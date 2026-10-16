"use client";

import * as React from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { checkRule, matchRoutePermission } from "@/lib/route-permissions";

/** Dashboard cross-links use the destination's gate, including read-only grants. */
export function PermissionLink(props: ComponentProps<typeof Link>) {
  const { ready, canAny } = usePermissions();
  const pathname = typeof props.href === "string" ? props.href.split(/[?#]/)[0] : props.href.pathname;
  if (pathname?.startsWith("/") && !pathname.startsWith("//")) {
    if (!ready || !checkRule(matchRoutePermission(pathname), canAny)) return null;
  }
  return <Link {...props} />;
}
