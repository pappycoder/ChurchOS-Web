import AuthRouteShell from "@/components/shared/auth-route-shell";
import { PRIVATE_ROBOTS } from "@/lib/seo";
export const metadata = { title: "Account", robots: PRIVATE_ROBOTS };
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthRouteShell>{children}</AuthRouteShell>;
}
