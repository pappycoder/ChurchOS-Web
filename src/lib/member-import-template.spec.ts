import { afterEach, describe, expect, it, vi } from "vitest";
import { Workbook } from "exceljs";
import { createExcelWorkbook } from "./export-utils";
import { memberImportTemplate } from "./member-import-template";

afterEach(() => { vi.unstubAllGlobals(); });

describe("member import template", () => {
  it("saves text phones, actual dates and valid dropdowns through the last input row", async () => {
    const book = await createExcelWorkbook(memberImportTemplate(["Main Branch"]));
    const restored = new Workbook();
    await restored.xlsx.load(await book.xlsx.writeBuffer());
    const sheet = restored.worksheets[0];
    expect(sheet.name).toBe("Members");
    expect(sheet.getCell("D1").value).toBe("Phone");
    expect(sheet.getRow(1).values).not.toContain("Status");
    expect(sheet.getCell("L1").value).toBe("Notes");
    expect(sheet.columnCount).toBe(12);
    expect(sheet.getCell("G1").value).toBe("Date of Birth");
    expect(sheet.getCell("D2").value).toBe("+234 803 456 7890");
    for (const address of ["D2", "E2", "D3", "E3", "D500", "E500"]) {
      expect(sheet.getCell(address).numFmt).toBe("@");
      expect(sheet.getCell(address).dataValidation?.type).toBeUndefined();
    }
    expect(sheet.getColumn("D").numFmt).toBe("@");
    expect(sheet.getColumn("E").numFmt).toBe("@");
    expect(sheet.getCell("G2").value).toEqual(new Date("1995-04-12T00:00:00Z"));
    for (const address of ["G2", "G3", "G500"]) {
      const cell = sheet.getCell(address);
      expect(cell.numFmt).toBe("yyyy-mm-dd");
      expect(cell.dataValidation).toMatchObject({ type: "date", operator: "between", allowBlank: true, showErrorMessage: true });
      expect(cell.dataValidation.formulae).toHaveLength(2);
    }
    for (const column of ["F", "K"]) {
      const name = sheet.getCell(`${column}500`).dataValidation.formulae[0];
      expect(restored.definedNames.getRanges(name).ranges.length).toBeGreaterThan(0);
    }
  });

  it("round-trips phone prefixes and dates through the actual import worker", async () => {
    const book = await createExcelWorkbook(memberImportTemplate(["Main Branch"]));
    const sheet = book.worksheets[0];
    sheet.getCell("E2").value = "08034567890";
    sheet.getCell("D3").value = "+44 7700 900123";
    sheet.getCell("A3").value = "Ada";
    sheet.getCell("B3").value = "Obi";
    sheet.getCell("G3").value = new Date("2000-02-29T00:00:00Z");
    const bytes = new Uint8Array(await book.xlsx.writeBuffer());
    const postMessage = vi.fn();
    const worker = { onmessage: undefined as unknown, postMessage };
    vi.stubGlobal("self", worker);
    await import("./workers/spreadsheet.worker");
    await (worker.onmessage as (event: unknown) => Promise<void>)({ data: { buffer: bytes.buffer, csv: false } });
    expect(postMessage).toHaveBeenCalledTimes(1);
    const output = postMessage.mock.calls[0][0];
    expect(output.error).toBeUndefined();
    expect(output.records).toHaveLength(2);
    expect(output.records[0]).toMatchObject({ Phone: "+234 803 456 7890", "WhatsApp Number": "08034567890", "Date of Birth": "1995-04-12" });
    expect(output.records[1]).toMatchObject({ Phone: "+44 7700 900123", "Date of Birth": "2000-02-29" });
  });
});
