import type { ExcelSheet } from "./excel-design";
import { TARGET_FIELDS } from "./member-import-template";

export const VISITOR_IMPORT_FIELDS = [
  ...TARGET_FIELDS.filter((field) =>
    [
      "firstName",
      "lastName",
      "email",
      "phone",
      "whatsappNumber",
      "gender",
    ].includes(field.key),
  ).map((field) =>
    field.key === "lastName"
      ? { ...field, label: "Last Name", required: false }
      : field,
  ),
  {
    key: "firstVisitDate",
    label: "First Visit Date",
    aliases: ["firstvisitdate", "firstvisit", "visitdate", "date"],
  },
  ...TARGET_FIELDS.filter((field) => ["branch", "notes"].includes(field.key)),
];

export function visitorImportTemplate(
  branchNames: string[],
  defaultBranch?: string,
): ExcelSheet[] {
  const example: Record<string, unknown> = {
    firstName: "Amina",
    lastName: "Okafor",
    email: "amina@example.com",
    phone: "+234 801 234 5678",
    gender: "female",
    firstVisitDate: new Date("2026-10-25T00:00:00Z"),
    branch: defaultBranch ?? branchNames[0] ?? "",
  };
  return [
    {
      name: "Visitors",
      template: true,
      columns: VISITOR_IMPORT_FIELDS.map((field) => ({
        key: field.key,
        label: field.label.replace(/ \*$/, "").replace(/ \(.*\)$/, ""),
        ...(["phone", "whatsappNumber"].includes(field.key)
          ? { numberFormat: "@" }
          : {}),
        ...(field.key === "firstVisitDate"
          ? { dateInput: true, numberFormat: "yyyy-mm-dd", width: 24 }
          : {}),
        ...(field.key === "gender" ? { options: ["male", "female"] } : {}),
        ...(field.key === "branch" ? { options: branchNames } : {}),
      })),
      data: [example],
    },
    {
      name: "Instructions",
      columns: [
        { key: "step", label: "Step" },
        { key: "instruction", label: "Instructions", width: 90 },
      ],
      data: [
        {
          step: "1. Add visitors",
          instruction:
            "Replace the example. Only First Name is required. Keep the headers in row 1. New visitors start with the New follow-up status.",
        },
        {
          step: "2. Dates",
          instruction:
            "Use your app's calendar if available, or type YYYY-MM-DD. LibreOffice may require typed dates. An empty First Visit Date defaults to the import date.",
        },
        {
          step: "3. Phone numbers",
          instruction:
            "Phone and WhatsApp are formatted as Text to preserve + country codes and leading zeros. Keep destination formatting when pasting.",
        },
        {
          step: "4. Branch",
          instruction:
            "Use an available branch name. Branch staff import into their own branch. HQ can select a branch; blank HQ branches are church-wide.",
        },
        {
          step: "5. Review",
          instruction:
            "Save as XLSX or CSV, upload on Import Visitors, map columns and run the validation preview. Review errors before confirming. Duplicate contact rows are skipped.",
        },
      ],
    },
  ];
}
