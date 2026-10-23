"use client";

/**
 * Hard ceiling for client-side "export everything" loops so a runaway
 * total can never spin requests forever.
 */
export const MAX_EXPORT_ROWS = 5000;

interface PagedBody<T> {
  data: T[];
  meta?: { total: number };
  total?: number;
}

/**
 * Serializes list-query params the same way every list hook does
 * (skips undefined/null/empty, stringifies the rest).
 */
export function listUrl(
  base: string,
  params: Record<string, unknown> = {}
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return `${base}${qs ? `?${qs}` : ""}`;
}

/**
 * Fetches EVERY row behind a paginated list endpoint by walking pages
 * sequentially at the endpoint's cap. Uses the reported total or an empty final page; refuses incomplete or oversized exports.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PagedBody<T>>,
  options: { perRequest?: number } = {}
): Promise<T[]> {
  const out: T[] = [];
  let page = 1;
  let previousPage: string | undefined;
  while (out.length <= MAX_EXPORT_ROWS) {
    const body = await fetchPage(page);
    if (!body || !Array.isArray(body.data)) throw new Error("The export returned an invalid page. Please retry.");
    const rows = body.data;
    const total = body.meta?.total ?? body.total;
    if (typeof total === "number" && total > MAX_EXPORT_ROWS)
      throw new Error(`More than ${MAX_EXPORT_ROWS.toLocaleString()} records match. Narrow your filters before exporting.`);
    if (rows.length === 0) {
      if (typeof total === "number" && out.length < total)
        throw new Error("Some export records could not be loaded. Please retry.");
      return out;
    }
    const fingerprint = JSON.stringify(rows);
    if (fingerprint === previousPage) throw new Error("The export repeated a page. Please retry.");
    previousPage = fingerprint;
    if (out.length + rows.length > MAX_EXPORT_ROWS)
      throw new Error(`More than ${MAX_EXPORT_ROWS.toLocaleString()} records match. Narrow your filters before exporting.`);
    out.push(...rows);
    if (typeof total === "number" && out.length >= total) return out;
    // A server may cap requests below the requested page size. Trust its total,
    // or keep paging until empty when it does not provide one.
    if (total === undefined && options.perRequest && rows.length < options.perRequest) return out;
    page += 1;
  }
  throw new Error("Narrow your filters before exporting.");
}
