# Monthly attendance payroll Excel

Open **Attendance Management ? Monthly Summary**, select a month and choose **Download Payroll Excel**. The button uses the existing Attendance export permission.

No backend change, database migration or additional service is required. The report uses the existing monthly attendance endpoint and, when Payslips view permission is present, the existing payslip roster for employee salaries. Salary lookup failure does not block export: salary fields are left blank and the user is informed.

## Workbook calculations

- Working days = calendar days in selected month - weekends - holidays (weekday holiday counts supplied by Monthly Summary).
- Half Days is the number of half-day attendance records.
- Worked and Worked Days both show weighted credit: attendance records - half days × 0.5, bounded between zero and working days.
- Leaves = working days - worked day credits.
- Leave deduction = monthly salary / 30 × leaves, rounded to two decimals. The divisor is fixed at 30.
- Total salary = monthly salary - leave deduction - tax - other deductions + incentives.

Saved employee salaries are used when accessible. Missing salaries and corresponding calculated amounts stay blank until salary is entered in Excel. Tax, other deductions and incentive amounts initially default to zero and accept non-negative manual entries. Each employee has two physical rows: other columns span both, while each of three separate incentive columns contains an amount followed by its editable reason. All three amounts contribute to net salary. Summary totals and employee formulas recalculate in Excel / LibreOffice. Exported files include cached initial results and a Read Me sheet.

The main sheet starts directly with the title, period and column headers; the previous instruction rows have been removed. Optional detail and incentive columns have Excel outline controls to collapse or expand them. Any column can also be hidden or unhidden normally; hiding columns does not remove their values from calculations.

## Review and deployment

The requested absence deduction rule includes paid leave and differs from existing payslip policy; this report does not modify payslips. Independent working/worked/payable monthly overrides are recomputed by the requested report formulas. Review joining dates and any attendance on weekends/holidays before approving payment. Current-month reports cover the full month and are clearly marked provisional, since future days have not yet been worked. Negative net salary stays visible for review.

Rebuild and deploy the frontend normally. Workbook edits remain in the downloaded file; they do not update the application database. No mail is sent.

Verification: calculation assertions cover half-day weighting, blank/zero salaries, month lengths, leave deduction, net pay and totals. A generated XLSX was written and reloaded with ExcelJS to verify formulas and merged incentive rows. The sample under `.server-audit/monthly-payroll-example.xlsx` uses fictional employees only. Standard Jest execution may require an unrestricted project terminal on Windows due to the local Node realpath permission issue.
