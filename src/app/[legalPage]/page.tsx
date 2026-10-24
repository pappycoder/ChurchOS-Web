import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/legal/legal-document";
import { legalDocuments } from "@/lib/legal";
import { publicPageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return legalDocuments.map((document) => ({ legalPage: document.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legalPage: string }>;
}) {
  const { legalPage } = await params;
  const document = legalDocuments.find((item) => item.slug === legalPage);
  if (!document) return {};
  return publicPageMetadata({
    title: document.title,
    description: document.description,
    path: `/${document.slug}`,
  });
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ legalPage: string }>;
}) {
  const { legalPage } = await params;
  const document = legalDocuments.find((item) => item.slug === legalPage);
  if (!document) notFound();
  return <LegalDocument document={document} />;
}
