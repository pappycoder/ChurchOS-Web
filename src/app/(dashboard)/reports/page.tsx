"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Landmark,
  ListOrdered,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { BreakdownBars } from "@/components/reports/breakdown-bars";
import {
  useFinancialReport,
  useAttendanceReport,
  useMemberReport,
  monthLabel,
  type FinancialReport,
  type AttendanceReport,
  type MemberReport,
} from "@/hooks/use-reports";
import { useBranchesList } from "@/hooks/use-branches";
import { exportPDF, exportExcel, exportCSV } from "@/lib/export-utils";

type ReportBlock = "financial" | "attendance" | "members";
type Format = "pdf" | "xlsx" | "csv";

const BLOCKS: { key: ReportBlock; label: string; description: string }[] = [
  {
    key: "financial",
    label: "Financial summary",
    description: "Grand total, transactions, average gift, per-category and monthly trend.",
  },
  {
    key: "attendance",
    label: "Attendance summary",
    description: "Total attendance, services held, per-service breakdown and monthly trend.",
  },
  {
    key: "members",
    label: "Members summary",
    description: "Total / new / active members, by-status, by-gender and monthly growth.",
  },
];

const FORMATS: { key: Format; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "pdf", label: "PDF", icon: FileText },
  { key: "xlsx", label: "XLSX", icon: FileSpreadsheet },
  { key: "csv", label: "CSV", icon: FileBarChart },
];

function formatNaira(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

export default function ReportsGeneratorPage() {
  const [blocks, setBlocks] = React.useState<ReportBlock[]>(["financial"]);
  const [range, setRange] = React.useState<ReportRange>({ startDate: "", endDate: "" });
  const [branchId, setBranchId] = React.useState<string>("");
  const [outputFormat, setOutputFormat] = React.useState<Format>("pdf");
  const [exporting, setExporting] = React.useState(false);

  const params = {
    startDate: range.startDate || undefined,
    endDate: range.endDate || undefined,
    branchId: branchId || undefined,
  };

  const financial = useFinancialReport(params);
  const attendance = useAttendanceReport(params);
  const members = useMemberReport(params);
  const branchesQuery = useBranchesList({ limit: 100 });

  const queryFor = (block: ReportBlock) =>
    block === "financial" ? financial : block === "attendance" ? attendance : members;

  const toggleBlock = (block: ReportBlock) =>
    setBlocks((prev) =>
      prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
    );

  const needsBranchFilter = blocks.includes("financial") && blocks.includes("attendance");

  const loading =
    blocks.some((b) => queryFor(b).isLoading) && !blocks.every((b) => queryFor(b).data);
  const anyError = blocks.some((b) => queryFor(b).isError);

  const hasBlockData = (b: ReportBlock) => !!queryFor(b).data;

  const handleGenerate = async () => {
    if (blocks.length === 0) return;
    setExporting(true);
    try {
      const stamp = `report-${format(new Date(), "yyyyMMdd")}`;
      if (outputFormat === "pdf") {
        await exportPdf();
      } else if (outputFormat === "xlsx") {
        const sheets = blocks.map((b) => {
          const sheet = buildSheet(b);
          return { name: sheetName(b), data: sheet.rows };
        });
        await exportExcel(sheets, stamp);
      } else {
        for (const b of blocks) {
          exportCSV(
            buildSheet(b).rows,
            buildSheet(b).columns,
            `${sheetName(b).toLowerCase()}-report-${format(new Date(), "yyyyMMdd")}`
          );
        }
      }
    } finally {
      setExporting(false);
    }
  };

  const buildSheet = (b: ReportBlock): { rows: Record<string, unknown>[]; columns: { key: string; label: string }[] } => {
    if (b === "financial") {
      const r = financial.data as FinancialReport | undefined;
      return {
        rows: [
          { name: "Grand Total", total: r?.grandTotal ?? 0, count: r?.transactionCount ?? 0, average: r?.averageAmount ?? 0 },
          ...(r?.byCategory ?? []).map((c) => ({ name: c.name, total: c.total, count: c.count })),
          { name: "— Monthly trend —", total: undefined, count: undefined },
          ...(r?.monthlyTrend ?? []).map((t) => ({ name: monthLabel(t.month), total: t.total })),
        ],
        columns: [
          { key: "name", label: "Category / Month" },
          { key: "total", label: "Total (₦)" },
          { key: "count", label: "Transactions" },
          { key: "average", label: "Average (₦)" },
        ],
      };
    }
    if (b === "attendance") {
      const r = attendance.data as AttendanceReport | undefined;
      return {
        rows: [
          { name: "Grand Total", total: r?.totalAttendance ?? 0, services: r?.serviceCount ?? 0, average: r?.averagePerService ?? 0 },
          ...(r?.byService ?? []).map((s) => ({ name: s.name, total: s.total, services: s.serviceCount, average: s.average })),
          { name: "— Monthly trend —", total: undefined },
          ...(r?.monthlyTrend ?? []).map((t) => ({ name: monthLabel(t.month), total: t.total })),
        ],
        columns: [
          { key: "name", label: "Service / Month" },
          { key: "total", label: "Check-ins" },
          { key: "services", label: "Services" },
          { key: "average", label: "Average / Service" },
        ],
      };
    }
    const r = members.data as MemberReport | undefined;
    return {
      rows: [
        { name: "Total Members", count: r?.totalMembers ?? 0 },
        { name: "New in Period", count: r?.newMembersInPeriod ?? 0 },
        { name: "Active Members", count: r?.activeMembers ?? 0 },
        { name: "— By status —", count: undefined },
        ...(r?.byStatus ?? []).map((s) => ({ name: s.status, count: s.count })),
        { name: "— By gender —", count: undefined },
        ...(r?.byGender ?? []).map((g) => ({ name: g.gender, count: g.count })),
        { name: "— Monthly growth —", count: undefined },
        ...(r?.monthlyGrowth ?? []).map((t) => ({ name: monthLabel(t.month), count: t.total })),
      ],
      columns: [
        { key: "name", label: "Status / Gender / Month" },
        { key: "count", label: "Members" },
      ],
    };
  };

  const sheetName = (b: ReportBlock) =>
    b === "financial" ? "Financial" : b === "attendance" ? "Attendance" : "Members";

  const exportPdf = async () => {
    const sections: { title: string; rows: Record<string, unknown>[]; columns: { key: string; label: string }[] }[] =
      blocks.map((b) => ({ title: `${sheetName(b)} Report`, ...buildSheet(b) }));
    const full: Record<string, unknown>[] = [];
    // Build a single combined PDF with a section header per block.
    const seenCols = new Map<string, string>();
    sections.forEach((s) => {
      if (full.length > 0) full.push({ name: "", total: "", count: "", average: "" });
      s.columns.forEach((c) => seenCols.set(c.key, c.label));
      s.rows.forEach((row) => full.push({ ...row }));
    });
    const columns = Array.from(seenCols.entries()).map(([key, label]) => ({ key, label }));
    await exportPDF("ChurchOS Reports", columns, full, `report-${format(new Date(), "yyyyMMdd")}`);
  };

  if (anyError) {
    return (
      <div>
        <PageHeader
          title="Reports"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Reports" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load report data.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Generate Report"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Reports" },
        ]}
        action={
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={blocks.length === 0 || loading || exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Generating…" : `Download ${outputFormat.toUpperCase()}`}
          </Button>
        }
      />

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Report configuration</CardTitle>
          <CardDescription>Choose what to include, the date range, and the output format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 py-4">
          {/* Data blocks */}
          <div className="grid gap-4 lg:grid-cols-3">
            {BLOCKS.map((b) => {
              const checked = blocks.includes(b.key);
              return (
                <label
                  key={b.key}
                  className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    checked ? "border-primary/50 bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleBlock(b.key)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{b.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{b.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {blocks.length === 0 && (
            <p className="text-sm text-destructive">Select at least one data block.</p>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 border-t pt-4">
            <ReportDateRange value={range} onChange={setRange} />
            {needsBranchFilter ? (
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Branch</Label>
                <Select value={branchId} onValueChange={(v) => setBranchId(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-44 h-9" aria-label="Branch filter">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {(branchesQuery.data?.data ?? []).map((br) => (
                      <SelectItem key={br.branchId} value={br.branchId}>{br.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Branch filter requires the Financial or Attendance block.</p>
            )}
          </div>

          {/* Format */}
          <div className="flex items-center gap-2 border-t pt-4">
            <Label className="text-sm font-medium">Format</Label>
            <div className="flex gap-1">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                const active = outputFormat === f.key;
                return (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setOutputFormat(f.key)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {f.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="space-y-4">
        {loading && <div className="text-sm text-muted-foreground py-4">Loading report data…</div>}

        {hasBlockData("financial") && blocks.includes("financial") && (
          <FinancialPreview report={financial.data} />
        )}
        {hasBlockData("attendance") && blocks.includes("attendance") && (
          <AttendancePreview report={attendance.data} />
        )}
        {hasBlockData("members") && blocks.includes("members") && (
          <MembersPreview report={members.data} />
        )}
      </div>
    </div>
  );
}

function FinancialPreview({ report }: { report: FinancialReport | undefined }) {
  if (!report) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Financial summary</CardTitle>
        <CardDescription>
          {report.startDate ? `${report.startDate} → ${report.endDate}` : "All time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Grand Total" value={formatNaira(report.grandTotal)} icon={<Landmark className="h-4 w-4" />} variant="primary" />
          <StatsCard title="Transactions" value={report.transactionCount} icon={<ListOrdered className="h-4 w-4" />} />
          <StatsCard title="Average Gift" value={formatNaira(report.averageAmount)} icon={<ListOrdered className="h-4 w-4" />} />
        </div>
        <BreakdownBars
          items={report.byCategory.map((c) => ({ name: c.name, value: c.total, count: c.count }))}
          labelSuffix={(item) => `${item.count} txns`}
          formatValue={formatNaira}
        />
      </CardContent>
    </Card>
  );
}

function AttendancePreview({ report }: { report: AttendanceReport | undefined }) {
  if (!report) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Attendance summary</CardTitle>
        <CardDescription>
          {report.startDate ? `${report.startDate} → ${report.endDate}` : "All time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Total Attendance" value={report.totalAttendance} icon={<Users className="h-4 w-4" />} variant="primary" />
          <StatsCard title="Services Held" value={report.serviceCount} icon={<ListOrdered className="h-4 w-4" />} />
          <StatsCard title="Average / Service" value={report.averagePerService.toLocaleString("en-NG", { maximumFractionDigits: 1 })} icon={<Users className="h-4 w-4" />} />
        </div>
        <BreakdownBars
          items={report.byService.map((s) => ({ name: s.name, value: s.total, count: s.serviceCount }))}
          labelSuffix={(item) => `${item.count} ${item.count === 1 ? "service" : "services"}`}
        />
      </CardContent>
    </Card>
  );
}

function MembersPreview({ report }: { report: MemberReport | undefined }) {
  if (!report) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Members summary</CardTitle>
        <CardDescription>
          {report.startDate ? `${report.startDate} → ${report.endDate}` : "All time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Total Members" value={report.totalMembers} icon={<Users className="h-4 w-4" />} variant="primary" />
          <StatsCard title="New in Period" value={report.newMembersInPeriod} icon={<Users className="h-4 w-4" />} />
          <StatsCard title="Active Members" value={report.activeMembers} icon={<Users className="h-4 w-4" />} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownBars items={report.byStatus.map((s) => ({ name: s.status, value: s.count }))} />
          <BreakdownBars items={report.byGender.map((g) => ({ name: g.gender, value: g.count }))} />
        </div>
      </CardContent>
    </Card>
  );
}
