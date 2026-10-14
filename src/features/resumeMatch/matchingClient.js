import { rankCandidates } from './multiResumeAnalyzer';
export function rankCandidatesAsync(candidates, jobDescription, signal) {
 if (typeof Worker === 'undefined') return Promise.resolve(rankCandidates(candidates,jobDescription));
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./matching.worker.js',import.meta.url));
  let settled=false;
  const finish=(error,results)=>{
   if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();
   if(error)reject(error);else resolve(results);
  };
  const abort=()=>finish(new DOMException('Ranking cancelled.','AbortError'));
  const timer=setTimeout(()=>finish(new Error('This batch took too long. Try fewer or shorter resumes.')),120000);
  worker.onmessage=event=>event.data.error?finish(new Error(event.data.error)):finish(null,event.data.results);
  worker.onerror=()=>finish(new Error('The scoring worker could not load. Refresh the page and try again.'));
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return}
  worker.postMessage({candidates,jobDescription});
 });
}
