"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

export interface DocsSection {
  id: string;
  label: string;
}

export const DOCS_SECTIONS: DocsSection[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "members", label: "Members" },
  { id: "families", label: "Families" },
  { id: "visitors", label: "Visitors" },
  { id: "attendance", label: "Attendance" },
  { id: "giving", label: "Giving" },
  { id: "events", label: "Events" },
  { id: "sermons", label: "Sermons" },
  { id: "media", label: "Media" },
  { id: "admin-users", label: "Admin — Users" },
  { id: "admin-roles", label: "Admin — Roles" },
  { id: "admin-settings", label: "Admin — Settings" },
  { id: "admin-branches", label: "Admin — Branches" },
  { id: "permissions-matrix", label: "Permissions Matrix" },
];

export function DocsSideNav({
  sections,
  activeId,
}: {
  sections: DocsSection[];
  activeId: string;
}) {
  if (sections.length === 0) return null;
  return (
    <nav className="flex flex-col gap-0.5">
      {sections.map((section) =>
        section.id === activeId ? (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current="true"
            className="inline-flex items-center rounded px-3 py-2 text-sm font-medium text-foreground transition-colors bg-muted"
          >
            <ArrowRight className="mr-2 h-3.5 w-3.5" />
            {section.label}
          </a>
        ) : (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="inline-flex items-center rounded px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            {section.label}
          </a>
        ),
      )}
    </nav>
  );
}

export function useDocsScrollSpy(): string {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -66% 0px" },
    );

    const observed = new Set<Element>();
    const scan = () => {
      document.querySelectorAll("[data-docs-section]").forEach((el) => {
        if (!observed.has(el)) {
          observer.observe(el);
          observed.add(el);
        }
      });
    };
    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return activeId;
}
