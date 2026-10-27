"use client";
import { useSearchParams } from "next/navigation";
/** Native history integrates with App Router and preserves unrelated query parameters. */
export function useUrlQueryState<T extends string = string>(key: string, fallback: T = "" as T, allowed?: readonly T[]) {
 const params = useSearchParams();
 const requested = params.get(key) as T | null;
 const value = requested && (!allowed || allowed.includes(requested)) ? requested : fallback;
 const setValue = (next: T) => {
   const url = new URL(window.location.href);
   if(next) url.searchParams.set(key,next); else url.searchParams.delete(key);
   if (url.href !== window.location.href) window.history.pushState(null,"",url);
 };
 return [value,setValue] as const;
}
