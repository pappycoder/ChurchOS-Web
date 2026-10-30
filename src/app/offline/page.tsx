import Link from "next/link";
import { PublicPaperShell } from "@/components/shared/public-paper-shell";

// Temporarily disabled. Keep the workspace implementation for future builds.
// import { OfflineWorkspace } from "@/components/offline/offline-workspace";
export const metadata = {
  title: "Offline workspace - ChurchOS",
  robots: { index: false, follow: false },
};
export default function OfflinePage() {
  // return <OfflineWorkspace />;
  // Keep this public route available as the service worker’s connection fallback.
  return (
    <PublicPaperShell>
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Offline access is temporarily unavailable</h1>
        <p className="text-muted-foreground">Please reconnect to continue using ChurchOS.</p>
        <Link href="/" prefetch={false} className="inline-block text-primary underline">Return to ChurchOS</Link>
      </div>
    </main>
    </PublicPaperShell>
  );
}
