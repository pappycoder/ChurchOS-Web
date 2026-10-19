"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";
import { Button } from "@/components/ui/button";
import { helpArticles, helpTopics } from "@/lib/help/catalog";
import { SUPPORT_CONTACT_PATH } from "@/lib/support";

function TopicNavigation() {
  const path = usePathname();
  const article = helpArticles.find((item) => path === `/help/${item.slug}`);
  return (
    <nav aria-label="Help topics" className="space-y-5">
      <Link
        href="/help"
        aria-current={path === "/help" ? "page" : undefined}
        className="flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <BookOpen className="size-4" />
        All guides
      </Link>
      {helpTopics.map((topic) => (
        <div key={topic.id} className="space-y-2">
          <Link
            href={`/help?topic=${topic.id}`}
            className="block text-sm font-medium hover:text-primary"
          >
            {topic.title}
          </Link>
          {article?.topic === topic.id && (
            <ul className="space-y-1 border-l pl-3">
              {helpArticles
                .filter((item) => item.topic === topic.id)
                .map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/help/${item.slug}`}
                      aria-current={item.slug === article.slug ? "page" : undefined}
                      className={`block rounded-md px-2 py-2 text-sm leading-relaxed ${item.slug === article.slug ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

export function HelpShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const content = (
    <div className="space-y-6">
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
        <aside className="sticky top-24 hidden rounded-xl border bg-card p-5 lg:block">
          <TopicNavigation />
        </aside>
        <div className="min-w-0 space-y-6">
          <details className="rounded-xl border bg-card p-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium">Browse help topics</summary>
            <div className="mt-5">
              <TopicNavigation />
            </div>
          </details>
          {children}
        </div>
      </div>
    </div>
  );

  // Public articles remain server-rendered and readable before session restoration or without JS.
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
          className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          <Link href="/help" className="flex items-center gap-2" aria-label="ChurchOS Help Centre">
            <BrandLogo variant="mark" emblemClassName="!size-8" />
            <span className="font-semibold">
              ChurchOS{" "}
              <span className="text-sm font-normal text-muted-foreground">/ Help Centre</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <ColorModeToggle />
            <Button asChild size="sm" variant="ghost"><Link href={SUPPORT_CONTACT_PATH}>Support</Link></Button>
            <Button asChild size="sm" variant="outline">
              <Link href={isAuthenticated ? "/dashboard" : "/"}>
                <ArrowLeft className="size-4" />
                {isAuthenticated ? "Back to dashboard" : "Back to home"}
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main
        id="help-main"
        tabIndex={-1}
        className="mx-auto max-w-[1440px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
      >
        {content}
      </main>
      <footer className="mt-10 border-t">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>Practical help for the people behind your church.</p>
          <nav aria-label="Help footer" className="flex flex-wrap gap-5">
            <Link href={isAuthenticated ? "/dashboard" : "/"}>
              {isAuthenticated ? "Dashboard" : "ChurchOS home"}
            </Link>
            <Link href="/help">All guides</Link>
            <Link href="/help/get-help-and-report-a-problem">Get help</Link>
            <Link href={SUPPORT_CONTACT_PATH}>Contact support</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
