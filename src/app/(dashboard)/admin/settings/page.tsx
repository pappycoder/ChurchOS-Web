"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GeneralSettingsTab } from "@/components/settings/general-settings-tab";
import { usePermissions } from "@/hooks/use-permissions";

export default function ChurchSettingsPage() {
  const { can } = usePermissions();
  const router = useRouter();
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "security") router.replace("/profile?tab=security");
    else if (tab === "messaging") router.replace("/admin/integrations");
  }, [router]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Church settings"
        breadcrumbs={[{ label: "Settings" }]}
      />
      <nav aria-label="Related settings" className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/profile?tab=security">Personal security</Link>
        </Button>
        {can("integrations", "read") && (
          <Button variant="outline" asChild>
            <Link href="/admin/integrations">
              Provider accounts and services
            </Link>
          </Button>
        )}
      </nav>
      <Card>
        <CardHeader>
          <CardTitle>Church details and preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralSettingsTab />
        </CardContent>
      </Card>
    </div>
  );
}
