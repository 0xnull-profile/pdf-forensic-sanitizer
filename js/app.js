// @ts-check
/**
 * Coordinates the current document, viewer state, and export workflow.
 * The app handles one document at a time and keeps its contents in memory.
 * A download link is available only after output verification succeeds.
 */
import { PdfInspector, PdfInspectionError, loadLocalPdfJs, safeText } from './pdf-inspector.js';
import { RedactionCanvas, RedactionStore } from './redaction-canvas.js';
import { sanitizePdf, loadLocalPdfLib } from './sanitizer-engine.js';
import { exportConfigKey } from './export-integrity.js';
import { installOfflineShell } from './offline-shell.js';

const $ = (/** @type {string} */ selector) => document.querySelector(selector);
const ui = {
  shell: $('#app'), viewer: $('#viewer'), stage: $('#page-stage'), sheet: $('#page-sheet'),
  pdfCanvas: /** @type {HTMLCanvasElement} */ ($('#pdf-page-canvas')),
  overlay: /** @type {HTMLCanvasElement} */ ($('#redaction-overlay')),
  file: /** @type {HTMLInputElement} */ ($('#pdf-file-input')),
  dropzone: $('#pdf-dropzone'), empty: $('#empty-state'),
  pageInput: /** @type {HTMLInputElement} */ ($('#current-page')),
  pageCount: $('#page-count'), mobilePage: $('#mobile-page-count'),
  zoomLabel: $('#zoom-level'), fileName: $('#document-name'),
  phase: $('.phase-indicator'), status: $('#session-state'), detail: $('#document-detail'),
  operation: $('#operation-status'), net: $('#network-indicator'),
  netText: $('#network-indicator .network-text'),
  offlineCache: $('#offline-cache-indicator'),
  previewText: $('#xray-text-preview'), xrayPanel: $('#xray-preview'),
  xrayInfo: $('#xray-preview-info'),
  auditNoticeTitle: $('#audit-notice-title'), auditNoticeText: $('#audit-notice-detail'),
  metadataTotal: $('#metadata-total'), activeTotal: $('#active-objects-total'),
  metadataCount: $('#metadata-count'), riskCount: $('#risk-count'),
  metaList: $('#metadata-list'), inspectionList: $('#inspection-list'),
  destroyDialog: /** @type {HTMLDialogElement} */ ($('#destroy-dialog')),
  reportDialog: /** @type {HTMLDialogElement} */ ($('#export-report-dialog')),
  exportDialog: /** @type {HTMLDialogElement} */ ($('#export-confirm-dialog')),
  redactionList: $('#redaction-list'), redactionCount: $('#redaction-count'),
  paranoia: /** @type {HTMLInputElement} */ ($('#paranoia-mode')),
  watermark: /** @type {HTMLInputElement} */ ($('#watermark-text')),
  opacity: /** @type {HTMLInputElement} */ ($('#watermark-opacity')),
  opacityValue: $('#watermark-opacity-value'),
  progress: $('#export-progress'), progressBar: /** @type {HTMLProgressElement} */ ($('#export-progress-bar')),
  progressTitle: $('#export-progress-title'), progressDetail: $('#export-progress-detail'),
  verifiedDownload: /** @type {HTMLAnchorElement} */ ($('#verified-download')),
  reportOutput: $('#report-output'), copyReport: $('[data-action="copy-report"]'),
  exportSummary: $('.export-summary span'),
  notification: $('#notification-region'),
  drawer: $('#inspector-panel'), drawerToggle: $('.inspector-toggle'),
  drawerClose: $('.inspector-close'), drawerBackdrop: $('.drawer-backdrop'),
};

/** @type {{phase: 'starting'|'empty'|'loading'|'ready'|'exporting'|'destroying'|'error', epoch:number, renderEpoch:number, pdfjs:any, pdfLib:any, inspector:PdfInspector|null, editor:RedactionCanvas|null, store:RedactionStore, exportAbort:AbortController|null, reportText:string, page:number, pages:number, zoom:number, fit:boolean, xray:boolean, audit: import('./pdf-inspector.js').AuditResult|null}} */
const state = {
  phase: 'starting', epoch: 0, renderEpoch: 0, pdfjs: null, pdfLib: null, inspector: null,
  editor: null, store: new RedactionStore(), exportAbort: null, reportText: '',
  page: 1, pages: 0, zoom: 1, fit: false, xray: false, audit: null,
};

const zoomSteps = [0.35, 0.5, 0.65, 0.75, 0.9, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
let inactivityTimer = 0;
let warningTimer = 0;
let resizeTimer = 0;
let fileDragCounter = 0;

/** @param {string} selector @param {boolean} enabled */
function enable(selector, enabled) {
  for (const element of document.querySelectorAll(selector)) {
    if ('disabled' in element) element.disabled = !enabled;
  }
}

/** @param {string} text */
function setPhase(text) {
  ui.phase.lastChild?.remove(); // Replaces the text node, keeping the status dot.
  ui.phase.append(document.createTextNode(text));
}

/** @param {'preparing'|'ready'|'unavailable'|'error'} status @param {string} detail */
function reportOfflineShell(status, detail) {
  ui.offlineCache.dataset.cacheState = status;
  ui.offlineCache.textContent = status === 'ready' ? 'ASSET OFFLINE · PRONTI' :
    status === 'preparing' ? 'ASSET OFFLINE · PREPARAZIONE' :
    status === 'unavailable' ? 'ASSET OFFLINE · NON SUPPORTATI' :
    'ASSET OFFLINE · NON PRONTI';
  ui.offlineCache.title = detail + ' Lo stato non dimostra che nessun dato venga inviato in rete.';
  ui.offlineCache.setAttribute('aria-label', ui.offlineCache.textContent + '. ' + detail);
}

function updateNetworkIndicator() {
  const online = navigator.onLine !== false;
  ui.net.dataset.networkState = online ? 'online' : 'offline';
  ui.netText.textContent = online ? 'ONLINE · ELABORAZIONE LOCALE' : 'OFFLINE RILEVATO';
  ui.net.setAttribute('aria-label', online ? 'Browser segnala una connessione. Elaborazione locale.' : 'Browser segnala modalità offline.');
  ui.net.title = online
    ? 'La connettività non prova l\'assenza di richieste. Verifica con DevTools > Network. Puoi scollegare la rete prima di importare dati riservati.'
    : 'Stato offline riportato dal browser; non è una misura dei byte trasmessi.';
}

/** @param {'info'|'warning'|'error'} kind @param {string} title @param {string} detail */
function toast(kind, title, detail = '') {
  const note = document.createElement('div');
  note.className = `notification notification-${kind}`;
  note.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  const heading = document.createElement('strong');
  heading.textContent = title;
  note.append(heading);
  if (detail) {
    const paragraph = document.createElement('p');
    paragraph.textContent = detail;
    note.append(paragraph);
  }
  ui.notification.append(note);
  while (ui.notification.childElementCount > 3) ui.notification.firstElementChild?.remove();
  if (kind !== 'error') window.setTimeout(() => note.remove(), 5000);
  else {
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'notification-close';
    dismiss.setAttribute('aria-label', 'Chiudi messaggio di errore');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', () => note.remove());
    note.append(dismiss);
  }
}

function updateControls() {
  const ready = state.phase === 'ready';
  const pageVisible = ready && ui.overlay.style.visibility !== 'hidden';
  const busy = state.phase === 'loading' || state.phase === 'destroying' || state.phase === 'exporting';
  const canExport = pageVisible && Boolean(state.pdfLib);
  enable('[data-action="open-file"], #pdf-file-input', state.phase === 'empty' && Boolean(state.pdfjs));
  enable('[data-action="destroy-session"]', busy || ready);
  enable('[data-action="page-prev"]', ready && state.page > 1);
  enable('[data-action="page-next"]', ready && state.page < state.pages);
  enable('#current-page', ready);
  enable('[data-action="zoom-out"]', ready && state.zoom > zoomSteps[0]);
  enable('[data-action="zoom-in"]', ready && state.zoom < zoomSteps[zoomSteps.length - 1]);
  enable('[data-action="fit-width"]', ready);
  enable('[data-tool="xray"], [data-tool="redact"], [data-tool="pan"], [data-tool="select"]', pageVisible);
  enable('#tab-redaction, #tab-export', ready);
  enable('#watermark-text, #watermark-opacity, input[name="export-dpi"]', canExport);
  document.querySelector('.quality-fieldset').disabled = !canExport;
  enable('[data-action="sanitize-export"]', canExport);
  enable('[data-action="add-rect-numeric"], .rect-coordinates input', ready);
  enable('.redaction-item button', ready);
  // Pattern suggestions need their own review flow; keep the control disabled for now.
  enable('[data-action="suggest-redactions"], [data-action="clear-metadata"]', false);
  ui.paranoia.checked = true;
  ui.paranoia.disabled = true; // Full rasterization is mandatory in this release.
  ui.pageInput.value = ready || state.phase === 'exporting' ? String(state.page) : '';
  ui.pageInput.max = String(Math.max(1, state.pages));
  ui.pageCount.textContent = ready || state.phase === 'exporting' ? String(state.pages) : '—';
  ui.zoomLabel.textContent = ready || state.phase === 'exporting' ? `${Math.round(state.zoom * 100)}%` : '100%';
  if (ui.mobilePage) ui.mobilePage.textContent = ready || state.phase === 'exporting' ? `${state.page} / ${state.pages}` : '— / —';
  ui.shell.dataset.appState = state.phase;
  ui.editor?.setEnabled(pageVisible);
}

function resetAudit() {
  ui.auditNoticeTitle.textContent = 'Analisi non eseguita';
  ui.auditNoticeText.textContent = 'Il risultato della scansione locale apparirà qui.';
  ui.metadataTotal.textContent = '—';
  ui.activeTotal.textContent = '—';
  ui.metadataCount.textContent = '—';
  ui.riskCount.textContent = '—';
  ui.metaList.replaceChildren();
  ui.inspectionList.replaceChildren();
  for (const name of ['Author', 'Creator', 'Producer', 'CreationDate', 'ModDate', 'XMP']) {
    appendMeta(name, '—');
  }
}

/** @param {string} key @param {string} value */
function appendMeta(key, value) {
  const row = document.createElement('div');
  row.className = 'metadata-item';
  const dt = document.createElement('dt');
  dt.textContent = key;
  const dd = document.createElement('dd');
  dd.textContent = value;
  row.append(dt, dd);
  ui.metaList.append(row);
}

/** @param {string} label @param {string} value @param {boolean} [risk] */
function appendInspection(label, value, risk = false) {
  const li = document.createElement('li');
  const description = document.createElement('span');
  description.textContent = label;
  const result = document.createElement('span');
  result.className = risk ? 'inspection-state inspection-risk' : 'inspection-state';
  result.textContent = value;
  li.append(description, result);
  ui.inspectionList.append(li);
}

/** @param {import('./pdf-inspector.js').AuditResult} report */
function paintAudit(report) {
  const values = new Map(report.fields.map((field) => [field.name, field.value]));
  const rows = [
    ['Title', 'title'], ['Subject', 'subject'], ['Author', 'author'],
    ['Creator', 'creator'], ['Producer', 'producer'],
    ['CreationDate', 'created'], ['ModDate', 'modified'], ['Keywords', 'keywords'],
  ];
  ui.metaList.replaceChildren();
  for (const [label, key] of rows) appendMeta(label, values.get(key) || '—');
  appendMeta('XMP', report.xmpCount ? `${report.xmpCount} proprietà rilevate` : 'Non rilevato');
  for (const property of report.xmpProperties) appendMeta(`XMP · ${property.name}`, property.value);
  if (report.xmpCount > report.xmpProperties.length) appendMeta('Altre proprietà XMP', `${report.xmpCount - report.xmpProperties.length} non visualizzate`);

  // Report the categories found, rather than assigning an unsupported risk score.
  const riskCategories = [report.metadataCount > 0, report.characters > 0,
    report.annotations > 0, report.links > 0, report.widgets > 0,
    report.formFields > 0, (report.attachments ?? 0) > 0, report.jsActions === true,
    report.openAction === true]
    .filter(Boolean).length;
  ui.riskCount.textContent = `${riskCategories} segnali`;
  ui.metadataTotal.textContent = String(report.metadataCount);
  ui.activeTotal.textContent = String(report.annotations + report.formFields + (report.attachments ?? 0) + Number(report.jsActions === true) + Number(report.openAction === true));
  ui.metadataCount.textContent = String(report.metadataCount);
  ui.inspectionList.replaceChildren();
  appendInspection('Testo estraibile', `${report.characters.toLocaleString('it-IT')} caratteri`, report.characters > 0);
  appendInspection('Pagine con testo', `${report.textPages} / ${report.totalPages}`);
  appendInspection('Annotazioni', String(report.annotations), report.annotations > 0);
  appendInspection('Link URL', String(report.links), report.links > 0);
  appendInspection('Widget PDF', String(report.widgets), report.widgets > 0);
  appendInspection('Campi modulo', String(report.formFields), report.formFields > 0);
  appendInspection('Allegati', report.attachments === null ? 'Non verificati' : String(report.attachments), (report.attachments ?? 0) > 0);
  appendInspection('Azioni JavaScript', report.jsActions === null ? 'Non verificabili' : (report.jsActions ? 'Rilevate' : 'Non rilevate'), report.jsActions === true);
  appendInspection('Azione all’apertura', report.openAction === null ? 'Non verificabile' : (report.openAction ? 'Rilevata' : 'Non rilevata'), report.openAction === true);
  if (report.complete) {
    ui.auditNoticeTitle.textContent = 'Analisi locale completata';
    ui.auditNoticeText.textContent = `Esaminate ${report.totalPages} pagine. Sono riportati gli elementi rilevabili dalle API PDF.js; non è una certificazione di assenza di rischi.`;
  } else {
    ui.auditNoticeTitle.textContent = 'Audit parziale · controlli non completati';
    ui.auditNoticeText.textContent = `Pagine esaminate: ${report.pagesScanned}/${report.totalPages}. ${report.warnings.slice(0, 3).join('; ')}. Non interpretare i valori zero come assenza di rischio.`;
  }
  ui.auditNoticeTitle.closest('.notice')?.classList.toggle('notice-warning', !report.complete);
  document.querySelector('.risk-grid')?.setAttribute('aria-label', report.complete ? 'Risultati dell\'analisi PDF' : 'Risultati parziali dell\'analisi PDF');
}


/** Update the sidebar using a snapshot of the redaction boxes. */
function updateRedactionList() {
  invalidateVerifiedOutput();
  const boxes = state.store.all();
  ui.redactionCount.textContent = String(boxes.length);
  ui.redactionList.className = boxes.length ? 'redaction-list-filled' : 'redaction-list-empty';
  ui.redactionList.replaceChildren();
  if (!boxes.length) {
    const empty = document.createElement('p');
    empty.className = 'redaction-empty';
    empty.textContent = 'Nessun riquadro. Attiva Redaction (R) e trascina, oppure inserisci coordinate.';
    ui.redactionList.append(empty);
  } else {
    const list = document.createElement('ol');
    list.className = 'redaction-items';
    for (const box of boxes) {
      const item = document.createElement('li');
      item.className = 'redaction-item';
      item.dataset.selected = String(box.id === state.editor?.selectedId);
      const goto = document.createElement('button');
      goto.type = 'button'; goto.className = 'redaction-goto';
      goto.dataset.boxId = String(box.id); goto.dataset.boxAction = 'goto';
      goto.textContent = `P.${box.page} · #${box.id} · ${Math.round(box.w * 100)} × ${Math.round(box.h * 100)}%`;
      goto.setAttribute('aria-label', `Mostra riquadro ${box.id}, pagina ${box.page}`);
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'redaction-delete';
      remove.dataset.boxId = String(box.id); remove.dataset.boxAction = 'remove';
      remove.setAttribute('aria-label', `Elimina riquadro ${box.id} dalla pagina ${box.page}`);
      remove.textContent = '×';
      item.append(goto, remove);
      list.append(item);
    }
    ui.redactionList.append(list);
  }
  ui.exportSummary.textContent = state.phase === 'exporting' ? 'Esportazione e verifica in corso…'
    : `${boxes.length} riquadri · ${state.pages || '—'} pagine. L’export appiattisce l’intero documento.`;
}

/** @param {string|null} tool */
function setEditorTool(tool) {
  if (state.phase !== 'ready' || !['select', 'redact', 'pan'].includes(tool)) return;
  state.editor?.setTool(/** @type {'select'|'redact'|'pan'} */ (tool));
  ui.shell.dataset.activeTool = tool;
  if (tool === 'redact') selectTab('tab-redaction');
  for (const item of document.querySelectorAll('[data-tool="select"], [data-tool="redact"], [data-tool="pan"]')) {
    item.setAttribute('aria-pressed', String(item.getAttribute('data-tool') === tool));
  }
}

/** @param {number} id */
async function selectRedaction(id) {
  const box = state.store.get(id);
  if (!box || state.phase !== 'ready') return;
  if (box.page !== state.page) await showPage(box.page);
  if (state.phase === 'ready') { setEditorTool('select'); state.editor?.select(id); }
}

function addNumericRedaction() {
  if (state.phase !== 'ready' || !state.editor) return;
  const fields = ['rect-x', 'rect-y', 'rect-w', 'rect-h'].map((id) => /** @type {HTMLInputElement} */ (document.getElementById(id)));
  if (fields.some((field) => !field.checkValidity() || field.value.trim() === '')) {
    toast('warning', 'Coordinate non valide', 'Usa valori compresi tra 0 e 100; larghezza e altezza devono essere positive.');
    return;
  }
  const [x,y,w,h] = fields.map((field) => Number(field.value) / 100);
  try { state.editor.add(state.page, { x, y, w, h }); setEditorTool('select'); }
  catch (error) { toast('warning', 'Riquadro non aggiunto', error instanceof Error ? error.message : 'Controlla le coordinate.'); }
}

/** @type {Set<string>} */
const downloadUrls = new Set();
/** @type {Map<string,number>} */
const downloadTimers = new Map();
/** @type {string|null} */
let verifiedConfigKey = null;

function currentExportKey() {
  return exportConfigKey({
    epoch: state.epoch, revision: state.store.revision,
    dpi: Number(document.querySelector('input[name="export-dpi"]:checked')?.value || 300),
    watermark: ui.watermark.value, opacity: Number(ui.opacity.value),
  });
}

function invalidateVerifiedOutput() {
  if (verifiedConfigKey === null || verifiedConfigKey === currentExportKey()) return;
  clearDownloadUrl();
  state.reportText = '';
  ui.reportOutput.textContent = 'Le impostazioni sono cambiate. Avvia un nuovo export e una nuova verifica.';
  ui.copyReport.disabled = true;
  if (ui.reportDialog.open) ui.reportDialog.close();
  ui.operation.textContent = 'Output precedente invalidato · ripeti la sanificazione';
  if (state.phase === 'ready') toast('warning', 'Export precedente non più valido',
    'Riquadri o impostazioni modificati. Il PDF va rigenerato e verificato.');
}

function clearDownloadUrl() {
  for (const timer of downloadTimers.values()) window.clearTimeout(timer);
  downloadTimers.clear();
  for (const url of downloadUrls) URL.revokeObjectURL(url);
  downloadUrls.clear();
  verifiedConfigKey = null;
  ui.verifiedDownload.removeAttribute('href');
  ui.verifiedDownload.hidden = true;
}

function confirmExport() {
  if (state.phase !== 'ready' || !state.pdfLib || ui.overlay.style.visibility === 'hidden') return;
  $('#export-confirm-summary').textContent = `${state.store.count} riquadri · ${state.pages} pagine · ${document.querySelector('input[name="export-dpi"]:checked')?.value || '300'} DPI`;
  ui.exportDialog.showModal();
}

/** @param {string} phase @param {number} page @param {number} total */
function showExportProgress(phase, page, total) {
  const progress = phase.startsWith('Raster') ? Math.round((page / total) * 85) :
    phase.startsWith('Controllo') ? 2 : phase.startsWith('Ricostruzione') ? 91 : 97;
  ui.progressBar.value = progress;
  ui.progressTitle.textContent = phase;
  ui.progressDetail.textContent = page > 0 ? `Pagina ${page} / ${total} · ${progress}%` : 'Validazione preventiva';
  ui.operation.textContent = phase;
}

async function runExport() {
  if (state.phase !== 'ready' || !state.pdfLib || !state.inspector ||
      ui.overlay.style.visibility === 'hidden') return;
  const epoch = state.epoch;
  const abort = new AbortController();
  state.exportAbort = abort;
  const originalAudit = state.audit;
  const options = {
    inspector: state.inspector, pdfjs: state.pdfjs, pdfLib: state.pdfLib,
    boxes: state.store.all(),
    dpi: /** @type {150|250|300} */ (Number(document.querySelector('input[name="export-dpi"]:checked')?.value || 300)),
    watermark: ui.watermark.value, opacity: Number(ui.opacity.value) / 100,
    signal: abort.signal, onProgress: showExportProgress,
  };
  selectTab('tab-export');
  state.phase = 'exporting';
  state.editor?.setEnabled(false);
  clearDownloadUrl();
  state.reportText = '';
  ui.copyReport.disabled = true;
  ui.progress.hidden = false;
  ui.progressBar.value = 0;
  updateControls();
  try {
    const result = await sanitizePdf(options);
    if (epoch !== state.epoch || abort.signal.aborted) {
      if (result.bytes.byteLength) result.bytes.fill(0);
      return;
    }
    // Blob construction snapshots the typed-array bytes; clear the JS copy.
    const blob = new Blob([result.bytes], { type: 'application/pdf' });
    if (result.bytes.byteLength) result.bytes.fill(0);
    clearDownloadUrl();
    const url = URL.createObjectURL(blob);
    downloadUrls.add(url);
    ui.verifiedDownload.href = url;
    ui.verifiedDownload.download = 'documento_SANIFICATO.pdf';
    verifiedConfigKey = currentExportKey();
    ui.verifiedDownload.hidden = false;
    const metadataInfo = originalAudit?.complete ? `${originalAudit.metadataCount} rilevati nell’originale` : 'audit iniziale non completo';
    const report = [
      'SANIFICAZIONE COMPLETATA · VERIFICA AUTOMATICA SUPERATA',
      `Sessione: ${new Date().toISOString()}`,
      '',
      `[OK] Pagine ricostruite da immagini: ${result.pagesRasterized}/${state.pages} (${result.dpi} DPI)`,
      `[OK] Riquadri fusi nei pixel: ${result.boxesApplied}`,
      `[OK] Pixel verificati nelle aree oscurate: ${result.maskPixelsVerified.toLocaleString('it-IT')}`,
      `[OK] Caratteri estraibili nel nuovo PDF: ${result.verification.remainingChars}`,
      `[OK] Campi Info non neutri / XMP: ${result.verification.metadataFields}`,
      `[OK] Allegati / annotazioni / moduli / script rilevati: 0`,
      `[INFO] Metadati nell’originale: ${metadataInfo}`,
      `[INFO] Dimensione documento generato: ${(blob.size / (1024*1024)).toFixed(2)} MiB`,
      `[INFO] SHA-256 del PDF generato: ${result.sha256}`,
      '',
      'Il testo non coperto resta VISIBILE e può essere letto con OCR.',
      'Verifica strutturale interna: non sostituisce una revisione indipendente.',
      'Nessun contatore di traffico di rete viene dichiarato senza misurazione.',
    ].join('\n');
    state.reportText = report;
    ui.reportOutput.textContent = report;
    ui.copyReport.disabled = false;
    ui.progressBar.value = 100;
    ui.progressTitle.textContent = 'File ricostruito e verificato';
    ui.progressDetail.textContent = 'Premi “Scarica PDF verificato” nel report.';
    ui.operation.textContent = 'Output verificato · pronto al download';
    closeDrawer();
    ui.reportDialog.showModal();
  } catch (error) {
    if (epoch !== state.epoch || abort.signal.aborted) return;
    clearDownloadUrl();
    ui.progressTitle.textContent = 'Esportazione bloccata';
    ui.progressDetail.textContent = 'Non è stato preparato alcun download.';
    ui.operation.textContent = 'Verifica non superata · download bloccato';
    toast('error', 'PDF non esportato', error instanceof Error ? error.message : 'Errore di esportazione.');
  } finally {
    if (epoch === state.epoch) {
      state.phase = 'ready'; state.exportAbort = null; updateControls();
      updateRedactionList();
      resetIdleTimer();
    }
  }
}

async function copyReport() {
  if (!state.reportText) return;
  try { await navigator.clipboard.writeText(state.reportText); toast('info', 'Report copiato', 'Il riepilogo è negli appunti del dispositivo.'); }
  catch { toast('warning', 'Copia non consentita', 'Il browser potrebbe richiedere HTTPS o un permesso esplicito.'); }
}

function resetVisualState() {
  ui.empty.hidden = false;
  ui.stage.hidden = true;
  ui.xrayPanel.hidden = true;
  ui.previewText.textContent = '';
  ui.pdfCanvas.width = ui.pdfCanvas.height = 0;
  ui.overlay.width = ui.overlay.height = 0;
  ui.overlay.style.visibility = 'hidden';
  state.editor?.reset();
  ui.sheet.style.removeProperty('width');
  ui.sheet.style.removeProperty('height');
  ui.file.value = '';
  ui.fileName.textContent = 'Nessun documento';
  ui.viewer.scrollTop = ui.viewer.scrollLeft = 0;
  ui.status.textContent = 'Nessun file in sessione';
  ui.detail.textContent = 'PDF: — | Pagine: —';
  ui.operation.textContent = 'In attesa di un PDF locale';
  ui.dropzone.dataset.dropState = 'idle';
  ui.shell.dataset.activeTool = 'select';
  ui.viewer.querySelector('[data-tool="xray"]')?.setAttribute('aria-pressed', 'false');
  for (const tool of document.querySelectorAll('[data-tool="redact"], [data-tool="pan"], [data-tool="select"]')) tool.setAttribute('aria-pressed', 'false');
  ui.watermark.value = ''; ui.opacity.value = '25'; ui.opacityValue.textContent = '25%';
  ui.progress.hidden = true; ui.progressBar.value = 0;
  state.reportText = ''; ui.copyReport.disabled = true;
  ui.reportOutput.textContent = 'Nessun report disponibile.';
  ui.verifiedDownload.hidden = true; ui.verifiedDownload.removeAttribute('href');
  selectTab('tab-audit');
  state.pages = 0;
  state.page = 1;
  state.zoom = 1;
  state.fit = false;
  state.xray = false;
  state.audit = null;
  resetAudit();
  updateRedactionList();
  updateControls();
}

function closeDrawer(restoreFocus = false) {
  const wasOpen = ui.drawer.classList.contains('is-open');
  ui.drawer.classList.remove('is-open');
  ui.drawer.removeAttribute('role');
  ui.drawer.removeAttribute('aria-modal');
  ui.drawerToggle?.setAttribute('aria-expanded', 'false');
  if (location.hash === '#inspector-panel') history.replaceState(null, '', location.pathname + location.search);
  if (restoreFocus && wasOpen) ui.drawerToggle?.focus();
}
function openDrawer() {
  ui.drawer.classList.add('is-open');
  ui.drawerToggle?.setAttribute('aria-expanded', 'true');
  if (matchMedia('(max-width: 1023px)').matches) {
    ui.drawer.setAttribute('role', 'dialog');
    ui.drawer.setAttribute('aria-modal', 'true');
  }
  ui.drawer.querySelector('.inspector-tab[aria-selected="true"]')?.focus();
}

function markReadyToSelect() {
  state.phase = 'empty';
  resetVisualState();
  setPhase('AUDIT LOCALE · IN ATTESA DI PDF');
  const heading = $('#empty-state-title');
  heading.textContent = 'Il documento resta sul tuo dispositivo.';
  $('.dropzone-description').textContent = 'Trascina un PDF o selezionalo dal dispositivo. L\'analisi è locale e non invia il file a server.';
  $('.dropzone-footnote span').textContent = 'Fino a 100 MB e 300 pagine. Per dati critici, disconnetti la rete prima dell\'importazione.';
  $('.viewport-hint').lastChild.textContent = ' Importazione locale · Export solo dopo verifica strutturale';
  ui.exportSummary.textContent = 'Ogni pagina verrà rasterizzata e verificata prima del download.';
}

/** @param {unknown} error */
function describeError(error) {
  if (error instanceof PdfInspectionError) return error.message;
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (name === 'PasswordException') return 'PDF protetto da password. Usa una copia sbloccata e riprova.';
  if (name === 'InvalidPDFException' || name === 'MissingPDFException') return 'PDF non valido o corrotto. Prova un altro file.';
  if (name === 'RenderingCancelledException') return 'Rendering annullato.';
  return 'Lettura o rendering non riusciti. Controlla il file oppure chiudi la sessione e riprova.';
}

/** @param {File|null|undefined} file */
async function importFile(file) {
  if (!file) return;
  if (state.phase !== 'empty' || !state.pdfjs) {
    toast('warning', 'Sessione già attiva', 'Chiudi la sessione corrente prima di importare un altro PDF.');
    return;
  }
  const epoch = ++state.epoch;
  const inspector = new PdfInspector(state.pdfjs);
  state.inspector = inspector;
  state.phase = 'loading';
  resetIdleTimer();
  ui.file.value = '';
  setPhase('LETTURA LOCALE · IN CORSO');
  ui.status.textContent = 'Lettura PDF in memoria';
  ui.operation.textContent = 'Validazione intestazione e limiti';
  updateControls();
  try {
    const loaded = await inspector.open(file);
    if (epoch !== state.epoch) return;
    state.pages = loaded.numPages;
    state.page = 1;
    state.zoom = 1;
    state.fit = false;
    state.phase = 'ready';
    state.editor?.setTool('select');
    ui.shell.dataset.activeTool = 'select';
    resetIdleTimer();
    ui.fileName.textContent = safeText(file.name, 120) || 'documento.pdf';
    ui.fileName.title = 'Nome del file locale';
    ui.status.textContent = 'Documento in memoria · non sanificato';
    ui.detail.textContent = `PDF: ${(file.size / (1024 * 1024)).toFixed(2)} MB | Pagine: ${state.pages}`;
    ui.empty.hidden = true;
    ui.stage.hidden = false;
    ui.operation.textContent = 'Anteprima locale';
    $('#page-stage-hint').textContent = 'ANTEPRIMA NON SANIFICATA · I riquadri saranno fusi nei pixel solo nell’export verificato.';
    setPhase('DOCUMENTO CARICATO · NON SANIFICATO');
    ui.auditNoticeTitle.textContent = 'Audit in preparazione';
    ui.auditNoticeText.textContent = 'Lettura di testo, metadati, annotazioni, allegati e azioni rilevabili in locale.';
    updateControls();
    if (matchMedia('(max-width: 767px)').matches) await fitWidth();
    else await showPage(1);
    if (epoch !== state.epoch) return;
    void scanAudit(epoch, inspector);
  } catch (error) {
    if (epoch !== state.epoch) return;
    await destroySession(true);
    ui.operation.textContent = 'Importazione non riuscita';
    toast('error', 'Impossibile aprire PDF', describeError(error));
  }
}

/** @param {number} pageNumber */
async function showPage(pageNumber) {
  const inspector = state.inspector;
  if (state.phase !== 'ready' || !inspector) return;
  const renderEpoch = ++state.renderEpoch;
  const epoch = state.epoch;
  state.editor?.setEnabled(false);
  ui.overlay.style.visibility = 'hidden';
  state.page = Math.max(1, Math.min(state.pages, pageNumber));
  updateControls();
  ui.operation.textContent = `Rendering pagina ${state.page} / ${state.pages}`;
  try {
    const result = await inspector.renderPage(state.page, ui.pdfCanvas, state.zoom, window.devicePixelRatio || 1);
    if (epoch !== state.epoch || renderEpoch !== state.renderEpoch) return;
    ui.sheet.style.width = `${result.width}px`;
    ui.sheet.style.height = `${result.height}px`;
    ui.overlay.width = result.pixelWidth;
    ui.overlay.height = result.pixelHeight;
    state.editor?.setPage(state.page);
    ui.overlay.style.visibility = 'visible';
    state.editor?.setEnabled(true);
    updateControls();
    ui.operation.textContent = 'Anteprima generata nel browser';
    if (state.xray) void updateXray(epoch, renderEpoch);
  } catch (error) {
    if (epoch !== state.epoch || renderEpoch !== state.renderEpoch ||
        (error instanceof PdfInspectionError && error.code === 'CANCELLED') ||
        error?.name === 'RenderingCancelledException') return;
    ui.overlay.style.visibility = 'hidden';
    ui.operation.textContent = 'Errore di rendering';
    toast('error', 'Pagina non visualizzabile', describeError(error));
  }
}

/** @param {number} epoch @param {PdfInspector} inspector */
async function scanAudit(epoch, inspector) {
  try {
    const report = await inspector.audit((done, total) => {
      if (epoch === state.epoch) ui.auditNoticeText.textContent = `Scansione pagina ${done} di ${total} · nessun caricamento del documento`;
    });
    if (epoch !== state.epoch) return;
    state.audit = report;
    paintAudit(report);
    toast(report.complete ? 'info' : 'warning', report.complete ? 'Audit completato' : 'Audit parziale',
      report.complete ? `${report.totalPages} pagine analizzate.` : 'Alcuni elementi non sono verificabili. Consulta l’ispettore.');
  } catch (error) {
    if (epoch !== state.epoch) return;
    ui.auditNoticeTitle.textContent = 'Audit non completato';
    ui.auditNoticeText.textContent = describeError(error);
    toast('error', 'Errore durante l’analisi', describeError(error));
  }
}

/** @param {number} epoch @param {number} renderEpoch */
async function updateXray(epoch, renderEpoch) {
  const inspector = state.inspector;
  if (!inspector || !state.xray) return;
  ui.previewText.textContent = 'Estrazione del testo della pagina…';
  try {
    const preview = await inspector.getPageText(state.page);
    if (epoch !== state.epoch || renderEpoch !== state.renderEpoch || !state.xray) return;
    ui.previewText.textContent = preview.text || '(Nessun testo estraibile tramite PDF.js in questa pagina.)';
    ui.xrayInfo.textContent = preview.truncated
      ? 'Anteprima limitata a 6.000 caratteri. Non include OCR. La leggibilità visiva non dimostra assenza di testo nascosto.'
      : 'Testo estraibile da PDF.js. Non include OCR, non certifica che tutto il testo nascosto sia stato trovato.';
  } catch (error) {
    if (epoch !== state.epoch) return;
    ui.previewText.textContent = 'Testo non estraibile in questa pagina.';
    ui.xrayInfo.textContent = describeError(error);
  }
}

async function toggleXray() {
  if (state.phase !== 'ready') return;
  state.xray = !state.xray;
  ui.xrayPanel.hidden = !state.xray;
  ui.viewer.querySelector('[data-tool="xray"]')?.setAttribute('aria-pressed', String(state.xray));
  if (state.xray) await updateXray(state.epoch, state.renderEpoch);
}

/** @param {number} newZoom */
function changeZoom(newZoom) {
  if (state.phase !== 'ready') return;
  state.fit = false;
  state.zoom = Math.max(zoomSteps[0], Math.min(zoomSteps[zoomSteps.length - 1], newZoom));
  void showPage(state.page);
}

/** @param {number} direction */
function stepZoom(direction) {
  if (state.phase !== 'ready') return;
  const next = direction > 0
    ? zoomSteps.find((step) => step > state.zoom + 0.001)
    : [...zoomSteps].reverse().find((step) => step < state.zoom - 0.001);
  if (next !== undefined) changeZoom(next);
}

async function fitWidth() {
  const inspector = state.inspector;
  if (state.phase !== 'ready' || !inspector) return;
  const epoch = state.epoch;
  const page = state.page;
  try {
    const { width } = await inspector.getPageSize(page);
    if (epoch !== state.epoch || page !== state.page) return;
    const viewportPadding = matchMedia('(max-width: 767px)').matches ? 30 : 76;
    const space = Math.max(150, ui.viewer.clientWidth - viewportPadding);
    state.zoom = Math.min(3, Math.max(0.35, space / width));
    state.fit = true;
    await showPage(page);
  } catch (error) {
    if (epoch === state.epoch) toast('error', 'Zoom non disponibile', describeError(error));
  }
}

/** @param {boolean} [quiet] */
async function destroySession(quiet = false) {
  ++state.epoch;
  ++state.renderEpoch;
  window.clearTimeout(inactivityTimer);
  window.clearTimeout(warningTimer);
  state.exportAbort?.abort();
  state.exportAbort = null;
  const inspector = state.inspector;
  state.inspector = null;
  state.phase = 'destroying';
  if (ui.exportDialog.open) ui.exportDialog.close();
  if (ui.reportDialog.open) ui.reportDialog.close();
  clearDownloadUrl();
  if (ui.destroyDialog.open) ui.destroyDialog.close();
  closeDrawer();
  // Release UI-owned resources before waiting for the PDF worker to stop.
  resetVisualState();
  ui.operation.textContent = 'Rilascio risorse in corso';
  try { await inspector?.destroy(); } catch { /* Memory hygiene is best-effort. */ }
  state.phase = state.pdfjs ? 'empty' : 'error';
  if (state.pdfjs) markReadyToSelect();
  else updateControls();
  if (!quiet) toast('info', 'Sessione chiusa', 'Worker e riferimenti controllati dall’app rilasciati per quanto consentito dal browser.');
}

function resetIdleTimer() {
  if (state.phase !== 'ready' && state.phase !== 'loading') return;
  window.clearTimeout(inactivityTimer);
  window.clearTimeout(warningTimer);
  warningTimer = window.setTimeout(() => {
    if (state.phase === 'ready') toast('warning', 'Chiusura automatica tra 60 secondi', 'Interagisci con la pagina per mantenere la sessione aperta.');
  }, 9 * 60_000);
  inactivityTimer = window.setTimeout(() => void destroySession(), 10 * 60_000);
}

/** @param {string} tabId */
function selectTab(tabId) {
  const tab = document.getElementById(tabId);
  if (!tab || tab.hasAttribute('disabled')) return;
  for (const item of document.querySelectorAll('.inspector-tab')) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls'))?.toggleAttribute('hidden', !selected);
  }
}

function attachEvents() {
  document.addEventListener('click', (event) => {
    const element = event.target instanceof Element ? event.target.closest('[data-action]') : null;
    if (!element || element.hasAttribute('disabled')) return;
    switch (element.getAttribute('data-action')) {
      case 'open-file': if (state.phase === 'empty') ui.file.click(); break;
      case 'destroy-session': ui.destroyDialog.showModal(); break;
      case 'cancel-destroy': ui.destroyDialog.close(); break;
      case 'confirm-destroy': void destroySession(); break;
      case 'page-prev': void showPage(state.page - 1); break;
      case 'page-next': void showPage(state.page + 1); break;
      case 'zoom-in': stepZoom(+1); break;
      case 'zoom-out': stepZoom(-1); break;
      case 'fit-width': void fitWidth(); break;
      case 'close-report': ui.reportDialog.close(); break;
      case 'add-rect-numeric': addNumericRedaction(); break;
      case 'sanitize-export': confirmExport(); break;
      case 'cancel-export': ui.exportDialog.close(); break;
      case 'confirm-export': ui.exportDialog.close(); void runExport(); break;
      case 'copy-report': void copyReport(); break;
      default: break;
    }
  });

  ui.file.addEventListener('change', () => {
    const file = ui.file.files?.[0];
    void importFile(file);
  });
  ui.pageInput.addEventListener('change', () => {
    if (state.phase !== 'ready') return;
    const number = Number(ui.pageInput.value);
    if (Number.isInteger(number) && number >= 1 && number <= state.pages) void showPage(number);
    else ui.pageInput.value = String(state.page);
  });

  ui.viewer.querySelector('[data-tool="xray"]')?.addEventListener('click', () => void toggleXray());
  for (const item of document.querySelectorAll('[data-tool="select"], [data-tool="redact"], [data-tool="pan"]')) {
    item.addEventListener('click', () => setEditorTool(item.getAttribute('data-tool')));
  }
  ui.opacity.addEventListener('input', () => { ui.opacityValue.textContent = `${ui.opacity.value}%`; invalidateVerifiedOutput(); });
  ui.watermark.addEventListener('input', invalidateVerifiedOutput);
  for (const input of document.querySelectorAll('input[name="export-dpi"]')) {
    input.addEventListener('change', invalidateVerifiedOutput);
  }
  ui.verifiedDownload.addEventListener('click', (event) => {
    if (verifiedConfigKey === null || verifiedConfigKey !== currentExportKey()) {
      event.preventDefault();
      invalidateVerifiedOutput();
      return;
    }
    const url = ui.verifiedDownload.getAttribute('href');
    if (!url || !downloadUrls.has(url)) { event.preventDefault(); return; }
    if (downloadTimers.has(url)) return;
    const timer = window.setTimeout(() => {
      URL.revokeObjectURL(url); downloadUrls.delete(url); downloadTimers.delete(url);
      if (ui.verifiedDownload.getAttribute('href') === url) {
        ui.verifiedDownload.hidden = true; ui.verifiedDownload.removeAttribute('href');
      }
    }, 60_000);
    downloadTimers.set(url, timer);
  });
  ui.redactionList.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-box-action]') : null;
    if (!button || state.phase !== 'ready') return;
    const id = Number(button.getAttribute('data-box-id'));
    if (button.getAttribute('data-box-action') === 'remove') state.editor?.remove(id);
    else if (button.getAttribute('data-box-action') === 'goto') void selectRedaction(id);
  });
  for (const tab of document.querySelectorAll('.inspector-tab')) {
    tab.addEventListener('click', () => selectTab(tab.id));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('.inspector-tab:not(:disabled)')];
      let next = tabs.indexOf(tab);
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else next = (next + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[next].id);
      tabs[next].focus();
    });
  }

  // Keep drag-and-drop within this document; do not navigate to the dropped file.
  ui.viewer.addEventListener('dragenter', (event) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    ++fileDragCounter;
    ui.dropzone.dataset.dropState = 'over';
  });
  ui.viewer.addEventListener('dragover', (event) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = state.phase === 'empty' ? 'copy' : 'none';
  });
  ui.viewer.addEventListener('dragleave', (event) => {
    event.preventDefault();
    fileDragCounter = Math.max(0, fileDragCounter - 1);
    if (!fileDragCounter) ui.dropzone.dataset.dropState = 'idle';
  });
  ui.viewer.addEventListener('drop', (event) => {
    event.preventDefault();
    fileDragCounter = 0;
    ui.dropzone.dataset.dropState = 'idle';
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (files.length !== 1) {
      toast('warning', 'Importa un PDF alla volta', 'È possibile aprire un solo documento per sessione.');
      return;
    }
    void importFile(files[0]);
  });
  // Prevent accidental navigation to a local document when dropped outside.
  window.addEventListener('dragover', (event) => { if (event.dataTransfer?.types.includes('Files')) event.preventDefault(); });
  window.addEventListener('drop', (event) => { if (event.dataTransfer?.types.includes('Files')) event.preventDefault(); });

  ui.drawerToggle?.addEventListener('click', (event) => { event.preventDefault(); openDrawer(); });
  ui.drawerClose?.addEventListener('click', (event) => {
    event.preventDefault(); closeDrawer(true);
  });
  ui.drawerBackdrop?.addEventListener('click', (event) => { event.preventDefault(); closeDrawer(true); });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && ui.drawer.classList.contains('is-open') &&
        ![ui.exportDialog, ui.reportDialog, ui.destroyDialog].some((dialog) => dialog.open)) {
      closeDrawer(true); return;
    }
    if (event.key === 'Tab' && ui.drawer.classList.contains('is-open') &&
        matchMedia('(max-width: 1023px)').matches && !ui.destroyDialog.open) {
      const focusable = [...ui.drawer.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled)')]
        .filter((item) => item.getClientRects().length > 0);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"], dialog')) return;
    if (state.phase !== 'ready') return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && (event.key === '+' || event.key === '=')) { event.preventDefault(); stepZoom(+1); }
    else if (modifier && event.key === '-') { event.preventDefault(); stepZoom(-1); }
    else if (!modifier && event.key === 'ArrowLeft') { event.preventDefault(); void showPage(state.page - 1); }
    else if (!modifier && event.key === 'ArrowRight') { event.preventDefault(); void showPage(state.page + 1); }
    else if (!modifier && event.key.toLowerCase() === 'x') { event.preventDefault(); void toggleXray(); }
    else if (!modifier && event.key.toLowerCase() === 'r') { event.preventDefault(); setEditorTool('redact'); }
    else if (!modifier && event.key.toLowerCase() === 'h') { event.preventDefault(); setEditorTool('pan'); }
    else if (!modifier && event.key.toLowerCase() === 'v') { event.preventDefault(); setEditorTool('select'); }
    else if (!modifier && (event.key === 'Delete' || event.key === 'Backspace') && state.editor?.selectedId != null) {
      event.preventDefault(); state.editor.remove(state.editor.selectedId);
    }
  });
  window.addEventListener('online', updateNetworkIndicator);
  window.addEventListener('offline', updateNetworkIndicator);
  let lastActivity = 0;
  const recordActivity = () => {
    const now = Date.now();
    if (now - lastActivity >= 1000) { lastActivity = now; resetIdleTimer(); }
  };
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    document.addEventListener(event, recordActivity, { passive: true });
  }
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    if (state.fit) resizeTimer = window.setTimeout(() => void fitWidth(), 150);
  });
  window.addEventListener('pagehide', () => {
    // Browsers cannot guarantee completion of asynchronous cleanup on pagehide.
    void destroySession(true);
  });
}

async function start() {
  updateNetworkIndicator();
  resetAudit();
  attachEvents();
  // The Service Worker caches only allowlisted assets. Registration does not
  // block PDF.js initialization; a first online visit is required.
  void installOfflineShell(reportOfflineShell);
  setPhase('CARICAMENTO MOTORE LOCALE');
  ui.operation.textContent = 'Verifica libreria PDF.js self-hosted';
  try {
    state.pdfjs = await loadLocalPdfJs();
    try { state.pdfLib = await loadLocalPdfLib(); }
    catch { state.pdfLib = null; }
    state.editor = new RedactionCanvas({ canvas: ui.overlay, viewer: ui.viewer, store: state.store,
      onChange: updateRedactionList, onWarning: (message) => toast('warning', 'Riquadro non applicato', message) });
    markReadyToSelect();
    if (!state.pdfLib) toast('warning', 'Esportazione non disponibile', 'Aggiungi pdf-lib locale: npm ci e npm run vendor. L’audit e la selezione restano operativi.');
  } catch {
    state.phase = 'error';
    updateControls();
    setPhase('MOTORE LOCALE NON DISPONIBILE');
    ui.status.textContent = 'Dipendenza PDF.js non presente';
    ui.operation.textContent = 'Esegui npm ci && npm run vendor';
    $('.dropzone-description').textContent = 'Il motore locale PDF.js manca. Completa il setup come indicato nel README. Nessun CDN o fallback remoto viene caricato.';
    $('.dropzone-footnote span').textContent = 'Apri questa pagina tramite un server statico HTTP(S) locale, non con file://.';
    toast('error', 'PDF.js non trovato', 'Prima del primo avvio: npm ci, npm run vendor e un server statico.');
  }
}

void start();
