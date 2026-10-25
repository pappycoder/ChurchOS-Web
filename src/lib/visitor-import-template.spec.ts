import { expect, it } from "vitest";
import { Workbook } from "exceljs";
import { createExcelWorkbook } from "./export-utils";
import {
  visitorImportTemplate,
  VISITOR_IMPORT_FIELDS,
} from "./visitor-import-template";
it("round trips the visitor template with supported fields, dates and text phones", async () => {
  const book = await createExcelWorkbook(
    visitorImportTemplate(["Main Branch"]),
  );
  const restored = new Workbook();
  await restored.xlsx.load(await book.xlsx.writeBuffer());
  const sheet = restored.worksheets[0];
  expect(sheet.name).toBe("Visitors");
  expect(sheet.columnCount).toBe(9);
  expect(sheet.getRow(1).values).not.toContain("Status");
  expect(
    VISITOR_IMPORT_FIELDS.filter((field) => field.required).map(
      (field) => field.key,
    ),
  ).toEqual(["firstName"]);
  for (const col of ["D", "E"])
    expect(sheet.getCell(`${col}500`).numFmt).toBe("@");
  expect(sheet.getCell("G2").value).toBeInstanceOf(Date);
  expect(sheet.getCell("G500").dataValidation.type).toBe("date");
  expect(sheet.getCell("H500").dataValidation.type).toBe("list");
});
