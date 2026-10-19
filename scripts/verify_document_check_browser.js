const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),WebSocket=require('ws');
const root=process.cwd(),out=path.join(root,'.server-audit/document-check');
fs.mkdirSync(out,{recursive:true});
const assets=[];
async function fixtures(){}
const server=http.createServer((req,res)=>{
 assets.push(req.url);
 const route=decodeURIComponent(new URL(req.url,'http://local').pathname);
 let file=path.resolve(root,'build','.'+route);if(!file.startsWith(path.join(root,'build')+path.sep)){res.writeHead(400);return res.end()}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'build/index.html');
 res.setHeader('Content-Type',file.endsWith('.wasm')?'application/wasm':file.endsWith('.gz')?'application/gzip':file.endsWith('.js')||file.endsWith('.mjs')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':'text/html');
 fs.createReadStream(file).pipe(res);
});
(async()=>{
 await fixtures();await new Promise(r=>server.listen(4187,'127.0.0.1',r));
 const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9357','--user-data-dir='+path.join(out,'chrome'),'about:blank'],{windowsHide:true,stdio:'ignore'});
 let ws;
 try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:9357/json')).json();break}catch{await new Promise(r=>setTimeout(r,250))}}
 if(!tabs)throw Error('Chrome did not start');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.on('open',r));
 let serial=0,history=[],errors=[];const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},30000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject});ws.send(JSON.stringify({id,method,params}))});
 const profile={user:{id:601,user_id:601,nick_name:'Fixture User',firstname:'Fixture',email:'fixture@example.test',position_id:4,super_admin:false},resources:[{id:1,resource:'recruiting',resource_name:'recruiting',name:'Recruiting',display_name:'Recruiting',resource_type:'PAGE',component_key:'recruiting',route:'/dashboard/recruiting',label:'Recruiting',permissions:{view:true,create:true},scope:'OWN'}]};
 ws.on('message',raw=>{
  const m=JSON.parse(raw);
  if(m.id){const q=pending.get(m.id);if(q){pending.delete(m.id);m.error?q.reject(Error(m.error.message)):q.resolve(m.result||{})}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){
   (async()=>{const request=m.params.request,url=new URL(request.url),route=url.pathname.replace(/^.*?(?=\/(?:auth|resume-match)\/)/,'');let body={success:true,data:[],total_pages:1},status=200;
   if(url.origin==='http://127.0.0.1:4187'&&(url.pathname.startsWith('/document-check/')||url.pathname.endsWith('.mjs'))){await send('Fetch.continueRequest',{requestId:m.params.requestId});return;}
   if(request.method==='POST'&&request.postData?.includes('SAMPLE123'))throw Error('Document content sent over network');
   if(route==='/auth/me')body=profile;
   else if(route==='/resume-match/status')body={success:true,data:{history_ready:true}};
   else if(route==='/resume-match/history'){
    if(request.method==='POST'){const record=JSON.parse(request.postData);history.unshift({...record,id:history.length+1,created_at:'2026-10-13 12:00:00'});body={success:true,data:{id:history.length}}}
    else body={success:true,data:history};
   }
   await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:4187'},{name:'Access-Control-Allow-Headers',value:'Authorization, Content-Type'},{name:'Access-Control-Allow-Methods',value:'GET, POST, PUT, OPTIONS'}],body:Buffer.from(request.method==='OPTIONS'?'':JSON.stringify(body)).toString('base64')});
   })().catch(e=>errors.push(e.message));
  }
 });
 const run=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 const wait=async expression=>{for(let i=0;i<800;i++){if(await run(expression))return;await new Promise(r=>setTimeout(r,300))}throw Error('Wait failed: '+expression)};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',resourceType:'XHR'},{urlPattern:'*',resourceType:'Fetch'}]});
 const token='fixture.'+Buffer.from(JSON.stringify({user_id:601,firstname:'Fixture',email:'fixture@example.test',position_id:4,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
 await send('Network.setCookie',{name:'jwtToken',value:token,url:'http://127.0.0.1:4187'});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const light=await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('e2e-theme','light')"});
 await send('Page.navigate',{url:'http://127.0.0.1:4187/dashboard/recruiting'});
 await wait("!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Document Check'))");
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:light.identifier});
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Document Check')).click()");
 await wait("!!document.querySelector('.doc-check')");

 if(process.env.DOCUMENT_CHECK_PRIVATE_SAMPLES==='1'){
  const local=fs.readdirSync(path.join(root,'docs')).filter(name=>name.toLowerCase().endsWith('.pdf'));
  const samples=[['dl',local.find(name=>/driver/i.test(name))],['visa',local.find(name=>/h1b|visa/i.test(name))],['i94',local.find(name=>/i.?94/i.test(name))],['travel',local.find(name=>/travel/i.test(name))]];
  const labels={dl:'Driving licence',visa:'Visa copy',i94:'I-94 record',travel:'Travel history'};
  const pageDom=await send('DOM.getDocument');
  for(const [type,file]of samples){if(!file)throw Error('Expected local sample is missing');const element=await send('DOM.querySelector',{nodeId:pageDom.root.nodeId,selector:'input[aria-label="Upload '+labels[type]+'"]'});await send('DOM.setFileInputFiles',{nodeId:element.nodeId,files:[path.join(root,'docs',file)]});await wait('document.querySelectorAll(".dc-file").length==='+ (samples.findIndex(item=>item[0]===type)+1));}
  await run("Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Run document checks')).click()");
  await wait("document.querySelectorAll('.dc-result-tabs button').length===4");
  const report=[];
  for(let index=0;index<4;index++){
   await run('document.querySelectorAll(".dc-result-tabs button")['+index+'].click()');
   const result=await run("(()=>{const rows=Array.from(document.querySelectorAll('.dc-fields>div'));return {nameDetected:rows.some(row=>row.querySelector('dt').textContent==='Name'&&row.querySelector('dd').textContent.trim().length>1),birthDateDetected:rows.some(row=>row.querySelector('dt').textContent==='Date of birth'),processingFailed:document.querySelector('.dc-status').textContent.includes('incomplete')}})()");
   const type=await run('document.querySelectorAll(".dc-result-tabs button")['+index+'].textContent');
   report.push({category:type.startsWith('Driving')?'dl':type.startsWith('Visa')?'visa':type.startsWith('I-94')?'i94':'travel',...result});
  }
  if(report.some(item=>item.processingFailed)||report.filter(item=>['dl','visa','i94'].includes(item.category)).some(item=>!item.nameDetected))throw Error('A supplied identity-document name was not recognised');
  const result={mode:'Private local PDFs; no screenshots or text exports',documents:report,errors};
  fs.writeFileSync(path.join(out,'private-sample-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));return;
 }
 const png=await run("(()=>{const c=document.createElement('canvas');c.width=1600;c.height=1000;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';x.font='38px Arial';['SAMPLE DOCUMENT - NOT A REAL ID','Full Name: Alex Example','DOB: 01/14/1990','License Number: SAMPLE123','Expiration Date: 12/31/2030'].forEach((line,i)=>x.fillText(line,80,130+i*120));return c.toDataURL('image/png').split(',')[1]})()");
 const image=path.join(out,'synthetic-document.png');fs.writeFileSync(image,Buffer.from(png,'base64'));
 const {jsPDF}=require('jspdf');const scanned=new jsPDF();scanned.addImage('data:image/png;base64,'+png,'PNG',10,10,190,120);const scannedPath=path.join(out,'synthetic-scan.pdf');fs.writeFileSync(scannedPath,Buffer.from(scanned.output('arraybuffer')));
 const digital=new jsPDF();digital.text(['Full Name: Alex Example','DOB: 01/14/1990','License Number: SAMPLE123','Expiration Date: 12/31/2030'],15,25);const digitalPath=path.join(out,'synthetic-text.pdf');fs.writeFileSync(digitalPath,Buffer.from(digital.output('arraybuffer')));
 const doc=await send('DOM.getDocument');
 async function upload(selector,files){const result=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector});await send('DOM.setFileInputFiles',{nodeId:result.nodeId,files});}
 await upload('input[aria-label="Upload Driving licence"]',[image,scannedPath]);
 await wait("document.querySelectorAll('.dc-file').length===2");
 await upload('input[aria-label="Upload I-94 record"]',[digitalPath]);await wait("document.querySelectorAll('.dc-file').length===3");
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Run document checks')).click()");
 await wait("document.querySelectorAll('.dc-result-tabs button').length===3");
 if(!await run("Array.from(document.querySelectorAll('.dc-fields dd')).some(e=>e.textContent==='XXXXXXXX')"))throw Error('Sensitive fields were not masked');
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Show sensitive values')).click()");
 if(!await run("Array.from(document.querySelectorAll('.dc-fields dd')).some(e=>e.textContent.includes('SAMPLE123'))"))throw Error('Actual image OCR did not recover the fixture number');
 await run("document.querySelectorAll('.dc-result-tabs button')[1].click()");
 await wait("document.querySelector('.dc-result-heading small').textContent==='synthetic-scan.pdf'");
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Show sensitive values')).click()");
 if(!await run("Array.from(document.querySelectorAll('.dc-fields dd')).some(e=>e.textContent.includes('SAMPLE123'))"))throw Error('Scanned PDF OCR did not recover the fixture number');
 await run("document.querySelectorAll('.dc-result-tabs button')[2].click()");
 await wait("document.querySelector('.dc-result-heading small').textContent==='synthetic-text.pdf'");
 if(!await run("document.querySelector('.dc-status').textContent.includes('Embedded PDF text')"))throw Error('Embedded text extraction failed');
 fs.writeFileSync(path.join(out,'local-asset-requests.json'),JSON.stringify(assets.filter(asset=>asset.includes('/document-check/ocr/')),null,2));
 if(!assets.some(asset=>asset.includes('eng.traineddata.gz'))||!assets.some(asset=>/tesseract-core.*\.wasm(?:\.js)?/.test(asset)))throw Error('Local model/WASM assets were not fetched');
 await run("HTMLAnchorElement.prototype.click=function(){}");
 await run("(()=>{const original=URL.createObjectURL;URL.createObjectURL=function(blob){if(blob.type==='application/json')window.summaryForTest=blob.text();return original.call(this,blob)}})()");
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Download summary')).click()");
 if(!await run("(async()=>{const report=await window.summaryForTest;return !/SAMPLE123|Alex Example|synthetic-document|synthetic-text|synthetic-scan/.test(report)})()"))throw Error('Summary contains personal values or filenames');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:800,deviceScaleFactor:1,mobile:false});
 await wait("document.querySelector('.doc-check').getBoundingClientRect().bottom<=innerHeight");
 const desktop=await send('Page.captureScreenshot' ,{format:'png'});fs.writeFileSync(path.join(out,'document-check-desktop.png'),Buffer.from(desktop.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
 await wait("document.querySelector('.doc-check').getBoundingClientRect().bottom<=innerHeight");
 await run("document.querySelector('.dc-mobile-panels button:first-child').click()");
 if(!await run("getComputedStyle(document.querySelector('.dc-workspace')).display==='none' && getComputedStyle(document.querySelector('.dc-setup')).display!=='none'"))throw Error('Mobile upload panel switch failed');
 await run("document.querySelector('.dc-mobile-panels button:last-child').click()");
 if(!await run("getComputedStyle(document.querySelector('.dc-workspace')).display!=='none' && getComputedStyle(document.querySelector('.dc-setup')).display==='none'"))throw Error('Mobile review panel switch failed');
 if(!await run("document.querySelector('.doc-check').getBoundingClientRect().width<=innerWidth"))throw Error('Mobile overflow');
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'document-check-mobile.png'),Buffer.from(mobile.data,'base64'));
 await run("localStorage.setItem('e2e-theme','dark')");await send('Page.reload');await wait("!!document.querySelector('.doc-check.dc-dark')");
 if(!await run("!document.querySelector('.dc-result')"))throw Error('Document results survived a reload');
 const dark=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'document-check-dark.png'),Buffer.from(dark.data,'base64'));
 const result={imageOcr:true,scannedPdfOcr:true,pdfTextExtraction:true,localModel:true,localWasm:true,maskedFields:true,summaryRedacted:true,mobileFit:true,viewportFit:true,mobilePanelSwitch:true,darkTheme:true,clearedOnReload:true,errors};
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(errors.length)throw Error('Browser errors detected');
 }finally{if(ws){try{ws.send(JSON.stringify({id:999999,method:'Browser.close'}))}catch{}ws.close()}chrome.kill();server.close()}
})().catch(error=>{console.log(JSON.stringify({failed:true,message:error.message}));process.exitCode=1});
