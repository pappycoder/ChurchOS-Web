"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function maskDsn(dsn: string | undefined | null): string {
  if (!dsn) return "not set";
  try {
    const url = new URL(dsn);
    const project = url.pathname.split("/").pop();
    return `https://${url.hostname}/${project}`;
  } catch {
    return "set (masked)";
  }
}

function RenderErrorChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test render error (triggered from /debug/sentry)");
  }
  return null;
}

export default function SentryDebugPage() {
  const [clientActive, setClientActive] = React.useState<boolean | null>(null);
  const [dsnMasked, setDsnMasked] = React.useState<string>("checking...");
  const [env, setEnv] = React.useState<string>("checking...");
  const [vercelEnv, setVercelEnv] = React.useState<string>("not set");
  const [nodeEnv, setNodeEnv] = React.useState<string>("not set");
  const [nextPublicDebug, setNextPublicDebug] = React.useState<string>("not set");
  const [shouldThrow, setShouldThrow] = React.useState(false);
  const [lastEventId, setLastEventId] = React.useState<string | null>(null);
  const [serverResult, setServerResult] = React.useState<{
    status: number;
    ok: boolean;
    body: string;
  } | null>(null);
  const [loadingServer, setLoadingServer] = React.useState(false);

  React.useEffect(() => {
    try {
      const client = Sentry.getClient();
      setClientActive(!!client);
      const options = client?.getOptions();
      setDsnMasked(maskDsn(options?.dsn as string | undefined));
    } catch {
      setClientActive(false);
    }
    setEnv(
      (process.env.NEXT_PUBLIC_VERCEL_ENV ||
        process.env.NODE_ENV ||
        "unknown") as string
    );
    setVercelEnv(
      (process.env.NEXT_PUBLIC_VERCEL_ENV as string | undefined) || "not set"
    );
    setNodeEnv((process.env.NODE_ENV as string | undefined) || "not set");
    setNextPublicDebug(
      (process.env.NEXT_PUBLIC_SENTRY_DEBUG as string | undefined) || "not set"
    );
  }, []);

  const handleCaptureMessage = React.useCallback(async () => {
    const eventId = Sentry.captureMessage("Test message from /debug/sentry", "info");
    setLastEventId(eventId);
  }, []);

  const handleCaptureException = React.useCallback(async () => {
    try {
      throw new Error("Test exception from /debug/sentry (manual capture)");
    } catch (e) {
      const eventId = Sentry.captureException(e);
      setLastEventId(eventId);
    }
  }, []);

  const handleTriggerRenderError = React.useCallback(async () => {
    setShouldThrow(true);
  }, []);

  const handleTestServer = React.useCallback(async () => {
    setLoadingServer(true);
    setServerResult(null);
    try {
      const res = await fetch("/api/sentry-test");
      const text = await res.text();
      setServerResult({ status: res.status, ok: res.ok, body: text });
    } catch (e) {
      const eventId = Sentry.captureException(e);
      setLastEventId(eventId);
      setServerResult({
        status: 0,
        ok: false,
        body: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoadingServer(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>Sentry Diagnostics</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Client SDK</div>
                {clientActive === null ? (
                  <Skeleton className="h-5 w-16" />
                ) : clientActive ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertTriangle className="mr-1 h-3 w-3" /> Inactive
                  </Badge>
                )}
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>DSN (effective, masked): {dsnMasked}</div>
                <div>NODE_ENV: {nodeEnv}</div>
                <div>NEXT_PUBLIC_VERCEL_ENV: {vercelEnv}</div>
                <div>Environment (resolved): {env}</div>
                <div>NEXT_PUBLIC_SENTRY_DEBUG: {nextPublicDebug}</div>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Last event ID</div>
              <div className="mt-2 text-xs text-muted-foreground break-all">
                {lastEventId ?? "none"}
              </div>
              {serverResult && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <div className="font-medium">Server test</div>
                  <div>Status: {serverResult.status}</div>
                  <div>OK: {String(serverResult.ok)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <Button size="sm" onClick={handleCaptureMessage}>
              Capture test message
            </Button>
            <Button size="sm" onClick={handleCaptureException}>
              Capture test exception
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleTriggerRenderError}
            >
              Trigger render error
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestServer}
              disabled={loadingServer}
            >
              {loadingServer ? "Testing..." : "Test server route"}
            </Button>
          </div>

          <RenderErrorChild shouldThrow={shouldThrow} />
        </CardContent>
      </Card>
    </div>
  );
}
