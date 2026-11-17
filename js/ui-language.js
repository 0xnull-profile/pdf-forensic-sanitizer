// @ts-check
/**
 * UI-only Italian/English localization. No remote translation services or storage.
 * Source-document text and filenames must remain unchanged.
 * The app's original Italian UI strings are stable source keys; unknown strings
 * (including PDF.js diagnostics) are left untouched instead of guessed.
 */
const ENGLISH = Object.freeze(
{
  "Vai all'area di lavoro": "Skip to workspace",
  "Navigazione documento": "Document navigation",
  "Pagine": "Pages",
  "Pagina precedente": "Previous page",
  "Pagina successiva": "Next page",
  "Pagina": "Page",
  "Numero pagina": "Page number",
  "di": "of",
  "Riduci zoom": "Zoom out",
  "Aumenta zoom": "Zoom in",
  "Adatta alla larghezza": "Fit to width",
  "Stato rete non ancora verificato": "Network state not yet verified",
  "Lo stato della rete sarà verificato dal modulo applicativo": "The app will check the network state",
  "RETE · NON VERIFICATA": "NETWORK · UNVERIFIED",
  "RETE": "NETWORK",
  "Versione Windows portabile: apri le release ufficiali su GitHub": "Windows portable edition: open official GitHub releases",
  "Distruggi sessione": "Destroy session",
  "Apri pannello ispettore": "Open inspector panel",
  "Area di lavoro PDF": "PDF workspace",
  "Nessun documento": "No document",
  "AVVIO MOTORE LOCALE": "STARTING LOCAL ENGINE",
  "Strumenti PDF touch": "Touch PDF tools",
  "Seleziona e modifica riquadri": "Select and edit redaction boxes",
  "Disegna oscuramento sul PDF": "Draw redaction on PDF",
  "Sposta pagina": "Pan page",
  "Seleziona": "Select",
  "Oscura": "Redact",
  "Sposta": "Pan",
  "Mano": "Hand",
  "PRIVATE WORKSPACE · PDF": "PRIVATE PDF WORKSPACE",
  "I tuoi documenti.": "Your documents.",
  "Solo tuoi.": "Your control.",
  "Analizza, oscura e ricostruisci i PDF direttamente sul dispositivo. Nessun caricamento del documento su un server.": "Inspect, redact and rebuild PDFs on your device. Documents are never uploaded to a processing server.",
  "Seleziona PDF": "Choose PDF",
  "Inizializzazione del motore locale in corso.": "Initializing the local engine.",
  "Preferisci lavorare senza browser?": "Prefer working without a browser?",
  "Versione Windows portabile · senza installazione · utilizzo offline": "Portable Windows edition · no installation · works offline",
  "Analisi preliminare · Esportazione non disponibile": "Preliminary analysis · Export unavailable",
  "Il tuo browser non supporta canvas.": "Your browser does not support canvas.",
  "X-RAY · TESTO ESTRAIBILE": "X-RAY · EXTRACTABLE TEXT",
  "SOLO LETTURA": "READ ONLY",
  "Il testo estraibile potrebbe non includere elementi grafici e contenuti riconoscibili con OCR.": "Extractable text may exclude graphics and content recoverable through OCR.",
  "ANTEPRIMA NON SANIFICATA · Le aree nere diventeranno permanenti solo nell’export verificato.": "UNSANITIZED PREVIEW · Blacked-out areas become permanent only in the verified export.",
  "Nessun file in sessione": "No file in session",
  "PDF: —  |  Pagine: —": "PDF: —  |  Pages: —",
  "ASSET OFFLINE · DA VERIFICARE": "OFFLINE ASSETS · UNVERIFIED",
  "Inizializzazione": "Initialization",
  "Seleziona un PDF": "Choose a PDF",
  "Riquadri": "Boxes",
  "Esporta": "Export",
  "PANNELLO FORENSE": "FORENSIC PANEL",
  "Ispettore documento": "Document inspector",
  "Esposizione del documento": "Document exposure",
  "Metadati, livelli testuali e oggetti incorporati.": "Metadata, text layers and embedded objects.",
  "Analisi non eseguita": "Analysis not yet run",
  "L’analisi locale partirà dopo la selezione di un PDF.": "The local analysis will start when you select a PDF.",
  "RIEPILOGO RISCHI": "RISK OVERVIEW",
  "Metadati": "Metadata",
  "Non analizzati": "Not analyzed",
  "Elementi attivi": "Active elements",
  "METADATI PDF": "PDF METADATA",
  "OGGETTI E CONTENUTI": "OBJECTS AND CONTENT",
  "Livello testuale": "Text layer",
  "In attesa": "Pending",
  "Annotazioni e moduli": "Annotations and forms",
  "Azioni e allegati": "Actions and attachments",
  "Prepara pulizia metadati": "Prepare metadata removal",
  "Redaction distruttiva": "Destructive redaction",
  "Seleziona le aree da eliminare dai pixel della pagina.": "Select areas to remove from the page pixels.",
  "RIQUADRI DA APPLICARE": "REDACTION BOXES",
  "Nessun riquadro definito": "No redaction boxes defined",
  "Attiva Redaction e trascina sul documento.": "Choose Redact and drag on the document.",
  "Aggiungi riquadro tramite coordinate": "Add a box using coordinates",
  "Percentuali della pagina visualizzata (0–100). Utilizzabile anche da tastiera.": "Percentages of the displayed page (0–100). Keyboard-accessible.",
  "Aggiungi riquadro alla pagina": "Add box to page",
  "Suggerisci dati sensibili": "Suggest sensitive data",
  "Rilevamento automatico previsto in una fase successiva. Controlla manualmente ogni pagina prima di esportare.": "Automatic detection is planned for a future release. Review every page manually before export.",
  "SANIFICAZIONE AVANZATA": "ADVANCED SANITIZATION",
  "Modalità Paranoia": "Paranoia mode",
  "Rasterizzazione completa del documento.": "Full-document rasterization.",
  "In questa versione la rasterizzazione completa è sempre attiva. Ogni pagina viene ricreata come immagine, senza livello testuale. I contenuti visibili restano leggibili e possono essere riconosciuti tramite OCR.": "Full rasterization is always enabled in this release. Each page is rebuilt as an image without a text layer. Visible content remains readable and may be recovered through OCR.",
  "Configura le proprietà del nuovo PDF rasterizzato.": "Configure the properties of the rebuilt raster PDF.",
  "FILIGRANA PERMANENTE": "PERMANENT WATERMARK",
  "Testo della filigrana": "Watermark text",
  "Opacità": "Opacity",
  "La filigrana sarà fusa nei pixel prima dell'esportazione.": "The watermark will be merged into the pixels before export.",
  "QUALITÀ DI ESPORTAZIONE": "EXPORT QUALITY",
  "Risoluzione": "Resolution",
  "DPI di esportazione": "Export DPI",
  "Le immagini PNG possono produrre file di grandi dimensioni. Il limite di memoria viene verificato prima dell’export.": "PNG images can produce large files. Memory limits are checked before export.",
  "Verifica prima del download": "Verification before download",
  "Il download è bloccato se il PDF ricostruito contiene testo estraibile, annotazioni o metadati non neutralizzati.": "Download is blocked if the rebuilt PDF contains extractable text, annotations or unneutralized metadata.",
  "Esportazione in corso": "Export in progress",
  "Preparazione": "Preparing",
  "L’export rasterizza ogni pagina e verifica il risultato prima del download.": "Export rasterizes every page and verifies the result before download.",
  "Sanifica e scarica PDF": "Sanitize and download PDF",
  "L'operazione rilascerà i dati controllati dall'app. La cancellazione fisica della RAM del browser non può essere garantita.": "This releases app-controlled data. Physical erasure of browser RAM cannot be guaranteed.",
  "File e riferimenti conservati in memoria": "Files and references held in memory",
  "Riquadri e impostazioni della sessione": "Redaction boxes and session settings",
  "Canvas temporanei e URL generati": "Temporary canvases and generated URLs",
  "Annulla": "Cancel",
  "Distruggi definitivamente": "Destroy permanently",
  "Conferma sanificazione": "Confirm sanitization",
  "Il nuovo PDF sarà ricostruito esclusivamente da immagini. L’originale non viene modificato.": "The new PDF will be rebuilt entirely from images. The original will not be modified.",
  "Riquadri: — · Pagine: —": "Boxes: — · Pages: —",
  "Verifica tutte le pagine: qualsiasi dato non oscurato rimarrà visibile e potrà essere riconosciuto con OCR. L’anteprima NON è un file sanificato.": "Review every page: anything not redacted will remain visible and may be recovered through OCR. The preview is NOT a sanitized file.",
  "Conferma e genera PDF": "Confirm and generate PDF",
  "Report di sanificazione": "Sanitization report",
  "I controlli descrivono gli elementi misurati nel PDF ricostruito, non una garanzia assoluta contro ogni rischio.": "Checks describe measurable properties of the rebuilt PDF, not a guarantee against every risk.",
  "Nessun report disponibile.": "No report available.",
  "Scarica PDF verificato": "Download verified PDF",
  "Copia report": "Copy report",
  "Chiudi": "Close",
  "COPIA RISERVATA — Destinatario": "CONFIDENTIAL COPY — Recipient",
  "Il risultato della scansione locale apparirà qui.": "Local scan results will appear here.",
  "Non rilevato": "Not detected",
  "Non rilevata": "Not detected",
  "Non rilevate": "Not detected",
  "Non verificato": "Not verified",
  "Non verificati": "Not verified",
  "Non verificabile": "Cannot be verified",
  "Non verificabili": "Cannot be verified",
  "Rilevata": "Detected",
  "Rilevate": "Detected",
  "Altre proprietà XMP": "Other XMP properties",
  "Testo estraibile": "Extractable text",
  "Pagine con testo": "Pages containing text",
  "Annotazioni": "Annotations",
  "Link URL": "URL links",
  "Widget PDF": "PDF widgets",
  "Campi modulo": "Form fields",
  "Allegati": "Attachments",
  "Azioni JavaScript": "JavaScript actions",
  "Azione all’apertura": "Open action",
  "Analisi locale completata": "Local analysis complete",
  "Audit parziale · controlli non completati": "Partial audit · Checks incomplete",
  "Risultati dell'analisi PDF": "PDF analysis results",
  "Risultati parziali dell'analisi PDF": "Partial PDF analysis results",
  "Nessun riquadro. Attiva Redaction (R) e trascina, oppure inserisci coordinate.": "No boxes yet. Choose Redact (R) and drag, or enter coordinates.",
  "Esportazione e verifica in corso…": "Export and verification in progress…",
  "Trascina il dito sul PDF per creare un riquadro. Usa Sposta per scorrere la pagina.": "Drag across the PDF to create a box. Use Pan to scroll the page.",
  "Trascina la pagina per spostarla. Torna a Seleziona per modificare i riquadri.": "Drag the page to pan. Return to Select to edit boxes.",
  "Coordinate non valide": "Invalid coordinates",
  "Usa valori compresi tra 0 e 100; larghezza e altezza devono essere positive.": "Use values from 0 to 100; width and height must be positive.",
  "Riquadro non aggiunto": "Box not added",
  "Controlla le coordinate.": "Check the coordinates.",
  "Le impostazioni sono cambiate. Avvia un nuovo export e una nuova verifica.": "Settings changed. Start a new export and verification.",
  "Output precedente invalidato · ripeti la sanificazione": "Previous output invalidated · Sanitize again",
  "Export precedente non più valido": "Previous export no longer valid",
  "Riquadri o impostazioni modificati. Il PDF va rigenerato e verificato.": "Boxes or settings were changed. Rebuild and verify the PDF.",
  "Validazione preventiva": "Preflight validation",
  "SANIFICAZIONE COMPLETATA · VERIFICA AUTOMATICA SUPERATA": "SANITIZATION COMPLETE · AUTOMATED VERIFICATION PASSED",
  "Il testo non coperto resta VISIBILE e può essere letto con OCR.": "Unredacted text remains VISIBLE and can be read with OCR.",
  "Verifica strutturale interna: non sostituisce una revisione indipendente.": "Internal structural verification does not replace an independent review.",
  "Nessun contatore di traffico di rete viene dichiarato senza misurazione.": "No network traffic counter is claimed without measurement.",
  "File ricostruito e verificato": "File rebuilt and verified",
  "Premi “Scarica PDF verificato” nel report.": "Select “Download verified PDF” in the report.",
  "Output verificato · pronto al download": "Verified output · Ready to download",
  "Esportazione bloccata": "Export blocked",
  "Non è stato preparato alcun download.": "No download has been prepared.",
  "Verifica non superata · download bloccato": "Verification failed · Download blocked",
  "PDF non esportato": "PDF not exported",
  "Errore di esportazione.": "Export error.",
  "Report copiato": "Report copied",
  "Il riepilogo è negli appunti del dispositivo.": "The report has been copied to the device clipboard.",
  "Copia non consentita": "Copy not permitted",
  "Il browser potrebbe richiedere HTTPS o un permesso esplicito.": "The browser may require HTTPS or explicit permission.",
  "PDF: — | Pagine: —": "PDF: — | Pages: —",
  "In attesa di un PDF locale": "Waiting for a local PDF",
  "AUDIT LOCALE · IN ATTESA DI PDF": "LOCAL AUDIT · WAITING FOR PDF",
  "Il documento resta sul tuo dispositivo.": "Your document stays on your device.",
  "Trascina un PDF o selezionalo dal dispositivo. L'analisi è locale e non invia il file a server.": "Drag a PDF here or choose one from your device. Analysis is local and does not upload the document to servers.",
  "Fino a 100 MB e 300 pagine. Per dati critici, disconnetti la rete prima dell'importazione.": "Up to 100 MB and 300 pages. For sensitive files, disconnect from the network before importing.",
  " Importazione locale · Export solo dopo verifica strutturale": " Local import · Export only after structural verification",
  "PDF protetto da password. Usa una copia sbloccata e riprova.": "Password-protected PDF. Use an unlocked copy and try again.",
  "PDF non valido o corrotto. Prova un altro file.": "Invalid or corrupted PDF. Try another file.",
  "Rendering annullato.": "Rendering cancelled.",
  "Lettura o rendering non riusciti. Controlla il file oppure chiudi la sessione e riprova.": "Reading or rendering failed. Check the file, or end the session and try again.",
  "Sessione già attiva": "Session already active",
  "Chiudi la sessione corrente prima di importare un altro PDF.": "Close the current session before importing another PDF.",
  "LETTURA LOCALE · IN CORSO": "LOCAL READ · IN PROGRESS",
  "Lettura PDF in memoria": "Reading PDF into memory",
  "Validazione intestazione e limiti": "Validating header and limits",
  "Nome del file locale": "Local filename",
  "Documento in memoria · non sanificato": "Document in memory · Not sanitized",
  "Anteprima locale": "Local preview",
  "ANTEPRIMA NON SANIFICATA · I riquadri saranno fusi nei pixel solo nell’export verificato.": "UNSANITIZED PREVIEW · Redaction boxes are merged into pixels only in the verified export.",
  "DOCUMENTO CARICATO · NON SANIFICATO": "DOCUMENT LOADED · NOT SANITIZED",
  "Audit in preparazione": "Audit being prepared",
  "Lettura di testo, metadati, annotazioni, allegati e azioni rilevabili in locale.": "Locally checking accessible text, metadata, annotations, attachments and actions.",
  "Importazione non riuscita": "Import failed",
  "Impossibile aprire PDF": "Unable to open PDF",
  "Anteprima generata nel browser": "Preview rendered in the browser",
  "Errore di rendering": "Rendering error",
  "Pagina non visualizzabile": "Unable to display page",
  "Audit completato": "Audit complete",
  "Audit parziale": "Partial audit",
  "Alcuni elementi non sono verificabili. Consulta l’ispettore.": "Some elements cannot be verified. See the inspector.",
  "Audit non completato": "Audit incomplete",
  "Errore durante l’analisi": "Analysis error",
  "Estrazione del testo della pagina…": "Extracting page text…",
  "(Nessun testo estraibile tramite PDF.js in questa pagina.)": "(No text can be extracted from this page with PDF.js.)",
  "Anteprima limitata a 6.000 caratteri. Non include OCR. La leggibilità visiva non dimostra assenza di testo nascosto.": "Preview limited to 6,000 characters. Does not include OCR. Visible readability does not prove that hidden text is absent.",
  "Testo estraibile da PDF.js. Non include OCR, non certifica che tutto il testo nascosto sia stato trovato.": "Text extractable through PDF.js. Does not include OCR and does not certify that all hidden text was found.",
  "Testo non estraibile in questa pagina.": "Text cannot be extracted from this page.",
  "Zoom non disponibile": "Zoom unavailable",
  "Rilascio risorse in corso": "Releasing resources",
  "Sessione chiusa": "Session closed",
  "Worker e riferimenti controllati dall’app rilasciati per quanto consentito dal browser.": "App-controlled workers and references released as far as the browser permits.",
  "Chiusura automatica tra 60 secondi": "Automatic session closure in 60 seconds",
  "Interagisci con la pagina per mantenere la sessione aperta.": "Interact with the page to keep the session open.",
  "Importa un PDF alla volta": "Import one PDF at a time",
  "È possibile aprire un solo documento per sessione.": "Only one document can be opened per session.",
  "CARICAMENTO MOTORE LOCALE": "LOADING LOCAL ENGINE",
  "Verifica libreria PDF.js self-hosted": "Checking self-hosted PDF.js library",
  "Riquadro non applicato": "Box not applied",
  "Esportazione non disponibile": "Export unavailable",
  "Aggiungi pdf-lib locale: npm ci e npm run vendor. L’audit e la selezione restano operativi.": "Add local pdf-lib: npm ci and npm run vendor. Audit and selection remain available.",
  "MOTORE LOCALE NON DISPONIBILE": "LOCAL ENGINE UNAVAILABLE",
  "Dipendenza PDF.js non presente": "PDF.js dependency missing",
  "Esegui npm ci && npm run vendor": "Run npm ci && npm run vendor",
  "Il motore locale PDF.js manca. Completa il setup come indicato nel README. Nessun CDN o fallback remoto viene caricato.": "The local PDF.js engine is missing. Complete setup as described in the README. No CDN or remote fallback is loaded.",
  "Apri questa pagina tramite un server statico HTTP(S) locale, non con file://.": "Open this page through a local static HTTP(S) server, not file://.",
  "PDF.js non trovato": "PDF.js not found",
  "Prima del primo avvio: npm ci, npm run vendor e un server statico.": "Before first launch: npm ci, npm run vendor and a static server.",
  "Chiudi messaggio di errore": "Dismiss error message",
  "APP LOCALE · PRONTA": "LOCAL APP · READY",
  "APP LOCALE · ERRORE": "LOCAL APP · ERROR",
  "APP LOCALE · RISORSE INCORPORATE": "LOCAL APP · BUNDLED ASSETS",
  "APP LOCALE": "LOCAL APP",
  "ASSET OFFLINE · PRONTI": "OFFLINE ASSETS · READY",
  "ASSET OFFLINE · PREPARAZIONE": "OFFLINE ASSETS · PREPARING",
  "ASSET OFFLINE · NON SUPPORTATI": "OFFLINE ASSETS · UNSUPPORTED",
  "ASSET OFFLINE · NON PRONTI": "OFFLINE ASSETS · NOT READY",
  " Lo stato non dimostra che nessun dato venga inviato in rete.": " This status does not prove that no data is sent over the network.",
  "Versione desktop con risorse locali. Le richieste di rete della finestra sono bloccate.": "Desktop edition with local resources. Window network requests are blocked.",
  "Il blocco delle richieste del programma non disattiva Internet sul dispositivo e non garantisce la cancellazione fisica della RAM.": "Blocking the app's network requests does not disconnect the device or guarantee physical RAM erasure.",
  "ONLINE · ELABORAZIONE LOCALE": "ONLINE · LOCAL PROCESSING",
  "OFFLINE RILEVATO": "OFFLINE DETECTED",
  "ONLINE": "ONLINE",
  "OFFLINE": "OFFLINE",
  "Browser segnala una connessione. Elaborazione locale.": "Browser reports a connection. Processing is local.",
  "Browser segnala modalità offline.": "Browser reports offline mode.",
  "La connettività non prova l'assenza di richieste. Verifica con DevTools > Network. Puoi scollegare la rete prima di importare dati riservati.": "Connectivity does not prove the absence of requests. Check DevTools > Network. Disconnect before importing sensitive files.",
  "Stato offline riportato dal browser; non è una misura dei byte trasmessi.": "Offline status is reported by the browser; it does not measure transmitted bytes.",
  "Serve HTTPS o localhost e un browser con Service Worker.": "HTTPS or localhost and a browser with Service Worker are required.",
  "Preparazione cache degli asset statici. I PDF non vengono memorizzati.": "Preparing the static asset cache. PDFs are not stored.",
  "Cache offline incompleta: controlla la connessione e ricarica.": "Offline cache incomplete: check your connection and reload.",
  "Cache offline non disponibile: applicazione utilizzabile solo con asset accessibili.": "Offline cache unavailable: the app only works while its assets are accessible.",
  "Audit e redaction dei PDF interamente in locale. Esportazione da immagini raster con verifica del documento ricostruito.": "Inspect and redact PDFs locally. Raster-image reconstruction with verification of the rebuilt document.",
  "[OK] Allegati / annotazioni / moduli / script rilevati: 0": "[OK] Attachments / annotations / forms / scripts detected: 0",
  "audit iniziale non completo": "initial audit incomplete",
  "Controllo limiti e memoria": "Checking limits and memory",
  "Rasterizzazione e oscuramento": "Rasterization and redaction",
  "Ricostruzione del contenitore PDF": "Rebuilding PDF container",
  "Verifica strutturale e testo residuo": "Checking structure and residual text",
  "Modulo PDF.js locale non valido.": "Invalid local PDF.js module.",
  "Pagina troppo grande per una rasterizzazione sicura a 300 DPI.": "Page too large for safe rasterization at 300 DPI.",
  "Sessione PDF chiusa.": "PDF session closed.",
  "Apri una nuova istanza per ogni documento.": "Open a new instance for each document.",
  "Il PDF deve avere dimensione compresa tra 1 byte e 100 MB.": "PDF size must be between 1 byte and 100 MB.",
  "File non valido: intestazione %PDF- assente.": "Invalid file: missing %PDF- header.",
  "Caricamento interrotto.": "Loading interrupted.",
  "Numero pagina non valido.": "Invalid page number.",
  "Pagina o zoom non valido.": "Invalid page or zoom.",
  "Anteprima sostituita da una richiesta successiva.": "Preview replaced by a later request.",
  "Anteprima troppo grande per la memoria disponibile.": "Preview too large for available memory.",
  "Canvas 2D non disponibile.": "2D canvas unavailable.",
  "Pagina o risoluzione non valida.": "Invalid page or resolution.",
  "Rendering sostituito.": "Rendering replaced.",
  "Canvas di esportazione non disponibile.": "Export canvas unavailable.",
  "pdf-lib locale non disponibile.": "Local pdf-lib unavailable.",
  "Esportazione annullata dalla chiusura della sessione.": "Export cancelled when the session ended.",
  "Opacità watermark non valida.": "Invalid watermark opacity.",
  "Non è possibile leggere e verificare i pixel oscurati.": "Cannot read and verify redacted pixels.",
  "Riquadro con area nulla nel canvas.": "Box has zero area on the canvas.",
  "Troppi riquadri sovrapposti: unisci gli oscuramenti prima di esportare.": "Too many overlapping boxes: merge redactions before export.",
  "Lettura dei pixel oscurati non riuscita.": "Could not read redacted pixels.",
  "Lettura dei pixel oscurati incompleta.": "Incomplete redacted pixel readback.",
  "Almeno un pixel della zona oscurata non è nero e opaco. Download bloccato.": "At least one pixel in the redacted area is not opaque black. Download blocked.",
  "Scegli 150, 250 o 300 DPI.": "Choose 150, 250 or 300 DPI.",
  "Numero di pagine non supportato.": "Unsupported number of pages.",
  "Esportazione PNG non supportata da questo browser.": "PNG export unsupported by this browser.",
  "Impossibile codificare la pagina in PNG.": "Could not encode page as PNG.",
  "Motore di verifica PDF.js non disponibile.": "PDF.js verification engine unavailable.",
  "Numero di pagine diverso dopo la ricostruzione.": "Page count changed after reconstruction.",
  "Metadati XMP ancora presenti.": "XMP metadata are still present.",
  "API di verifica insufficienti: non è possibile certificare l’output.": "Insufficient verification APIs: the output cannot be verified.",
  "Allegati, azioni, script o moduli rilevati nel nuovo documento.": "Attachments, actions, scripts or forms detected in the rebuilt document.",
  "Il documento o il motore pdf-lib non è disponibile.": "Document or pdf-lib engine unavailable.",
  "Numero di riquadri non valido.": "Invalid box count.",
  "Riquadro associato a una pagina inesistente.": "Box belongs to a nonexistent page.",
  "Opacità fuori intervallo.": "Opacity out of range.",
  "PDF generato troppo grande. Riduci i DPI o dividi il documento.": "Generated PDF too large. Reduce DPI or split the document.",
  "Riquadro non valido: coordinate normalizzate comprese tra 0 e 1.": "Invalid box: normalized coordinates must be between 0 and 1.",
  "Dimensioni del canvas di esportazione non valide.": "Invalid export canvas dimensions.",
  "Pagina non valida.": "Invalid page.",
  "Limite massimo di 2.000 riquadri per sessione.": "Maximum of 2,000 boxes per session.",
  "Canvas overlay non disponibile.": "Overlay canvas unavailable."
});

// Only known application-generated templates are eligible for translation.
// Capture groups represent counts, never document content.
const PATTERNS = Object.freeze([
  [/^(\d+) proprietà rilevate$/, (_, n) => `${n} properties detected`],
  [/^(\d+) non visualizzate$/, (_, n) => `${n} not shown`],
  [/^(\d+) segnali$/, (_, n) => `${n} indicators`],
  [/^([\d.,]+) caratteri$/, (_, n) => `${n} characters`],
  [/^(\d+) riquadri · ([\d—]+) pagine\. L’export appiattisce l’intero documento\.$/,
    (_, n, p) => `${n} boxes · ${p} pages. Export flattens the entire document.`],
  [/^(\d+) riquadri · (\d+) pagine · (\d+) DPI$/,
    (_, n, p, d) => `${n} boxes · ${p} pages · ${d} DPI`],
  [/^Riquadri: ([\d—]+) · Pagine: ([\d—]+)$/,
    (_, n, p) => `Boxes: ${n} · Pages: ${p}`],
  [/^Mostra riquadro (\d+), pagina (\d+)$/, (_, n, p) => `Show box ${n} on page ${p}`],
  [/^Elimina riquadro (\d+) dalla pagina (\d+)$/, (_, n, p) => `Delete box ${n} from page ${p}`],
  [/^Esaminate (\d+) pagine\. Sono riportati gli elementi rilevabili dalle API PDF\.js; non è una certificazione di assenza di rischi\.$/,
    (_, n) => `Analyzed ${n} pages. Results reflect what the PDF.js APIs can detect; this is not a certification of risk absence.`],
  [/^Pagine esaminate: (\d+)\/(\d+)\. (.*)\. Non interpretare i valori zero come assenza di rischio\.$/,
    (_, done, total, details) => `Pages scanned: ${done}/${total}. ${details}. Do not interpret zero values as an absence of risk.`],
  [/^(\d+) pagine analizzate\.$/, (_, n) => `${n} pages analyzed.`],
  [/^Scansione pagina (\d+) di (\d+) · nessun caricamento del documento$/,
    (_, done, total) => `Scanning page ${done} of ${total} · No document upload`],
  [/^Rendering pagina (\d+) \/ (\d+)$/, (_, page, total) => `Rendering page ${page} / ${total}`],
  [/^Pagina (\d+) \/ (\d+) · (\d+)%$/, (_, page, total, p) => `Page ${page} / ${total} · ${p}%`],
  [/^PDF: ([\d.]+) MB \| Pagine: (\d+)$/, (_, mb, pages) => `PDF: ${mb} MB | Pages: ${pages}`],
  [/^(\d+) rilevati nell’originale$/, (_, n) => `${n} found in the original`],
  [/^v([\d.-]+) · VERSIONE STABILE$/, (_, v) => `v${v} · STABLE RELEASE`],
  [/^(\d+) risorse statiche nella cache del browser\. Nessun PDF salvato\.$/,
    (_, n) => `${n} static resources in the browser cache. No PDFs saved.`],
  [/^\[OK\] Pagine ricostruite da immagini: (\d+)\/(\d+) \(?(\d+ DPI)\)?$/,
    (_, p, total, dpi) => `[OK] Pages rebuilt from images: ${p}/${total} (${dpi})`],
  [/^\[OK\] Riquadri fusi nei pixel: (\d+)$/, (_, n) => `[OK] Boxes merged into pixels: ${n}`],
  [/^\[OK\] Pixel verificati nelle aree oscurate: ([\d.,]+)$/, (_, n) => `[OK] Pixels verified in redacted areas: ${n}`],
  [/^\[OK\] Caratteri estraibili nel nuovo PDF: (\d+)$/, (_, n) => `[OK] Extractable characters in new PDF: ${n}`],
  [/^\[OK\] Campi Info non neutri \/ XMP: (\d+)$/, (_, n) => `[OK] Non-neutral Info/XMP fields: ${n}`],
  [/^\[INFO\] Metadati nell’originale: (.*)$/, (_, value) => `[INFO] Metadata in original: ${translateEnglish(value)}`],
  [/^\[INFO\] Dimensione documento generato: ([\d.]+ MiB)$/, (_, value) => `[INFO] Generated document size: ${value}`],
  [/^\[INFO\] SHA-256 del PDF generato: ([0-9a-f]{64})$/, (_, value) => `[INFO] Generated PDF SHA-256: ${value}`],
]);

// Dynamic, number-only diagnostics from PDF.js and the sanitizer.
const EXTRA_PATTERNS = Object.freeze([
  [/^PDF non supportato: massimo (\d+) pagine\.$/, (_, n) => `Unsupported PDF: maximum ${n} pages.`],
  [/^Pagina (\d+): supera 24 megapixel a (\d+) DPI\. Riduci i DPI\.$/,
    (_, p, dpi) => `Page ${p}: exceeds 24 megapixels at ${dpi} DPI. Reduce the DPI.`],
  [/^Pagina (\d+): superficie troppo grande a (\d+) DPI\. Riduci la risoluzione\.$/,
    (_, p, dpi) => `Page ${p}: surface too large at ${dpi} DPI. Reduce resolution.`],
  [/^Documento troppo grande a (\d+) DPI\. Riduci la risoluzione o dividi il PDF\.$/,
    (_, dpi) => `Document too large at ${dpi} DPI. Reduce resolution or split the PDF.`],
  [/^Campo Info ([A-Za-z]+) presente nel PDF esportato\.$/,
    (_, name) => `Info field ${name} is present in the exported PDF.`],
  [/^Data ([A-Za-z]+) non neutralizzata\.$/,
    (_, name) => `Date ${name} was not neutralized.`],
  [/^Annotazioni residue nella pagina (\d+)\.$/, (_, n) => `Residual annotations on page ${n}.`],
  [/^Azioni della pagina (\d+) non verificabili\.$/, (_, n) => `Actions on page ${n} cannot be verified.`],
  [/^Script residuo nella pagina (\d+)\.$/, (_, n) => `Residual script on page ${n}.`],
  [/^(\d+) caratteri estraibili ancora presenti nell'output\.$/,
    (_, n) => `${n} extractable characters remain in the output.`],
]);

const ALL_PATTERNS = Object.freeze([...PATTERNS, ...EXTRA_PATTERNS]);

const OMIT = '#document-name, #xray-text-preview, #metadata-list, #report-output, #language-toggle, input, textarea, [contenteditable="true"], .icon-sprite';
const LOCALIZED_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt'];
const textHistory = new WeakMap();
const attrHistory = new WeakMap();
let language = 'it';

/** @param {string} browserLanguage */
export function inferLanguage(browserLanguage = '') {
  return /^it(?:[-_]|$)/i.test(browserLanguage) ? 'it' : 'en';
}

/** @param {string} source */
export function translateEnglish(source) {
  const direct = Object.hasOwn(ENGLISH, source) ? ENGLISH[source] : undefined;
  if (direct !== undefined) return direct;
  for (const [expression, transform] of ALL_PATTERNS) {
    if (expression.test(source)) return source.replace(expression, transform);
  }
  return source;
}

export function currentLanguage() { return language; }

/** Translate only app-authored strings, leaving unmatched content alone. */
export function translateUi(source) {
  return language === 'en' ? translateEnglish(source) : source;
}

/** The report contains fixed labels and counts, not the source PDF text. */
export function translateReport(source) {
  return String(source).split('\n').map((line) => translateUi(line)).join('\n');
}

function eligible(node) {
  const parent = node.nodeType === 1 ? node : node.parentElement;
  return parent && !parent.closest(OMIT) && !parent.closest('svg, script, style');
}

function translateTextNode(node) {
  if (!eligible(node)) return;
  let record = textHistory.get(node);
  const now = node.nodeValue ?? '';
  if (!record || now !== record.last) {
    // App logic has set a new UI message. Keep the original in memory only.
    record = { source: now, last: now };
    textHistory.set(node, record);
  }
  const trimmed = record.source.trim();
  const translated = translateUi(trimmed);
  const rendered = trimmed && trimmed !== translated
    ? record.source.replace(trimmed, translated) : record.source;
  if (now !== rendered) node.nodeValue = rendered;
  record.last = rendered;
}

function translateAttrs(element) {
  if (!eligible(element)) return;
  let saved = attrHistory.get(element);
  if (!saved) { saved = new Map(); attrHistory.set(element, saved); }
  for (const name of LOCALIZED_ATTRIBUTES) {
    const current = element.getAttribute(name);
    if (current === null) { saved.delete(name); continue; }
    let record = saved.get(name);
    if (!record || current !== record.last) {
      record = { source: current, last: current };
      saved.set(name, record);
    }
    const rendered = translateUi(record.source);
    if (rendered !== current) element.setAttribute(name, rendered);
    record.last = rendered;
  }
}

function scan(root) {
  if (!root) return;
  if (root.nodeType === 3) { translateTextNode(root); return; }
  if (root.nodeType !== 1) return;
  const element = /** @type {Element} */ (root);
  if (!eligible(element)) return;
  translateAttrs(element);
  const iterator = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let item = iterator.nextNode(); item; item = iterator.nextNode()) {
    if (item.nodeType === 3) translateTextNode(item);
    else translateAttrs(/** @type {Element} */ (item));
  }
}

function renderToggle(button) {
  if (!button) return;
  button.textContent = language === 'it' ? 'EN' : 'IT';
  button.lang = language === 'it' ? 'en' : 'it';
  const hint = language === 'it' ? 'Passa all’inglese' : 'Switch to Italian';
  button.setAttribute('aria-label', hint);
  button.title = hint;
}

/**
 * Install local-only localization. User choices are session-only and cannot
 * change the state of a PDF, the release URL, or the exported PDF bytes.
 * @param {() => void} [onChange]
 */
export function installLanguage(onChange) {
  const button = document.getElementById('language-toggle');
  if (!button) throw new Error('Missing language switcher');
  language = inferLanguage(navigator.language || '');
  const render = () => {
    document.documentElement.lang = language;
    scan(document.querySelector('.skip-link'));
    scan(document.getElementById('app'));
    // Document filenames remain untouched; localize only the empty placeholder.
    const shell = document.getElementById('app');
    const fileName = document.getElementById('document-name');
    if (shell?.dataset.appState === 'empty' && fileName &&
        ['Nessun documento', 'No document'].includes(fileName.textContent)) {
      fileName.textContent = translateUi('Nessun documento');
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      const italian = 'Audit e redaction dei PDF interamente in locale. Esportazione da immagini raster con verifica del documento ricostruito.';
      meta.content = translateUi(italian);
    }
    renderToggle(button);
  };
  render();
  button.addEventListener('click', () => {
    language = language === 'it' ? 'en' : 'it';
    render();
    onChange?.();
  });
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') scan(record.target);
      else if (record.type === 'attributes') translateAttrs(record.target);
      else for (const child of record.addedNodes) scan(child);
    }
  });
  observer.observe(document.getElementById('app'), {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: LOCALIZED_ATTRIBUTES,
  });
}
