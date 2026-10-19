import type { MetadataRoute } from "next";
import { helpArticles, HELP_REVIEWED_AT } from "@/lib/help/catalog";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: absoluteUrl("/help"), lastModified: new Date(HELP_REVIEWED_AT), changeFrequency: "weekly", priority: 0.8 },
    ...helpArticles.map(article => ({ url: absoluteUrl(`/help/${article.slug}`), lastModified: new Date(HELP_REVIEWED_AT), changeFrequency: "monthly" as const, priority: 0.6 })),
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
