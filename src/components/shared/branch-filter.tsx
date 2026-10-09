"use client";

import { useCurrentProfile } from "@/hooks/use-profile";
import { useBranchesList } from "@/hooks/use-branches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BranchFilterProps {
  value: string;
  onChange: (branchId: string) => void;
  className?: string;
  allLabel?: string;
}

/** HQ users can select one branch or all; branch users are pinned to their branch. */
export function BranchFilter({
  value,
  onChange,
  className = "w-[190px]",
  allLabel = "All branches",
}: BranchFilterProps) {
  const { data: profile } = useCurrentProfile();
  const isAdminHq = !!profile?.isAdminHq;
  const branchesQuery = useBranchesList(
    { limit: 100 },
    { enabled: isAdminHq },
  );

  if (!profile) return null;

  if (!isAdminHq) {
    return (
      <Select value={profile.branchId ?? "__no_branch__"} disabled>
        <SelectTrigger className={className} aria-label="Branch">
          <SelectValue placeholder="Your branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={profile.branchId ?? "__no_branch__"}>
            {profile.branch?.name ?? "Your branch"}
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select
      value={value || "all"}
      onValueChange={(selected) => onChange(selected === "all" ? "" : selected)}
    >
      <SelectTrigger className={className} aria-label="Filter by branch">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {(branchesQuery.data?.data ?? []).map((branch) => (
          <SelectItem key={branch.branchId} value={branch.branchId}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
