"use client";

import * as React from "react";
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
}

export function ExportDropdown({
  columns,
  data,
  title,
  filename,
  disabled,
}: ExportDropdownProps) {
  const [loading, setLoading] = React.useState<"csv" | "pdf" | "xlsx" | null>(null);

  const handleCSV = () => {
    setLoading("csv");
    try {
      exportCSV(data, columns, filename);
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = async () => {
    setLoading("pdf");
    try {
      await exportPDF(title, columns, data, filename);
    } finally {
      setLoading(null);
    }
  };

  const handleExcel = async () => {
    setLoading("xlsx");
    try {
      await exportExcel([{ name: title, data }], filename);
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
