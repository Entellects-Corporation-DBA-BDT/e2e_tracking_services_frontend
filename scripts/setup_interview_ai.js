// Server-side setup only. Never import this file into React or copy .env to public/.
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process'),dotenv=require('dotenv');
const root=path.resolve(__dirname,'..');
const env={...(fs.existsSync(path.join(root,'.env'))?dotenv.parse(fs.readFileSync(path.join(root,'.env'))):{}),...process.env};
const secretNames=['AI_API_KEY','AI_API_BASE','AI_MODEL','AI_PROVIDER_NAME'];
const mask=value=>{let text=String(value||'');for(const name of [...secretNames,'SUPABASE_ACCESS_TOKEN'])if(env[name])text=text.split(env[name]).join('[REDACTED]');return text;};
async function check(){
 if(!env.AI_API_KEY?.trim())throw Error('AI_API_KEY is missing from the private .env file.');
 const base=new URL((env.AI_API_BASE||'https://api.openai.com/v1').replace(/\/$/,'')+'/');
 if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('The AI provider must use HTTPS.');
 const model=env.AI_MODEL||'gpt-5-mini';
 const response=await fetch(new URL('models/'+encodeURIComponent(model),base),{headers:{Authorization:'Bearer '+env.AI_API_KEY},signal:AbortSignal.timeout(20000)});
 console.log('Provider model-access check: HTTP '+response.status+' (no generation request or candidate data sent).');
 if(!response.ok)throw Error('The provider could not confirm model access. Check AI_API_KEY and AI_MODEL; a custom provider may not support the model metadata endpoint.');
 const url=env.REACT_APP_SUPABASE_URL||env.VITE_SUPABASE_URL;
 if(!url)throw Error('The existing Supabase URL is missing.');
 const parsed=new URL(url),ref=parsed.hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
 if(!ref)throw Error('A hosted Supabase project URL is required by this deployment helper.');
 const anonKey=env.REACT_APP_SUPABASE_ANON_KEY||env.VITE_SUPABASE_ANON_KEY;
 if(!anonKey)throw Error('The public Supabase anon key is missing.');
 const probe=await fetch(parsed.origin+'/functions/v1/ai-assist?probe=1',{headers:{Authorization:'Bearer '+anonKey,apikey:anonKey},signal:AbortSignal.timeout(20000)});
 let status={};try{status=await probe.json();}catch{}
 console.log('Interview function: HTTP '+probe.status+'; provider configured: '+(status.configured===true)+'.');
 if(!process.argv.includes('--deploy')&&(!probe.ok||status.configured!==true))throw Error(probe.status===404?'The AI key is valid, but ai-assist is not deployed in the configured Supabase project. Run npm run interview:setup.':'InterviewReady is not ready. Configure its Supabase function and provider secrets with npm run interview:setup.');
 return {ref,url:parsed.origin,anonKey};
}
function cli(args){
 if(!process.env.npm_execpath)throw Error('Run this helper through npm run interview:setup.');
 const result=spawnSync(process.execPath,[process.env.npm_execpath,'exec','--yes','--package=supabase@2','--','supabase',...args],{cwd:root,env:{...process.env,...env},encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:4*1024*1024});
 if(result.error)throw Error('Supabase CLI could not finish: '+result.error.message);
 if(result.status!==0)throw Error('Supabase CLI requires deployment access. Run npx supabase login or set SUPABASE_ACCESS_TOKEN privately, then retry. '+mask(result.stderr).slice(-600));
 return result.stdout;
}
(async()=>{
 const project=await check();
 if(!process.argv.includes('--deploy'))return;
 console.log('Checking Supabase deployment access (secret values are never printed)...');
 const projects=JSON.parse(cli(['projects','list','--output','json']));
 if(!Array.isArray(projects)||!projects.some(p=>p.id===project.ref||p.ref===project.ref))throw Error('The logged-in Supabase account does not have access to the configured project.');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'e2e-interview-secrets-'));
 const file=path.join(directory,'secrets.env');
 try{
  const values=secretNames.filter(name=>env[name]?.trim()).map(name=>name+'='+JSON.stringify(env[name].trim())).join('\n');
  fs.writeFileSync(file,values+'\n',{mode:0o600});
  cli(['secrets','set','--project-ref',project.ref,'--env-file',file]);
  console.log('Interview provider secrets configured.');
  cli(['functions','deploy','ai-assist','--project-ref',project.ref,'--use-api']);
  console.log('Interview JavaScript function deployed.');
 }finally{if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(directory);}
 const response=await fetch(project.url+'/functions/v1/ai-assist?probe=1',{headers:{Authorization:'Bearer '+project.anonKey,apikey:project.anonKey},signal:AbortSignal.timeout(20000)});
 const status=await response.json();if(!response.ok||status.configured!==true)throw Error('Deployment completed but the readiness probe did not pass.');
 console.log('InterviewReady AI is configured. Refresh the tool to use live AI.');
})().catch(error=>{console.error(mask(error.message));process.exitCode=1;});

