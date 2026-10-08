"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="max-w-md w-full rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          An unexpected error occurred. We&#39;ve been notified and are looking into
          it. Please try again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
