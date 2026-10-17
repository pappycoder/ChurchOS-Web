import { BrandLogo } from "@/components/shared/brand-logo";
import { ColorModeToggle } from "@/components/shared/color-mode-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative grid min-h-svh lg:grid-cols-2">
    <aside className="relative hidden flex-col justify-between border-e bg-muted p-10 lg:flex">
      <div className="flex items-center gap-3 text-lg font-medium"><BrandLogo variant="mark" emblemClassName="size-9 dark:brightness-0 dark:invert" />ChurchOS</div>
      <div className="max-w-lg space-y-4"><h1 className="text-3xl font-semibold tracking-tight">A connected church starts here.</h1><p className="text-lg leading-relaxed text-muted-foreground">Care for your community, coordinate your ministries, and understand your church’s growth in one workspace.</p></div>
      <p className="text-sm text-muted-foreground">Members. Ministry. Community.</p>
    </aside>
    <div className="absolute end-4 top-4 z-10"><ColorModeToggle /></div>
    <main className="flex min-w-0 items-center justify-center px-6 py-12 sm:px-8"><div className="w-full max-w-sm">{children}</div></main>
  </div>;
}
