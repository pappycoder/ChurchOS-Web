"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentProfile } from "@/hooks/use-profile";
import { featureForPath } from "@/lib/plan-features";
import { Button } from "@/components/ui/button";
export function PlanFeatureGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const [historical, setHistorical] = React.useState("");
  const feature = featureForPath(pathname);
  if (
    !feature ||
    profile?.planFeatures === undefined ||
    profile.planFeatures.includes(feature) ||
    historical === pathname
  )
    return <>{children}</>;
  const admin = profile?.role.some(
    (r) => r === "church_admin" || r === "super_admin",
  );
  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-xl border bg-card p-8">
      <h1 className="text-2xl font-semibold">
        This feature is available on a different plan
      </h1>
      <p className="text-muted-foreground">
        {admin
          ? "Compare plans to enable this feature for your church. Existing records are retained."
          : "Contact your church administrator to enable this feature."}
      </p>
      <div className="flex flex-wrap gap-3">
        {admin && (
          <Button asChild>
            <Link href="/subscription">View plans</Link>
          </Button>
        )}
        {!["analytics", "reports"].includes(feature) && (
          <Button variant="outline" onClick={() => setHistorical(pathname)}>
            View historical records
          </Button>
        )}
      </div>
    </section>
  );
}
