import { rankCandidates, scoreCandidate } from './multiResumeAnalyzer';
const candidate=(name,text)=>({id:name,name,title:'Engineer',state:'CA',experience:3,skills:[],resumeText:text});
test('ranks matching candidates first without changing the input list',()=>{
 const input=[candidate('Missing','Java SQL'),candidate('Matching','React JavaScript TypeScript AWS Docker')];
 const ranked=rankCandidates(input,'React JavaScript TypeScript AWS Docker software engineer');
 expect(ranked[0].candidate.name).toBe('Matching');expect(ranked[0].score).toBe(100);
 expect(input[0].name).toBe('Missing');
});
test('matches skill aliases and special characters with word boundaries',()=>{
 const scored=scoreCandidate(candidate('Alias','cpp csharp PostgreSQL'), 'C++ C# SQL');
 expect(scored.matchedKeywords.map(x=>x.keyword)).toEqual(expect.arrayContaining(['C++','C#','SQL']));
 expect(scoreCandidate(candidate('Substring','JavaScript'),'Java').score).toBe(0);
});
test('reports only skills present in the job description as missing',()=>{
 const scored=scoreCandidate(candidate('Partial','React'),'React Python');
 expect(scored.missingKeywords.map(x=>x.keyword)).toEqual(['Python']);
});
test('a job description without recognised skills returns zero',()=>{
 const scored=scoreCandidate(candidate('Unknown','React'),'Unlisted terminology');
 expect(scored.score).toBe(0);expect(scored.matchedKeywords).toEqual([]);
});
