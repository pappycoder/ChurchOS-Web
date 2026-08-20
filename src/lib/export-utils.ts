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

export async function exportPDF(
  title: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 22);

  autoTable(doc, {
    startY: 30,
    columns: columns.map((c) => ({ header: c.label, dataKey: c.key })),
    body: data as Record<string, string>[],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${filename}.pdf`);
}

export async function exportExcel(
  sheets: { name: string; data: Record<string, unknown>[] }[],
  filename: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
