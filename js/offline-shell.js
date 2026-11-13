// @ts-check
/**
 * Manage registration and readiness checks for the offline application shell.
 * Only static resources are cached. Readiness does not imply network isolation
 * or say anything about the confidentiality of a selected document.
 */

/** @param {ServiceWorker} worker */
export async function getStaticCacheStatus(worker) {
  if (!worker || typeof MessageChannel === 'undefined') return { complete: false };
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      resolve({ complete: false });
    }, 12_000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      const payload = event.data;
      resolve(payload?.type === 'STATIC_CACHE_STATUS' && payload.complete === true &&
        Number.isInteger(payload.assetsExpected) && payload.assetsExpected > 0 &&
        payload.assetsCached === payload.assetsExpected ? payload : { complete: false });
    };
    try { worker.postMessage({ type: 'STATIC_CACHE_STATUS' }, [channel.port2]); }
    catch { window.clearTimeout(timeout); channel.port1.close(); resolve({ complete: false }); }
  });
}

/**
 * Register only on HTTPS/localhost. On hosted deployments the SW installs
 * once, precaches static assets, and will serve the next offline navigation.
 * @param {(status:'preparing'|'ready'|'unavailable'|'error', detail:string)=>void} report
 */
export async function installOfflineShell(report) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    report('unavailable', 'Serve HTTPS o localhost e un browser con Service Worker.');
    return;
  }
  report('preparing', 'Preparazione cache degli asset statici. I PDF non vengono memorizzati.');
  try {
    const workerUrl = new URL('../sw.js', import.meta.url);
    const scope = new URL('../', import.meta.url);
    // Reuse the existing registration after an offline browser restart.
    // A fresh register() can attempt an update fetch before it resolves.
    const existing = await navigator.serviceWorker.getRegistration(scope.href);
    const registration = existing || await navigator.serviceWorker.register(workerUrl.href, {
      scope: scope.pathname, updateViaCache: 'none',
    });
    // `ready` does not indicate the cache contents; the SW independently
    // checks whether all expected static files have been stored.
    const active = registration.active || (await navigator.serviceWorker.ready).active;
    const status = await getStaticCacheStatus(active);
    if (status.complete) report('ready', `${status.assetsCached} risorse statiche nella cache del browser. Nessun PDF salvato.`);
    else report('error', 'Cache offline incompleta: controlla la connessione e ricarica.');
  } catch {
    report('error', 'Cache offline non disponibile: applicazione utilizzabile solo con asset accessibili.');
  }
}
