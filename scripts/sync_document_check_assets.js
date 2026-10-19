const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../public/document-check/ocr');
fs.mkdirSync(path.join(root,'core'),{recursive:true});fs.mkdirSync(path.join(root,'lang'),{recursive:true});
const worker=path.join(path.dirname(require.resolve('tesseract.js/package.json')),'dist/worker.min.js');
fs.copyFileSync(worker,path.join(root,'worker.min.js'));
const core=path.dirname(require.resolve('tesseract.js-core/package.json'));
for(const file of fs.readdirSync(core)){if(file.startsWith('tesseract-core')&&/\.(js|wasm)$/.test(file))fs.copyFileSync(path.join(core,file),path.join(root,'core',file));}
const english=path.join(path.dirname(require.resolve('@tesseract.js-data/eng/package.json')),'4.0.0_best_int/eng.traineddata.gz');
fs.copyFileSync(english,path.join(root,'lang/eng.traineddata.gz'));
console.log('Synced local Document Check OCR worker, WebAssembly and English language model.');
