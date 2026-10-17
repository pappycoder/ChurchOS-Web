"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

interface AuthFormWrapperProps { heading: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode; }
export function AuthFormWrapper({ heading, subtitle, children, footer }: AuthFormWrapperProps) {
  return <div className="space-y-6">
    <Link href="/" aria-label="ChurchOS home" className="mx-auto flex w-fit items-center gap-2 text-lg font-semibold lg:hidden"><BrandLogo variant="mark" emblemClassName="size-8 dark:brightness-0 dark:invert" />ChurchOS</Link>
    <div className="space-y-2 text-center"><h1 className="text-2xl font-semibold tracking-tight">{heading}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></div>
    {children}
    <div className="pt-2 text-center text-sm text-muted-foreground">{footer ?? <p>Copyright &copy; 2026 ChurchOS</p>}</div>
  </div>;
}
