/*
 * Static Service Worker template. The build generates sw.js from this file
 * and an allowlist of versioned application assets.
 * Imported documents are not cached here.
 */
'use strict';
const CACHE_PREFIX = 'pdf-sanitizer-static-';
const CACHE_NAME = CACHE_PREFIX + 'f82ae2892b3f5cd06e4757b5';
const FILES = ["css/style.css","index.html","js/app.js","js/export-integrity.js","js/offline-shell.js","js/pdf-inspector.js","js/redaction-canvas.js","js/sanitizer-engine.js","manifest.webmanifest","vendor/PDFJS-LICENSE","vendor/PDFLIB-LICENSE","vendor/README.md","vendor/SHA256SUMS.txt","vendor/cmaps/78-EUC-H.bcmap","vendor/cmaps/78-EUC-V.bcmap","vendor/cmaps/78-H.bcmap","vendor/cmaps/78-RKSJ-H.bcmap","vendor/cmaps/78-RKSJ-V.bcmap","vendor/cmaps/78-V.bcmap","vendor/cmaps/78ms-RKSJ-H.bcmap","vendor/cmaps/78ms-RKSJ-V.bcmap","vendor/cmaps/83pv-RKSJ-H.bcmap","vendor/cmaps/90ms-RKSJ-H.bcmap","vendor/cmaps/90ms-RKSJ-V.bcmap","vendor/cmaps/90msp-RKSJ-H.bcmap","vendor/cmaps/90msp-RKSJ-V.bcmap","vendor/cmaps/90pv-RKSJ-H.bcmap","vendor/cmaps/90pv-RKSJ-V.bcmap","vendor/cmaps/Add-H.bcmap","vendor/cmaps/Add-RKSJ-H.bcmap","vendor/cmaps/Add-RKSJ-V.bcmap","vendor/cmaps/Add-V.bcmap","vendor/cmaps/Adobe-CNS1-0.bcmap","vendor/cmaps/Adobe-CNS1-1.bcmap","vendor/cmaps/Adobe-CNS1-2.bcmap","vendor/cmaps/Adobe-CNS1-3.bcmap","vendor/cmaps/Adobe-CNS1-4.bcmap","vendor/cmaps/Adobe-CNS1-5.bcmap","vendor/cmaps/Adobe-CNS1-6.bcmap","vendor/cmaps/Adobe-CNS1-UCS2.bcmap","vendor/cmaps/Adobe-GB1-0.bcmap","vendor/cmaps/Adobe-GB1-1.bcmap","vendor/cmaps/Adobe-GB1-2.bcmap","vendor/cmaps/Adobe-GB1-3.bcmap","vendor/cmaps/Adobe-GB1-4.bcmap","vendor/cmaps/Adobe-GB1-5.bcmap","vendor/cmaps/Adobe-GB1-UCS2.bcmap","vendor/cmaps/Adobe-Japan1-0.bcmap","vendor/cmaps/Adobe-Japan1-1.bcmap","vendor/cmaps/Adobe-Japan1-2.bcmap","vendor/cmaps/Adobe-Japan1-3.bcmap","vendor/cmaps/Adobe-Japan1-4.bcmap","vendor/cmaps/Adobe-Japan1-5.bcmap","vendor/cmaps/Adobe-Japan1-6.bcmap","vendor/cmaps/Adobe-Japan1-UCS2.bcmap","vendor/cmaps/Adobe-Korea1-0.bcmap","vendor/cmaps/Adobe-Korea1-1.bcmap","vendor/cmaps/Adobe-Korea1-2.bcmap","vendor/cmaps/Adobe-Korea1-UCS2.bcmap","vendor/cmaps/B5-H.bcmap","vendor/cmaps/B5-V.bcmap","vendor/cmaps/B5pc-H.bcmap","vendor/cmaps/B5pc-V.bcmap","vendor/cmaps/CNS-EUC-H.bcmap","vendor/cmaps/CNS-EUC-V.bcmap","vendor/cmaps/CNS1-H.bcmap","vendor/cmaps/CNS1-V.bcmap","vendor/cmaps/CNS2-H.bcmap","vendor/cmaps/CNS2-V.bcmap","vendor/cmaps/ETHK-B5-H.bcmap","vendor/cmaps/ETHK-B5-V.bcmap","vendor/cmaps/ETen-B5-H.bcmap","vendor/cmaps/ETen-B5-V.bcmap","vendor/cmaps/ETenms-B5-H.bcmap","vendor/cmaps/ETenms-B5-V.bcmap","vendor/cmaps/EUC-H.bcmap","vendor/cmaps/EUC-V.bcmap","vendor/cmaps/Ext-H.bcmap","vendor/cmaps/Ext-RKSJ-H.bcmap","vendor/cmaps/Ext-RKSJ-V.bcmap","vendor/cmaps/Ext-V.bcmap","vendor/cmaps/GB-EUC-H.bcmap","vendor/cmaps/GB-EUC-V.bcmap","vendor/cmaps/GB-H.bcmap","vendor/cmaps/GB-V.bcmap","vendor/cmaps/GBK-EUC-H.bcmap","vendor/cmaps/GBK-EUC-V.bcmap","vendor/cmaps/GBK2K-H.bcmap","vendor/cmaps/GBK2K-V.bcmap","vendor/cmaps/GBKp-EUC-H.bcmap","vendor/cmaps/GBKp-EUC-V.bcmap","vendor/cmaps/GBT-EUC-H.bcmap","vendor/cmaps/GBT-EUC-V.bcmap","vendor/cmaps/GBT-H.bcmap","vendor/cmaps/GBT-V.bcmap","vendor/cmaps/GBTpc-EUC-H.bcmap","vendor/cmaps/GBTpc-EUC-V.bcmap","vendor/cmaps/GBpc-EUC-H.bcmap","vendor/cmaps/GBpc-EUC-V.bcmap","vendor/cmaps/H.bcmap","vendor/cmaps/HKdla-B5-H.bcmap","vendor/cmaps/HKdla-B5-V.bcmap","vendor/cmaps/HKdlb-B5-H.bcmap","vendor/cmaps/HKdlb-B5-V.bcmap","vendor/cmaps/HKgccs-B5-H.bcmap","vendor/cmaps/HKgccs-B5-V.bcmap","vendor/cmaps/HKm314-B5-H.bcmap","vendor/cmaps/HKm314-B5-V.bcmap","vendor/cmaps/HKm471-B5-H.bcmap","vendor/cmaps/HKm471-B5-V.bcmap","vendor/cmaps/HKscs-B5-H.bcmap","vendor/cmaps/HKscs-B5-V.bcmap","vendor/cmaps/Hankaku.bcmap","vendor/cmaps/Hiragana.bcmap","vendor/cmaps/KSC-EUC-H.bcmap","vendor/cmaps/KSC-EUC-V.bcmap","vendor/cmaps/KSC-H.bcmap","vendor/cmaps/KSC-Johab-H.bcmap","vendor/cmaps/KSC-Johab-V.bcmap","vendor/cmaps/KSC-V.bcmap","vendor/cmaps/KSCms-UHC-H.bcmap","vendor/cmaps/KSCms-UHC-HW-H.bcmap","vendor/cmaps/KSCms-UHC-HW-V.bcmap","vendor/cmaps/KSCms-UHC-V.bcmap","vendor/cmaps/KSCpc-EUC-H.bcmap","vendor/cmaps/KSCpc-EUC-V.bcmap","vendor/cmaps/Katakana.bcmap","vendor/cmaps/LICENSE","vendor/cmaps/NWP-H.bcmap","vendor/cmaps/NWP-V.bcmap","vendor/cmaps/RKSJ-H.bcmap","vendor/cmaps/RKSJ-V.bcmap","vendor/cmaps/Roman.bcmap","vendor/cmaps/UniCNS-UCS2-H.bcmap","vendor/cmaps/UniCNS-UCS2-V.bcmap","vendor/cmaps/UniCNS-UTF16-H.bcmap","vendor/cmaps/UniCNS-UTF16-V.bcmap","vendor/cmaps/UniCNS-UTF32-H.bcmap","vendor/cmaps/UniCNS-UTF32-V.bcmap","vendor/cmaps/UniCNS-UTF8-H.bcmap","vendor/cmaps/UniCNS-UTF8-V.bcmap","vendor/cmaps/UniGB-UCS2-H.bcmap","vendor/cmaps/UniGB-UCS2-V.bcmap","vendor/cmaps/UniGB-UTF16-H.bcmap","vendor/cmaps/UniGB-UTF16-V.bcmap","vendor/cmaps/UniGB-UTF32-H.bcmap","vendor/cmaps/UniGB-UTF32-V.bcmap","vendor/cmaps/UniGB-UTF8-H.bcmap","vendor/cmaps/UniGB-UTF8-V.bcmap","vendor/cmaps/UniJIS-UCS2-H.bcmap","vendor/cmaps/UniJIS-UCS2-HW-H.bcmap","vendor/cmaps/UniJIS-UCS2-HW-V.bcmap","vendor/cmaps/UniJIS-UCS2-V.bcmap","vendor/cmaps/UniJIS-UTF16-H.bcmap","vendor/cmaps/UniJIS-UTF16-V.bcmap","vendor/cmaps/UniJIS-UTF32-H.bcmap","vendor/cmaps/UniJIS-UTF32-V.bcmap","vendor/cmaps/UniJIS-UTF8-H.bcmap","vendor/cmaps/UniJIS-UTF8-V.bcmap","vendor/cmaps/UniJIS2004-UTF16-H.bcmap","vendor/cmaps/UniJIS2004-UTF16-V.bcmap","vendor/cmaps/UniJIS2004-UTF32-H.bcmap","vendor/cmaps/UniJIS2004-UTF32-V.bcmap","vendor/cmaps/UniJIS2004-UTF8-H.bcmap","vendor/cmaps/UniJIS2004-UTF8-V.bcmap","vendor/cmaps/UniJISPro-UCS2-HW-V.bcmap","vendor/cmaps/UniJISPro-UCS2-V.bcmap","vendor/cmaps/UniJISPro-UTF8-V.bcmap","vendor/cmaps/UniJISX0213-UTF32-H.bcmap","vendor/cmaps/UniJISX0213-UTF32-V.bcmap","vendor/cmaps/UniJISX02132004-UTF32-H.bcmap","vendor/cmaps/UniJISX02132004-UTF32-V.bcmap","vendor/cmaps/UniKS-UCS2-H.bcmap","vendor/cmaps/UniKS-UCS2-V.bcmap","vendor/cmaps/UniKS-UTF16-H.bcmap","vendor/cmaps/UniKS-UTF16-V.bcmap","vendor/cmaps/UniKS-UTF32-H.bcmap","vendor/cmaps/UniKS-UTF32-V.bcmap","vendor/cmaps/UniKS-UTF8-H.bcmap","vendor/cmaps/UniKS-UTF8-V.bcmap","vendor/cmaps/V.bcmap","vendor/cmaps/WP-Symbol.bcmap","vendor/iccs/CGATS001Compat-v2-micro.icc","vendor/iccs/LICENSE","vendor/pdf-lib.esm.js","vendor/pdf.min.mjs","vendor/pdf.worker.min.mjs","vendor/standard_fonts/FoxitDingbats.pfb","vendor/standard_fonts/FoxitFixed.pfb","vendor/standard_fonts/FoxitFixedBold.pfb","vendor/standard_fonts/FoxitFixedBoldItalic.pfb","vendor/standard_fonts/FoxitFixedItalic.pfb","vendor/standard_fonts/FoxitSerif.pfb","vendor/standard_fonts/FoxitSerifBold.pfb","vendor/standard_fonts/FoxitSerifBoldItalic.pfb","vendor/standard_fonts/FoxitSerifItalic.pfb","vendor/standard_fonts/FoxitSymbol.pfb","vendor/standard_fonts/LICENSE_FOXIT","vendor/standard_fonts/LICENSE_LIBERATION","vendor/standard_fonts/LiberationSans-Bold.ttf","vendor/standard_fonts/LiberationSans-BoldItalic.ttf","vendor/standard_fonts/LiberationSans-Italic.ttf","vendor/standard_fonts/LiberationSans-Regular.ttf","vendor/wasm/LICENSE_JBIG2","vendor/wasm/LICENSE_OPENJPEG","vendor/wasm/LICENSE_PDFJS_JBIG2","vendor/wasm/LICENSE_PDFJS_OPENJPEG","vendor/wasm/LICENSE_PDFJS_QCMS","vendor/wasm/LICENSE_PDFJS_QUICKJS","vendor/wasm/LICENSE_QCMS","vendor/wasm/LICENSE_QUICKJS","vendor/wasm/jbig2.wasm","vendor/wasm/jbig2_nowasm_fallback.js","vendor/wasm/openjpeg.wasm","vendor/wasm/openjpeg_nowasm_fallback.js","vendor/wasm/qcms_bg.wasm","vendor/wasm/quickjs-eval.js","vendor/wasm/quickjs-eval.wasm"];
const ROOT = new URL('./', self.registration.scope);
const STATIC_URLS = new Set(FILES.map((name) => new URL(name, ROOT).href));
const INDEX = new URL('index.html', ROOT).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    // No cache is populated at request time. A failed install is not offline-ready.
    const cache = await caches.open(CACHE_NAME);
    try {
      for (const name of FILES) {
        const url = new URL(name, ROOT);
        const response = await fetch(url, {
          cache: 'reload', credentials: 'same-origin', redirect: 'error',
        });
        if (!response.ok || response.type !== 'basic') {
          throw new Error('Static asset unavailable: ' + name);
        }
        await cache.put(url, response);
      }
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // Let existing tabs finish using their current application version.
    // Activating a new worker mid-export could mix old and new code.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) =>
      name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Local Blob downloads never use HTTP and must remain browser-managed.
  if (url.protocol === 'blob:' || url.protocol === 'data:') return;
  const isHome = url.origin === ROOT.origin &&
    (url.pathname === ROOT.pathname || url.pathname === new URL('index.html', ROOT).pathname);
  const asset = request.method === 'GET' && url.origin === ROOT.origin && !url.search &&
    STATIC_URLS.has(url.href) ? url.href :
    request.method === 'GET' && request.mode === 'navigate' && isHome ? INDEX : null;

  // Only serve approved GET requests. There is no runtime cache fallback
  // for unknown assets or document uploads.
  event.respondWith(asset ? (async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(asset)) || Response.error();
  })() : Response.error());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'STATIC_CACHE_STATUS' || !event.ports?.[0]) return;
  const port = event.ports[0];
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = new Set((await cache.keys()).map((request) => request.url));
      const complete = keys.size === STATIC_URLS.size && [...STATIC_URLS].every((url) => keys.has(url));
      port.postMessage({ type: 'STATIC_CACHE_STATUS', complete,
        assetsExpected: STATIC_URLS.size, assetsCached: keys.size });
    } catch {
      port.postMessage({ type: 'STATIC_CACHE_STATUS', complete: false,
        assetsExpected: STATIC_URLS.size, assetsCached: 0 });
    }
  })());
});
