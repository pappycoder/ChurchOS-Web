"use client";
import ui from "@/components/members/members-ui.module.css";
import { PeopleImportPage } from "@/components/shared/people-import-page";
export default function MemberImportPage() {
  return <PeopleImportPage kind="members" className={ui.page} progressClassName={ui.progress} />;
}
