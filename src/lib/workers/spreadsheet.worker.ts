/// <reference lib="webworker" />
import type { CellValue } from "exceljs";
const MAX_ROWS = 10000;
const MAX_COLUMNS = 100;

function validateArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  let expanded = 0;
  let entries = 0;
  // Bound ZIP expansion before the workbook parser allocates worksheet objects.
  for (let offset = 0; offset + 46 <= buffer.byteLength; offset++) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extra = view.getUint16(offset + 30, true);
    const comment = view.getUint16(offset + 32, true);
    if (offset + 46 + nameLength + extra + comment > buffer.byteLength || size === 0xffffffff) throw new Error("Unsupported workbook archive.");
    expanded += size;
    entries++;
    if (expanded > 30 * 1024 * 1024 || entries > 1000) throw new Error("Workbook is too large after decompression. Split it into smaller files.");
    offset += 45 + nameLength + extra + comment;
  }
  if (!entries) throw new Error("Invalid XLSX file.");
}

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || !cell) quoted = !quoted;
      else throw new Error("Invalid CSV quoting.");
    } else if (!quoted && (ch === ',' || ch === '\n' || ch === '\r')) {
      row.push(cell); cell = "";
      if (row.length > MAX_COLUMNS) throw new Error("Use no more than 100 columns.");
      if (ch !== ',') {
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        if (ch === '\r' && text[i + 1] === '\n') i++;
      }
    } else cell += ch;
    if (cell.length > 10000 || rows.length > MAX_ROWS + 1) throw new Error("Import exceeds the row or cell size limit.");
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) throw new Error("Replace formulas with their values before importing.");
    if ("richText" in value) return value.richText.map((run) => run.text).join("");
    if ("text" in value) return value.text;
    return "";
  }
  return String(value);
}

self.onmessage = async (event: MessageEvent<{ buffer: ArrayBuffer; csv: boolean }>) => {
  try {
    const { buffer, csv } = event.data;
    let rows: string[][];
    if (csv) rows = csvRows(new TextDecoder().decode(buffer).replace(/^\uFEFF/, ""));
    else {
      validateArchive(buffer);
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("The workbook has no sheets.");
      if (sheet.rowCount > MAX_ROWS + 1 || sheet.columnCount > MAX_COLUMNS) throw new Error("Use at most 10,000 rows and 100 columns.");
      rows = [];
      sheet.eachRow((row) => {
        const values: string[] = [];
        for (let column = 1; column <= sheet.columnCount; column++) {
          const text = cellText(row.getCell(column).value).trim();
          if (text.length > 10000) throw new Error("A cell exceeds 10,000 characters.");
          values.push(text);
        }
        rows.push(values);
      });
    }
    const headers = rows.shift()?.map((name) => name.trim()) ?? [];
    if (!headers.length || headers.filter(Boolean).length !== new Set(headers.filter(Boolean)).size) throw new Error("Use unique column headings.");
    if (!rows.length || rows.length > MAX_ROWS) throw new Error("Use between 1 and 10,000 data rows.");
    const records = rows.map((values) => Object.fromEntries(headers.map((name, index) => [name, values[index] ?? ""]).filter(([name]) => name)));
    self.postMessage({ records });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Unable to parse this spreadsheet." });
  }
};
