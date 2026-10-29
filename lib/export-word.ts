import { Document, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle, Packer } from "docx";
import { saveAs } from "file-saver";

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
}

export async function exportAttendanceToWord({
  filename,
  eventTitle,
  eventDate,
  location,
  attendees,
}: WordExportOptions) {
  // Define header styling
  const cellHeader = (text: string, widthPercent: number) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: "0F766E" }, // Emerald 700
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text,
              bold: true,
              color: "FFFFFF",
              size: 20, // 10pt
              font: "Arial",
            }),
          ],
        }),
      ],
    });

  const cellRow = (text: string, widthPercent: number, isAlt: boolean) =>
    new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: isAlt ? { fill: "F8FAFC" } : undefined,
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: text || "—",
              size: 18, // 9pt
              font: "Arial",
              color: "1E293B",
            }),
          ],
        }),
      ],
    });

  // Table rows
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cellHeader("#", 6),
      cellHeader("Full Name", 24),
      cellHeader("Role", 12),
      cellHeader("Campus / Zone", 22),
      cellHeader("Phone", 16),
      cellHeader("Gender", 8),
      cellHeader("Check-in Time", 12),
    ],
  });

  const dataRows = attendees.map((att, idx) => {
    const isAlt = idx % 2 === 1;
    return new TableRow({
      children: [
        cellRow(String(idx + 1), 6, isAlt),
        cellRow(att.fullName, 24, isAlt),
        cellRow(att.role, 12, isAlt),
        cellRow(att.campus, 22, isAlt),
        cellRow(att.phone, 16, isAlt),
        cellRow(att.gender, 8, isAlt),
        cellRow(att.checkInTime, 12, isAlt),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
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
                text: "DANCE FACULTY — OFFICIAL EVENT ATTENDANCE ROSTER",
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
  const cleanFilename = filename.endsWith(".docx") ? filename : `${filename}.docx`;
  saveAs(blob, cleanFilename);
}

