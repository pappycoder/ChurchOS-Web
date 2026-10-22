import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  if (isPreviewDeployment()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [
      "/api/", "/login", "/register", "/forgot-password", "/reset-password", "/accept-invitation",
      "/subscription", "/payment/", "/offline", "/docs", "/support",
      "/dashboard", "/members", "/visitors", "/attendance", "/giving",
      "/events", "/forms", "/media", "/pastoral", "/admin", "/profile",
      "/communication", "/appointments", "/debug", "/assets", "/sermons",
      "/reports", "/analytics", "/inbox", "/notifications", "/departments",
    ] },
    sitemap: `${base}/sitemap.xml`, host: base,
  };
}
