import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const isPreviewDeployment = () => process.env.VERCEL_ENV === "preview";
export const PRIVATE_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false, noimageindex: true, nosnippet: true },
};

/** Supply complete social objects: Next replaces rather than merges nested metadata. */
export function publicPageMetadata({ title, description, path, image = "/og.png", article = false, modifiedTime }: {
  title: string; description: string; path: string; image?: string;
  article?: boolean; modifiedTime?: string;
}): Metadata {
  const socialTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  return {
    title: { absolute: socialTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots: isPreviewDeployment() ? PRIVATE_ROBOTS : {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: article ? "article" : "website",
      siteName: SITE_NAME, locale: "en_NG", title: socialTitle, description,
      url: absoluteUrl(path),
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, type: "image/png", alt: socialTitle }],
      ...(article ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image", title: socialTitle, description,
      images: [{ url: absoluteUrl(image), alt: socialTitle }],
    },
  };
}

/** Prevent HTML from terminating a JSON-LD script, including future CMS content. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
