import { addDesignedSheet, initializeWorkbook, type ExcelSheet } from "./excel-design";
export interface ExportColumn {
  key: string;
  label: string;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  const header = columns.map((c) => escapeCSV(c.label)).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => escapeCSV(String(row[c.key] ?? "")))
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface PdfReportSection {
  title: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  description?: string;
}

export interface PdfReportOptions {
  metadata?: import("@/lib/pdf-design").PdfMetadata[];
}

/** Builds a structured document; every section keeps its own column schema. */
export async function createReportPDF(
  title: string,
  sections: PdfReportSection[],
  options: PdfReportOptions = {},
) {
  const [{ default: jsPDF }, { default: autoTable }, design] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    import("@/lib/pdf-design"),
  ]);
  const { PDF_COLORS: colors, PDF_FONT, preparePdf, pdfText, pdfLabel, drawPdfHeader, drawPdfFooters } = design;
  const landscape = sections.some((section) => section.columns.length > 5);
  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", putOnlyUsedFonts: true });
  const assets = await preparePdf(doc);
  const generatedAt = new Date();
  doc.setProperties({ title, author: "ChurchOS", creator: "ChurchOS", subject: "Church administration report" });

  sections.forEach((section, index) => {
    if (index) doc.addPage();
    const width = doc.internal.pageSize.getWidth();
    const usable = width - 28;
    drawPdfHeader(doc, assets.logo);
    let y = 39;
    pdfLabel(doc, sections.length > 1 ? `SECTION ${index + 1} OF ${sections.length}` : "EXPORTED REPORT", 14, y);
    y += 9;
    y += pdfText(doc, sections.length > 1 ? section.title : title, 14, y, usable, 22, true) + 3;
    if (section.description) y += pdfText(doc, section.description, 14, y, usable, 9, false, colors.muted) + 4;

    const metadata = [...(options.metadata ?? []), { label: "Rows", value: section.data.length.toLocaleString("en-NG") }];
    const columnsPerRow = Math.min(3, metadata.length);
    const cellWidth = usable / columnsPerRow;
    for (let start = 0; start < metadata.length; start += columnsPerRow) {
      const row = metadata.slice(start, start + columnsPerRow);
      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(9);
      const rowHeight = Math.max(19, ...row.map((item) => (doc.splitTextToSize(item.value, cellWidth - 12) as string[]).length * 4.5 + 11));
      doc.setFillColor(colors.soft);
      doc.roundedRect(14, y, usable, rowHeight, 2, 2, "F");
      row.forEach((item, i) => {
        pdfLabel(doc, item.label, 20 + cellWidth * i, y + 6);
        pdfText(doc, item.value, 20 + cellWidth * i, y + 12, cellWidth - 12, 9);
      });
      y += rowHeight + 3;
    }
    y += 6;

    if (section.data.length === 0) {
      doc.setDrawColor(colors.line);
      doc.roundedRect(14, y, usable, 30, 3, 3, "S");
      pdfText(doc, "No records to display", 22, y + 12, usable - 16, 12, true);
      pdfText(doc, "No records matched the selection when this report was generated.", 22, y + 21, usable - 16, 9, false, colors.muted);
      return;
    }
    // Plain string values preserve exactly the chosen rows without schema mixing.
    const body = section.data.map((row) => Object.fromEntries(section.columns.map((column) => [column.key, typeof row[column.key] === "number"
      ? (row[column.key] as number).toLocaleString("en-NG", /₦|NGN|amount|price|cost|value/i.test(column.label)
        ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        : { maximumFractionDigits: 8 })
      : row[column.key] == null ? "" : String(row[column.key])])));
    autoTable(doc, {
      startY: y,
      margin: { top: 36, bottom: 24, left: 14, right: 14 },
      columns: section.columns.map((column) => ({ header: column.label, dataKey: column.key })),
      body,
      theme: "plain",
      styles: { font: PDF_FONT, fontSize: 8.5, cellPadding: 3.5, overflow: "linebreak", textColor: colors.ink, lineColor: colors.line, lineWidth: { bottom: 0.15 } },
      headStyles: { fillColor: colors.navy, textColor: colors.white, fontStyle: "bold", fontSize: 8, cellPadding: 4 },
      alternateRowStyles: { fillColor: colors.soft },
      rowPageBreak: "avoid",
      showHead: "everyPage",
      horizontalPageBreak: section.columns.length > 9,
      horizontalPageBreakRepeat: section.columns[0]?.key,
      willDrawPage: ({ pageNumber }) => {
        drawPdfHeader(doc, assets.logo);
        if (pageNumber > 1) pdfText(doc, `${section.title} · continued`, 14, 32, usable, 8, true, colors.muted);
      },
      didParseCell: (cell) => {
        if (cell.section !== "body") return;
        const row = section.data[cell.row.index];
        if (!row) return;
        const populated = section.columns.filter((column) => row[column.key] !== undefined && row[column.key] !== null && row[column.key] !== "");
        if (populated.length === 1 && section.columns.length > 1) {
          cell.cell.styles.fillColor = "#E8EFFB";
          cell.cell.styles.fontStyle = "bold";
          cell.cell.styles.textColor = colors.blue;
        }
        const firstValue = String(row[section.columns[0]?.key] ?? "");
        if (/^(grand total|total members|new in period|active members)$/i.test(firstValue)) {
          cell.cell.styles.fontStyle = "bold";
          cell.cell.styles.fillColor = "#E8EFFB";
        }
        const raw = row[cell.column.dataKey];
        if (typeof raw === "number") cell.cell.styles.halign = "right";
      },
    });
  });
  drawPdfFooters(doc, generatedAt);
  return doc;
}

export async function exportReportPDF(title: string, sections: PdfReportSection[], filename: string, options: PdfReportOptions = {}): Promise<void> {
  const doc = await createReportPDF(title, sections, options);
  doc.save(`${filename}.pdf`);
}

export async function exportPDF(
  title: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string,
  options: PdfReportOptions = {},
): Promise<void> {
  await exportReportPDF(title, [{ title, columns, data }], filename, options);
}

export async function createExcelWorkbook(sheets: ExcelSheet[]) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  initializeWorkbook(workbook);
  sheets.forEach((sheet, index) => addDesignedSheet(workbook, sheet, index));
  // Keep the input sheet first, including when validation adds a hidden sheet.
  return workbook;
}

export async function exportExcel(sheets: ExcelSheet[], filename: string): Promise<void> {
  const workbook = await createExcelWorkbook(sheets);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
