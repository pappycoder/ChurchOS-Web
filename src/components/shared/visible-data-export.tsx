"use client";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { toast } from "@/lib/toast";
export function VisibleDataExport({ getRoot, label = "Export visible data" }: { getRoot?: () => Element | null; label?: string }) {
  const { ready } = usePermissions();
  const [busy, setBusy] = useState(false);
  async function download(format: "csv" | "xlsx" | "pdf") {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const root = getRoot ? getRoot() : document.getElementById("main-content");
      const { collectVisibleData } = await import("@/lib/visible-data-export");
      const sections = root ? collectVisibleData(root) : [];
      if (!sections.length) { toast.info("No visible table rows or list items to export"); return; }
      const exports = await import("@/lib/export-utils");
      const filename = "churchos-visible-data";
      if (format === "pdf") {
        const doc = await exports.createReportPDF("Visible data", sections);
        doc.save(`${filename}.pdf`);
      } else if (format === "xlsx") {
        await exports.exportExcel(sections.map((section, i) => ({ name: `${i + 1} ${section.title}`.slice(0,31), columns: section.columns, data: section.data })), filename);
      } else {
        const data = sections.flatMap(section => section.data.map((record, i) => ({ section: section.title, row: i + 1,
          ...Object.fromEntries(section.columns.map(column => [column.label, record[column.key]])) })));
        const labels = [...new Set(sections.flatMap(section => section.columns.map(column => column.label)))];
        exports.exportCSV(data, [{ key: "section", label: "Collection" }, { key: "row", label: "Row" }, ...labels.map(label => ({ key: label, label }))], filename);
      }
    } catch (error) { toast.error("Export failed", { description: error instanceof Error ? error.message : "Please try again." }); }
    finally { setBusy(false); }
  }
  return <div className="flex justify-end" data-export-ignore>
    <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="outline" size="sm" aria-label={label} disabled={!ready || busy} title="Export the visible table rows and list items on this page"><Download className="size-4" />{busy ? "Exporting…" : label}</Button></DropdownMenuTrigger><DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => void download("csv")}>Visible data as CSV</DropdownMenuItem>
      <DropdownMenuItem onClick={() => void download("xlsx")}>Visible data as Excel</DropdownMenuItem>
      <DropdownMenuItem onClick={() => void download("pdf")}>Visible data as PDF</DropdownMenuItem>
    </DropdownMenuContent></DropdownMenu>
  </div>;
}
