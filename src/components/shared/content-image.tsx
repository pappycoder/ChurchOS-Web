"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"img">, "src" | "onError" | "onLoad"> & { src: string; alt: string };
/** Stable dimensions, lazy delivery and a shared accessible fallback for content images. */
export function ContentImage({ src, alt, className, width = 1200, height = 1200, loading = "lazy", ...props }: Props) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => { setFailed(false); setLoaded(false); }, [src]);
  const local = src.startsWith("/") && !src.startsWith("//");
  const publicStorage = /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src);
  const optimizable = publicStorage || (local && !src.startsWith("/api/") && !src.endsWith(".svg"));
  if (failed || !src) return <span role="img" aria-label={`${alt}: image unavailable`} className={cn("inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground", className)}><ImageOff className="size-6" aria-hidden="true" /></span>;
  return <Image {...props} src={src} alt={alt} width={Number(width)} height={Number(height)} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading={loading} unoptimized={!optimizable} onError={() => setFailed(true)} onLoad={() => setLoaded(true)} className={cn(!loaded && "animate-pulse bg-muted motion-reduce:animate-none", className)} />;
}
