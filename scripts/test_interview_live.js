// Explicit live smoke test: sends fictional data only; incurs provider usage.
// Never imported by React. --local-provider tests the exact gateway locally;
// the default tests the deployed Supabase endpoint used by the application.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),dotenv=require('dotenv');
const root=path.resolve(__dirname,'..');
const env={...dotenv.parse(fs.readFileSync(path.join(root,'.env'))),...process.env};
const redact=value=>{let result=String(value);for(const key of ['AI_API_KEY','SUPABASE_ACCESS_TOKEN','REACT_APP_SUPABASE_ANON_KEY','VITE_SUPABASE_ANON_KEY'])if(env[key])result=result.split(env[key]).join('[REDACTED]');return result;};
(async()=>{
 let handler;
 if(process.argv.includes('--local-provider')){
  if(!env.AI_API_KEY)throw Error('AI_API_KEY is missing.');
  vm.runInNewContext(fs.readFileSync(path.join(root,'supabase/functions/ai-assist/index.js'),'utf8'),{Request,Response,AbortSignal,console,fetch,Deno:{env:{get:name=>env[name]},serve:fn=>{handler=fn;}}});
  console.log('Testing the local gateway with the live provider, not the deployed endpoint.');
 }else{
  const origin=env.REACT_APP_SUPABASE_URL||env.VITE_SUPABASE_URL,key=env.REACT_APP_SUPABASE_ANON_KEY||env.VITE_SUPABASE_ANON_KEY;
  if(!origin||!key)throw Error('Public Supabase configuration is missing.');
  const url=new URL('/functions/v1/ai-assist',origin);
  handler=async req=>fetch(url+(req.method==='GET'?'?probe=1':''),{method:req.method,headers:{Authorization:'Bearer '+key,apikey:key,'Content-Type':'application/json'},...(req.method==='POST'?{body:await req.text()}:{}),signal:AbortSignal.timeout(115000)});
 }
 const call=async payload=>{const response=await handler(new Request('https://fixture.test/ai-assist',payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{}));let data;try{data=await response.json();}catch{throw Error('Gateway returned invalid JSON (HTTP '+response.status+').');}console.log((payload?.task||'Readiness')+': HTTP '+response.status);if(!response.ok)throw Error(data.error||data.message||'Gateway request failed.');return data;};
 assert.equal((await call()).configured,true);
 const resume='Fictional test candidate. Frontend developer, Example Systems, 2022-2025. Built React and JavaScript interfaces, accessible forms, REST integrations and Jest tests. BSc Computer Science, 2021. No other experience is claimed.';
 const jd='Frontend developer: React, JavaScript, HTML, CSS, accessibility, REST APIs and unit testing. Explain technical decisions and collaborate with teammates.';
 const analysis=await call({task:'analyze',resume,jd,jobTitle:'Frontend Developer'});assert(analysis.analysis.summary);assert(Array.isArray(analysis.analysis.requirementMatches));
 const tailored=await call({task:'tailor',resume,jd,jobTitle:'Frontend Developer',clarifications:[]});assert(tailored.resume.professionalSummary);assert(Array.isArray(tailored.resume.experience));
 const questions=await call({task:'questions',resume,jd,setup:{difficulty:'Intermediate',focus:'Mixed'},jobTitle:'Frontend Developer'});assert.equal(questions.questions.length,10);assert.equal(new Set(questions.questions.map(q=>q.text.toLowerCase().trim())).size,10);
 const question=questions.questions[0];const feedback=await call({task:'feedback',resume,jd,question,answer:'In the fictional React project I split forms into reusable components, validated input, exposed accessible labels, handled API failures and added Jest tests for submission and errors.'});assert(Array.isArray(feedback.feedback.ratings));
 const report=await call({task:'report',results:[{question,feedback:feedback.feedback,skipped:false}]});assert(report.report.overallNote);assert.equal(report.report.answeredCount,1);
 console.log('PASS: live analysis, tailoring, 10 unique questions, answer feedback and report. Fictional data only; no secrets logged.');
})().catch(error=>{console.error(redact(error.message));process.exitCode=1;});
