"use client";
import { visitorWorkspaceClass } from "@/components/visitors/visitor-presentation";
import { PeopleImportPage } from "@/components/shared/people-import-page";
export default function VisitorImportPage() {
  return (
    <PeopleImportPage
      kind="visitors"
      presentationClassName={visitorWorkspaceClass}
      compactProgress
    />
  );
}
