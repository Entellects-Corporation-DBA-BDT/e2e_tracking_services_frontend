import ExcelJS from 'exceljs';
import { downloadApplicationExcel } from './applicationListTools';
test('Recruiting XLSX contains candidate feedback immediately after feedback and supports empty older records',async()=>{
 let buffer;
 const workbook=new ExcelJS.Workbook();
 const realWrite=workbook.xlsx.writeBuffer.bind(workbook.xlsx);
 const workbookSpy=jest.spyOn(ExcelJS,'Workbook').mockImplementation(()=>workbook);
 jest.spyOn(workbook.xlsx,'writeBuffer').mockImplementation(async()=>{buffer=await realWrite();return buffer;});
 URL.createObjectURL=jest.fn(()=> 'blob:report');URL.revokeObjectURL=jest.fn();
 const click=jest.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 try{
 await downloadApplicationExcel([{candidate_name:'Example',feedback:'Client notes',candidate_feedback:'Candidate notes'},{candidate_name:'Older record'}],'Recruiting');
 // Read the generated XLSX back with the original constructor after restoring the spy.
 workbookSpy.mockRestore();
 const restored=new ExcelJS.Workbook();await restored.xlsx.load(buffer);
 const sheet=restored.getWorksheet('Applications');
 expect(sheet.getCell('G3').value).toBe('Feedback');expect(sheet.getCell('H3').value).toBe('Candidate Feedback');
 expect(sheet.getCell('G4').value).toBe('Client notes');expect(sheet.getCell('H4').value).toBe('Candidate notes');
 expect(sheet.getCell('H5').value||'').toBe('');
 }finally{workbookSpy.mockRestore();click.mockRestore();}
});
