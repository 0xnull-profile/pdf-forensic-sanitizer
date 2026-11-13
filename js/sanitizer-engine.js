// @ts-check
/**
 * Build image-only PDFs from pages rendered by PDF.js.
 * Never copy pages or objects from the source document: masks and watermarks
 * are applied to pixels before pdf-lib creates the output file.
 *
 * PDF parsing uses a worker; canvas encoding and PDF assembly currently run
 * on the main thread, one page at a time. Memory cleanup is best effort.
 */
import { rasterBounds, validateRect } from './redaction-canvas.js';
import { PDF_LIMITS } from './pdf-inspector.js';

export const EXPORT_LIMITS = Object.freeze({
  maxPagePixels: 24_000_000,      // Up to roughly 96 MiB for the RGBA page buffer
  maxTotalPixels: 360_000_000,   // Limit cumulative raster work
  maxOutputBytes: 160 * 1024 * 1024,
});

export class SanitizationError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) { super(message); this.name = 'SanitizationError'; this.code = code; }
}

let libPromise;
export function loadLocalPdfLib() {
  if (!libPromise) {
    libPromise = import('../vendor/pdf-lib.esm.js').then((lib) => {
      if (typeof lib.PDFDocument?.create !== 'function') {
        throw new SanitizationError('DEPENDENCY', 'pdf-lib locale non disponibile.');
      }
      return lib;
    }).catch((error) => { libPromise = undefined; throw error; });
  }
  return libPromise;
}

/** @param {AbortSignal|undefined} signal */
function checkAbort(signal) {
  if (signal?.aborted) throw new SanitizationError('ABORTED', 'Esportazione annullata dalla chiusura della sessione.');
}

/**
 * No alpha and no placeholder: solid black pixels ON TOP of the full page.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number,w:number,h:number}[]} boxes
 * @param {number} width @param {number} height
 */
export function burnRedactions(ctx, boxes, width, height) {
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000000';
    for (const box of boxes) {
      const bounds = rasterBounds(validateRect(box), width, height, 2);
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }
  } finally { ctx.restore(); }
}

/**
 * Draw repeat watermark BEFORE black redactions, never as selectable PDF text.
 * @param {CanvasRenderingContext2D} ctx @param {number} width @param {number} height
 * @param {string} label @param {number} opacity @param {number} dpi
 */
export function burnWatermark(ctx, width, height, label, opacity, dpi) {
  const text = label.trim().slice(0, 160);
  if (!text) return;
  if (!Number.isFinite(opacity) || opacity < 0.05 || opacity > 0.6) {
    throw new SanitizationError('OPTIONS', 'Opacità watermark non valida.');
  }
  const fontPx = Math.max(18, 20 * dpi / 72);
  ctx.save();
  try {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0B0E14';
    ctx.font = `600 ${fontPx}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const stepX = Math.max(ctx.measureText(text).width + 120 * dpi / 72, 240 * dpi / 72);
    const stepY = Math.max(125 * dpi / 72, fontPx * 4);
    // Rotate each cell in place, with a bounded number of draws per page.
    for (let y = -height * .15; y < height * 1.2; y += stepY) {
      for (let x = -width * .2; x < width * 1.25; x += stepX) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
  } finally { ctx.restore(); }
}

/**
 * Check the blackened areas pixel by pixel using bounded stripes.
 * Heavy overlap is rejected to avoid unbounded readback work. This covers
 * the canvas before encoding; separate E2E tests inspect the exported PDF
 * with a different renderer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x:number,y:number,w:number,h:number}[]} boxes
 * @param {number} width @param {number} height
 * @param {AbortSignal|undefined} signal
 * @returns {number} Number of mask pixels actually checked (overlaps included).
 */
export function verifyMaskPixels(ctx, boxes, width, height, signal) {
  if (typeof ctx.getImageData !== 'function' ||
      !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) {
    throw new SanitizationError('MASK', 'Non è possibile leggere e verificare i pixel oscurati.');
  }
  const maxChecked = width * height * 3;
  let checked = 0;
  for (const box of boxes) {
    checkAbort(signal);
    const { x, y, w, h } = rasterBounds(validateRect(box), width, height, 2);
    if (w < 1 || h < 1) throw new SanitizationError('MASK', 'Riquadro con area nulla nel canvas.');
    if (checked + w * h > maxChecked) {
      throw new SanitizationError('MASK_LIMIT',
        'Troppi riquadri sovrapposti: unisci gli oscuramenti prima di esportare.');
    }
    const stripeHeight = Math.max(1, Math.floor(65_536 / w));
    for (let top = y; top < y + h; top += stripeHeight) {
      checkAbort(signal);
      const rows = Math.min(stripeHeight, y + h - top);
      let rgba;
      try { rgba = ctx.getImageData(x, top, w, rows).data; }
      catch { throw new SanitizationError('MASK', 'Lettura dei pixel oscurati non riuscita.'); }
      if (rgba.length !== w * rows * 4) {
        throw new SanitizationError('MASK', 'Lettura dei pixel oscurati incompleta.');
      }
      for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i] !== 0 || rgba[i + 1] !== 0 || rgba[i + 2] !== 0 || rgba[i + 3] !== 255) {
          throw new SanitizationError('MASK',
            'Almeno un pixel della zona oscurata non è nero e opaco. Download bloccato.');
        }
      }
      checked += w * rows;
    }
  }
  return checked;
}

/**
 * Fail early on expensive jobs: peak memory grows far beyond the final file.
 * @param {{numPages:number,getPageSize:(page:number)=>Promise<{width:number,height:number}>}} inspector
 * @param {150|250|300} dpi @param {AbortSignal|undefined} signal
 */
export async function preflightExport(inspector, dpi, signal) {
  if (![150, 250, 300].includes(dpi)) throw new SanitizationError('OPTIONS', 'Scegli 150, 250 o 300 DPI.');
  const count = inspector.numPages;
  if (!Number.isSafeInteger(count) || count < 1 || count > PDF_LIMITS.pages) {
    throw new SanitizationError('PAGES', 'Numero di pagine non supportato.');
  }
  let totalPixels = 0;
  for (let page = 1; page <= count; page++) {
    checkAbort(signal);
    const { width, height } = await inspector.getPageSize(page);
    const pixelWidth = Math.ceil(width * dpi / 72);
    const pixelHeight = Math.ceil(height * dpi / 72);
    if (!Number.isSafeInteger(pixelWidth) || !Number.isSafeInteger(pixelHeight) ||
        pixelWidth < 1 || pixelHeight < 1 || pixelWidth > PDF_LIMITS.maxPageDimension ||
        pixelHeight > PDF_LIMITS.maxPageDimension ||
        pixelWidth * pixelHeight > EXPORT_LIMITS.maxPagePixels) {
      throw new SanitizationError('PAGE_LIMIT', `Pagina ${page}: superficie troppo grande a ${dpi} DPI. Riduci la risoluzione.`);
    }
    totalPixels += pixelWidth * pixelHeight;
    if (totalPixels > EXPORT_LIMITS.maxTotalPixels) {
      throw new SanitizationError('TOTAL_LIMIT', `Documento troppo grande a ${dpi} DPI. Riduci la risoluzione o dividi il PDF.`);
    }
  }
  return totalPixels;
}

/** @param {HTMLCanvasElement} canvas */
async function canvasPng(canvas) {
  if (!canvas.toBlob) throw new SanitizationError('CANVAS', 'Esportazione PNG non supportata da questo browser.');
  /** @type {Blob|null} */
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob || blob.type !== 'image/png' || blob.size < 8) {
    throw new SanitizationError('CANVAS', 'Impossibile codificare la pagina in PNG.');
  }
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Structural verification with a completely fresh PDF.js loading task.
 * A failed/unavailable inspection MUST BLOCK the download. In particular,
 * don't call a missing inspection API a successful check.
 * @param {Uint8Array} bytes @param {any} pdfjs @param {number} expectedPages
 * @param {AbortSignal|undefined} signal
 */
export async function verifyRasterOutput(bytes, pdfjs, expectedPages, signal) {
  if (!pdfjs?.getDocument) throw new SanitizationError('VERIFY', 'Motore di verifica PDF.js non disponibile.');
  checkAbort(signal);
  const loadingTask = pdfjs.getDocument({
    data: bytes.slice(),  // PDF.js owns this transferred copy.
    isEvalSupported: false, enableXfa: false, stopAtErrors: true,
    maxImageSize: PDF_LIMITS.decodedImagePixels,
    cMapPacked: true,
    cMapUrl: new URL('../vendor/cmaps/', import.meta.url).href,
    iccUrl: new URL('../vendor/iccs/', import.meta.url).href,
    standardFontDataUrl: new URL('../vendor/standard_fonts/', import.meta.url).href,
    wasmUrl: new URL('../vendor/wasm/', import.meta.url).href,
    useWorkerFetch: true,
  });
  try {
    const doc = await loadingTask.promise;
    if (doc.numPages !== expectedPages) throw new SanitizationError('VERIFY', 'Numero di pagine diverso dopo la ricostruzione.');
    const metadata = await doc.getMetadata();
    const info = metadata?.info ?? {};
    for (const key of ['Title', 'Subject', 'Author', 'Creator', 'Producer', 'Keywords']) {
      if (String(info[key] ?? '').trim()) {
        throw new SanitizationError('VERIFY', `Campo Info ${key} presente nel PDF esportato.`);
      }
    }
    for (const key of ['CreationDate', 'ModDate']) {
      const value = String(info[key] ?? '');
      if (value && !/^D:1970/.test(value)) {
        throw new SanitizationError('VERIFY', `Data ${key} non neutralizzata.`);
      }
    }
    if (metadata?.metadata) throw new SanitizationError('VERIFY', 'Metadati XMP ancora presenti.');
    if (typeof doc.getAttachments !== 'function' || typeof doc.getFieldObjects !== 'function' ||
        typeof doc.hasJSActions !== 'function' || typeof doc.getJSActions !== 'function' ||
        typeof doc.getOpenAction !== 'function') {
      throw new SanitizationError('VERIFY', 'API di verifica insufficienti: non è possibile certificare l’output.');
    }
    if (Object.keys((await doc.getAttachments()) ?? {}).length !== 0 ||
        Object.keys((await doc.getFieldObjects()) ?? {}).length !== 0 ||
        await doc.hasJSActions() ||
        Object.keys((await doc.getJSActions()) ?? {}).length !== 0 ||
        (await doc.getOpenAction()) != null) {
      throw new SanitizationError('VERIFY', 'Allegati, azioni, script o moduli rilevati nel nuovo documento.');
    }
    let remainingChars = 0;
    for (let page = 1; page <= doc.numPages; page++) {
      checkAbort(signal);
      const item = await doc.getPage(page);
      const extracted = await item.getTextContent();
      remainingChars += extracted.items.reduce((sum, entry) =>
        sum + (typeof entry.str === 'string' ? entry.str.length : 0), 0);
      const annotations = await item.getAnnotations({ intent: 'any' });
      if (annotations.length) throw new SanitizationError('VERIFY', `Annotazioni residue nella pagina ${page}.`);
      if (typeof item.getJSActions !== 'function') {
        throw new SanitizationError('VERIFY', `Azioni della pagina ${page} non verificabili.`);
      }
      const actions = await item.getJSActions();
      if (Object.keys(actions ?? {}).length) {
        throw new SanitizationError('VERIFY', `Script residuo nella pagina ${page}.`);
      }
    }
    if (remainingChars !== 0) throw new SanitizationError('VERIFY', `${remainingChars} caratteri estraibili ancora presenti nell'output.`);
    return { pagesVerified: expectedPages, remainingChars, metadataFields: 0,
      attachments: 0, annotations: 0, formFields: 0, jsActions: 0 };
  } catch (error) {
    if (error instanceof SanitizationError) throw error;
    throw new SanitizationError('VERIFY', `Verifica del PDF fallita: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
  } finally {
    try { await loadingTask.destroy(); } catch { /* Best effort worker release. */ }
  }
}

/**
 * @typedef {Object} SanitizeOptions
 * @property {import('./pdf-inspector.js').PdfInspector} inspector
 * @property {any} pdfjs
 * @property {any} pdfLib
 * @property {import('./redaction-canvas.js').RedactionBox[]} boxes
 * @property {150|250|300} dpi
 * @property {string} watermark
 * @property {number} opacity
 * @property {AbortSignal} [signal]
 * @property {(phase:string,page:number,total:number)=>void} [onProgress]
 * @property {()=>HTMLCanvasElement} [makeCanvas]
 */
/**
 * Rasterize every page, including pages without redaction boxes.
 * @param {SanitizeOptions} options
 */
export async function sanitizePdf(options) {
  const { inspector, pdfjs, pdfLib, boxes, dpi, watermark, opacity,
    signal, onProgress = () => {}, makeCanvas = () => document.createElement('canvas') } = options;
  if (!pdfLib?.PDFDocument?.create || !inspector?.loaded) {
    throw new SanitizationError('STATE', 'Il documento o il motore pdf-lib non è disponibile.');
  }
  const pageCount = inspector.numPages;
  if (!Array.isArray(boxes) || boxes.length > 2000) {
    throw new SanitizationError('OPTIONS', 'Numero di riquadri non valido.');
  }
  // Clone and validate; the UI must not mutate geometry mid-export.
  const patches = boxes.map(({ page, x, y, w, h }) => {
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new SanitizationError('OPTIONS', 'Riquadro associato a una pagina inesistente.');
    }
    return { page, ...validateRect({ x, y, w, h }) };
  });
  const label = String(watermark ?? '').slice(0, 160);
  if (!Number.isFinite(opacity) || opacity < 0.05 || opacity > 0.60) {
    throw new SanitizationError('OPTIONS', 'Opacità fuori intervallo.');
  }
  onProgress('Controllo limiti e memoria', 0, pageCount);
  const totalPixels = await preflightExport(inspector, dpi, signal);
  checkAbort(signal);
  // Start with an empty document; do not copy source PDF objects.
  const out = await pdfLib.PDFDocument.create({ updateMetadata: false });
  out.setTitle(''); out.setAuthor(''); out.setSubject(''); out.setKeywords([]);
  out.setProducer(''); out.setCreator('');
  out.setCreationDate(new Date(0)); out.setModificationDate(new Date(0));
  let rasterized = 0;
  let maskPixelsVerified = 0;
  for (let page = 1; page <= pageCount; page++) {
    checkAbort(signal);
    onProgress('Rasterizzazione e oscuramento', page, pageCount);
    const canvas = makeCanvas();
    try {
      const { pointWidth, pointHeight, pixelWidth, pixelHeight } =
        await inspector.renderPageForExport(page, canvas, dpi);
      checkAbort(signal);
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new SanitizationError('CANVAS', 'Canvas 2D non disponibile.');
      burnWatermark(ctx, pixelWidth, pixelHeight, label, opacity, dpi);
      const pagePatches = patches.filter((box) => box.page === page);
      burnRedactions(ctx, pagePatches, pixelWidth, pixelHeight);
      maskPixelsVerified += verifyMaskPixels(ctx, pagePatches, pixelWidth, pixelHeight, signal);
      const pngBytes = await canvasPng(canvas);
      checkAbort(signal);
      const png = await out.embedPng(pngBytes);
      const outputPage = out.addPage([pointWidth, pointHeight]);
      outputPage.drawImage(png, { x: 0, y: 0, width: pointWidth, height: pointHeight });
      rasterized += 1;
    } finally {
      // Release the bitmap immediately. PNG backing buffers may still be used
      // internally by pdf-lib and are released after serialization/GC.
      canvas.width = 0;
      canvas.height = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  checkAbort(signal);
  onProgress('Ricostruzione del contenitore PDF', pageCount, pageCount);
  const bytes = await out.save({ useObjectStreams: true });
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > EXPORT_LIMITS.maxOutputBytes) {
    if (bytes instanceof Uint8Array && bytes.byteLength) bytes.fill(0);
    throw new SanitizationError('OUTPUT_LIMIT', 'PDF generato troppo grande. Riduci i DPI o dividi il documento.');
  }
  try {
    checkAbort(signal);
    onProgress('Verifica strutturale e testo residuo', pageCount, pageCount);
    const verification = await verifyRasterOutput(bytes, pdfjs, pageCount, signal);
    checkAbort(signal);
    // Digest only after successful output verification. Hash says nothing about
    // confidentiality; it helps the user identify the exact file downloaded.
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return { bytes, sha256, verification, pagesRasterized: rasterized,
      boxesApplied: patches.length, maskPixelsVerified, dpi, totalPixels };
  } catch (error) {
    if (bytes.byteLength > 0) bytes.fill(0);
    throw error;
  }
}
