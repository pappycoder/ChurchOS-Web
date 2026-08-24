"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportCSV, exportPDF, exportExcel, type ExportColumn } from "@/lib/export-utils";

interface ExportDropdownProps {
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title: string;
  filename: string;
  disabled?: boolean;
  /**
   * When provided and no rows are selected client-side, exports EVERY
   * matching row by paging through the list endpoint. Errors surface as
   * a toast and fall back to the passed-in `data`.
   */
  fetchAllRows?: () => Promise<Record<string, unknown>[]>;
}

export function ExportDropdown({
  columns,
  data,
  title,
  filename,
  disabled,
  fetchAllRows,
}: ExportDropdownProps) {
  const [loading, setLoading] = React.useState<"csv" | "pdf" | "xlsx" | null>(null);

  const resolveRows = async (): Promise<Record<string, unknown>[]> => {
    if (fetchAllRows) {
      try {
        const rows = await fetchAllRows();
        return rows.length > 0 ? rows : data;
      } catch (error) {
        toast.error("Could not load all rows for export", {
          description:
            error instanceof Error
              ? error.message
              : "Exporting the loaded rows instead.",
        });
      }
    }
    return data;
  };

  const handleCSV = async () => {
    setLoading("csv");
    try {
      exportCSV(await resolveRows(), columns, filename);
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    setLoading("pdf");
    try {
      await exportPDF(title, columns, await resolveRows(), filename);
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading("xlsx");
    try {
      await exportExcel([{ name: title, data: await resolveRows() }], filename);
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || !!loading}>
          <Download className="h-4 w-4" />
          {loading ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePDF} disabled={loading === "pdf"}>
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExcel} disabled={loading === "xlsx"}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV} disabled={loading === "csv"}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
