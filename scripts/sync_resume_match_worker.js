const fs=require('fs'),path=require('path');
const source=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy/build/pdf.worker.min.mjs');
const target=path.resolve('public/resume-match/pdf.worker.min.mjs');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
console.log('Synced local PDF worker.');
