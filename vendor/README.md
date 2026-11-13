# Local runtime dependencies

Run `npm ci` followed by `npm run vendor` to copy the pinned PDF.js and pdf-lib builds into this directory. The script includes the resources PDF.js needs for CMaps, color profiles, standard fonts, and WASM decoding.

`tools/build-offline.mjs` also generates `../sw.js`, which caches approved application assets only. It does not cache imported PDFs or extracted document data.

`SHA256SUMS.txt` records the vendored file hashes for the current build. The release script verifies those files before publishing. For provenance claims, publish a signed release or reference hash independently of the static host.
