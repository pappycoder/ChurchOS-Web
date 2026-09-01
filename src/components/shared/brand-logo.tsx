"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const CHURCHOS_NAME = "ChurchOS";

// Transparent, background-keyed derivatives of the official brand PNGs
// (masters in public/brand/churchos-{logo,logoname-light,logoname-dark}.png).
// Naming defaults matching the designer's palette:
//   - EMBLEM_SRC      : navy emblem alone (variant="mark")
//   - LOCKUP_NAVY     : navy emblem + wordmark, for light surfaces (tone="default")
//   - LOCKUP_LIGHT    : light emblem + wordmark, for dark surfaces (tone="light")
const EMBLEM_SRC = "/brand/churchos-emblem.png";
const LOCKUP_NAVY = "/brand/churchos-lockup-navy.png";
const LOCKUP_LIGHT = "/brand/churchos-lockup-light.png";

interface BrandLogoProps {
  variant?: "full" | "mark";
  /** "light" uses the light-on-dark lockup (light surfaces default / dark surfaces light). */
  tone?: "default" | "light";
  className?: string;
  /** Size hook. For "mark": square (`h-8 w-8`). For "full" lockup: a height class (`h-8`); width is auto. */
  emblemClassName?: string;
  /**
   * Retained for API compatibility. The lockup PNG bakes the wordmark in, so
   * this has no visual effect on a full lockup; it only matters if you later
   * switch to a wordmark-rendered variant.
   */
  wordmarkClassName?: string;
}

/**
 * Single source of truth for the ChurchOS brand. Renders the official
 * transparent lockup / emblem PNGs so the brand sits cleanly on any surface.
 */
export function BrandLogo({
  variant = "full",
  tone = "default",
  className,
  emblemClassName,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <span className={cn("inline-flex items-center select-none", className)}>
        <Image
          src={EMBLEM_SRC}
          alt={CHURCHOS_NAME}
          width={512}
          height={512}
          className={cn("h-14 w-14 shrink-0", emblemClassName)}
        />
      </span>
    );
  }

  const src = tone === "light" ? LOCKUP_LIGHT : LOCKUP_NAVY;
  return (
    <span className={cn("inline-flex items-center select-none", className)}>
      <Image
        src={src}
        alt={CHURCHOS_NAME}
        width={932}
        height={512}
        className={cn("h-14 w-auto shrink-0", emblemClassName)}
      />
    </span>
  );
}
