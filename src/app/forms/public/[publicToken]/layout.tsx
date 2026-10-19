import { PRIVATE_ROBOTS } from "@/lib/seo";
export const metadata = { title: "Community form", robots: PRIVATE_ROBOTS };
export default function PublicFormLayout({ children }: { children: React.ReactNode }) { return children; }
