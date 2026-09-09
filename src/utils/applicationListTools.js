const PROCESS_LABELS = { 1: "Submitted", 2: "Interview Scheduled", 3: "Placed" };

const easternDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return [values.year, values.month, values.day].join("-");
};

export const applicationDateRange = (period) => {
  if (!period || period === "all" || period === "custom") return { start_date: "", end_date: "" };
  const todayText = easternDate();
  const end = new Date(todayText + "T12:00:00");
  const start = new Date(end);
  if (period === "this_week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "this_month") {
    start.setDate(1);
  }
  return { start_date: easternDate(start), end_date: todayText };
};

const xmlEscape = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const fileName = (path) => path ? String(path).split(/[\\/]/).pop() : "";

export const downloadApplicationExcel = (rows, moduleLabel, filters = {}) => {
  const recruitingColumns = [
    ["Submission Date", 115, (row) => row.date_created],
    ["Recruiter Name", 135, (row) => row.employee_name],
    ["Candidate Name", 155, (row) => row.candidate_name],
    ["Client", 145, (row) => row.client],
    ["Status", 120, (row) => PROCESS_LABELS[Number(row.process_id)] || "Not Set"],
    ["POC", 125, (row) => row.poc],
    ["Feedback", 220, (row) => row.feedback],
  ];
  const storedDetailColumns = [
    ["Submission Date", 105, (row) => row.date_created],
    ["Candidate Name", 150, (row) => row.candidate_name],
    ["Submitted By", 120, (row) => row.employee_name],
    ["Team / Position", 120, (row) => row.position_name],
    ["Vendor", 125, (row) => row.vendor],
    ["POC Name", 115, (row) => row.poc],
    ["POC Email", 165, (row) => row.email],
    ["POC Contact", 105, (row) => row.contact],
    ["Client Name", 135, (row) => row.client],
    ["Office Location", 100, (row) => row.emp_loc],
    ["Rate / Hour", 85, (row) => row.rate],
    ["Role / Position", 140, (row) => row.role],
    ["Candidate Location", 130, (row) => row.candidate_loc],
    ["Status", 110, (row) => PROCESS_LABELS[Number(row.process_id)] || "Not Set"],
    ["Interview Slot", 160, (row) => row.interview_slot],
    ["Interview Mode", 105, (row) => row.interview_mode],
    ["Feedback", 190, (row) => row.feedback],
    ["Remarks", 210, (row) => row.remarks],
    ["Resume File", 150, (row) => fileName(row.resume_path)],
    ["R2R File", 150, (row) => fileName(row.r2r_path)],
    ["Driving License File", 160, (row) => fileName(row.driving_path)],
    ["Visa File", 150, (row) => fileName(row.visa_path)],
    ["MSA File", 150, (row) => fileName(row.msc_path)],
  ];
  const columns = moduleLabel === "Recruiting" ? recruitingColumns : storedDetailColumns;
  const cell = (value, style = "Data") => '<Cell ss:StyleID="' + style + '"><Data ss:Type="String">' + xmlEscape(value) + "</Data></Cell>";
  const columnXml = columns.map(([, width]) => '<Column ss:AutoFitWidth="0" ss:Width="' + width + '"/>').join("");
  const header = columns.map(([label]) => cell(label, "Header")).join("");
  const body = rows.map((row, index) => {
    const style = index % 2 ? "DataAlt" : "Data";
    return "<Row ss:AutoFitHeight=\"1\">" + columns.map(([, , read]) => cell(read(row), style)).join("") + "</Row>";
  }).join("");
  const period = filters.start_date || filters.end_date
    ? (filters.start_date || "Beginning") + " to " + (filters.end_date || "Today")
    : "All dates";
  const styles = '<Styles>'
    + '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10"/><Interior/><NumberFormat/><Protection/></Style>'
    + '<Style ss:ID="Title"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4F46E5" ss:Pattern="Solid"/></Style>'
    + '<Style ss:ID="Subtitle"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#344054"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style>'
    + '<Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#3730A3"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/></Borders><Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#5B35F5" ss:Pattern="Solid"/></Style>'
    + '<Style ss:ID="Data"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/></Borders></Style>'
    + '<Style ss:ID="DataAlt"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E7EC"/></Borders><Interior ss:Color="#F8F7FF" ss:Pattern="Solid"/></Style>'
    + '</Styles>';
  const lastRow = rows.length + 3;
  const workbook = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>'
    + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    + styles + '<Worksheet ss:Name="Applications"><Table>' + columnXml
    + '<Row ss:Height="30"><Cell ss:StyleID="Title" ss:MergeAcross="' + (columns.length - 1) + '"><Data ss:Type="String">' + xmlEscape(moduleLabel + " Application Report") + '</Data></Cell></Row>'
    + '<Row ss:Height="22"><Cell ss:StyleID="Subtitle" ss:MergeAcross="' + (columns.length - 1) + '"><Data ss:Type="String">' + xmlEscape("Period: " + period + "   |   Records: " + rows.length + "   |   Generated: " + easternDate()) + '</Data></Cell></Row>'
    + '<Row ss:Height="28">' + header + '</Row>' + body + '</Table>'
    + '<x:AutoFilter x:Range="R3C1:R' + lastRow + 'C' + columns.length + '"/>'
    + '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions>'
    + '</Worksheet></Workbook>';
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = moduleLabel.toLowerCase().replace(/\s+/g, "-") + "-report-" + easternDate() + ".xls";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};