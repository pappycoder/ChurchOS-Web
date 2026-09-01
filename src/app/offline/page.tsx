import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";

export const metadata = {
  title: "You're Offline - ChurchOS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-6">
        <BrandLogo variant="mark" emblemClassName="h-16 w-16" />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            You&apos;re offline
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            ChurchOS couldn&apos;t reach the server. Check your connection and
            try again. Your app shell is available offline.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/">Try again</Link>
        </Button>
      </div>
    </main>
  );
}
