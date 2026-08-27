"use client";

import { Badge } from "@/components/ui/badge";
import {
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_STATUS_LABELS,
  ASSET_STATUS_STYLES,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_STYLES,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_STYLES,
  type AssetCondition,
  type AssetLoanStatus,
  type AssetStatus,
  type MaintenanceStatus,
} from "@/hooks/use-assets";

type StatusKind =
  | { kind: "status"; value: AssetStatus }
  | { kind: "condition"; value: AssetCondition }
  | { kind: "maintenance"; value: MaintenanceStatus }
  | { kind: "loan"; value: AssetLoanStatus };

export function StatusBadge(props: StatusKind) {
  const { kind, value } = props;

  let label: string;
  let style: string;
  switch (kind) {
    case "status":
      label = ASSET_STATUS_LABELS[value];
      style = ASSET_STATUS_STYLES[value];
      break;
    case "condition":
      label = ASSET_CONDITION_LABELS[value];
      style = ASSET_CONDITION_STYLES[value];
      break;
    case "maintenance":
      label = MAINTENANCE_STATUS_LABELS[value];
      style = MAINTENANCE_STATUS_STYLES[value];
      break;
    case "loan":
      label = LOAN_STATUS_LABELS[value];
      style = LOAN_STATUS_STYLES[value];
      break;
  }

  return (
    <Badge variant="outline" className={`gap-1 rounded-full font-normal ${style}`}>
      {label}
    </Badge>
  );
}