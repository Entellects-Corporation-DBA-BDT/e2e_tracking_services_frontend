import ExcelJS from 'exceljs';
import {createMonthlyPayrollWorkbook,monthlyPayrollValues} from './monthlyPayrollExport';

const report={month:'2026-10',end_date:'2026-10-31',data:[{id:1,employee_id:'BDT-I-001',legal_name:'Example Employee',weekend_days:9,holiday_days:1,present_days:19,half_days:2},{id:2,legal_name:'Missing Salary',weekend_days:9,holiday_days:1,present_days:0,half_days:0}]};

test('counts half days as 0.5 and calculates the requested payroll deductions',()=>{
 const sheet=createMonthlyPayrollWorkbook(report,[{id:1,monthly_salary:10000}]).getWorksheet('Monthly Payroll');
 expect(sheet.getCell('D5').value.result).toBe(21);
 expect(sheet.getCell('H5').value.result).toBe(18);
 expect(sheet.getCell('I5').value.result).toBe(3);
 expect(sheet.getCell('L5').value.result).toBe(1000);
 expect(sheet.getCell('R5').value.result).toBe(9000);
 expect(sheet.getCell('K7').value).toBeNull();
 expect(sheet.getCell('R7').value.result).toBeFalsy();
 expect(sheet.getCell('R5').value.formula).toContain('-M5-N5+SUM(O5:Q5)');
 expect(sheet.getCell('O6').master.address).toBe('O6');
 expect(sheet.getCell('C6').master.address).toBe('C5');
});

test('exports a readable XLSX with formulas, totals, editable salary and incentive reason rows',async()=>{
 const book=createMonthlyPayrollWorkbook(report,[{id:1,monthly_salary:10000}]);
 const buffer=await book.xlsx.writeBuffer();
 const restored=new ExcelJS.Workbook();await restored.xlsx.load(buffer);
 const sheet=restored.getWorksheet('Monthly Payroll');
 expect(sheet.getCell('L5').value.result).toBe(1000);
 expect(sheet.getCell('R9').value.result).toBe(9000);
 expect(sheet.getCell('K5').dataValidation.type).toBe('decimal');
 expect(sheet.getCell('L5').value.formula).toContain('/30*I5');
 for(const col of ['O','P','Q']){expect(sheet.getCell(`${col}5`).value).toBe(0);expect(sheet.getCell(`${col}6`).value).toBe('Reason: ');}
 expect(sheet.getColumn('O').outlineLevel).toBe(1);
 expect(sheet.getRow(4).getCell(1).value).toBe('Serial No.');
 expect(sheet.getRow(5).getCell(1).value).toBe(1);
 expect(restored.getWorksheet('Read Me')).toBeTruthy();
});

test('handles leap months, missing salaries, excess attendance and provisional reports',()=>{
 expect(monthlyPayrollValues({weekend_days:8,holiday_days:2,present_days:5,half_days:1,monthly_salary:0},29)).toMatchObject({working:19,worked:4.5,leaves:14.5,salary:0,deduction:0});
 expect(monthlyPayrollValues({weekend_days:8,present_days:50},28).worked).toBe(20);
 const sheet=createMonthlyPayrollWorkbook({...report,end_date:'2026-10-10'},[],{salaryAvailable:false}).getWorksheet('Monthly Payroll');
 expect(sheet.getCell('A3').value).toContain('PROVISIONAL');
 expect(sheet.workbook.getWorksheet('Read Me').getCell('B8').value).toContain('unavailable');
 expect(()=>createMonthlyPayrollWorkbook({month:'2026-13',data:[{}]})).toThrow();
 expect(()=>createMonthlyPayrollWorkbook({month:'2026-10',data:[]})).toThrow();
});


test('serializes standard Excel number formats without invalid literal characters',async()=>{
 const book=createMonthlyPayrollWorkbook(report,[{id:1,monthly_salary:10000}]);
 book.getWorksheet('Monthly Payroll').getColumn('P').hidden=true;
 const restored=new ExcelJS.Workbook();await restored.xlsx.load(await book.xlsx.writeBuffer());
 const sheet=restored.getWorksheet('Monthly Payroll');
 expect(sheet.getCell('K5').numFmt).toBe('#,##0.00;[Red](#,##0.00);0.00;@');
 expect(sheet.getCell('R5').numFmt).toBe(sheet.getCell('K5').numFmt);
 expect(sheet.getCell('Q6').numFmt).toBe('@');
 expect(sheet.getColumn('P').hidden).toBe(true);
 expect(sheet.getCell('R5').value.formula).not.toContain('#REF!');
});


test('avoids the ExcelJS outline / print-settings XML ordering defect',async()=>{
 const JSZip=require('jszip');
 const book=createMonthlyPayrollWorkbook(report,[{id:1,monthly_salary:10000}]);
 const zip=await JSZip.loadAsync(await book.xlsx.writeBuffer());
 const xml=await zip.file('xl/worksheets/sheet1.xml').async('string');
 // An explicit outlinePr after pageSetUpPr violates CT_SheetPr's element sequence.
 expect(xml).not.toContain('<outlinePr');
 expect(xml).toContain('outlineLevel="1"');
 expect(xml).toContain('horizontalDpi="300"');
 expect(xml).toContain('verticalDpi="300"');
});
