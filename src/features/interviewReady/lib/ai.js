const pending=new Set();
export function cancelInterviewRequests(){for(const controller of pending)controller.abort();pending.clear();}
async function configuration(signal){
 const response=await fetch((process.env.PUBLIC_URL||'')+'/resume-match/config.json',{cache:'no-store',signal});
 if(!response.ok)throw new AiError('Public Supabase configuration is unavailable. Run the application asset-sync hook.',503);
 const config=await response.json();
 if(!config.url||!config.anonKey)throw new AiError('Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, then restart the application.',503);
 let url;try{url=new URL(config.url);}catch{throw new AiError('The Supabase URL is invalid.',503);}
 if(url.protocol!=='https:' && !['localhost','127.0.0.1'].includes(url.hostname))throw new AiError('Supabase must use HTTPS.',503);
 return {url:url.href.replace(/\/$/,'')+'/functions/v1/ai-assist',key:config.anonKey};
}
async function request(payload){
 const controller=new AbortController();pending.add(controller);const timer=setTimeout(()=>controller.abort(),120000);
 try{
  const {url,key}=await configuration(controller.signal);
  if(controller.signal.aborted)throw new AiError('Request cancelled.',0);
  const response=await fetch(url+(payload?'':'?probe=1'),{method:payload?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key,apikey:key},...(payload?{body:JSON.stringify(payload)}:{}),signal:controller.signal});
  let data;try{data=await response.json();}catch{throw new AiError('The AI service returned invalid JSON.',502);}
  if(!response.ok)throw new AiError(response.status===404?'Deploy the ai-assist function in the configured Supabase project.':response.status===401?'Supabase rejected the public application credentials.':data.error||'The AI request failed. Please try again.',response.status);
  if(!data||typeof data!=='object')throw new AiError('The AI service returned an invalid response.',502);
  return data;
 }catch(error){if(error instanceof AiError)throw error;throw new AiError(error.name==='AbortError'?'The AI request was cancelled or timed out. Your input is preserved.':'Could not reach the AI service. Please try again.',0);}
 finally{clearTimeout(timer);pending.delete(controller);}
}
export class AiError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'AiError';
        this.status = status;
    }
}
async function callEdge(payload){return request(payload);}
export async function fetchConfigStatus(){
 try{return await request();}catch(error){return {configured:false,provider:null,model:null,message:error.message};}
}
export async function analyzeMatch(resume, jd, jobTitle, companyName) {
    const data = await callEdge({ task: 'analyze', resume, jd, jobTitle, companyName });
    if (!data?.analysis)
        throw new AiError('The analysis response was missing required data.');
    return data.analysis;
}
export async function tailorResume(resume, jd, jobTitle, companyName, clarifications = []) {
    const data = await callEdge({ task: 'tailor', resume, jd, jobTitle, companyName, clarifications });
    if (!data?.resume)
        throw new AiError('The tailoring response was missing required data.');
    return data.resume;
}
export async function generateQuestions(resume, jd, setup, jobTitle) {
    const data = await callEdge({ task: 'questions', resume, jd, setup, jobTitle });
    if (!Array.isArray(data?.questions))
        throw new AiError('The question response was missing required data.');
    if(data.questions.length!==10||new Set(data.questions.map(q=>String(q.text||'').trim().toLowerCase())).size!==10||data.questions.some(q=>!q.text||!q.category))throw new AiError('The AI must return exactly 10 distinct questions. Please retry.');
    return data.questions.map((q,index)=>({...q,id:'q'+(index+1),index}));
}
export async function evaluateAnswer(question, answer, resume, jd) {
    const data = await callEdge({ task: 'feedback', question, answer, resume, jd });
    if (!data?.feedback)
        throw new AiError('The feedback response was missing required data.');
    return data.feedback;
}
export async function generateReport(results, resume, jd) {
    const data = await callEdge({task:'report',results:results.map(({question,feedback,skipped})=>({question,feedback,skipped}))});
    if (!data?.report)
        throw new AiError('The report response was missing required data.');
    return data.report;
}
