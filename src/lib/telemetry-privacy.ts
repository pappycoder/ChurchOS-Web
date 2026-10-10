import type { Event } from "@sentry/nextjs";

/** Apply the same request-data policy to browser, server and edge telemetry. */
export function redactTelemetry<T extends Event>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.headers;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }
  if (event.user) event.user = { id: event.user.id };
  delete event.extra;
  if (event.transaction) event.transaction = event.transaction.split("?")[0];
  event.breadcrumbs = event.breadcrumbs?.filter((entry) => !entry.category?.startsWith("ui.") && !/auth|forms\/public/.test(String(entry.data?.url ?? ""))).map((entry) => ({ ...entry, data: entry.data?.url ? { url: String(entry.data.url).split("?")[0] } : undefined }));
  for (const span of event.spans ?? []) {
    span.data = {};
    if (span.description) span.description = span.description.split("?")[0];
  }
  return event;
}
