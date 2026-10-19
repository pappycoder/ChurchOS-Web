import type { MetadataRoute } from "next";
import { helpArticles, HELP_REVIEWED_AT } from "@/lib/help/catalog";
import { absoluteUrl } from "@/lib/site";
import { isPreviewDeployment } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment()) return [];

  return [
    { url: absoluteUrl("/help"), lastModified: new Date(HELP_REVIEWED_AT), changeFrequency: "weekly", priority: 0.8 },
    ...helpArticles.map(article => ({ url: absoluteUrl(`/help/${article.slug}`), lastModified: new Date(HELP_REVIEWED_AT), changeFrequency: "monthly" as const, priority: 0.6 })),
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
