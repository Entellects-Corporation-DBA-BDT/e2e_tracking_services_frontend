export async function searchTechfetch({email,password,keywords,state='ALL'}, signal) {
 const configResponse=await fetch((process.env.PUBLIC_URL||'')+'/resume-match/config.json',{cache:'no-store',signal});
 if(!configResponse.ok)throw Error('Search configuration is unavailable. Restart the frontend or rebuild it.');
 let config;try{config=await configResponse.json();}catch{throw Error('Search configuration is unavailable. Rebuild and deploy the complete frontend.');}
 const url=process.env.REACT_APP_SUPABASE_URL||config.url;
 const key=process.env.REACT_APP_SUPABASE_ANON_KEY||config.anonKey;
 if(!url||!key)throw Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart or rebuild the frontend.');
 let endpoint;try{endpoint=new URL(url);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw Error();}catch{throw Error('Configure a valid HTTPS Supabase project URL.');}
 if(key.startsWith('sb_secret_'))throw Error('Use a public Supabase anon key, never a server secret.');
 const response=await fetch(endpoint.href.replace(/\/$/,'')+'/functions/v1/techfetch-search',{
  method:'POST',signal,headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},
  body:JSON.stringify({email:email.trim(),password,keywords:keywords.trim(),state})
 });
 let data;try{data=await response.json();}catch{throw Error('Search service returned an invalid response. Check the deployed Supabase function.');}
 if(!response.ok)throw Error(response.status===401||response.status===403?'Search service authorization failed. Check the public anon key and Edge Function authentication.':'Search service failed. Check the deployed techfetch-search function.');
 if(!['techfetch','techfetch-demo'].includes(data.source)||!Array.isArray(data.candidates))throw Error('Search service returned an unrecognised source or candidate format.');
 if(data.candidates.length>50)throw Error('Search returned too many candidates. Narrow your search.');
 const candidates=data.candidates.map((row,index)=>{
  if(!row||typeof row!=='object'||typeof row.resumeText!=='string'||row.resumeText.length>300000)throw Error('Search service returned an invalid candidate.');
  return {id:'techfetch-'+String(row.id??index),name:String(row.name||'Unknown candidate'),title:String(row.title||''),state:String(row.state||''),skills:Array.isArray(row.skills)?row.skills.filter(skill=>typeof skill==='string'):[],experience:Number(row.experience)||0,resumeText:row.resumeText};
 });
 return {source:data.source,candidates};
}
