"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentProfile } from "@/hooks/use-profile";
import { featureForPath, FEATURE_MINIMUM_PLAN } from "@/lib/plan-features";
import { Button } from "@/components/ui/button";
export function PlanFeatureGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profile } = useCurrentProfile();
  const feature = featureForPath(pathname);
  if (
    !feature ||
    profile?.planFeatures?.includes(feature)
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
        Available on {FEATURE_MINIMUM_PLAN[feature] === "community" ? "Community" : "Network"} and higher plans.
      </p>
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

      </div>
    </section>
  );
}
