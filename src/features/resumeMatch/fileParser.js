/* global globalThis */
const MAX_BYTES = 10 * 1024 * 1024;
export async function parseFile(file) {
  if (file.size > MAX_BYTES) throw new Error('Files must be 10 MB or smaller.');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'txt'].includes(extension)) throw new Error('Choose a PDF, DOCX or TXT file. Convert legacy DOC files first.');
  let text;
  if (extension === 'txt') text = await file.text();
  else if (extension === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser');
    const parser = mammoth.default || mammoth;
    text = (await parser.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;
  } else {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = (process.env.PUBLIC_URL || '') + '/resume-match/pdf.worker.min.mjs';
    const document = await pdfjs.getDocument({data:await file.arrayBuffer(),isEvalSupported:false}).promise;
    try {
      if (document.numPages > 100) throw new Error('Choose a document with 100 pages or fewer.');
      const pages = [];
      for (let page = 1; page <= document.numPages; page++) {
        const content = await (await document.getPage(page)).getTextContent();
        pages.push(content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join(''));
      }
      text = pages.join('\n\n');
    } finally { await document.destroy(); }
  }
  if (!text || text.trim().length < 20) throw new Error('No readable text found. Scanned documents need OCR or conversion to a text-based file.');
  if (text.length > 300000) throw new Error('This document contains too much text. Choose a shorter document.');
  return text;
}
export function candidateFromText(text, filename) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const name = lines.slice(0,5).find(line => line.length < 50 && !line.includes('@') && !/\d{3}/.test(line) && /[a-zA-Z]/.test(line));
  return {
    id:globalThis.crypto?.randomUUID?.() || 'upload-'+Date.now()+'-'+Math.random(),
    name:name || filename.replace(/\.[^.]+$/, ''),
    title:lines.slice(0,10).find(line => line.length < 80 && /engineer|developer|designer|analyst|manager|architect|scientist|consultant|specialist/i.test(line)) || '',
    state:(text.match(/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/) || [''])[0],
    experience:Number((text.match(/(\d{1,2})\+?\s*(?:years?|yrs?)\b/i) || [0,0])[1]),
    skills:[],resumeText:text,
  };
}
