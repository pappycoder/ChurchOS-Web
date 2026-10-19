import { LandingPage } from "@/components/marketing/landing-page";
import { JsonLd } from "@/components/shared/json-ld";
import { publicPageMetadata } from "@/lib/seo";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const metadata = publicPageMetadata({
  title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/",
});

export default function Home() {
  return <>
    <JsonLd data={{
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME,
          url: absoluteUrl("/"), logo: absoluteUrl("/icons/icon-512x512.png") },
        { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: SITE_NAME,
          url: absoluteUrl("/"), inLanguage: "en", publisher: { "@id": absoluteUrl("/#organization") } },
        { "@type": "SoftwareApplication", name: SITE_NAME, url: absoluteUrl("/"),
          applicationCategory: "BusinessApplication", operatingSystem: "Web",
          description: SITE_DESCRIPTION, image: absoluteUrl("/og.png"),
          publisher: { "@id": absoluteUrl("/#organization") } },
      ],
    }} />
    <LandingPage />
  </>;
}
