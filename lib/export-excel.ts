/**
 * Utility to export data to an editable, beautifully formatted Excel spreadsheet (.xls)
 * Opens seamlessly in Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number; // width in pixels
  align?: "left" | "center" | "right";
  isBold?: boolean;
}

export interface ExcelExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  facultyName?: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
}

export function exportToExcel({
  filename,
  title,
  subtitle,
  facultyName = "Loveworld Arts Academy — Dance Faculty",
  columns,
  data,
}: ExcelExportOptions) {
  if (typeof window === "undefined") return;

  const colCount = columns.length;
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Column Definitions with explicit width so long names fit without truncation
  const colgroupHtml = columns
    .map(c => `<col style="width: ${c.width || 180}px;" />`)
    .join("\n        ");

  // 2. Table Headers with Emerald background & bold white text
  const theadHtml = columns
    .map(
      c => `
        <th style="
          background-color: #047857;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          text-align: ${c.align || "left"};
          border: 1px solid #065f46;
          white-space: nowrap;
        ">
          ${escapeHtml(c.header)}
        </th>`
    )
    .join("");

  // 3. Table Rows with alternating colors, ample padding, and bold text on specified fields
  const tbodyHtml = data
    .map((row, idx) => {
      const bgColor = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = columns
        .map(c => {
          const rawVal = row[c.key] ?? "";
          const valStr = String(rawVal);
          const isNameOrStatus = c.isBold || c.key.toLowerCase().includes("name") || c.key.toLowerCase().includes("role");
          
          let cellStyle = `
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            padding: 10px 16px;
            border: 1px solid #e2e8f0;
            text-align: ${c.align || "left"};
            background-color: ${bgColor};
            color: #1e293b;
            white-space: nowrap;
          `;

          if (isNameOrStatus) {
            cellStyle += " font-weight: bold; color: #0f172a;";
          }

          // Highlight Present / Absent if it's status
          if (c.key.toLowerCase().includes("status")) {
            if (valStr.toLowerCase() === "present") {
              cellStyle += " color: #047857; font-weight: bold;";
            } else if (valStr.toLowerCase() === "absent") {
              cellStyle += " color: #b91c1c; font-weight: bold;";
            } else if (valStr.toLowerCase() === "late") {
              cellStyle += " color: #d97706; font-weight: bold;";
            }
          }

          return `<td style="${cellStyle}">${escapeHtml(valStr)}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("\n      ");

  // 4. Complete HTML with Microsoft Excel XML namespaces for native spreadsheet parsing
  const excelContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Attendance Register</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; mso-displayed-decimal-separator: "."; mso-displayed-thousand-separator: ","; }
    th, td { mso-number-format: "\\@"; }
  </style>
</head>
<body style="padding: 20px; background-color: #ffffff;">
  <table>
    <colgroup>
      ${colgroupHtml}
    </colgroup>
    <thead>
      <!-- Brand & Organization Header Banner -->
      <tr>
        <th colspan="${colCount}" style="
          background-color: #064e3b;
          color: #a7f3d0;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          font-weight: bold;
          letter-spacing: 2px;
          text-align: center;
          padding: 10px 16px;
          text-transform: uppercase;
          border: 1px solid #064e3b;
        ">
          ${escapeHtml(facultyName)}
        </th>
      </tr>

      <!-- Main Title (Centered & Bold) -->
      <tr>
        <th colspan="${colCount}" style="
          background-color: #047857;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 16pt;
          font-weight: 800;
          text-align: center;
          padding: 16px;
          border: 1px solid #047857;
        ">
          ${escapeHtml(title)}
        </th>
      </tr>

      <!-- Subtitle & Meta Info Banner -->
      <tr>
        <th colspan="${colCount}" style="
          background-color: #ecfdf5;
          color: #065f46;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          font-weight: 600;
          text-align: center;
          padding: 8px 16px;
          border: 1px solid #d1fae5;
        ">
          ${subtitle ? escapeHtml(subtitle) + " &bull; " : ""}Generated on ${generatedDate} &bull; Total Records: ${data.length}
        </th>
      </tr>

      <!-- Blank Spacer Row -->
      <tr style="height: 12px;">
        <th colspan="${colCount}" style="background-color: #ffffff; border: none; height: 12px;"></th>
      </tr>

      <!-- Actual Column Headers -->
      <tr>
        ${theadHtml}
      </tr>
    </thead>
    <tbody>
      ${tbodyHtml}
    </tbody>
  </table>
</body>
</html>
  `.trim();

  // 5. Trigger client-side download as .xls
  const blob = new Blob([excelContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const cleanFilename = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.setAttribute("href", url);
  link.setAttribute("download", cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
