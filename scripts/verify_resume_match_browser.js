const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),WebSocket=require('ws');
const root=process.cwd(),out=path.join(root,'.server-audit/resume-match');
fs.mkdirSync(out,{recursive:true});
async function fixtures(){
 const {jsPDF}=require('jspdf');const pdf=new jsPDF();pdf.text(['Alex Example','Software Engineer','Austin, TX','6 years building React Python AWS applications with Docker'],15,20);
 fs.writeFileSync(path.join(out,'alex.pdf'),Buffer.from(pdf.output('arraybuffer')));
 const JSZip=require('jszip'),zip=new JSZip();
 zip.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
 zip.file('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml','<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Jordan Example</w:t></w:r></w:p><w:p><w:r><w:t>Python Developer</w:t></w:r></w:p><w:p><w:r><w:t>Boston, MA. 4 years Python SQL AWS development.</w:t></w:r></w:p></w:body></w:document>');
 fs.writeFileSync(path.join(out,'jordan.docx'),await zip.generateAsync({type:'nodebuffer'}));
}
const server=http.createServer((req,res)=>{
 const route=decodeURIComponent(new URL(req.url,'http://local').pathname);
 let file=path.resolve(root,'build','.'+route);if(!file.startsWith(path.join(root,'build')+path.sep)){res.writeHead(400);return res.end()}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'build/index.html');
 res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':'text/html');
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
 const wait=async expression=>{for(let i=0;i<180;i++){if(await run(expression))return;await new Promise(r=>setTimeout(r,300))}throw Error('Wait failed: '+expression)};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',resourceType:'XHR'},{urlPattern:'*',resourceType:'Fetch'}]});
 const token='fixture.'+Buffer.from(JSON.stringify({user_id:601,firstname:'Fixture',email:'fixture@example.test',position_id:4,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
 await send('Network.setCookie',{name:'jwtToken',value:token,url:'http://127.0.0.1:4187'});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:800,deviceScaleFactor:1,mobile:false});
 const lightInit=await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('e2e-theme','light')"});
 await send('Page.navigate',{url:'http://127.0.0.1:4187/dashboard/recruiting'});
 await wait("!!Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Resume Match'))");
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:lightInit.identifier});
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Resume Match')).click()");
 await wait("!!document.querySelector('.resume-match-page')");
 await wait("document.querySelector('[role=tab][aria-selected=true]').textContent.includes('TechFetch')");
 await wait("document.querySelector('.resume-match-page').getBoundingClientRect().bottom<=innerHeight+1");
 await new Promise(resolve=>setTimeout(resolve,350));
 if(!await run("(()=>{const button=document.querySelector('.rm-techfetch-search button[type=submit]'),panel=document.querySelector('.rm-source-panel');return button.getBoundingClientRect().bottom<=panel.getBoundingClientRect().bottom})()"))throw Error('Search button is clipped');
 const techfetchShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'resume-match-techfetch.png'),Buffer.from(techfetchShot.data,'base64'));
 await run("Array.from(document.querySelectorAll('[role=tab]')).find(b=>b.textContent.includes('Resume Search')).click()");
 await wait("!!document.querySelector('input[aria-label=\"Upload resumes\"]')");

 const set=(selector,value)=>run("(()=>{const input=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(input,"+JSON.stringify(value)+");input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))})()");
 await set('[aria-label="Job description"]','We need a React TypeScript Python AWS developer with Docker experience, SQL skills and communication.');
 const doc=await send('DOM.getDocument');
 const input=await send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[aria-label="Upload resumes"]'});
 await send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[path.join(out,'alex.pdf'),path.join(out,'jordan.docx')]});
 await wait("document.querySelectorAll('.rm-upload-list li').length===2");
 if(!await run("document.querySelector('.rm-upload-list').textContent.includes('Alex Example')&&document.querySelector('.rm-upload-list').textContent.includes('Jordan Example')"))throw Error('PDF/DOCX names not parsed');
 await run("document.querySelector('.rm-primary').click()");await wait("document.querySelectorAll('.rm-score').length===2&&!document.querySelector('.rm-primary').disabled");
 if(history[0]?.source!=='upload')throw Error('Upload history source incorrect');
 await run("document.querySelector('.rm-candidate-header').click()");await wait("document.querySelectorAll('.rm-tags.matched span').length>0");
 await run("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('My history')).click()");await wait("document.querySelectorAll('.rm-history-grid article').length===1");
 await run("document.querySelector('[aria-label=\"Close history\"]').click()");
 const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'resume-match-desktop.png'),Buffer.from(desktop.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:1,mobile:true});
 await run("document.querySelector('.resume-match-page').scrollIntoView()");
 if(!await run("document.querySelector('.resume-match-page').getBoundingClientRect().width<=innerWidth"))throw Error('Mobile width overflow');
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'resume-match-mobile.png'),Buffer.from(mobile.data,'base64'));
 await run("localStorage.setItem('e2e-theme','dark')");await send('Page.reload');await wait("!!document.querySelector('.resume-match-page.rm-dark')");
 const dark=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'resume-match-dark.png'),Buffer.from(dark.data,'base64'));
 const result={darkTheme:true,mode:'Browser with API fixtures; actual PDF/DOCX parsing and scoring workers',recruitingButton:true,subpage:true,techfetchDefault:true,desktopFit:true,pdf:true,docx:true,workerScoring:true,candidateDetails:true,history:true,mobileFit:true,errors};
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(errors.length)throw Error('Browser errors detected');
 }finally{if(ws){try{ws.send(JSON.stringify({id:999999,method:'Browser.close'}))}catch{}ws.close()}chrome.kill();server.close()}
})().catch(e=>{console.log(JSON.stringify({failed:true,message:e.message}));process.exitCode=1});
