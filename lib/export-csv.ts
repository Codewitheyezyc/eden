/**
 * Utility to export data to a pure, mobile-friendly RFC-4180 CSV (.csv) file.
 * Handles Excel compatibility so phone numbers are preserved as text without scientific notation (9.02E+09).
 */

export interface CsvColumn {
  header: string;
  key: string;
}

export interface CsvExportOptions {
  filename: string;
  columns: CsvColumn[];
  data: Record<string, any>[];
}

function escapeCsvCell(value: any, key: string = ""): string {
  if (value === null || value === undefined) return "";
  const str = String(value);

  // If this is a phone number column, wrap as Excel text formula ="..." so Excel NEVER parses as scientific notation (e.g. 9.02E+09)
  if (key.toLowerCase().includes("phone") && str && str !== "—") {
    return `="${str.replace(/"/g, '""')}"`;
  }

  // If the cell contains comma, double quote, newline, or carriage return, enclose in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv({ filename, columns, data }: CsvExportOptions) {
  if (typeof window === "undefined") return;

  const headerRow = columns.map(c => escapeCsvCell(c.header)).join(",");
  const rows = data.map(row => 
    columns.map(c => escapeCsvCell(row[c.key] ?? "", c.key)).join(",")
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel and mobile spreadsheet viewers render characters flawlessly
  const csvContent = "\uFEFF" + [headerRow, ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", cleanFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
