import {validateDocumentFile} from './documentReview';
import {findDocumentName} from './nameExtraction';
const PIXEL_LIMIT=20000000,RENDER_PIXELS=6000000;
const aborted=()=>new DOMException('Document check cancelled.','AbortError');
function check(signal){if(signal?.aborted)throw aborted();}
function abortable(promise,signal){
 if(!signal)return promise;
 return new Promise((resolve,reject)=>{const stop=()=>reject(aborted());if(signal.aborted)return stop();signal.addEventListener('abort',stop,{once:true});Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',stop));});
}
async function previewBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.85));}
function canvasFor(width,height){
 const scale=Math.min(1,3000/Math.max(width,height),Math.sqrt(RENDER_PIXELS/(width*height)));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));return canvas;
}
export function createLocalOcrSession(onProgress=()=>{},signal){
 let worker=null,initializing=null,closed=false,activeLabel='';
 const stop=()=>{if(worker){worker.terminate();worker=null;}};
 signal?.addEventListener('abort',stop,{once:true});
 async function engine(){
  check(signal);if(closed)throw aborted();
  if(!initializing)initializing=(async()=>{
   const {createWorker}=await import('tesseract.js');
   const base=(process.env.PUBLIC_URL||'')+'/document-check/ocr';
   const instance=await createWorker('eng',1,{workerPath:base+'/worker.min.js',corePath:base+'/core',langPath:base+'/lang',workerBlobURL:false,cacheMethod:'none',logger:event=>onProgress({label:activeLabel,status:event.status,progress:event.progress||0})});
   if(closed||signal?.aborted){await instance.terminate();throw aborted();}
   worker=instance;await worker.setParameters({preserve_interword_spaces:'1',user_defined_dpi:'300'});return worker;
  })();
  return abortable(initializing,signal);
 }
 async function recognize(canvas,type){
  const instance=await engine();
  const rotated=angle=>{if(!angle)return canvas;const target=document.createElement('canvas');target.width=angle%180?canvas.height:canvas.width;target.height=angle%180?canvas.width:canvas.height;const context=target.getContext('2d');context.translate(target.width/2,target.height/2);context.rotate(angle*Math.PI/180);context.drawImage(canvas,-canvas.width/2,-canvas.height/2);return target;};
  const quality=result=>{const evidence=findDocumentName(result.text,type),markers=(result.text.match(/driver.{0,15}licen[cs]e|\bDOB\b|\bbirth\b|\bname\b|beneficiary|travel history|class of admission|I[- ]?797/gi)||[]).length;return result.confidence+Math.min(20,markers*4)+(evidence.value?(evidence.needsConfirmation?6:18):0)-(result.text.trim().length<30?40:0);};
  async function scan(target,angle,mode='6'){
   check(signal);await instance.setParameters({tessedit_pageseg_mode:mode});
   const {data}=await abortable(instance.recognize(target),signal);
   return {text:data.text||'',confidence:Number(data.confidence)||0,rotation:angle};
  }
  let best=await scan(canvas,0);
  const name=findDocumentName(best.text,type);
  if(best.confidence<68||(!name.value&&best.confidence<85)){
   for(const angle of [90,270,180]){
    onProgress({label:activeLabel,status:'Checking scan orientation',progress:0});
    const target=rotated(angle);
    try{const result=await scan(target,angle);if(quality(result)>quality(best))best=result;}
    finally{target.width=target.height=0;}
    if(best.confidence>=70&&findDocumentName(best.text,type).value)break;
   }
  }
  const evidence=findDocumentName(best.text,type);
  if(!evidence.value||evidence.needsConfirmation){
   onProgress({label:activeLabel,status:'Reading isolated name fields',progress:0});
   const target=rotated(best.rotation);
   try{const sparse=await scan(target,best.rotation,'11');if(quality(sparse)>quality(best))best=sparse;}
   finally{if(target!==canvas)target.width=target.height=0;}
  }
  const oriented=rotated(best.rotation);
  try{return {...best,preview:await previewBlob(oriented)};}
  finally{if(oriented!==canvas)oriented.width=oriented.height=0;}
 }

 return {
  async read(file,label,type){
   check(signal);activeLabel=label;onProgress({label,status:'Checking file',progress:0});
   const mime=await validateDocumentFile(file);check(signal);
   const buffer=await file.arrayBuffer();check(signal);
   const digest=await crypto.subtle.digest('SHA-256',buffer);
   const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   let text='',pages=1,preview=null,lowResolution=false,rotation=0;const confidences=[];
   if(mime==='application/pdf'){
    const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc=(process.env.PUBLIC_URL||'')+'/resume-match/pdf.worker.min.mjs';
    const task=pdfjs.getDocument({data:buffer,isEvalSupported:false,stopAtErrors:true});
    task.onPassword=()=>{task.destroy();};
    const destroy=()=>{task.destroy();};signal?.addEventListener('abort',destroy,{once:true});
    let pdf;
    try{
     pdf=await abortable(task.promise,signal);pages=pdf.numPages;
     if(pages>5)throw Error('Choose a PDF with at most 5 pages. Split longer documents first.');
     for(let index=1;index<=pages;index++){
      check(signal);onProgress({label,status:'Reading page '+index+' of '+pages,progress:(index-1)/pages});
      const page=await pdf.getPage(index),content=await page.getTextContent();
      let pageText=content.items.map(item=>(item.str||'')+(item.hasEOL?'\n':' ')).join('');
      if(pageText.trim().length<80||index===1){
       const view=page.getViewport({scale:3});const canvas=canvasFor(view.width,view.height);
       const viewport=page.getViewport({scale:3*canvas.width/view.width});
       const render=page.render({canvasContext:canvas.getContext('2d'),viewport});
       const cancel=()=>render.cancel();signal?.addEventListener('abort',cancel,{once:true});
       try{await abortable(render.promise,signal);if(index===1)preview=await previewBlob(canvas);
        if(pageText.trim().length<80){const result=await recognize(canvas,type);pageText=result.text;confidences.push(result.confidence);if(index===1){preview=result.preview;rotation=result.rotation;}}
       }finally{signal?.removeEventListener('abort',cancel);canvas.width=canvas.height=0;}
      }
      text+=pageText+'\n\n';page.cleanup();if(text.length>100000)throw Error('Document contains too much text. Split it into a smaller file.');
     }
    }finally{signal?.removeEventListener('abort',destroy);if(pdf)await pdf.destroy();else await task.destroy();}
   }else{
    const bitmap=await createImageBitmap(file);
    try{
     check(signal);
     if(bitmap.width*bitmap.height>PIXEL_LIMIT)throw Error('Image is larger than 20 megapixels. Resize it before uploading.');
     lowResolution=Math.min(bitmap.width,bitmap.height)<500;
     const canvas=canvasFor(bitmap.width,bitmap.height);
     try{canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);preview=await previewBlob(canvas);const result=await recognize(canvas,type);text=result.text;confidences.push(result.confidence);preview=result.preview;rotation=result.rotation;}
     finally{canvas.width=canvas.height=0;}
    }finally{bitmap.close();}
   }
   check(signal);return {text:text.slice(0,100000),fingerprint,pages,preview,lowResolution,rotation,confidence:confidences.length?Math.round(confidences.reduce((a,b)=>a+b,0)/confidences.length):null};
  },
  async close(){closed=true;signal?.removeEventListener('abort',stop);if(worker){const instance=worker;worker=null;await instance.terminate();}}
 };
}
