# Recruiting Document Check

Open Recruiting > Document Check, or the recruiting resource route followed by /document-check. It inherits the Recruiting view permission and E2E session. This is a local document-review aid, not a fake/original classifier, certified identity check, malware scanner or immigration/work-eligibility decision.

## Local processing and privacy

PDF/JPEG/PNG contents are read entirely in the browser. English Tesseract.js 6.0.1 runs in a Web Worker using self-hosted worker, WebAssembly and language files. No OCR key, cloud OCR service, Supabase configuration, PHP upload endpoint or database migration is required. OCR language-model caching is disabled. Files, extracted text and review marks stay in tab memory and are cleared by the Clear session action, leaving the page or closing/reloading the tab. The application does not send document contents to its backend. Other extensions or scripts running in the same browser are outside this module's control.

Reference name/DOB are optional. Fields and rule flags are suggestions requiring visual confirmation: OCR can omit or misread data, dates assume MM/DD/YYYY or supported labelled formats, and document templates differ. Missing fields mean not recognised, not necessarily absent. Expiry flags do not establish immigration status. I-94 admit-until entries can use D/S. Photo-ID appearance and all pages must still be reviewed by a trained person. The manual review checkbox is a session marker and is not a certification.

Supported categories: driving licence, I-94, travel history, visa copy. The H-1B checkbox organises the upload panel and does not prescribe which documents a person must provide. Each type accepts up to two files. Include both sides of a two-sided document. Limits: 8 MB per file, 32 MB total, 5 PDF pages per file, 20-megapixel images, 6-megapixel rendered canvases and a four-minute review timeout. Scanned PDF pages use OCR; sufficiently readable embedded text is extracted directly. English printed text is supported; handwriting, glare, seals, complex layouts and foreign scripts can require manual review.

Checks cover signatures/extensions/MIME consistency, readability, selected labelled fields, optional name/DOB comparison, valid calendar dates, past labelled expiry dates, and byte-identical duplicate uploads. SHA-256 hashes stay in memory. No forensic alteration detection, barcode authentication, issuer connection or authoritative identity verification is performed. No numeric authenticity score is provided.

Document/reference numbers and birth dates are masked until explicitly revealed. Extracted text is available in a closed-by-default disclosure. Image previews are hidden until sensitive values are explicitly revealed and are rasterised without active PDF content; the first-page preview is not a review of all pages. Preview object URLs are revoked when results are cleared or the page is unmounted. The JSON summary excludes recognised personal fields, filenames, document text, images and fingerprints; it includes technical findings and review marks. Downloaded reports are retained on the user's device until the user removes them.

## Deployment

1. Use HTTPS (localhost is supported for development).
2. Run npm ci, then npm run build. Existing prestart/prebuild hooks call scripts/sync_document_check_assets.js automatically.
3. Deploy the complete build output, including document-check/ocr/worker.min.js, document-check/ocr/core/*, document-check/ocr/lang/eng.traineddata.gz and the existing resume-match/pdf.worker.min.mjs.
4. Serve JavaScript as JavaScript, .wasm as application/wasm and .gz model files as binary/gzip files. Do not replace missing asset responses with SPA index.html. Do not add Content-Encoding: gzip to the already compressed language file in a way that causes the browser to transparently decompress it before the OCR loader reads it.
5. If CSP is configured, allow same-origin workers, model/core fetches and WebAssembly execution as required by your browser/CSP. Previews use blob: images. No CDN is required.
6. Keep generated OCR assets out of Git; they are generated from pinned dependencies by the hook. Both package.json and package-lock.json must accompany source builds. No separate backend service is installed.

Document correctness needs issuer/original-record checks. The official CBP site is https://i94.cbp.dhs.gov/; users access it separately and this module does not automatically submit candidate data there.

## Verification

11 focused Jest tests passed for validation, dates, field comparison, duplicate detection, masking, preview reveal, cancellation and clearing. The production build passed with only existing unrelated repository warnings. The Chrome check uses synthetic (non-identity) fixtures and actual OCR, confirming image OCR, scanned-PDF OCR, embedded text, self-hosted engine/model loading, masked fields, redacted summary export, mobile fit, dark theme and clearing on reload. Run the optional development helper with node scripts/verify_document_check_browser.js after building; it uses API fixtures and does not upload real identity documents.


## Name-reading improvements

Name reading supports split First/Given and Last/Surname labels, standalone NAME labels without a colon, beneficiary columns on approval paperwork, and licence field codes 1/2. Low-quality scans are retried at rotated orientations and with sparse-text segmentation; the page preview follows the chosen orientation. Licence position-based readings and partial names require explicit manual confirmation. Names are never inferred from filenames or copied from other documents. CBP year/month-name/day dates are supported; printed OMB form expiration dates on I-94/travel records are not treated as the traveller document expiry. Some travel-history layouts do not print a name, so the module explains the missing name instead of inventing one.

The name-reading update passed 18 focused tests. A separate private Chrome run processed four locally supplied PDFs without exporting their text or taking screenshots: names were recognised in the licence, H-1B paperwork and I-94; the travel-history layout had no recognised name and remains subject to document-number/manual checks. Some other fields in low-quality scans still need visual review. Local sample PDFs are excluded from Git and are not included in the React build.
