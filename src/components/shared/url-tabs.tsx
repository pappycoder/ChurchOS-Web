"use client";

import { Suspense, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

type UrlTabsProps = Omit<ComponentProps<typeof Tabs>, "value" | "onValueChange"> & {
  defaultValue: string;
  values: string[];
};

function UrlTabsContent({ defaultValue, values, ...props }: UrlTabsProps) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const value = requested && values.includes(requested) ? requested : defaultValue;

  return (
    <Tabs
      {...props}
      value={value}
      onValueChange={(next) => {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", next);
        window.history.pushState(null, "", url);
      }}
    />
  );
}

/** Preserve other query parameters and browser history without remounting drafts. */
export function UrlTabs({ values, ...props }: UrlTabsProps) {
  return (
    <Suspense fallback={<Tabs {...props} />}>
      <UrlTabsContent {...props} values={values} />
    </Suspense>
  );
}
