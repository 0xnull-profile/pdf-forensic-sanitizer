<p align="center">
  <img src="icons/icon-192.png" width="104" alt="PDF Forensic Sanitizer icon: shield, document and redaction bar">
</p>

<h1 align="center">PDF Forensic Sanitizer</h1>

<p align="center"><strong>Privacy-first PDF redaction and raster reconstruction.</strong><br>Your documents. Your device. Your control.</p>

<p align="center"><strong>English</strong> | <a href="README.it.md">Italiano</a></p>

<p align="center">
  <a href="https://0xnull-profile.github.io/pdf-forensic-sanitizer/">Launch Web Edition</a> |
  <a href="https://github.com/0xnull-profile/pdf-forensic-sanitizer/releases/download/v1.0.0-rc.1/PDF-Forensic-Sanitizer-1.0.0-rc.1-Windows-x64.exe">Download Windows Portable</a> |
  <a href="https://github.com/0xnull-profile/pdf-forensic-sanitizer/releases/tag/v1.0.0-rc.1">Release and checksums</a>
</p>

> **Release status:** `v1.0.0-rc.1` is a **public pre-release**, not the final stable `v1.0.0`. The application is not independently security-certified.

## Why this project exists

Sensitive PDF documents should not have to pass through an online document-processing service just to be redacted. **PDF Forensic Sanitizer** is a local-first tool by **0xnull-profile** for inspecting PDFs, covering sensitive areas and exporting a new image-only PDF.

The selected document is processed on the user's device. The application does **not** provide a PDF upload endpoint, cloud document conversion or telemetry. The Web Edition still downloads its application files from GitHub Pages; its initial loading and updates require a trusted network and browser environment.

## Choose your edition

| | Web Edition | Windows Portable |
| --- | --- | --- |
| Access | [Open in browser](https://0xnull-profile.github.io/pdf-forensic-sanitizer/) | [Download `.exe` (x64)](https://github.com/0xnull-profile/pdf-forensic-sanitizer/releases/download/v1.0.0-rc.1/PDF-Forensic-Sanitizer-1.0.0-rc.1-Windows-x64.exe) |
| Setup | No application installation | No Node.js, Python or manual HTTP server |
| Offline use | After all approved static assets have been cached and offline readiness is confirmed | Application assets are bundled; usable without an Internet connection |
| Experience | Responsive, touch-friendly Web/PWA | Standalone Windows desktop window |
| Best suited to | Quick access and mobile devices | Working with documents while disconnected from the network |

**Windows users:** Download the portable executable from the official release, verify it if possible, and open it. No developer tools or package installation are required. The current executable is **unsigned**; Windows may show a publisher warning. Do not turn off Windows security protections to run it.

## What it does

- Inspects multiple PDF pages and reports detectable text, metadata and interactive elements.
- Provides visual black redaction masks that can be moved, resized or removed before export.
- Re-renders **every** page to pixels, applies the masks and builds a **new image-only PDF**, instead of placing superficial rectangles over the original text layer.
- Offers optional watermarking and export resolution controls.
- Reopens and checks the generated PDF before making the verified output available for saving.
- Uses local PDF.js and pdf-lib assets, with no runtime CDN dependencies.
- Includes a responsive **Forensic Glass** interface, touch controls and a static-asset-only offline cache for the Web Edition.

Raster reconstruction intentionally removes selectable/searchable text from the output. It does not guarantee that every sensitive detail was masked correctly: visible unmasked content can still be read or recovered through OCR.

## Quick start

### Web Edition

1. Open the [Web Edition](https://0xnull-profile.github.io/pdf-forensic-sanitizer/).
2. Select a PDF from your device and review the page inspection results.
3. Add and adjust redaction masks over the information to conceal.
4. Inspect every page, then confirm export and save the verified raster PDF.
5. For offline use, wait until the application reports that its static cache is ready **before** disconnecting. Offline availability also depends on your browser retaining that cache.

### Windows Portable

1. Download the [Windows x64 `.exe`](https://github.com/0xnull-profile/pdf-forensic-sanitizer/releases/download/v1.0.0-rc.1/PDF-Forensic-Sanitizer-1.0.0-rc.1-Windows-x64.exe).
2. Move the file to a folder of your choice. No installation or local server is necessary.
3. For sensitive workflows, disconnect from the network before opening your document.
4. Launch the executable, import the PDF, apply masks and export to a destination you choose.

**Tip:** Keep the original PDF as a separate backup. Visually inspect the exported pages before sharing the sanitized copy.

## Privacy, security and limitations

The security model prioritizes **local processing**, **raster-based reconstruction** and **verifiable distribution files**, but no PDF sanitizer can promise universal confidentiality.

- **No document-processing backend:** the application is designed not to transmit selected PDFs to a server. The desktop build can run without network access.
- **No document cache:** the Web Edition's Service Worker allowlist caches application resources, not imported PDFs. Browser, operating-system and downloaded-file persistence remain outside the application's full control.
- **GitHub Pages header limitation:** the Web Edition does **not** satisfy the project's full hardened HTTP-header profile. In particular, a meta-tag CSP cannot enforce `frame-ancestors`, and the host does not supply the required per-worker response CSP. Offline use reduces some network risks but is not an equivalent replacement.
- **Output limitations:** original PDF structures are replaced in the tested raster pipeline, but rendering defects, incorrect mask placement, visible text and OCR remain relevant risks. Image-only PDFs lose searchable/selectable text.
- **Endpoint risks:** malicious browser extensions, compromised operating systems, other local applications and untrusted binaries are not neutralized by the sanitizer.
- **No security certification:** automated tests and independent MuPDF checks on synthetic cases are not a third-party audit or a guarantee for every possible PDF.
- **Unsigned Windows executable:** the current portable build has no Authenticode publisher signature.

For highly sensitive documents, prefer the Windows Portable Edition while disconnected, use a trusted device, and review the output manually. Do not use this software as the sole control where a formal compliance or security assurance process is required.

## Verify downloads and distribution

Each Windows release provides a portable executable and `WINDOWS-SHA256SUMS.txt`. Download **both** files from the [same official release](https://github.com/0xnull-profile/pdf-forensic-sanitizer/releases/tag/v1.0.0-rc.1).

Using Git Bash or another environment with `sha256sum`, run this from the download folder:

```sh
sha256sum -c WINDOWS-SHA256SUMS.txt
```

On Windows PowerShell, you can also calculate the hash and compare it manually with the text file:

```powershell
Get-FileHash -Algorithm SHA256 ".\PDF-Forensic-Sanitizer-1.0.0-rc.1-Windows-x64.exe"
```

The Web distribution includes [SHA-256 checksums](RELEASE-SHA256SUMS.txt) and an [SPDX software bill of materials](SBOM.spdx.json). **Checksums published beside the files on the same hosting service detect changes but do not independently authenticate the publisher.** The README files are repository documentation, not part of the application's signed or checksummed `dist/` payload.

## Project transparency

This public repository contains the **deployable Web distribution** and its public Windows release assets. The separate development repository, including full source, build tools and tests, is **private at this stage**. Accordingly, this public distribution should not be described as a complete open-source development release. Please refer to any explicitly published license terms; public availability alone does not grant an open-source license.

The user interface is currently in **Italian**. This README is available in [English](README.md) and [Italian](README.it.md).

Found a bug? Use [GitHub Issues](https://github.com/0xnull-profile/pdf-forensic-sanitizer/issues) if enabled, with a **synthetic or anonymized reproduction**. Never upload confidential PDFs, secrets or personal data to a public issue. For a sensitive security report, use a private contact channel rather than posting exploit details publicly.

---

<p align="center"><strong>0xnull-profile</strong> | Privacy-first tools, built around user control.</p>
