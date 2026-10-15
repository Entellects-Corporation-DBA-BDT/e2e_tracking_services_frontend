const fs=require('fs'),path=require('path');
const source=path.join(path.dirname(require.resolve('pdfjs-dist/package.json')),'legacy/build/pdf.worker.min.mjs');
const target=path.resolve('public/resume-match/pdf.worker.min.mjs');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
console.log('Synced local PDF worker.');

// CRA does not expose VITE_* variables. Publish only these two public values.
const mode=process.env.NODE_ENV||(process.env.npm_lifecycle_event==='prebuild'?'production':'development');
const env={};
for(const name of ['.env','.env.'+mode,'.env.local','.env.'+mode+'.local']){
 const file=path.resolve(name);
 if(fs.existsSync(file))Object.assign(env,require('dotenv').parse(fs.readFileSync(file)));
}
Object.assign(env,process.env);
const publicConfig={url:env.REACT_APP_SUPABASE_URL||env.VITE_SUPABASE_URL||'',anonKey:env.REACT_APP_SUPABASE_ANON_KEY||env.VITE_SUPABASE_ANON_KEY||''};
if(publicConfig.anonKey.startsWith('sb_secret_'))throw Error('Use a public Supabase anon key, never a secret key.');
try{const role=JSON.parse(Buffer.from(publicConfig.anonKey.split('.')[1]||'','base64').toString()).role;if(role&&role!=='anon')throw Error('Only a public anon key is allowed.');}catch(error){if(error.message==='Only a public anon key is allowed.')throw error;}
fs.writeFileSync(path.resolve('public/resume-match/config.json'),JSON.stringify(publicConfig));
console.log('Prepared public Resume Match configuration (credential values are not logged).');
