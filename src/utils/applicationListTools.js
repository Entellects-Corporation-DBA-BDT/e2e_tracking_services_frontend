
import ExcelJS from "exceljs";
import { formatEasternDate } from "./easternTime";

const PROCESS_LABELS = {
  1: "Submitted",
  2: "Interview Scheduled",
  3: "Placed",
};

const easternDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return [values.year, values.month, values.day].join("-");
};

export const applicationDateRange = (period) => {
  if (!period || period === "all" || period === "custom") {
    return { start_date: "", end_date: "" };
  }

  const todayText = easternDate();
  const end = new Date(todayText + "T12:00:00");
  const start = new Date(end);

  if (period === "this_week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === "this_month") {
    start.setDate(1);
  }

  return {
    start_date: easternDate(start),
    end_date: todayText,
  };
};

const fileName = (path) =>
  path ? String(path).split(/[\\/]/).pop() : "";

export const downloadApplicationExcel = async (
  rows,
  moduleLabel,
  filters = {}
) => {
  const recruitingColumns = [
    ["Submission Date (ET)", 115, (row) => formatEasternDate(row.date_created)],
    ["Recruiter Name", 135, (row) => row.employee_name],
    ["Candidate Name", 155, (row) => row.candidate_name],
    ["Client", 145, (row) => row.client],
    [
      "Status",
      120,
      (row) => PROCESS_LABELS[Number(row.process_id)] || "Not Set",
    ],
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
    [
      "Status",
      110,
      (row) => PROCESS_LABELS[Number(row.process_id)] || "Not Set",
    ],
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

  const columns =
    moduleLabel === "Recruiting"
      ? recruitingColumns
      : storedDetailColumns;

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "BeeData Technologies";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Applications", {
    views: [
      {
        state: "frozen",
        ySplit: 3,
      },
    ],
  });

  // Set column widths
  worksheet.columns = columns.map(([label, width]) => ({
  header: label,
  width: Math.max(10, Math.floor(width / 7)),
}));

  const totalColumns = columns.length;

  // Report title
  worksheet.mergeCells(1, 1, 1, totalColumns);

  const titleCell = worksheet.getCell(1, 1);

  titleCell.value = moduleLabel + " Application Report";
  titleCell.font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  titleCell.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(1).height = 30;

  // Report period and summary
  const period =
    filters.start_date || filters.end_date
      ? (filters.start_date || "Beginning") +
        " to " +
        (filters.end_date || "Today")
      : "All dates";

  worksheet.mergeCells(2, 1, 2, totalColumns);

  const subtitleCell = worksheet.getCell(2, 1);

  subtitleCell.value =
    "Period: " +
    period +
    "   |   Records: " +
    rows.length +
    "   |   Generated: " +
    easternDate();

  subtitleCell.font = {
    name: "Calibri",
    size: 10,
    bold: true,
    color: { argb: "FF344054" },
  };
  subtitleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2FF" },
  };
  subtitleCell.alignment = {
    vertical: "middle",
  };

  worksheet.getRow(2).height = 22;

  // Column headers
  const headerRow = worksheet.getRow(3);

  columns.forEach(([label], index) => {
    const cell = headerRow.getCell(index + 1);

    cell.value = label;
    cell.font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF5B35F5" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: {
        style: "thin",
        color: { argb: "FFC7D2FE" },
      },
      bottom: {
        style: "thin",
        color: { argb: "FF3730A3" },
      },
      left: {
        style: "thin",
        color: { argb: "FFC7D2FE" },
      },
      right: {
        style: "thin",
        color: { argb: "FFC7D2FE" },
      },
    };
  });

  headerRow.height = 28;

  // Application data
  rows.forEach((row, index) => {
    const excelRow = worksheet.getRow(index + 4);

    columns.forEach(([, , read], columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      const value = read(row);

      cell.value =
        value === null || value === undefined ? "" : String(value);

      cell.font = {
        name: "Calibri",
        size: 10,
      };

      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };

      cell.border = {
        bottom: {
          style: "thin",
          color: { argb: "FFE4E7EC" },
        },
        left: {
          style: "thin",
          color: { argb: "FFE4E7EC" },
        },
        right: {
          style: "thin",
          color: { argb: "FFE4E7EC" },
        },
      };

      // Alternating row colors
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F7FF" },
        };
      }
    });

    excelRow.commit();
  });

  // Enable Excel filters
  if (rows.length > 0) {
    worksheet.autoFilter = {
      from: {
        row: 3,
        column: 1,
      },
      to: {
        row: rows.length + 3,
        column: totalColumns,
      },
    };
  }

  // Generate a genuine XLSX workbook
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    moduleLabel.toLowerCase().replace(/\s+/g, "-") +
    "-report-" +
    easternDate() +
    ".xlsx";

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Release the temporary download URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
