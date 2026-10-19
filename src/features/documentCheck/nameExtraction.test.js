import {findDocumentName} from './nameExtraction';
test('reads a standalone NAME without a colon on approval paperwork',()=>{expect(findDocumentName('NOTICE OF ACTION\nNAME DOE, JANE ELLEN\nCLASS H1B','visa').value).toBe('DOE, JANE ELLEN');});
test('reads beneficiary columns without mistaking the company or receipt for the name',()=>{
 const text='Notice Date                Beneficiary A123456\n10/10/2026     CONS1        DOE, JANE ELLEN\nPETITIONER EXAMPLE COMPANY';
 expect(findDocumentName(text,'visa').value).toBe('DOE, JANE ELLEN');
});
test('reads licence name codes even when OCR joins the number and name',()=>{
 const text='DRIVER LICENSE\n4d DL SAMPLE123\n1DOE\n2JANE ELLEN\n3 DOB 01/14/1990';
 expect(findDocumentName(text,'dl')).toEqual({value:'JANE ELLEN DOE',method:'licence fields 1 and 2'});
});
test('marks a licence position-based reading as provisional',()=>{
 const result=findDocumentName('DRIVER LICENSE\n4d DL SAMPLE123\n{DOE\n~~ JANE ELLEN\nDOB 01/14/1990','dl');
 expect(result.value).toBe('JANE ELLEN DOE');expect(result.needsConfirmation).toBe(true);
});
test('does not fabricate a name from a travel record number or placeholders',()=>{
 expect(findDocumentName('View Travel History\nDocument Number: X12345\nArrival 2026-10-01','travel').value).toBe('');
 expect(findDocumentName('Full Name: Not available','i94').value).toBe('');
});
test('supports line-separated given and family labels',()=>{
 expect(findDocumentName('Last/Surname:\nDOE\nFirst (Given) Name:\nJANE ELLEN','i94').value).toBe('JANE ELLEN DOE');
});
