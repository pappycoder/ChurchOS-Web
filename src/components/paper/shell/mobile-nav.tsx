"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type { PaperArea } from "@/lib/paper-nav";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({ areas }: { areas: PaperArea[] }) {
  const pathname = usePathname();
  const primary = areas.slice(0, 3);
  const rest = areas.slice(3);

  const isActive = (area: PaperArea) =>
    area.children.some((module) =>
      module.children.some(
        (leaf) => pathname === leaf.href || pathname.startsWith(leaf.href + "/"),
      ),
    );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="flex items-stretch">
        {primary.map((area) => {
          const active = isActive(area);
          const landing = area.children[0]?.children[0]?.href ?? area.href;
          return (
            <Link
              key={area.id}
              href={landing}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                active ? "text-brand" : "text-ink-faint",
              )}
            >
              {active ? (
                <span className="absolute top-0 h-0.5 w-6 rounded-full bg-brand" />
              ) : null}
              <area.icon className="size-[18px]" strokeWidth={1.8} />
              {area.label}
            </Link>
          );
        })}

        {rest.length ? (
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex w-14 flex-col items-center justify-center gap-1 py-2.5 text-[10px] text-ink-faint"
                aria-label="All areas"
              >
                <LayoutGrid className="size-[18px]" strokeWidth={1.8} />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              <SheetHeader>
                <SheetTitle className="text-left font-display">All areas</SheetTitle>
                <SheetDescription className="text-left">
                  Everything in your workspace.
                </SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 px-4">
                {rest.map((area) => {
                  const landing = area.children[0]?.children[0]?.href ?? area.href;
                  return (
                    <Link
                      key={area.id}
                      href={landing}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border border-line p-3 transition-colors",
                        isActive(area)
                          ? "border-brand/40 bg-brand-soft/50"
                          : "bg-card hover:bg-muted",
                      )}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-ink-soft">
                        <area.icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold">{area.label}</span>
                        <span className="block truncate text-[10px] text-ink-faint">
                          {area.blurb}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </nav>
  );
}
