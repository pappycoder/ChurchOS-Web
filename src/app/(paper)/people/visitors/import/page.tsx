"use client";

import Link from "next/link";
import { PageHeader } from "@/components/paper/section";
import { PeopleImportPage } from "@/components/shared/people-import-page";

export default function VisitorsImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/people/visitors" className="flex items-center gap-1.5 hover:text-ink">
            ← People · Visitors
          </Link>
        }
        title="Bring last season&apos;s guests across."
        description="Upload a visitor list, map the columns, and import in reviewable batches — duplicates surface before anything is saved."
      />
      <PeopleImportPage kind="visitors" />
    </div>
  );
}
