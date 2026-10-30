// Document text extraction for PDF, DOCX, and TXT files.
// PDF: pdfjs-dist (text-layer extraction; scanned PDFs produce little/no text)
// DOCX: mammoth (raw text)
// TXT: direct read
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_TYPES = ['pdf', 'docx', 'txt'];
export class ExtractionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExtractionError';
    }
}
export function getFileExtension(name) {
    const parts = name.toLowerCase().split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}
export function validateFile(file) {
    if (!file.size) return {ok:false,error:'Choose a non-empty document.'};
    if (file.size > MAX_FILE_SIZE) {
        return { ok: false, error: `File "${file.name}" exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
    }
    const ext = getFileExtension(file.name);
    if (!ACCEPTED_TYPES.includes(ext)) {
        return { ok: false, error: `Unsupported file type ".${ext || 'unknown'}". Please upload a PDF, DOCX, or TXT file.` };
    }
    return { ok: true };
}
export async function extractText(file) {
    const validation=validateFile(file);if(!validation.ok)throw new ExtractionError(validation.error);
    const ext = getFileExtension(file.name);
    if (ext === 'txt')
        return extractTxt(file);
    if (ext === 'pdf')
        return extractPdf(file);
    if (ext === 'docx')
        return extractDocx(file);
    throw new ExtractionError(`Unsupported file type ".${ext}".`);
}
async function extractTxt(file) {
    const text = await file.text();
    if (!text.trim()) {
        throw new ExtractionError('The text file appears to be empty.');
    }
    return { text: cleanText(text), likelyScanned: false };
}
async function extractPdf(file) {
    try {
        const pdfjsLib=await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjsLib.GlobalWorkerOptions.workerSrc=(process.env.PUBLIC_URL||'')+'/resume-match/pdf.worker.min.mjs';
        const buffer = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer, isEvalSupported: false }).promise;
        if(doc.numPages>40){await doc.destroy();throw new ExtractionError('Choose a PDF with at most 40 pages.');}
        const parts = [];
        try {
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
                .map((item) => ('str' in item ? item.str : ''))
                .join(' ');
            parts.push(pageText);
        }
        } finally {await doc.destroy();}
        const text = cleanText(parts.join('\n'));
        if (!text || text.length < 20) {
            return {
                text: '',
                likelyScanned: true,
                note: 'We could not extract text from this PDF — it appears to be a scanned image rather than a text-based document. ' +
                    'Please paste the resume text directly into the editor as a fallback.',
            };
        }
        return { text, likelyScanned: false };
    }
    catch (err) {
        if (err instanceof ExtractionError)
            throw err;
        throw new ExtractionError('We could not read this PDF. The file may be corrupted or password-protected. Try pasting the text directly instead.');
    }
}
async function extractDocx(file) {
    try {
        const mammoth = await import('mammoth/mammoth.browser');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = cleanText(result.value);
        if (!text.trim()) {
            throw new ExtractionError('The DOCX file appears to contain no extractable text.');
        }
        return { text, likelyScanned: false };
    }
    catch (err) {
        if (err instanceof ExtractionError)
            throw err;
        throw new ExtractionError('We could not read this DOCX file. It may be corrupted. Try pasting the text directly instead.');
    }
}
function cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
export function countWords(text) {
    const t = text.trim();
    if (!t)
        return 0;
    return t.split(/\s+/).length;
}
export function isUsableText(text) {
    return countWords(text) >= 20;
}
