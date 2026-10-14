import { candidateFromText, parseFile } from './fileParser';
test('extracts candidate name, title, location and experience',()=>{
 const result=candidateFromText('Alex Example\nSoftware Engineer\nAustin, TX\n6 years building React applications','resume.txt');
 expect(result).toMatchObject({name:'Alex Example',title:'Software Engineer',state:'TX',experience:6});
});
test('rejects unsupported files and excessive file sizes before parsing',async()=>{
 await expect(parseFile({name:'resume.doc',size:100})).rejects.toThrow('Convert legacy DOC');
 await expect(parseFile({name:'resume.pdf',size:11*1024*1024})).rejects.toThrow('10 MB');
});
test('reads text and rejects documents without useful text',async()=>{
 await expect(parseFile({name:'resume.txt',size:100,text:async()=>'Alex Example\nReact developer with several years of experience'})).resolves.toContain('Alex');
 await expect(parseFile({name:'empty.txt',size:1,text:async()=>''})).rejects.toThrow('No readable text');
});
