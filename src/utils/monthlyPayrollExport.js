import ExcelJS from 'exceljs';

const number = value => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
// Use standard four-section Excel formats; zero amounts stay visible and text stays text.
const moneyFormat = '#,##0.00;[Red](#,##0.00);0.00;@';
const headers = ['Serial No.', 'Employee ID', 'Employee Name', 'Working Days', 'Weekends', 'Holidays', 'Half Days', 'Worked', 'Leaves', 'Worked Days', 'Salary / Month (INR)', 'Leave Deduction (INR)', 'Tax Deduction (INR)', 'Other Deductions (INR)', 'Incentive 1 / Reason (INR)', 'Incentive 2 / Reason (INR)', 'Incentive 3 / Reason (INR)', 'Total Salary (INR)'];

export function monthlyPayrollValues(row, calendarDays) {
  const weekends = Math.min(calendarDays, number(row.weekend_days));
  const holidays = Math.min(calendarDays - weekends, number(row.holiday_days));
  const working = Math.max(0, calendarDays - weekends - holidays);
  const half = Math.min(working, number(row.half_days));
  const worked = Math.min(working, Math.max(0, number(row.present_days) - half * .5));
  const leaves = Math.max(0, working - worked);
  const salary = row.monthly_salary === null || row.monthly_salary === undefined || row.monthly_salary === '' ? null : number(row.monthly_salary);
  return {weekends, holidays, working, half, worked, leaves, salary, deduction: salary === null ? null : money(salary / 30 * leaves)};
}

export function createMonthlyPayrollWorkbook(monthly, salaryRows = [], {salaryAvailable = true} = {}) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthly?.month || '')) throw new Error('Select a valid payroll month.');
  if (!Array.isArray(monthly.data) || !monthly.data.length) throw new Error('No employees are available for this month.');
  const [year, month] = monthly.month.split('-').map(Number);
  const calendarDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const title = new Intl.DateTimeFormat('en-GB', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year, month - 1, 1)));
  const salaries = new Map(salaryRows.map(row => [String(row.id), row.monthly_salary]));
  const book = new ExcelJS.Workbook();
  book.creator = 'BeeData Technologies';
  book.created = new Date();
  book.calcProperties.fullCalcOnLoad = true;
  const sheet = book.addWorksheet('Monthly Payroll', {
    views:[{state:'frozen', xSplit:3, ySplit:4, zoomScale:85}],
    pageSetup:{paperSize:9,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,printTitlesRow:'1:4',horizontalDpi:300,verticalDpi:300},
  });
  sheet.columns = [9,19,30,13,12,12,12,12,12,14,20,21,19,22,28,28,28,23].map(width => ({width}));
  sheet.mergeCells('A1:R2');
  sheet.getCell('A1').value = `BEEDATA TECHNOLOGIES | MONTHLY PAYROLL | ${title.toUpperCase()}`;
  sheet.getCell('A1').font = {name:'Calibri',size:18,bold:true,color:{argb:'FFFFFFFF'}};
  sheet.getCell('A1').fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF183B68'}};
  sheet.getCell('A1').alignment = {vertical:'middle',wrapText:true};
  sheet.getRow(1).height = 26; sheet.getRow(2).height = 20;
  sheet.mergeCells('A3:R3');
  const monthEnd = `${monthly.month}-${String(calendarDays).padStart(2,'0')}`;
  const provisional = !monthly.end_date || monthly.end_date < monthEnd;
  sheet.getCell('A3').value = `${provisional ? 'PROVISIONAL — attendance is incomplete. ' : ''}Period: ${monthly.month}-01 to ${monthEnd} | Attendance through: ${monthly.end_date || 'not supplied'} | ${monthly.data.length} employees`;
  sheet.getRow(3).height = 30;
  sheet.getRow(3).alignment = {vertical:'middle',wrapText:true};
  sheet.getRow(3).font = {name:'Calibri',size:11,color:{argb:provisional?'FF92400E':'FF536783'}};
  sheet.getRow(3).fill = {type:'pattern',pattern:'solid',fgColor:{argb:provisional?'FFFFF8E6':'FFF1F5FC'}};
  sheet.getRow(4).values = headers;
  sheet.getRow(4).height = 42;
  sheet.getRow(4).font = {name:'Calibri',bold:true,color:{argb:'FFFFFFFF'},size:10};
  sheet.getRow(4).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF285689'}};
  sheet.getRow(4).alignment = {wrapText:true,vertical:'middle',horizontal:'center'};
  // Standard Excel hide/unhide remains available; outline buttons also collapse optional detail groups.
  sheet.properties.outlineLevelCol = 1;
  // ExcelJS 4.x emits explicit outlinePr after pageSetUpPr (invalid OOXML order).
  // Omit it: Excel's default summary direction already matches this report.
  // Column outline levels still provide collapse/expand controls.
  [5,6,7,15,16,17].forEach(col=>{sheet.getColumn(col).outlineLevel=1;});
  const totals = {half:0,worked:0,leaves:0,salary:0,deduction:0,net:0};
  monthly.data.forEach((employee,index) => {
    const r = 5 + index * 2, reasonRow = r + 1;
    const salary = salaries.has(String(employee.id)) ? salaries.get(String(employee.id)) : employee.monthly_salary;
    const v = monthlyPayrollValues({...employee,monthly_salary:salary},calendarDays);
    for(let col=1;col<=18;col++) if(col<15||col>17) sheet.mergeCells(r,col,reasonRow,col);
    const values = [index+1,employee.employee_id || '',employee.legal_name || employee.employee_name || '',null,v.weekends,v.holidays,v.half,null,null,null,v.salary,null,0,0,0,0,0,null];
    values.forEach((value,index) => {sheet.getCell(r,index+1).value=value;});
    const formula = (col,expression,result) => {sheet.getCell(`${col}${r}`).value={formula:expression,...(result === null ? {result:''} : {result})};};
    formula('D',`MAX(0,${calendarDays}-E${r}-F${r})`,v.working);
    // present_days includes both full and half-day attendance records.
    formula('H',`MIN(D${r},MAX(0,${number(employee.present_days)}-G${r}*0.5))`,v.worked);
    formula('I',`MAX(0,D${r}-H${r})`,v.leaves);
    formula('J',`H${r}`,v.worked);
    formula('L',`IF(K${r}="","",ROUND(K${r}/30*I${r},2))`,v.deduction);
    formula('R',`IF(K${r}="","",ROUND(K${r}-L${r}-M${r}-N${r}+SUM(O${r}:Q${r}),2))`,v.salary === null ? null : money(v.salary - v.deduction));
    ['O','P','Q'].forEach((col,index)=>{
      sheet.getCell(`${col}${reasonRow}`).value = 'Reason: ';
      sheet.getCell(`${col}${reasonRow}`).note = `Reason for incentive ${index+1}. Amount goes directly above.`;
    });
    sheet.getCell(`G${r}`).note = 'Number of half-day records (not day credits). Worked subtracts 0.5 for each half day from total attendance records.';
    sheet.getCell(`H${r}`).note = `${number(employee.present_days)} attendance records. Worked day credits are capped at working days. Weekends / holiday attendance must be reviewed before approving payroll.`;
    for(let y=r;y<=reasonRow;y++) {
      sheet.getRow(y).height = y===r ? 29 : 25;
      for(let col=1;col<=18;col++) {
        const cell=sheet.getCell(y,col);
        cell.font={name:'Calibri',size:11,color:{argb:'FF243B53'}};
        cell.alignment={vertical:'middle',wrapText:true,horizontal:col===3||(col>=15&&col<=17)?'left':'center'};
        cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:index%2?'FFF1F6FC':'FFFFFFFF'}};
        cell.border={bottom:{style:'hair',color:{argb:'FFDEE6F0'}}};
        if(col>=11)cell.numFmt=moneyFormat;
        else if(col>=4)cell.numFmt='0.##';
      }
    }
    ['K','M','N','O','P','Q'].forEach(col=>{
      const cell=sheet.getCell(`${col}${r}`);
      cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEAF3FF'}};
      cell.font={name:'Calibri',size:11,color:{argb:'FF175CD3'},bold:true};
      cell.dataValidation={type:'decimal',operator:'greaterThanOrEqual',formulae:[0],allowBlank:true,showErrorMessage:true,errorStyle:'stop',errorTitle:'Invalid amount',error:'Enter a non-negative amount.'};
    });
    ['O','P','Q'].forEach(col=>{
      const reason=sheet.getCell(`${col}${reasonRow}`);
      reason.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF0F6FF'}};
      reason.numFmt='@';reason.font={name:'Calibri',italic:true,size:10,color:{argb:'FF526B8D'}};
    });
    sheet.getCell(`R${r}`).font={name:'Calibri',bold:true,color:{argb:'FF047857'},size:12};
    totals.half+=v.half;totals.worked+=v.worked;totals.leaves+=v.leaves;totals.salary+=v.salary||0;totals.deduction+=v.deduction||0;totals.net+=v.salary===null?0:money(v.salary-v.deduction);
  });
  const totalRow=5+monthly.data.length*2;
  sheet.mergeCells(`A${totalRow}:C${totalRow}`);sheet.getCell(`A${totalRow}`).value='TOTAL';
  const aggregate={G:totals.half,H:totals.worked,I:totals.leaves,J:totals.worked,K:totals.salary,L:totals.deduction,M:0,N:0,O:0,P:0,Q:0,R:totals.net};
  Object.entries(aggregate).forEach(([col,result])=>{sheet.getCell(`${col}${totalRow}`).value={formula:`SUM(${col}5:${col}${totalRow-1})`,result:money(result)};});
  sheet.getRow(totalRow).height=30;sheet.getRow(totalRow).font={name:'Calibri',bold:true,color:{argb:'FFFFFFFF'}};sheet.getRow(totalRow).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF183B68'}};
  for(let col=11;col<=18;col++)sheet.getCell(totalRow,col).numFmt=moneyFormat;
  sheet.pageSetup.printArea=`A1:R${totalRow}`;
  const notes=book.addWorksheet('Read Me');notes.getColumn(1).width=34;notes.getColumn(2).width=115;
  const guidance=[['MONTHLY PAYROLL','Calculation and review guide'],['Calendar days',`${calendarDays} days in ${title}. Working days = calendar days - weekends - weekday holidays from Monthly Summary.`],['Worked / Worked Days','Both columns show weighted attendance credit: attendance records - (half days × 0.5), capped at working days. Half Days is a record count.'],['Leave deduction','Working days - worked days. All such gaps are deducted under the requested rule, including approved paid leave. This differs from the existing Payslips paid-leave policy.'],['Current month','PROVISIONAL reports count the entire month. Future unworked days are included in leaves. Do not finalize until month end.'],['Adjustments','The export recomputes working and worked days per these formulas; independent saved working/worked/payable overrides are not used. Weekends, holiday and half-day counts use the summary.'],['Salary sources','Saved employee salary is fetched only with Payslips view permission. Missing salary is blank; enter it in blue cells. Changes stay in the downloaded file.'],['Salary availability',salaryAvailable?'Saved salary lookup was available.':'Saved salaries unavailable / not permitted; enter salary manually.'],['Deductions','Salary divisor is fixed at 30. Tax and other deductions default to zero; enter actual amounts. No automatic statutory tax calculation.'],['Incentives','Three incentive columns each have an amount with its own reason directly below. All three amounts are added to net salary. Other employee columns span both rows.'],['Final salary','Salary - leave deduction - tax - other deductions + incentives. Negative results remain visible for HR review. Blank salaries leave net pay blank.'],['Review required','Check joining dates, attendance on non-working days, approved paid leave and any monthly overrides before approving payment. This is a worksheet, not an issued payslip.'],['Column visibility','Use Excel column headers to Hide / Unhide any column. Outline buttons above the sheet collapse weekend/holiday/half-day detail or the three incentive columns. Hidden amounts still count in salary totals.'],['Excel formulas','Formula results are cached for the initial download and recalculated when inputs change in Excel / LibreOffice. Total includes only entered salaries.']];
  guidance.forEach((row,index)=>{const line=notes.addRow(row);line.height=index?48:30;line.alignment={wrapText:true,vertical:'middle'};if(!index){line.font={bold:true,color:{argb:'FFFFFFFF'}};line.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF183B68'}};}});
  return book;
}

export async function downloadMonthlyPayrollWorkbook(monthly,salaries,options) {
  const book=createMonthlyPayrollWorkbook(monthly,salaries,options);
  const buffer=await book.xlsx.writeBuffer();
  const url=URL.createObjectURL(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download=`monthly-payroll-${monthly.month}.xlsx`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
