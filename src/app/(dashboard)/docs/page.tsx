"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DocsSideNav, DOCS_SECTIONS, useDocsScrollSpy } from "@/components/docs/docs-nav";
import { DocsContent } from "@/components/docs/docs-content";

export default function DocsPage() {
  const activeSection = useDocsScrollSpy();

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
              <DocsSideNav sections={DOCS_SECTIONS} activeId={activeSection} />
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
