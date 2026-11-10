// Optional local production-build browser check. Uses only the original sample stories.
const fs=require('fs'),path=require('path'),http=require('http'),{spawn}=require('child_process'),WebSocket=require('ws'),assert=require('assert/strict');
const root=process.cwd(),out=path.join(root,'.server-audit/duplicate-checker-browser');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.resolve(root,'build','.'+route);if(!file.startsWith(path.join(root,'build')+path.sep)){res.writeHead(400);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'build/index.html');res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/html');fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(resolve=>server.listen(4196,'127.0.0.1',resolve));
 const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9366','--user-data-dir='+path.join(out,'chrome'),'about:blank'],{windowsHide:true,stdio:'ignore'});let ws;
 try{
 let tabs;for(let i=0;i<80;i++){try{tabs=await(await fetch('http://127.0.0.1:9366/json')).json();break;}catch{await new Promise(r=>setTimeout(r,250));}}assert.ok(tabs,'Chrome did not start');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(resolve=>ws.on('open',resolve));let serial=0;const pending=new Map(),errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method));},30000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});ws.send(JSON.stringify({id,method,params}));});
 ws.on('message',raw=>{const message=JSON.parse(raw);if(message.id){const task=pending.get(message.id);if(task){pending.delete(message.id);message.error?task.reject(Error(message.error.message)):task.resolve(message.result||{});}}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);});
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1480,height:1000,deviceScaleFactor:1,mobile:false});
 const run=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result.value;};
 const wait=async expression=>{for(let i=0;i<120;i++){if(await run(expression))return;await new Promise(r=>setTimeout(r,150));}throw Error('Wait failed: '+expression);};
 const click=label=>run(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!button)throw Error('Missing '+${JSON.stringify(label)});button.click();})()`);
 const screenshot=async name=>{const picture=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(picture.data,'base64'));};
 await send('Page.navigate',{url:'http://127.0.0.1:4196/ai-tools/duplicate-checker'});await wait("!!document.querySelector('#sample-story')");
 assert.equal(await run("document.querySelectorAll('.ai-tools-header nav a').length"),4);assert.ok(await run("!document.querySelector('.dashboard-layout')"));
 await run("(()=>{const select=document.querySelector('#sample-story');select.value='PROJ-412';select.dispatchEvent(new Event('change',{bubbles:true}));})()");await click('Analyze requirement');await wait("[...document.querySelectorAll('h2')].some(h=>h.textContent==='ALREADY IMPLEMENTED')");await screenshot('analysis-desktop');
 await click('History');await wait("!!document.querySelector('table tbody tr')");await run("document.querySelector('table tbody tr').click()");await wait("!!document.querySelector('[role=dialog]')");await run("document.querySelector('[aria-label=\"Close saved analysis\"]').click()");
 await click('Settings');await wait("!!document.querySelector('#similar-threshold')");await run("document.querySelector('.ai-tools-header button').click()");await wait("!!document.querySelector('.ai-tools-dark')");await screenshot('settings-dark');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,200));
 await run("document.querySelector('[aria-label=\"Open navigation\"]').click()");await wait("!!document.querySelector('[aria-label=\"Close navigation\"]')");await run("document.querySelector('[aria-label=\"Close navigation\"]').click()");
 assert.ok(await run("document.documentElement.scrollWidth<=innerWidth"),'Mobile document overflows');await screenshot('settings-mobile');
 await send('Page.reload');await wait("!!document.querySelector('#sample-story')");assert.ok(await run("!!document.querySelector('.ai-tools-dark')"));
 const result={publicDirectRoute:true,fourToolLinks:true,originalSampleAnalysis:true,sourceResults:true,historyModal:true,settings:true,darkMode:true,mobileNavigation:true,mobileFit:true,refresh:true,errors};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify(result));
 }finally{if(ws){try{ws.send(JSON.stringify({id:999999,method:'Browser.close'}));}catch{}ws.close();}chrome.kill();server.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
