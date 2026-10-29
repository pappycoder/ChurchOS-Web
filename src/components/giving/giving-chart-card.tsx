"use client";
import { WorkspaceChartCard, type WorkspaceChartCardProps } from "@/components/workspace/workspace-chart-card";
export function GivingChartCard(props: WorkspaceChartCardProps) {
  return <WorkspaceChartCard {...props} kind="giving" />;
}
