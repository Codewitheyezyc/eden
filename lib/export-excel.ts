/**
 * Utility to export data to a genuine, mobile-friendly Microsoft Excel (.xlsx) workbook.
 * Uses the SheetJS (xlsx) engine to produce true OpenXML spreadsheets with:
 * - Proper column widths (no cramped text or truncated names)
 * - Text-preserved phone numbers (never converts to scientific notation 9.02E+09)
 * - Native compatibility with iOS (Files, Numbers), Android (Google Sheets, Office), macOS, and Windows.
 */

import * as XLSX from "xlsx";
import { stripEmojis } from "./export-csv";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number; // character width
}

export interface ExcelExportOptions {
  filename: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
  sheetName?: string;
}

export function exportToRealExcel({
  filename,
  columns,
  data,
  sheetName = "Attendance",
}: ExcelExportOptions) {
  if (typeof window === "undefined") return;

  // 1. Build table rows (Header row + Data rows) with emojis stripped
  const headers = columns.map(c => stripEmojis(c.header));
  const rows = data.map(item =>
    columns.map(c => {
      const val = item[c.key];
      return val === null || val === undefined ? "" : stripEmojis(String(val));
    })
  );

  // 2. Create worksheet using array of arrays
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 3. Set explicit column widths so columns are never cramped or cut off in Excel
  const colWidths = columns.map(c => {
    let maxContentLen = c.header.length;
    for (const item of data) {
      const val = String(item[c.key] ?? "");
      if (val.length > maxContentLen) {
        maxContentLen = val.length;
      }
    }
    // Provide comfortable padding (at least header + 4 chars, min 16, max 42)
    const calculatedWidth = Math.max(maxContentLen + 4, c.width || 16);
    return { wch: Math.min(calculatedWidth, 42) };
  });

  ws["!cols"] = colWidths;

  // 4. Ensure all cells in the sheet are explicitly typed as string ('s')
  // This guarantees Excel NEVER parses phone numbers as scientific notation (e.g. 9.02E+09)
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v !== undefined) {
        cell.t = "s"; // Force string type
        cell.v = String(cell.v);
      }
    }
  }

  // 5. Create workbook and append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 6. Write binary .xlsx and trigger download
  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, cleanFilename, { bookType: "xlsx" });
}
