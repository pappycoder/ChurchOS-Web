"use client";
import { useCallback } from "react";
/** Data loads when a page mounts or a user explicitly refreshes it. */
export function usePrefetchRoute() { return useCallback((href?: string) => { void href; }, []); }
