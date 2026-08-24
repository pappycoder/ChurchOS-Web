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
 * sequentially at the endpoint's cap. Stops when the reported total is
 * reached, a page comes back short/empty, or MAX_EXPORT_ROWS is hit.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PagedBody<T>>,
  options: { perRequest?: number } = {}
): Promise<T[]> {
  const perRequest = options.perRequest ?? 200;
  const out: T[] = [];
  let page = 1;
  let total = Infinity;

  while (out.length < Math.min(total, MAX_EXPORT_ROWS)) {
    const body = await fetchPage(page);
    const rows = body?.data ?? [];
    total =
      typeof body?.meta?.total === "number"
        ? body.meta.total
        : typeof body?.total === "number"
          ? body.total
          : out.length + rows.length;

    out.push(...rows);

    // Short or empty page means we've reached the end even if the count lied.
    if (rows.length < perRequest || rows.length === 0) break;
    page += 1;
  }

  return out.slice(0, MAX_EXPORT_ROWS);
}
