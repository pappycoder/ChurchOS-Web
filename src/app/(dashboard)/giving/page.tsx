"use client";
import * as React from "react";
import { format, subDays } from "date-fns";
import { Plus, Receipt, FileBarChart2, Tags, Repeat } from "lucide-react";
import {
  GivingWorkspace,
  GivingHeader,
  givingCurrencies,
  givingMoney,
  givingWorkspaceClass,
} from "@/components/giving/giving-presentation";
import { GivingChartCard } from "@/components/giving/giving-chart-card";
import { GivingCategoryBars } from "@/components/giving/giving-category-bars";
import {
  DashboardTrend,
  dashboardColors,
} from "@/components/dashboard/dashboard-plots";
import { RecordCashDialog } from "@/components/giving/record-cash-dialog";
import { BranchFilter } from "@/components/shared/branch-filter";
import { PermissionLink } from "@/components/shared/permission-link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGivingDashboardCharts } from "@/hooks/use-dashboard-charts";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
export default function GivingDashboardPage() {
  const { can } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const [branchId, setBranchId] = React.useState("");
  const [currency, setCurrency] = React.useState("NGN");
  const [recordOpen, setRecordOpen] = React.useState(false);
  const [range] = React.useState(() => {
    const today = new Date();
    return {
      startDate: format(subDays(today, 29), "yyyy-MM-dd"),
      endDate: `${format(today, "yyyy-MM-dd")}T23:59:59.999Z`,
    };
  });
  const effectiveBranchId = profile?.isAdminHq
    ? branchId
    : (profile?.branchId ?? "");
  const query = useGivingDashboardCharts(
    { ...range, branchId: effectiveBranchId || undefined, currency },
    { enabled: !!profile },
  );
  const shortcuts = [
    {
      permission: "giving:records",
      href: "/giving/records",
      label: "Records",
      icon: Receipt,
    },
    {
      permission: "giving:reports",
      href: "/giving/reports",
      label: "Reports",
      icon: FileBarChart2,
    },
    {
      permission: "giving:categories",
      href: "/giving/categories",
      label: "Categories",
      icon: Tags,
    },
    {
      permission: "giving:recurring",
      href: "/giving/recurring",
      label: "Recurring",
      icon: Repeat,
    },
  ];
  return (
    <GivingWorkspace>
      <GivingHeader
        title="Giving"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving" },
        ]}
        action={
          can("giving:records", "create") && (
            <Button onClick={() => setRecordOpen(true)}>
              <Plus className="size-4" />
              Record Giving
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Giving tasks" className="flex flex-wrap gap-2">
          {shortcuts
            .filter((item) => can(item.permission, "read"))
            .map((item) => (
              <Button
                key={item.href}
                variant="outline"
                size="sm"
                asChild
                className="rounded-full"
              >
                <PermissionLink href={item.href}>
                  <item.icon className="size-3.5" />
                  {item.label}
                </PermissionLink>
              </Button>
            ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <BranchFilter value={branchId} onChange={setBranchId} />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger
              aria-label="Giving dashboard currency"
              className="w-28"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {givingCurrencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Last 30 days · successful gifts only · {currency} · no currency
        conversion
      </p>
      {can("giving:dashboard", "read") && (
        <div className="grid gap-3 lg:grid-cols-5">
          <GivingChartCard
            title="Giving trend"
            description={`Daily successful giving · ${currency}`}
            query={query}
            className="lg:col-span-3"
          >
            <DashboardTrend
              data={query.data?.trend ?? []}
              colors={[dashboardColors[0]]}
              formatValue={(value) => givingMoney(currency, value)}
              showValueAxis
            />
          </GivingChartCard>
          <GivingChartCard
            title="Giving by category"
            description={`Successful giving by category · ${currency}`}
            tone="violet"
            query={query}
            className="lg:col-span-2"
          >
            <GivingCategoryBars
              data={(query.data?.byCategory ?? []).map((row) => ({
                name: row.categoryName || "Uncategorized",
                amount: row.total,
              }))}
              currency={currency}
            />
          </GivingChartCard>
        </div>
      )}
      <RecordCashDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        branchId={effectiveBranchId || undefined}
        presentationClassName={givingWorkspaceClass}
      />
    </GivingWorkspace>
  );
}
