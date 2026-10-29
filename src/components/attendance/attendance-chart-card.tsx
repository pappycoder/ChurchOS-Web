"use client";
import { WorkspaceChartCard, type WorkspaceChartCardProps } from "@/components/workspace/workspace-chart-card";
export function AttendanceChartCard(props: WorkspaceChartCardProps) {
  return <WorkspaceChartCard {...props} kind="attendance" />;
}
