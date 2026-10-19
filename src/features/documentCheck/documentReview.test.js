import {validateDocumentFile,reviewDocumentText,crossDocumentFindings,normalizeDate} from './documentReview';
function file(name,body,type){const bytes=Uint8Array.from(body,c=>c.charCodeAt(0));return {name,type,size:bytes.length,slice:()=>({arrayBuffer:async()=>bytes.buffer})};}
test('rejects renamed HTML and unsupported or empty files before parsing',async()=>{
 await expect(validateDocumentFile(file('fake.pdf','<html>not a PDF</html>','application/pdf'))).rejects.toThrow('signature');
 await expect(validateDocumentFile(file('active.svg','<svg/>','image/svg+xml'))).rejects.toThrow('PDF, JPG or PNG');
 await expect(validateDocumentFile(file('empty.pdf','','application/pdf'))).rejects.toThrow('non-empty');
 await expect(validateDocumentFile(file('record.pdf','%PDF-1.7 content','application/pdf'))).resolves.toBe('application/pdf');
});
test('rejects invalid calendar dates rather than rolling them into the next month',()=>{
 expect(normalizeDate('02/30/2025')).toBeNull();expect(normalizeDate('02/29/2024')).toBe('2024-02-29');expect(normalizeDate('16 OCT 2026')).toBe('2026-10-16');
});
const dl='Full Name: Alex Example\nDOB: 01/14/1990\nLicense Number: SAMPLE123\nExpiration Date: 12/31/2030';
test('recognises reference fields without certifying authenticity',()=>{
 const result=reviewDocumentText(dl,'dl',{name:'Example Alex',dob:'1990-01-14',today:'2026-10-16'},{confidence:95});
 expect(result.fields.find(field=>field.key==='number').value).toBe('SAMPLE123');
 expect(result.status).toBe('Ready for manual review');expect(result.findings.some(item=>item.title==='Name text matches the reference')).toBe(true);
});
test('flags missing fields, weak OCR and mismatched references as review needs, never fake',()=>{
 const result=reviewDocumentText('Full Name: Someone Else\nDOB: 01/14/1990','i94',{name:'Alex Example',dob:'1992-01-14'},{confidence:35});
 expect(result.status).toBe('Needs review');expect(result.findings.some(item=>item.title==='Name text needs comparison')).toBe(true);expect(result.findings.some(item=>item.title==='Birth-date text needs comparison')).toBe(true);
 expect(JSON.stringify(result)).not.toMatch(/fake|fraud/i);
});
test('flags recognised past expiry with context rather than an immigration eligibility decision',()=>{
 const result=reviewDocumentText(dl.replace('2030','2020'),'dl',{today:'2026-10-16'});
 expect(result.findings.some(item=>item.title==='A recognised expiry date is in the past')).toBe(true);
});
test('detects duplicates and cross-document differences',()=>{
 const first={id:'a',fingerprint:'same',fields:[{key:'name',value:'Alex Example'},{key:'birthDate',value:'01/14/1990'}]};
 const second={id:'b',fingerprint:'same',fields:[{key:'name',value:'Other Person'},{key:'birthDate',value:'01/14/1991'}]};
 expect(crossDocumentFindings([first,second])).toHaveLength(3);
});


test('reads split CBP name labels and D/S without treating D/S as an invalid date',()=>{
 const text='First (Given) Name:\nAlex\nLast/Surname:\nExample\nDate of Birth: 01/14/1990\nAdmission Record Number: SAMPLE94\nClass of Admission: H1B\nAdmit Until Date: D/S';
 const result=reviewDocumentText(text,'i94');expect(result.fields.find(field=>field.key==='name').value).toBe('Alex Example');expect(result.fields.find(field=>field.key==='admitUntil').value).toBe('D/S');expect(result.status).toBe('Ready for manual review');
});


test('reads CBP year-month-name dates and ignores the printed OMB form expiration',()=>{
 const text='Last/Surname: DOE\nFirst (Given) Name: JANE ELLEN\nBirth Date: 1990 January 14\nAdmission I-94 Record Number: SAMPLE94\nClass of Admission: H1B\nAdmit Until Date: 2030 October 15\nOMB No. 0000-0000\nExpiration Date: 06/30/2024';
 const result=reviewDocumentText(text,'i94',{dob:'1990-01-14',today:'2026-10-16'});
 expect(result.fields.find(field=>field.key==='birthDate').value).toBe('1990 January 14');expect(result.fields.find(field=>field.key==='admitUntil').value).toBe('2030 October 15');
 expect(result.fields.some(field=>field.key==='expiryDate')).toBe(false);expect(result.findings.some(item=>item.title==='A recognised expiry date is in the past')).toBe(false);
 expect(normalizeDate('1990 January 14')).toBe('1990-01-14');expect(normalizeDate('Jan 14, 1990')).toBe('1990-01-14');
});
