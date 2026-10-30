"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DepartmentDetailContent } from "@/components/departments/department-detail-content";

export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ deptId: string }>;
}) {
  const { deptId } = React.use(params);

  return (
    <div className="space-y-4">
      <Link href="/gatherings/groups" className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint hover:text-ink">
        <ArrowLeft className="size-3" /> Gatherings · Groups
      </Link>
      <DepartmentDetailContent departmentId={deptId} />
    </div>
  );
}
