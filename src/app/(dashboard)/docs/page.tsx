"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DocsSideNav, docsSectionsForRole, useDocsScrollSpy } from "@/components/docs/docs-nav";
import { DocsContent } from "@/components/docs/docs-content";
import { useIsMember } from "@/hooks/use-is-member";
import { EmptyState } from "@/components/shared/empty-state";
import { BookOpen } from "lucide-react";

export default function DocsPage() {
  const activeSection = useDocsScrollSpy();
  const { isMember } = useIsMember();
  const sections = React.useMemo(() => docsSectionsForRole(isMember), [isMember]);

  if (isMember) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Access denied"
          description="You don't have permission to view this page. Contact your church admin if you believe this is a mistake."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Help & Documentation"
        breadcrumbs={[{ label: "Help & Documentation" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <Card>
            <CardContent className="py-3">
              <DocsSideNav sections={sections} activeId={activeSection} />
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <DocsContent />
        </div>
      </div>
    </div>
  );
}
