"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useCurrentProfile } from "@/hooks/use-profile";
import { usePermissions } from "@/hooks/use-permissions";
import { HelpSearch } from "./help-search";
import { legacyHelpSections, suggestedHelp } from "@/lib/help/recommendations";
import type { HelpSearchEntry } from "@/lib/help/search";
import { Button } from "@/components/ui/button";
export function DashboardHelpHub({ index }: { index: HelpSearchEntry[] }) {
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const { canAny } = usePermissions();
  const administrator = profile?.role.some(
    (role) => role === "church_admin" || role === "super_admin",
  );
  const suggestions = suggestedHelp(
    "/docs",
    (permission) => canAny(permission),
    profile?.role || [],
  );
  useEffect(() => {
    const followLegacyLink = () => {
      const slug = legacyHelpSections[window.location.hash.slice(1)];
      if (slug) router.replace(`/help/${slug}`);
    };
    followLegacyLink();
    window.addEventListener("hashchange", followLegacyLink);
    return () => window.removeEventListener("hashchange", followLegacyLink);
  }, [router]);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-widest text-primary">
            HERE TO HELP
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Help Centre</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Practical guides for your church workspace, with help you can share.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/help">
            Open public Help Centre
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </header>
      <section aria-label="Suggested for your work" className="space-y-4">
        <h2 className="text-lg font-semibold">Suggested for your work</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {suggestions.map((article) => (
            <Link
              key={article.slug}
              href={`/help/${article.slug}`}
              className="rounded-xl border bg-accent/30 p-5 transition hover:border-primary/50"
            >
              <BookOpen className="mb-4 size-5 text-primary" />
              <h3 className="font-semibold">{article.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {article.summary}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Read guide
                <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <HelpSearch index={index} compact />
      <aside className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle className="size-5 text-primary" />
            Need a person to help?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {administrator
              ? "Contact the ChurchOS team about a problem these guides don’t resolve. If the team is offline, leave a message through the available chat form."
              : "Ask your church administrator about your role, location access, subscription or provider settings. Your administrator can contact ChurchOS support when needed."}
          </p>
        </div>
        {administrator && (
          <Button asChild variant="outline">
            <Link href="/support">Contact support</Link>
          </Button>
        )}
      </aside>
    </div>
  );
}
