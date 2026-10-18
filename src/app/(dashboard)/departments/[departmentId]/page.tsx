"use client";
import { use } from "react";
import { DepartmentDetailContent } from "@/components/departments/department-detail-content";

export default function DepartmentDetailPage({ params }: { params: Promise<{ departmentId: string }> }) {
  const { departmentId } = use(params);
  return <DepartmentDetailContent key={departmentId} departmentId={departmentId} />;
}
