import {generateQuestions,generateReport,fetchConfigStatus,cancelInterviewRequests} from './ai';
const response=data=>({ok:true,status:200,json:async()=>data});
beforeEach(()=>{global.fetch=jest.fn().mockResolvedValueOnce(response({url:'https://project.example.test',anonKey:'public-fixture'}));});
afterEach(()=>{cancelInterviewRequests();delete global.fetch;});
test('uses existing public configuration and reports a missing function honestly',async()=>{
 fetch.mockResolvedValueOnce({ok:false,status:404,json:async()=>({})});
 expect(await fetchConfigStatus()).toMatchObject({configured:false,message:expect.stringContaining('Deploy the ai-assist')});
});
test('rejects duplicate questions instead of starting an invalid interview',async()=>{
 fetch.mockResolvedValueOnce(response({questions:Array.from({length:10},()=>({text:'Repeated question',category:'Technical'}))}));
 await expect(generateQuestions('resume','job',{difficulty:'Intermediate',focus:'Mixed'})).rejects.toThrow('10 distinct');
});
test('normalizes ten distinct questions to stable ids and indices',async()=>{
 fetch.mockResolvedValueOnce(response({questions:Array.from({length:10},(_,i)=>({text:'Question '+i,category:'Technical'}))}));
 const questions=await generateQuestions('resume','job',{difficulty:'Intermediate',focus:'Mixed'});
 expect(questions[9]).toMatchObject({id:'q10',index:9});
});
test('report sends feedback without raw answers, resumes or job descriptions',async()=>{
 fetch.mockResolvedValueOnce(response({report:{overallNote:'Fixture'}}));
 await generateReport([{question:{id:'q1',text:'Question'},answer:'PRIVATE ANSWER',feedback:{note:'Feedback'},skipped:false,submittedAt:123}],'PRIVATE RESUME','PRIVATE JD');
 const body=fetch.mock.calls[1][1].body;
 expect(body).not.toMatch(/PRIVATE|submittedAt/);expect(JSON.parse(body)).toMatchObject({task:'report',results:[{feedback:{note:'Feedback'}}]});
});
