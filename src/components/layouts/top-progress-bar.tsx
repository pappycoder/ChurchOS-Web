"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A slim fixed progress bar that briefly appears at the very top of the screen
 * whenever the route changes, giving immediate visual feedback during client
 * navigations. It is intentionally generic (no progress percentage): it shows a
 * short indeterminate shimmer, then fades out, matching the app's primary color.
 */
function TopProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    setVisible(true);
    setTick((t) => t + 1);
    const fadeTimer = setTimeout(() => setVisible(false), 400);
    return () => clearTimeout(fadeTimer);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      key={tick}
      className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-primary/10"
      aria-hidden="true"
    >
      <div className="h-full w-1/3 bg-primary progress-slide" />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  );
}
