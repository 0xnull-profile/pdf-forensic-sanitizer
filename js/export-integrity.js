// @ts-check
/**
 * Tie a verified download to the export settings that produced it.
 * Changes to geometry, watermark, or resolution invalidate that download.
 * This key tracks state; it is not a cryptographic integrity check.
 */

/**
 * @param {{epoch:number,revision:number,dpi:number,watermark:string,opacity:number}} state
 */
export function exportConfigKey({ epoch, revision, dpi, watermark, opacity }) {
  if (![epoch, revision, dpi, opacity].every(Number.isFinite) ||
      ![epoch, revision].every(Number.isSafeInteger) ||
      ![150, 250, 300].includes(dpi) || opacity < 5 || opacity > 60 ||
      typeof watermark !== 'string') {
    throw new TypeError('Configurazione di export non valida.');
  }
  return JSON.stringify([epoch, revision, dpi, watermark, opacity]);
}
