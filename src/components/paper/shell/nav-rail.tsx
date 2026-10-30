"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Command, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonAvatar } from "@/components/paper/primitives";
import { spring } from "@/components/paper/motion/variants";
import type { PaperArea } from "@/lib/paper-nav";
import { useCurrentProfile } from "@/hooks/use-profile";

export function NavRail({
  onOpenSearch,
  areas,
}: {
  onOpenSearch: () => void;
  areas: PaperArea[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const { resolvedTheme, setTheme } = useTheme();
  const [openArea, setOpenArea] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => setOpenArea(null), [pathname]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenArea(null), 160);
  };

  const landingOf = (area: PaperArea) => area.children[0]?.children[0]?.href ?? area.href;
  const activeArea = React.useMemo(() => {
    let best: PaperArea | undefined;
    for (const area of areas)
      for (const mod of area.children)
        for (const leaf of mod.children)
          if (
            (pathname === leaf.href || pathname.startsWith(leaf.href + "/")) &&
            (!best || leaf.href.length > best.href.length)
          )
            best = area;
    return best;
  }, [areas, pathname]);

  const area = areas.find((item) => item.id === openArea);
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "You";

  return (
    <div
      className="fixed left-3 top-1/2 z-50 hidden -translate-y-1/2 md:block"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className="flex items-center gap-2">
        <motion.nav
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.05 }}
          className="glass flex flex-col items-center gap-1 rounded-[22px] border border-line/80 p-2 shadow-lg"
          aria-label="Workspace areas"
        >
          <Link
            href="/home"
            aria-label="Abide home"
            className="mb-1 grid size-9 place-items-center rounded-[14px] bg-ink text-paper"
          >
            <span className="font-display text-[15px] font-semibold leading-none">a</span>
          </Link>

          <div className="my-1 h-px w-6 bg-line" />

          {areas.map((item) => {
            const isActive = activeArea?.id === item.id;
            const isOpen = openArea === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    onMouseEnter={() => setOpenArea(item.id)}
                    onClick={() => {
                      setOpenArea(isOpen ? null : item.id);
                      router.push(landingOf(item));
                    }}
                    className={cn(
                      "group relative grid size-10 place-items-center rounded-[14px] transition-colors duration-200",
                      isActive
                        ? "bg-terracotta-soft text-terracotta"
                        : "text-ink-faint hover:bg-muted hover:text-ink",
                      isOpen && !isActive && "bg-muted text-ink",
                    )}
                  >
                    <item.icon className="size-[18px]" strokeWidth={1.8} />
                    {isActive ? (
                      <motion.span
                        layoutId="dock-active"
                        className="absolute -left-[7px] h-5 w-[3px] rounded-full bg-terracotta"
                        transition={spring}
                      />
                    ) : null}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          <div className="my-1 h-px w-6 bg-line" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search (Command K)"
                className="grid size-10 place-items-center rounded-[14px] text-ink-faint transition-colors hover:bg-muted hover:text-ink"
              >
                <Command className="size-[17px]" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="text-xs">
              Search <kbd className="ml-1 font-mono text-[10px]">⌘K</kbd>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="grid size-10 place-items-center rounded-[14px] text-ink-faint transition-colors hover:bg-muted hover:text-ink"
              >
                {mounted && resolvedTheme === "dark" ? (
                  <Sun className="size-[17px]" strokeWidth={1.8} />
                ) : (
                  <Moon className="size-[17px]" strokeWidth={1.8} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="text-xs">
              Toggle theme
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                aria-label="Your profile"
                className="mt-1 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-105"
              >
                <PersonAvatar name={fullName} src={profile?.avatarUrl} size="sm" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="text-xs">
              {fullName}
            </TooltipContent>
          </Tooltip>
        </motion.nav>

        <AnimatePresence>
          {area ? (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, x: -12, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 268 }}
              exit={{ opacity: 0, x: -12, width: 0 }}
              transition={{ ...spring, damping: 32 }}
              className="overflow-hidden"
            >
              <div className="glass max-h-[70vh] w-[268px] overflow-y-auto rounded-[20px] border border-line/80 p-4 shadow-lg">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="rule-label">{area.label}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{area.blurb}</p>
                  </div>
                  <area.icon className="mt-0.5 size-4 text-ink-faint" />
                </div>

                <div className="space-y-4">
                  {area.children.map((module) => (
                    <div key={module.title} className="space-y-1">
                      <p className="px-1 text-[11px] font-semibold text-ink">{module.title}</p>
                      {module.children.map((leaf) => {
                        const active =
                          pathname === leaf.href || pathname.startsWith(leaf.href + "/");
                        return (
                          <Link
                            key={leaf.href}
                            href={leaf.href}
                            className={cn(
                              "group flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs transition-colors",
                              active
                                ? "bg-terracotta-soft/70 text-terracotta"
                                : "text-ink-soft hover:bg-muted hover:text-ink",
                            )}
                          >
                            <span className="flex-1 truncate">{leaf.title}</span>
                            <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-70" />
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
