import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";
import { Button } from "@/components/ui/button";
export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#help-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:p-3 focus:shadow"
      >
        Skip to content
      </a>
      <header className="border-b bg-card/60">
        <nav
          aria-label="Help Centre navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
        >
          <Link
            href="/help"
            className="flex items-center gap-2"
            aria-label="ChurchOS Help Centre"
          >
            <BrandLogo variant="mark" emblemClassName="!size-8" />
            <span className="text-sm font-semibold sm:text-base">
              ChurchOS{" "}
              <span className="font-normal text-muted-foreground">
                / Help Centre
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ColorModeToggle />
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">
                Open workspace
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main
        id="help-main"
        tabIndex={-1}
        className="mx-auto max-w-6xl px-4 py-10 outline-none sm:px-6 sm:py-14"
      >
        {children}
      </main>
      <footer className="mt-10 border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <p>Practical help for the people behind your church.</p>
          <nav aria-label="Help footer" className="flex flex-wrap gap-5">
            <Link href="/">ChurchOS home</Link>
            <Link href="/help">All guides</Link>
            <Link href="/help/get-help-and-report-a-problem">Get help</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
