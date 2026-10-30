const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),WebSocket=require('ws');
const root=process.cwd(),out=path.join(root,'.server-audit/workshop-browser');
fs.mkdirSync(out,{recursive:true});
const assets=[];
const ExcelJS=require('exceljs'),assert=require('assert/strict');
const downloads=path.join(out,'downloads-'+Date.now());fs.mkdirSync(downloads,{recursive:true});
let photoBytes=Buffer.alloc(0);
const users=[{id:101,name:'Alex Fixture',position_id:4,position_name:'Bench Sales',status:'Active'},{id:102,name:'Sam Fixture',position_id:4,position_name:'Bench Sales',status:'Active'}];
let meetings=Array.from({length:6},(_,i)=>({id:i+1,meeting_date:'2026-10-30',day:'Friday',position_id:4,team_name:'Bench Sales',topic:'Weekly learning '+(i+1),presenter_id:101,presenter_name:'Alex Fixture',attendees:users,photos:[],remarks:'Synthetic workshop notes',created_by_name:'Alex Fixture',created_at:'2026-10-30 10:00:00',updated_at:'2026-10-30 10:00:00',can_edit:true,can_delete:true}));
let exportedFromPage=false;
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
 const profile={user:{id:601,user_id:601,nick_name:'Fixture User',firstname:'Fixture',email:'fixture@example.test',position_id:4,super_admin:false},resources:[{id:1,resource:'workshop',resource_name:'workshop',name:'Workshop',display_name:'Workshop',resource_type:'PAGE',component_key:'workshop',route:'/dashboard/workshop',label:'Workshop',permissions:{view:true,create:true},scope:'OWN'}]};
 ws.on('message',raw=>{
  const m=JSON.parse(raw);
  if(m.id){const q=pending.get(m.id);if(q){pending.delete(m.id);m.error?q.reject(Error(m.error.message)):q.resolve(m.result||{})}}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
  if(m.method==='Fetch.requestPaused'){
   (async()=>{const request=m.params.request,url=new URL(request.url),route=url.pathname.replace(/^.*?(?=\/(?:auth|resume-match)\/)/,'');let body={success:true,data:[],total_pages:1},status=200,mime='application/json',rawBody=null;
   if(url.origin==='http://127.0.0.1:4187'&&(url.pathname.startsWith('/document-check/')||url.pathname.endsWith('.mjs'))){await send('Fetch.continueRequest',{requestId:m.params.requestId});return;}
   if(request.method==='POST'&&request.postData?.includes('SAMPLE123'))throw Error('Document content sent over network');
   const wi=url.pathname.indexOf('/workshops'),workshop=wi>=0?url.pathname.slice(wi):'';
   if(workshop){
    if(workshop==='/workshops/options')body={success:true,data:{positions:[{id:4,position_name:'Bench Sales',status:'Active'}],users,permissions:{create:true,edit:true,delete:true,export:true,upload:true},limits:{max_photos:6,max_file_bytes:5242880,max_total_bytes:20971520}}};
    else if(workshop.startsWith('/workshops/photos/')){mime='image/png';rawBody=photoBytes;}
    else if(request.method==='POST'){
     const field=key=>{const match=(request.postData||'').match(new RegExp('name="'+key+'"\\r?\\n\\r?\\n([^\\r\\n]*)'));return match?.[1]||''};
     const id=Number(workshop.split('/')[2])||100;
     const current=meetings.find(m=>m.id===id)||{};
     const record={...current,id,meeting_date:field('meeting_date'),day:'Friday',position_id:Number(field('position_id')),team_name:'Bench Sales',topic:field('topic'),presenter_id:Number(field('presenter_id')),presenter_name:'Alex Fixture',attendees:users,photos:current.photos||[{id:9001,original_name:'workshop.png',mime_type:'image/png',file_size:100}],remarks:field('remarks'),created_by_name:'Alex Fixture',created_at:'2026-10-30 10:00:00',updated_at:'2026-10-30 11:00:00',can_edit:true,can_delete:true};
     meetings=[record,...meetings.filter(m=>m.id!==id)];body={success:true,data:{id}};
    }else if(request.method==='DELETE'){meetings=meetings.filter(m=>m.id!==Number(workshop.split('/')[2]));body={success:true};}
    else{
     const query=url.searchParams;let rows=meetings.filter(m=>!query.get('search')||(m.topic+' '+m.remarks).toLowerCase().includes(query.get('search').toLowerCase()));const limit=Number(query.get('limit')||5),page=Number(query.get('page')||1);const stats={total:rows.length,teams:1,presenters:1,photos:rows.reduce((n,m)=>n+m.photos.length,0)};
     if(workshop.endsWith('/export')){exportedFromPage=query.has('page');body={success:true,data:{items:rows,total:rows.length}};}else body={success:true,data:{items:rows.slice((page-1)*limit,page*limit),page,limit,total:rows.length,total_pages:Math.max(1,Math.ceil(rows.length/limit)),stats}};
    }
   }
   else if(route==='/auth/me')body=profile;
   else if(route==='/resume-match/status')body={success:true,data:{history_ready:true}};
   else if(route==='/resume-match/history'){
    if(request.method==='POST'){const record=JSON.parse(request.postData);history.unshift({...record,id:history.length+1,created_at:'2026-10-13 12:00:00'});body={success:true,data:{id:history.length}}}
    else body={success:true,data:history};
   }
   await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:mime},{name:'Access-Control-Allow-Origin',value:'http://127.0.0.1:4187'},{name:'Access-Control-Allow-Headers',value:'Authorization, Content-Type'},{name:'Access-Control-Allow-Methods',value:'GET, POST, PUT, PATCH, DELETE, OPTIONS'}],body:(rawBody||Buffer.from(request.method==='OPTIONS'?'':JSON.stringify(body))).toString('base64')});
   })().catch(e=>errors.push(e.message));
  }
 });
 const run=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 const wait=async expression=>{for(let i=0;i<200;i++){if(await run(expression))return;await new Promise(r=>setTimeout(r,300))}throw Error('Wait failed: '+expression)};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Fetch.enable',{patterns:[{urlPattern:'*',resourceType:'XHR'},{urlPattern:'*',resourceType:'Fetch'}]});
 const token='fixture.'+Buffer.from(JSON.stringify({user_id:601,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.signature';
 await send('Network.setCookie',{name:'jwtToken',value:token,url:'http://127.0.0.1:4187'});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const light=await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('e2e-theme','light')"});
 await send('Page.navigate',{url:'http://127.0.0.1:4187/dashboard/workshop'});await wait("!!document.querySelector('.workshop-page tbody .ws-topic')");await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:light.identifier});
 if(!await run("!!document.querySelector('[data-resource=workshop]') && Array.from(document.querySelectorAll('.workshop-page th')).slice(0,2).map(x=>x.textContent).join(',')==='Date,Day'"))throw Error('Sidebar resource or leading date/day columns missing');
 const click=async(text,scope='.workshop-page')=>{if(!await run("(()=>{const b=Array.from(document.querySelectorAll("+JSON.stringify(scope+' button')+")).find(b=>b.textContent.trim()==="+JSON.stringify(text)+");if(!b)return false;b.click();return true})()"))throw Error('Missing button '+text)};
 const input=async(selector,value,tag='input')=>run("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");Object.getOwnPropertyDescriptor("+(tag==='select'?'HTMLSelectElement':tag==='textarea'?'HTMLTextAreaElement':'HTMLInputElement')+".prototype,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event("+JSON.stringify(tag==='select'?'change':'input')+",{bubbles:true}));})()");
 await run("document.querySelector('[aria-label=\"Next page\"]').click()");await wait("document.body.textContent.includes('Page 2 of 2')");
 await click('Add meeting');await wait("!!document.querySelector('.ws-modal form')");
 await input('.ws-modal input[type=date]','2026-10-30');await input('.ws-modal select','4','select');await input('.ws-modal input[maxlength="200"]','Team knowledge sharing');await input('.ws-modal select:nth-of-type(1)','4','select');
 await run("(()=>{const s=document.querySelectorAll('.ws-modal select')[1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(s,'101');s.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await run("Array.from(document.querySelectorAll('.ws-person')).find(n=>n.textContent.includes('Sam Fixture')).querySelector('input').click()");
 const encoded=await run("(()=>{const c=document.createElement('canvas');c.width=240;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#e4efff';ctx.fillRect(0,0,240,160);ctx.fillStyle='#2865dd';ctx.font='20px sans-serif';ctx.fillText('Workshop fixture',20,85);return c.toDataURL('image/png').split(',')[1]})()");photoBytes=Buffer.from(encoded,'base64');const photoFile=path.join(out,'workshop.png');fs.writeFileSync(photoFile,photoBytes);
 const {root:rootNode}=await send('DOM.getDocument'),node=await send('DOM.querySelector',{nodeId:rootNode.nodeId,selector:'.ws-modal input[type=file]'});await send('DOM.setFileInputFiles',{nodeId:node.nodeId,files:[photoFile]});
 await run("document.querySelector('.ws-modal button[type=submit]').click()");await wait("!document.querySelector('.ws-modal')");
 await run("document.querySelector('[aria-label=\"Previous page\"]').click()");await wait("!!document.querySelector('[aria-label=\"View meeting Team knowledge sharing\"]')");
 await run("document.querySelector('[aria-label=\"View meeting Team knowledge sharing\"]').click()");await wait("!!document.querySelector('.ws-modal img') && document.querySelector('.ws-modal img').naturalWidth>0");await click('Close','.ws-modal');
 await run("document.querySelector('[aria-label=\"Edit meeting Team knowledge sharing\"]').click()");await input('.ws-modal input[maxlength="200"]','Team knowledge sharing updated');await input('.ws-modal textarea','Follow-up completed.','textarea');await run("document.querySelector('.ws-modal button[type=submit]').click()");await wait("!document.querySelector('.ws-modal')");
 await input('.ws-search input','Team knowledge');await click('Apply filters');await wait("document.querySelector('.ws-pagination').textContent.includes('of 1 meetings')");
 await click('Reset');await wait("document.querySelector('.ws-pagination').textContent.includes('of 7 meetings')");
 if(!await run("new Set(Array.from(document.querySelectorAll('.ws-filters>label')).map(n=>Math.round(n.getBoundingClientRect().top))).size===1"))throw Error('Desktop filters are not one line');
 const desktop=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'workshop-desktop.png'),Buffer.from(desktop.data,'base64'));
 await run("document.querySelector('[aria-label=\"Next page\"]').click()");await wait("document.body.textContent.includes('Page 2 of 2')");await click('Download Excel');
 let excel;for(let i=0;i<150;i++){excel=fs.readdirSync(downloads).find(f=>f.endsWith('.xlsx'));if(excel)break;await new Promise(r=>setTimeout(r,200));}if(!excel)throw Error('Excel download missing');
 const book=new ExcelJS.Workbook();await book.xlsx.readFile(path.join(downloads,excel));const sheet=book.getWorksheet('Workshop meetings');assert.equal(sheet.getCell('A6').value,'Date');assert.equal(sheet.getCell('B6').value,'Day');assert.equal(sheet.rowCount,13);assert.equal(book.getWorksheet('Attendee details').rowCount,15);assert.equal(sheet.getImages().length,1);assert.equal(sheet.getImages()[0].range.tl.nativeCol,7);assert.equal(sheet.columnCount,9);assert.equal(sheet.getRow(6).values.includes('Created (UTC)'),false);assert.equal(exportedFromPage,false);
 await run("document.querySelector('[aria-label=\"Previous page\"]').click()");await wait("!!document.querySelector('[aria-label=\"Delete meeting Team knowledge sharing updated\"]')");await run("document.querySelector('[aria-label=\"Delete meeting Team knowledge sharing updated\"]').click()");await click('Remove meeting','.ws-modal');await wait("!document.querySelector('.ws-modal') && !document.body.textContent.includes('Team knowledge sharing updated')");
 await run("localStorage.setItem('e2e-theme','dark')");await send('Page.reload');await wait("!!document.querySelector('.workshop-page.ws-dark tbody .ws-topic')");await click('Add meeting');await wait("!!document.querySelector('.ws-overlay.ws-dark')");
 if(!await run("getComputedStyle(document.querySelector('.ws-modal')).backgroundColor==='rgb(20, 36, 59)'"))throw Error('Dark modal not styled');await click('Cancel','.ws-modal');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,300));if(!await run("document.querySelector('.workshop-page').getBoundingClientRect().width<=innerWidth"))throw Error('Workshop mobile overflow');
 if(!await run("Array.from(document.querySelectorAll('.ws-filters input,.ws-filters select')).every(n=>n.getBoundingClientRect().right<=innerWidth)"))throw Error('Mobile filter control overflow');
 const mobile=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,'workshop-mobile.png'),Buffer.from(mobile.data,'base64'));
 const result={sidebarGrouping:true,dateAndDayFirst:true,pagination:true,create:true,edit:true,participants:true,privatePhotoPreview:true,filters:true,excelAllFilteredRows:true,excelEmbeddedPhotos:true,deleteConfirmation:true,darkMode:true,mobileFit:true,errors};console.log(JSON.stringify(result));fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2));if(errors.length)throw Error('Browser errors detected');
 }finally{if(ws){try{ws.send(JSON.stringify({id:999999,method:'Browser.close'}))}catch{}ws.close()}chrome.kill();server.close()}
})().catch(error=>{console.log(JSON.stringify({failed:true,message:error.message}));process.exitCode=1});
