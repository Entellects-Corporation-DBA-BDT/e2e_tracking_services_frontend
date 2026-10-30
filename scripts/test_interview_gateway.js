// Local contract tests: fake provider responses; no API calls or credentials.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 let handler,output={},providerCalls=0,lastProviderBody;
 const context={Request,Response,AbortSignal,console,Deno:{env:{get:name=>name==='AI_API_KEY'?'fixture-only':undefined},serve:fn=>handler=fn},fetch:async(url,options)=>{providerCalls++;lastProviderBody=JSON.parse(options.body);return Response.json({choices:[{message:{content:JSON.stringify(output)}}]});}};
 vm.runInNewContext(fs.readFileSync('supabase/functions/ai-assist/index.js','utf8'),context);
 const call=async payload=>handler(new Request('https://fixture.test/ai-assist',payload?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{}));
 assert.equal((await (await call()).json()).configured,true);
 assert.equal((await call({task:'analyze'})).status,400);assert.equal(providerCalls,0);
 output={summary:'Fixture',strengths:[],supportedSkills:[],gaps:[],transferableSkills:[],clarifications:[],wordingSuggestions:[],requirementMatches:[]};
 assert.equal((await call({task:'analyze',resume:'Fixture resume',jd:'Fixture job'})).status,200);
 output={questions:Array.from({length:10},()=>({category:'Technical',text:'Duplicate',intent:'Test'}))};
 assert.equal((await call({task:'questions',resume:'Fixture resume',jd:'Fixture job',setup:{difficulty:'Intermediate',focus:'Mixed'}})).status,500);
 output={questions:Array.from({length:10},(_,i)=>({category:'Technical',text:'Unique '+i,intent:'Test'}))};
 const questions=await(await call({task:'questions',resume:'Fixture resume',jd:'Fixture job',setup:{difficulty:'Intermediate',focus:'Mixed'}})).json();assert.equal(questions.questions.length,10);
 output={doneWell:[],missingOrUnclear:[],corrections:[],improvements:[],strongerExample:'[Add your example]',ratings:[],note:'Fixture'};
 const feedback=await(await call({task:'feedback',resume:'Fixture resume',jd:'Fixture job',answer:'Fixture answer',question:{category:'Technical',text:'Fixture question'}})).json();assert.equal(feedback.feedback.ratings.length,0);
 output={strongestAreas:[],improvementAreas:[],topicsToStudy:[],practicePlan:[],overallNote:'Fixture'};
 assert.equal((await call({task:'report',results:[{question:{text:'Question',category:'Technical'},answer:'PRIVATE RAW ANSWER',feedback:{note:'Feedback'},skipped:false}]})).status,200);
 assert(!JSON.stringify(lastProviderBody).includes('PRIVATE RAW ANSWER'));
 console.log('Interview gateway contract checks passed (no live provider calls).');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
