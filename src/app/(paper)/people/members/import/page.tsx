"use client";

import Link from "next/link";
import { PageHeader } from "@/components/paper/section";
import { PeopleImportPage } from "@/components/shared/people-import-page";

export default function MembersImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link href="/people/members" className="flex items-center gap-1.5 hover:text-ink">
            ← People · Members
          </Link>
        }
        title="Bring your people across."
        description="Upload your current list, map the columns, and import in reviewable batches — nothing is saved until you confirm."
      />
      <PeopleImportPage kind="members" compactProgress />
    </div>
  );
}
