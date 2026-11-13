// @ts-check
/**
 * Read and render local PDF files through PDF.js.
 * The document is supplied as bytes, never as a network URL. Audit results
 * describe what PDF.js could inspect, not everything the file might contain.
 */

export const PDF_LIMITS = Object.freeze({
  fileBytes: 100 * 1024 * 1024,
  pages: 300,
  decodedImagePixels: 16_777_216,
  previewPixels: 16_777_216,
  exportPagePixels: 100_000_000,
  maxPageDimension: 20_000,
  xrayPreviewChars: 6_000,
});

const META_FIELDS = Object.freeze([
  ['Title', 'title'], ['Subject', 'subject'], ['Author', 'author'],
  ['Creator', 'creator'], ['Producer', 'producer'],
  ['CreationDate', 'created'], ['ModDate', 'modified'],
  ['Keywords', 'keywords'],
]);

/** @typedef {{name: string, value: string}} MetadataField */
/** @param {unknown} value */
function entriesOf(value) {
  if (value instanceof Map) return [...value.entries()];
  if (value && typeof value === 'object') return Object.entries(value);
  return [];
}
/** @typedef {{fields: MetadataField[], xmpKeys: string[], xmpProperties: MetadataField[], xmpCount: number, metadataCount: number, warnings: string[], pagesScanned: number, totalPages: number, characters: number, textPages: number, annotations: number, links: number, widgets: number, formFields: number, attachments: number|null, jsActions: boolean|null, openAction: boolean|null, complete: boolean}} AuditResult */

export class PdfInspectionError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = 'PdfInspectionError';
    this.code = code;
  }
}

/**
 * Load the pinned, self-hosted PDF.js build. Failure is explicit: no CDN
 * fallback, iframe fallback, or simulated preview. This import is same-origin.
 * @returns {Promise<any>}
 */
let pdfjsPromise;
export function loadLocalPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('../vendor/pdf.min.mjs').then((pdfjs) => {
      if (typeof pdfjs.getDocument !== 'function' || !pdfjs.GlobalWorkerOptions) {
        throw new PdfInspectionError('DEPENDENCY', 'Modulo PDF.js locale non valido.');
      }
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
      return pdfjs;
    }).catch((error) => {
      pdfjsPromise = undefined;
      throw error;
    });
  }
  return pdfjsPromise;
}

/** @param {unknown} value @param {number} [limit] */
export function safeText(value, limit = 350) {
  if (value == null) return '';
  const text = (Array.isArray(value) ? value.join(', ') : String(value));
  return text.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').trim().slice(0, limit);
}

/** @param {Uint8Array} data */
export function hasPdfHeader(data) {
  return data.byteLength >= 5 && data[0] === 0x25 && data[1] === 0x50 &&
    data[2] === 0x44 && data[3] === 0x46 && data[4] === 0x2d;
}

/** @param {number} width @param {number} height @param {number} scale */
function ensurePageSize(width, height, scale) {
  const pixels = Math.ceil(width * scale) * Math.ceil(height * scale);
  if (![width, height, scale, pixels].every(Number.isFinite) || width <= 0 || height <= 0 ||
      Math.max(width * scale, height * scale) > PDF_LIMITS.maxPageDimension ||
      pixels > PDF_LIMITS.exportPagePixels) {
    throw new PdfInspectionError('PAGE_LIMIT', 'Pagina troppo grande per una rasterizzazione sicura a 300 DPI.');
  }
}

/** @param {any} pdfjs */
export class PdfInspector {
  #pdfjs;
  #loadingTask = null;
  #document = null;
  #renderTask = null;
  #renderPromise = null;
  #renderGeneration = 0;
  #destroyed = false;

  constructor(pdfjs) { this.#pdfjs = pdfjs; }
  get numPages() { return this.#document?.numPages ?? 0; }
  get loaded() { return Boolean(this.#document) && !this.#destroyed; }

  #assertReady() {
    if (this.#destroyed || !this.#document) {
      throw new PdfInspectionError('CLOSED', 'Sessione PDF chiusa.');
    }
  }

  /**
   * Clear the locally owned byte array on exit, including failures.
   * PDF.js receives a separate copy that is transferred to its worker.
   * @param {File | {size:number, arrayBuffer():Promise<ArrayBuffer>}} file
   */
  async open(file) {
    if (this.#document || this.#loadingTask || this.#destroyed) {
      throw new PdfInspectionError('STATE', 'Apri una nuova istanza per ogni documento.');
    }
    if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > PDF_LIMITS.fileBytes) {
      throw new PdfInspectionError('FILE_LIMIT', 'Il PDF deve avere dimensione compresa tra 1 byte e 100 MB.');
    }
    /** @type {Uint8Array | null} */
    let localBytes = null;
    try {
      localBytes = new Uint8Array(await file.arrayBuffer());
      if (!hasPdfHeader(localBytes)) {
        throw new PdfInspectionError('HEADER', 'File non valido: intestazione %PDF- assente.');
      }
      if (this.#destroyed) throw new PdfInspectionError('CLOSED', 'Caricamento interrotto.');
      this.#loadingTask = this.#pdfjs.getDocument({
        data: localBytes.slice(),
        isEvalSupported: false,
        enableXfa: false,
        maxImageSize: PDF_LIMITS.decodedImagePixels,
        cMapPacked: true,
        cMapUrl: new URL('../vendor/cmaps/', import.meta.url).href,
        iccUrl: new URL('../vendor/iccs/', import.meta.url).href,
        standardFontDataUrl: new URL('../vendor/standard_fonts/', import.meta.url).href,
        wasmUrl: new URL('../vendor/wasm/', import.meta.url).href,
        useWorkerFetch: true,
        stopAtErrors: true,
      });
      const doc = await this.#loadingTask.promise;
      if (this.#destroyed) throw new PdfInspectionError('CLOSED', 'Caricamento interrotto.');
      if (!Number.isInteger(doc.numPages) || doc.numPages < 1 || doc.numPages > PDF_LIMITS.pages) {
        throw new PdfInspectionError('PAGE_COUNT', `PDF non supportato: massimo ${PDF_LIMITS.pages} pagine.`);
      }
      // Check the first page early, then enforce page-size limits during the audit.
      const firstPage = await doc.getPage(1);
      const exportViewport = firstPage.getViewport({ scale: 300 / 72 });
      ensurePageSize(exportViewport.width, exportViewport.height, 1);
      this.#document = doc;
      return { numPages: doc.numPages };
    } finally {
      if (localBytes?.byteLength) localBytes.fill(0);
    }
  }

  /**
   * Read metadata and inspect each page sequentially. No extracted full-text
   * strings or script bodies are retained in the returned audit report.
   * @param {(done:number,total:number)=>void} [onProgress]
   * @returns {Promise<AuditResult>}
   */
  async audit(onProgress = () => {}) {
    this.#assertReady();
    const doc = this.#document;
    /** @type {AuditResult} */
    const report = {
      fields: [], xmpKeys: [], xmpProperties: [], xmpCount: 0, metadataCount: 0,
      warnings: [], pagesScanned: 0, totalPages: doc.numPages,
      characters: 0, textPages: 0, annotations: 0, links: 0,
      widgets: 0, formFields: 0, attachments: null, jsActions: null, openAction: null, complete: false,
    };
    try {
      const metadata = await doc.getMetadata();
      const info = metadata?.info ?? {};
      for (const [pdfKey, uiKey] of META_FIELDS) {
        const value = safeText(info[pdfKey]);
        if (value) report.fields.push({ name: uiKey, value });
      }
      const xmp = metadata?.metadata?.getAll?.();
      if (xmp && typeof xmp === 'object') {
        const keys = entriesOf(xmp).filter(([key, value]) => safeText(value).length > 0).map(([key]) => key);
        report.xmpCount = keys.length;
        report.xmpKeys = keys.slice(0, 12).map((key) => safeText(key, 60));
        report.xmpProperties = entriesOf(xmp).filter(([, value]) => safeText(value).length > 0)
          .slice(0, 12).map(([key, value]) => ({ name: safeText(key, 60), value: safeText(value, 180) }));
      }
      report.metadataCount = report.fields.length + report.xmpCount;
    } catch { report.warnings.push('Metadati non completamente leggibili'); }

    try {
      const attachments = await doc.getAttachments();
      report.attachments = attachments ? Object.keys(attachments).length : 0;
    } catch { report.warnings.push('Allegati non verificabili'); }
    try {
      // Catalog/NameTree actions and AcroForm actions require separate APIs.
      if (typeof doc.hasJSActions === 'function' && typeof doc.getJSActions === 'function') {
        const fieldJs = await doc.hasJSActions();
        const catalogJs = await doc.getJSActions();
        report.jsActions = Boolean(fieldJs || entriesOf(catalogJs).length);
      } else {
        report.warnings.push('Verifica JavaScript del catalogo o dei moduli non supportata');
      }
    } catch { report.warnings.push('Azioni JavaScript non verificabili'); }
    try {
      if (typeof doc.getOpenAction === 'function') {
        const action = await doc.getOpenAction();
        report.openAction = action != null && entriesOf(action).length > 0;
      } else report.warnings.push('Azione all’apertura non verificabile');
    } catch { report.warnings.push('Azione all’apertura non verificabile'); }
    try {
      const fields = await doc.getFieldObjects();
      report.formFields = entriesOf(fields).length;
    } catch { report.warnings.push('Campi modulo non verificabili'); }

    for (let index = 1; index <= doc.numPages; index += 1) {
      this.#assertReady();
      try {
        const page = await doc.getPage(index);
        const exportViewport = page.getViewport({ scale: 300 / 72 });
        ensurePageSize(exportViewport.width, exportViewport.height, 1);
        const content = await page.getTextContent();
        const count = content.items.reduce((sum, item) => sum + (typeof item.str === 'string' ? item.str.length : 0), 0);
        report.characters += count;
        if (count > 0) report.textPages += 1;
        const annotations = await page.getAnnotations({ intent: 'any' });
        report.annotations += annotations.length;
        if (typeof page.getJSActions === 'function') {
          const pageJs = await page.getJSActions();
          if (entriesOf(pageJs).length > 0) report.jsActions = true;
        } else report.warnings.push(`Pagina ${index}: JavaScript non verificabile`);
        for (const annotation of annotations) {
          if (annotation.url || annotation.unsafeUrl) {
            report.links += 1;
          }
          if (annotation.annotationType === this.#pdfjs.AnnotationType?.WIDGET || annotation.subtype === 'Widget') {
            report.widgets += 1;
          }
        }
        report.pagesScanned = index;
      } catch (error) {
        if (this.#destroyed) throw error;
        const message = error instanceof PdfInspectionError && error.code === 'PAGE_LIMIT'
          ? `Pagina ${index}: dimensioni non consentite` : `Pagina ${index}: lettura incompleta`;
        report.warnings.push(message);
      }
      onProgress(index, doc.numPages);
      // Yield to UI between pages; do not schedule all pages concurrently.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    this.#assertReady();
    report.complete = report.warnings.length === 0 && report.pagesScanned === doc.numPages &&
      report.attachments !== null && report.jsActions !== null && report.openAction !== null;
    return report;
  }

  /** @param {number} pageNumber */
  async getPageText(pageNumber) {
    this.#assertReady();
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.numPages) {
      throw new PdfInspectionError('PAGE', 'Numero pagina non valido.');
    }
    const page = await this.#document.getPage(pageNumber);
    const text = await page.getTextContent();
    this.#assertReady();
    const chunks = [];
    let totalLength = 0;
    for (const item of text.items) {
      if (typeof item.str !== 'string') continue;
      if (totalLength >= PDF_LIMITS.xrayPreviewChars) break;
      const fragment = item.str.slice(0, PDF_LIMITS.xrayPreviewChars - totalLength);
      chunks.push(fragment);
      if (item.hasEOL) chunks.push('\n');
      else chunks.push(' ');
      totalLength += fragment.length + 1;
    }
    return { text: chunks.join('').trim(), truncated: totalLength >= PDF_LIMITS.xrayPreviewChars };
  }

  /** @param {number} pageNumber */
  async getPageSize(pageNumber) {
    this.#assertReady();
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.numPages) {
      throw new PdfInspectionError('PAGE', 'Numero pagina non valido.');
    }
    const page = await this.#document.getPage(pageNumber);
    this.#assertReady();
    const viewport = page.getViewport({ scale: 1 });
    return { width: viewport.width, height: viewport.height };
  }

  /**
   * A single canvas is reused for navigation. A pending render is cancelled and
   * awaited before the same canvas can be used again.
   * @param {number} pageNumber
   * @param {HTMLCanvasElement} canvas
   * @param {number} zoom
   * @param {number} [pixelRatio]
   */
  async renderPage(pageNumber, canvas, zoom, pixelRatio = 1) {
    this.#assertReady();
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.numPages ||
        !Number.isFinite(zoom) || zoom < 0.35 || zoom > 3) {
      throw new PdfInspectionError('PAGE', 'Pagina o zoom non valido.');
    }
    const generation = ++this.#renderGeneration;
    await this.cancelRender();
    this.#assertReady();
    const page = await this.#document.getPage(pageNumber);
    this.#assertReady();
    if (generation !== this.#renderGeneration) {
      throw new PdfInspectionError('CANCELLED', 'Anteprima sostituita da una richiesta successiva.');
    }
    const cssViewport = page.getViewport({ scale: zoom });
    const exportViewport = page.getViewport({ scale: 300 / 72 });
    ensurePageSize(exportViewport.width, exportViewport.height, 1);
    const pxRatio = Math.max(1, Math.min(pixelRatio, 2,
      Math.sqrt(PDF_LIMITS.previewPixels / (cssViewport.width * cssViewport.height))));
    const width = Math.ceil(cssViewport.width * pxRatio);
    const height = Math.ceil(cssViewport.height * pxRatio);
    if (width * height > PDF_LIMITS.previewPixels || width > PDF_LIMITS.maxPageDimension ||
        height > PDF_LIMITS.maxPageDimension) {
      throw new PdfInspectionError('PREVIEW_LIMIT', 'Anteprima troppo grande per la memoria disponibile.');
    }
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new PdfInspectionError('CANVAS', 'Canvas 2D non disponibile.');
    const task = page.render({
      canvas,
      canvasContext: context,
      viewport: cssViewport,
      transform: [pxRatio, 0, 0, pxRatio, 0, 0],
      background: 'rgb(255, 255, 255)',
    });
    this.#renderTask = task;
    this.#renderPromise = task.promise;
    try {
      await task.promise;
      this.#assertReady();
      return { width: cssViewport.width, height: cssViewport.height, pixelWidth: width, pixelHeight: height };
    } finally {
      if (this.#renderTask === task) this.#renderTask = null;
      if (this.#renderPromise === task.promise) this.#renderPromise = null;
    }
  }

  /**
   * Render one page into the export canvas at the requested resolution.
   * Use the same PDF.js viewport orientation as the preview so normalized
   * redaction coordinates remain aligned on rotated and cropped pages.
   * Pages are processed sequentially to bound memory use.
   * @param {number} pageNumber
   * @param {HTMLCanvasElement} canvas
   * @param {150|250|300} dpi
   * @returns {Promise<{pointWidth:number,pointHeight:number,pixelWidth:number,pixelHeight:number}>}
   */
  async renderPageForExport(pageNumber, canvas, dpi) {
    this.#assertReady();
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.numPages ||
        ![150, 250, 300].includes(dpi)) {
      throw new PdfInspectionError('PAGE', 'Pagina o risoluzione non valida.');
    }
    const generation = ++this.#renderGeneration;
    await this.cancelRender();
    this.#assertReady();
    const page = await this.#document.getPage(pageNumber);
    this.#assertReady();
    if (generation !== this.#renderGeneration) {
      throw new PdfInspectionError('CANCELLED', 'Rendering sostituito.');
    }
    const viewport = page.getViewport({ scale: dpi / 72 });
    ensurePageSize(viewport.width, viewport.height, 1);
    const pixelWidth = Math.ceil(viewport.width);
    const pixelHeight = Math.ceil(viewport.height);
    // Conservative in-memory limit (~96 MiB of RGBA pixels for one canvas).
    if (pixelWidth * pixelHeight > 24_000_000) {
      throw new PdfInspectionError('EXPORT_LIMIT',
        `Pagina ${pageNumber}: supera 24 megapixel a ${dpi} DPI. Riduci i DPI.`);
    }
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
    if (!context) throw new PdfInspectionError('CANVAS', 'Canvas di esportazione non disponibile.');
    const task = page.render({ canvas, canvasContext: context, viewport,
      background: 'rgb(255, 255, 255)',
      annotationMode: this.#pdfjs.AnnotationMode?.ENABLE ?? 1,
    });
    this.#renderTask = task;
    this.#renderPromise = task.promise;
    try {
      await task.promise;
      this.#assertReady();
      return { pointWidth: viewport.width * 72 / dpi,
        pointHeight: viewport.height * 72 / dpi, pixelWidth, pixelHeight };
    } finally {
      if (this.#renderTask === task) this.#renderTask = null;
      if (this.#renderPromise === task.promise) this.#renderPromise = null;
    }
  }

  async cancelRender() {
    const renderTask = this.#renderTask;
    const renderPromise = this.#renderPromise;
    renderTask?.cancel();
    if (renderPromise) {
      try { await renderPromise; } catch { /* Cancelled renders reject by design. */ }
    }
  }

  async destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#renderGeneration += 1;
    await this.cancelRender();
    const task = this.#loadingTask;
    this.#document = null;
    this.#loadingTask = null;
    if (task) {
      try { await task.destroy(); } catch { /* Best-effort release. */ }
    }
  }
}
