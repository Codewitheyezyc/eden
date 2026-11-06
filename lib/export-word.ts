import { Document, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, Packer } from "docx";
import { saveAs } from "file-saver";

export type WordColumnKey = "fullName" | "role" | "campus" | "phone" | "gender" | "checkInTime";

export interface WordAttendeeRow {
  fullName: string;
  role: string;
  campus: string;
  phone: string;
  gender: string;
  status: string;
  checkInTime: string;
}

export interface WordExportOptions {
  filename: string;
  eventTitle: string;
  eventDate: string;
  location: string;
  attendees: WordAttendeeRow[];
  selectedColumns?: WordColumnKey[];
}

const COLUMN_DEFINITIONS: Record<
  WordColumnKey,
  { label: string; baseWeight: number; getValue: (att: WordAttendeeRow) => string }
> = {
  fullName: { label: "Full Name", baseWeight: 4, getValue: (a) => a.fullName },
  role: { label: "Role", baseWeight: 2, getValue: (a) => a.role },
  campus: { label: "Campus / Zone", baseWeight: 3.5, getValue: (a) => a.campus },
  phone: { label: "Phone Number", baseWeight: 2.5, getValue: (a) => a.phone },
  gender: { label: "Gender", baseWeight: 1.5, getValue: (a) => a.gender },
  checkInTime: { label: "Check-in Time", baseWeight: 2, getValue: (a) => a.checkInTime },
};

export async function exportAttendanceToWord({
  filename,
  eventTitle,
  eventDate,
  location,
  attendees,
  selectedColumns = ["fullName", "role", "campus", "phone", "gender", "checkInTime"],
}: WordExportOptions) {
  // Always ensure fullName is present
  const validCols: WordColumnKey[] = selectedColumns.length > 0
    ? (selectedColumns.includes("fullName") ? selectedColumns : ["fullName", ...selectedColumns])
    : ["fullName"];

  const isNamesOnly = validCols.length === 1 && validCols[0] === "fullName";

  // Calculate dynamic width percentages
  // S/N column gets 8% to 12%
  const snWidth = isNamesOnly ? 12 : 7;
  const remainingPercent = 100 - snWidth;
  const totalWeight = validCols.reduce((acc, col) => acc + (COLUMN_DEFINITIONS[col]?.baseWeight || 2), 0);

  const colWidths: Record<WordColumnKey, number> = {} as any;
  validCols.forEach((col) => {
    const weight = COLUMN_DEFINITIONS[col]?.baseWeight || 2;
    colWidths[col] = Math.round((weight / totalWeight) * remainingPercent);
  });

  // Adjust any rounding discrepancies to make total exactly 100%
  const sumWidths = snWidth + validCols.reduce((acc, col) => acc + colWidths[col], 0);
  if (sumWidths !== 100 && validCols.length > 0) {
    colWidths[validCols[0]] += 100 - sumWidths;
  }

  // Header Cell Styling
  const cellHeader = (text: string, widthPercent: number, align: any = AlignmentType.LEFT) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: "0F766E" }, // Emerald 700
      margins: { top: 140, bottom: 140, left: 140, right: 140 },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({
              text,
              bold: true,
              color: "FFFFFF",
              size: isNamesOnly ? 22 : 20, // 11pt or 10pt
              font: "Arial",
            }),
          ],
        }),
      ],
    });

  // Data Cell Styling
  const cellRow = (
    text: string,
    widthPercent: number,
    isAlt: boolean,
    isNameCol: boolean = false,
    align: any = AlignmentType.LEFT
  ) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: isAlt ? { fill: "F8FAFC" } : undefined,
      margins: { top: isNamesOnly ? 140 : 100, bottom: isNamesOnly ? 140 : 100, left: 140, right: 140 },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({
              text: text || "—",
              size: isNamesOnly ? 22 : 18, // 11pt when names only, 9pt otherwise
              font: "Arial",
              bold: isNameCol,
              color: isNameCol ? "0F172A" : "334155",
            }),
          ],
        }),
      ],
    });

  // Header Row
  const headerCells = [
    cellHeader("#", snWidth, AlignmentType.CENTER),
    ...validCols.map((col) =>
      cellHeader(COLUMN_DEFINITIONS[col].label, colWidths[col], AlignmentType.LEFT)
    ),
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells,
  });

  // Data Rows
  const dataRows = attendees.map((att, idx) => {
    const isAlt = idx % 2 === 1;
    const rowCells = [
      cellRow(String(idx + 1), snWidth, isAlt, false, AlignmentType.CENTER),
      ...validCols.map((col) => {
        const val = COLUMN_DEFINITIONS[col].getValue(att);
        return cellRow(val, colWidths[col], isAlt, col === "fullName");
      }),
    ];

    return new TableRow({
      children: rowCells,
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "0F766E" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "0F766E" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [headerRow, ...dataRows],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Academy Super-Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "LOVEWORLD ARTS ACADEMY",
                bold: true,
                size: 32, // 16pt
                color: "0F766E",
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isNamesOnly
                  ? "FACULTY OF PERFORMING ARTS, DANCE UNIT — ATTENDANCE ROSTER (NAMES ONLY)"
                  : "FACULTY OF PERFORMING ARTS, DANCE UNIT — OFFICIAL EVENT ATTENDANCE ROSTER",
                bold: true,
                size: 20, // 10pt
                color: "64748B",
                font: "Arial",
              }),
            ],
            spacing: { after: 240 },
          }),

          // Event Meta
          new Paragraph({
            children: [
              new TextRun({ text: "Event: ", bold: true, size: 22, font: "Arial" }),
              new TextRun({ text: eventTitle, size: 22, font: "Arial" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date & Time: ", bold: true, size: 20, font: "Arial" }),
              new TextRun({ text: eventDate, size: 20, font: "Arial" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Location: ", bold: true, size: 20, font: "Arial" }),
              new TextRun({ text: location || "Campus Venue", size: 20, font: "Arial" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Total Verified Attendees: ", bold: true, size: 20, font: "Arial", color: "0F766E" }),
              new TextRun({ text: `${attendees.length} members`, bold: true, size: 20, font: "Arial" }),
            ],
            spacing: { after: 300 },
          }),

          // The Attendees Table
          table,

          // Footer Timestamp
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Exported on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} from Eden Portal`,
                size: 16,
                color: "94A3B8",
                font: "Arial",
                italics: true,
              }),
            ],
            spacing: { before: 240 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const suffix = isNamesOnly ? "_NamesOnly" : "";
  const cleanFilename = filename.endsWith(".docx")
    ? filename.replace(".docx", `${suffix}.docx`)
    : `${filename}${suffix}.docx`;

  saveAs(blob, cleanFilename);
}

