"use client";
import {
  ReportDateRange,
  type ReportRange,
} from "@/components/reports/report-date-range";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export function AnalyticsScope({
  range,
  onRangeChange,
  branchId,
  onBranchChange,
}: {
  range: ReportRange;
  onRangeChange: (value: ReportRange) => void;
  branchId: string;
  onBranchChange: (value: string) => void;
}) {
  const { data: profile } = useCurrentProfile();
  const branches = useBranchesList(
    { limit: 100 },
    { enabled: !!profile?.isAdminHq },
  );
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
      <ReportDateRange value={range} onChange={onRangeChange} />
      <div className="space-y-2">
        <Label htmlFor="analytics-branch">Branch</Label>
        <select
          id="analytics-branch"
          className="h-9 max-w-full rounded-md border bg-background px-3 text-sm"
          value={profile?.isAdminHq ? branchId : (profile?.branchId ?? "")}
          disabled={!profile?.isAdminHq}
          onChange={(e) => onBranchChange(e.target.value)}
        >
          <option value="">
            {profile?.isAdminHq
              ? "All permitted branches"
              : (profile?.branch?.name ?? "Your branch")}
          </option>
          {branches.data?.data.map((branch) => (
            <option key={branch.branchId} value={branch.branchId}>
              {branch.name}
            </option>
          ))}
          {!profile?.isAdminHq && profile?.branchId && (
            <option value={profile.branchId}>
              {profile.branch?.name ?? "Your branch"}
            </option>
          )}
        </select>
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          onRangeChange({ startDate: "", endDate: "" });
          onBranchChange("");
        }}
      >
        Reset filters
      </Button>
    </div>
  );
}
