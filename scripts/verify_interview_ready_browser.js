const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),WebSocket=require('ws');
const root=process.cwd(),out=path.join(root,'.server-audit/interview-ready');
fs.mkdirSync(out,{recursive:true});
const assets=[];
const vm=require('vm'),assert=require('assert/strict');
const sandbox={};vm.runInNewContext(fs.readFileSync('src/features/interviewReady/lib/demoData.js','utf8').replace(/export /g,'')+';globalThis.samples={DEMO_RESUME,DEMO_JD,DEMO_ANALYSIS,DEMO_TAILORED,DEMO_QUESTIONS,DEMO_FEEDBACK,DEMO_REPORT}',sandbox);const sample=sandbox.samples;
const downloads=path.join(out,'downloads-'+Date.now());fs.mkdirSync(downloads,{recursive:true});
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
 let serial=0,history=[],errors=[],tasks=[],failFeedback=true;const pending=new Map();
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},30000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject});ws.send(JSON.stringify({id,method,params}))});
 ws.on('close',()=>{for(const q of pending.values())q.reject(Error('Test browser closed'));pending.clear();});
 const profile={user:{id:601,user_id:601,nick_name:'Fixture User',firstname:'Fixture',email:'fixture@example.test',position_id:4,super_admin:false},resources:[{id:1,resource:'recruiting',resource_name:'recruiting',name:'Recruiting',display_name:'Recruiting',resource_type:'PAGE',component_key:'recruiting',route:'/dashboard/recruiting',label:'Recruiting',permissions:{view:true,create:true},scope:'OWN'}]};
 ws.on('message',raw=>{
  const m=JSON.parse(raw);
  if(m.id){const q=pending.get(m.id);if(q){pending.delete(m.id);m.error?q.reject(Error(m.error.message)):q.resolve(m.result||{})}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){
   (async()=>{const request=m.params.request,url=new URL(request.url),route=url.pathname.replace(/^.*?(?=\/(?:auth|resume-match)\/)/,'');let body={success:true,data:[],total_pages:1},status=200;
   if(url.origin==='http://127.0.0.1:4187'&&((url.pathname.startsWith('/document-check/')||url.pathname==='/resume-match/config.json')||url.pathname.endsWith('.mjs'))){await send('Fetch.continueRequest',{requestId:m.params.requestId});return;}
   if(request.method==='POST'&&request.postData?.includes('SAMPLE123'))throw Error('Document content sent over network');
   if(url.pathname.endsWith('/ai-assist')){
    if(request.method==='GET')body={configured:true,provider:'Browser fixture',model:'Fixture'};
    else if(request.method==='POST'){
     const payload=JSON.parse(request.postData);tasks.push(payload.task);
     if(payload.task==='analyze')body={analysis:sample.DEMO_ANALYSIS};
     if(payload.task==='tailor')body={resume:sample.DEMO_TAILORED};
     if(payload.task==='questions')body={questions:sample.DEMO_QUESTIONS};
     if(payload.task==='feedback'){if(failFeedback){failFeedback=false;status=503;body={error:'Synthetic retry test'};}else body={feedback:sample.DEMO_FEEDBACK};}
     if(payload.task==='report'){if(payload.resume||payload.jd||payload.results.some(r=>r.answer))errors.push('Report included raw content');body={report:sample.DEMO_REPORT};}
    }
   }
   else if(route==='/auth/me')body=profile;
   else if(route==='/resume-match/status')body={success:true,data:{history_ready:true}};
   else if(route==='/resume-match/history'){
    if(request.method==='POST'){const record=JSON.parse(request.postData);history.unshift({...record,id:history.length+1,created_at:'2026-10-13 12:00:00'});body={success:true,data:{id:history.length}}}
    else body={success:true,data:history};
   }
   await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:4187'},{name:'Access-Control-Allow-Headers',value:'Authorization, Content-Type, apikey'},{name:'Access-Control-Allow-Methods',value:'GET, POST, PUT, OPTIONS'}],body:Buffer.from(request.method==='OPTIONS'?'':JSON.stringify(body)).toString('base64')});
   })().catch(e=>errors.push(e.message));
  }
 });
 const run=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 const wait=async expression=>{for(let i=0;i<200;i++){if(await run(expression))return;await new Promise(r=>setTimeout(r,300))}throw Error('Wait failed: '+expression)};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',resourceType:'XHR'},{urlPattern:'*',resourceType:'Fetch'}]});
 await send('Network.clearBrowserCookies');
 const lightInit=await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('e2e-theme','light')"});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4187/ai-tools/interview-ready'});
 await wait("!!document.querySelector('.interview-ready')");
 await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:lightInit.identifier});
 const click=async text=>{if(!await run("(()=>{const b=Array.from(document.querySelectorAll('.interview-ready button')).find(b=>b.textContent.trim()==="+JSON.stringify(text)+");if(!b)return false;b.click();return true})()"))throw Error('Missing button '+text)};
 const input=async(selector,value)=>run("(()=>{const el=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,"+JSON.stringify(value)+");el.dispatchEvent(new Event('input',{bubbles:true}));})()");
 await input('#text-resume',sample.DEMO_RESUME);await input('#text-jd',sample.DEMO_JD);
 await click('Continue to Review');await wait("!!document.querySelector('[aria-label=\"Review and edit resume text\"]')");
 await click('Analyze Resume and JD');await wait("Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Tailor my resume')");
 await click('Tailor my resume');await wait("Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='DOCX')");
 await run("document.querySelector('[aria-label=\"Edit summary\"]').click()");
 await input('.interview-ready main textarea','Updated summary from confirmed experience for browser testing.');await click('Save');
 await click('DOCX');await click('PDF');
 for(let i=0;i<100;i++){if(fs.readdirSync(downloads).some(f=>f.endsWith('.docx'))&&fs.readdirSync(downloads).some(f=>f.endsWith('.pdf')))break;await new Promise(r=>setTimeout(r,200));}
 const exportedDocx=fs.readdirSync(downloads).find(f=>f.endsWith('.docx')),exportedPdf=fs.readdirSync(downloads).find(f=>f.endsWith('.pdf'));
 if(!exportedDocx||!exportedPdf)throw Error('DOCX/PDF exports missing');
 assert.equal(fs.readFileSync(path.join(downloads,exportedDocx)).subarray(0,2).toString(),'PK');assert.equal(fs.readFileSync(path.join(downloads,exportedPdf)).subarray(0,5).toString(),'%PDF-');
 await click('Continue to interview setup');await click('Generate 10 questions');await wait("document.body.textContent.includes('Question 1 of 10')");
 await input('#answer-input','A concrete answer from my confirmed experience.');await click('Pause');
 if(!await run("document.querySelector('#answer-input').disabled"))throw Error('Pause did not disable answer');await click('Resume');
 await click('Submit Answer');await wait("document.body.textContent.includes('Your answer was not lost')");
 if(!await run("document.querySelector('#answer-input').value.includes('concrete answer')"))throw Error('Failed request lost the answer');
 await click('Submit Answer');await wait("document.body.textContent.includes('Feedback on your answer')");
 await click('Next Question');await click('Skip');await click('End Interview');await click('End interview');
 await wait("document.body.textContent.includes('Your mock interview report')");
 if(!await run("document.body.textContent.includes('Incomplete session')"))throw Error('Early report not labelled incomplete');
 await run("document.querySelector('.ai-tools-header button').click()");
 await wait("!!document.querySelector('.ai-tools-dark')");
 if(!await run("getComputedStyle(document.querySelector('.interview-ready')).backgroundColor==='rgb(14, 25, 43)' && getComputedStyle(document.querySelector('.interview-ready')).colorScheme==='dark'"))throw Error('Interview dark theme not applied');
 await run(`window.checkButtonContrast=()=>{const luminance=color=>{const rgb=color.match(/[0-9.]+/g).slice(0,3).map(Number).map(value=>{value/=255;return value<=.04045?value/12.92:Math.pow((value+.055)/1.055,2.4)});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};return Array.from(document.querySelectorAll('.interview-ready .btn-primary,.interview-ready .btn-teal,.interview-ready .btn-outline,.interview-ready .btn-ghost,.interview-ready .btn-danger')).filter(b=>b.getClientRects().length).map(b=>{const style=getComputedStyle(b),a=luminance(style.color),c=luminance(style.backgroundColor);return {type:b.className.match(/btn-(primary|teal|outline|ghost|danger)/)?.[0],ratio:(Math.max(a,c)+.05)/(Math.min(a,c)+.05),opacity:style.opacity,disabled:b.disabled}})};`);
 await new Promise(r=>setTimeout(r,220));
 const normalContrast=await run('window.checkButtonContrast()');
 if(normalContrast.some(b=>b.ratio<4.5||b.opacity!=='1'))throw Error('Dark button contrast failure: '+JSON.stringify(normalContrast));
 await send('DOM.enable');await send('CSS.enable');
 const checkButtonStates=async selector=>{
  const {root:buttonRoot}=await send('DOM.getDocument');
  const {nodeId:buttonId}=await send('DOM.querySelector',{nodeId:buttonRoot.nodeId,selector});
  if(!buttonId)throw Error('Missing button variant '+selector);
  await send('CSS.forcePseudoState',{nodeId:buttonId,forcedPseudoClasses:['hover']});await new Promise(r=>setTimeout(r,220));
  if((await run('window.checkButtonContrast()')).some(b=>b.ratio<4.5))throw Error('Dark hover button contrast below 4.5:1');
  await send('CSS.forcePseudoState',{nodeId:buttonId,forcedPseudoClasses:['focus-visible']});
  if(!await run('parseFloat(getComputedStyle(document.querySelector('+JSON.stringify(selector)+')).outlineWidth)>=3'))throw Error('Keyboard focus ring not visible');
  await send('CSS.forcePseudoState',{nodeId:buttonId,forcedPseudoClasses:['active']});
  if(!await run('getComputedStyle(document.querySelector('+JSON.stringify(selector)+')).boxShadow.includes("inset")'))throw Error('Pressed button state not visible');
  await send('CSS.forcePseudoState',{nodeId:buttonId,forcedPseudoClasses:[]});
 };
 for(const kind of ['primary','teal','outline','ghost'])await checkButtonStates('.interview-ready .btn-'+kind+':not(:disabled)');
 await click('Clear session');
 if((await run('window.checkButtonContrast()')).some(b=>b.ratio<4.5))throw Error('Dark dialog button contrast below 4.5:1');
 await checkButtonStates('.interview-ready [role=dialog] .btn-danger');
 if(!await run("getComputedStyle(document.querySelector('.interview-ready [role=dialog] .card')).backgroundColor==='rgb(20, 36, 59)'"))throw Error('Dark confirmation dialog not styled');
 await click('Cancel');
 const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'report-desktop.png'),Buffer.from(desktop.data,'base64'));
 await click('Clear session');await click('Clear everything');await wait("!!document.querySelector('#text-resume')");
 if(!await run("document.querySelector('#text-resume').value===''") )throw Error('Clear left private content');
 const fileInput=async(file,selector)=>{const {root}=await send('DOM.getDocument'),node=await send('DOM.querySelector',{nodeId:root.nodeId,selector});await send('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[file]});};
 await fileInput(path.join(downloads,exportedDocx),'#file-resume');await wait("document.querySelector('#text-resume').value.includes('Updated summary')");
 await fileInput(path.join(downloads,exportedPdf),'#file-jd');await wait("document.querySelector('#text-jd').value.includes('Updated summary')");
 await send('Page.reload');await wait("!!document.querySelector('#text-resume')");if(!await run("document.querySelector('#text-resume').value===''") )throw Error('Content persisted on reload');
 if(!await run("!!document.querySelector('.ai-tools-dark')"))throw Error('Dark theme did not persist on refresh');
 await click('Load demo sample');if(!await run("document.body.textContent.includes('Demo mode')"))throw Error('Demo not labelled');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await new Promise(r=>setTimeout(r,300));
 if(!await run("document.documentElement.scrollWidth<=innerWidth && document.querySelector('.interview-ready').getBoundingClientRect().width<=innerWidth"))throw Error('Mobile horizontal overflow');
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'inputs-mobile.png'),Buffer.from(mobile.data,'base64'));
 const result={publicDirectLink:true,analysis:true,tailoring:true,editedResumeDocxAndPdf:true,docxAndPdfReimport:true,tenQuestions:true,pauseResume:true,failedAnswerRetry:true,skipAndEarlyReport:true,reportPayloadPrivate:true,clearAndReload:true,labelledDemo:true,mobileFit:true,darkTheme:true,darkDialog:true,themePersists:true,buttonContrast:true,hoverFocusPressed:true,minimumButtonContrast:Math.round(Math.min(...normalContrast.map(b=>b.ratio))*100)/100,tasks,errors};
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(errors.length)throw Error('Browser errors detected');
 }finally{if(ws){try{ws.send(JSON.stringify({id:999999,method:'Browser.close'}))}catch{}ws.close()}chrome.kill();server.close()}
})().catch(error=>{console.log(JSON.stringify({failed:true,message:error.message}));process.exitCode=1});
