"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { legacyHelpSections } from "@/lib/help/recommendations";

/** Keep old bookmarks useful without mounting a second help screen in the dashboard. */
export default function DocsPage() {
  const router = useRouter();
  useEffect(() => {
    const slug = legacyHelpSections[window.location.hash.slice(1)];
    router.replace(slug ? `/help/${slug}` : `/help${window.location.search}`);
  }, [router]);
  return (
    <p className="p-6">
      Opening the{" "}
      <Link href="/help" className="underline">
        Help Centre
      </Link>
      …
    </p>
  );
}
