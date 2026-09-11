// Server-only fetcher for the news page (app/(site)/news), a Server Component
// with no request-scoped cookies/JWT. Calls F1_API_URL directly with the API
// key, bypassing app/api/[...endpoint]'s browser-facing proxy and its
// cookie/anon-cookie auth gate entirely — that gate can never be satisfied
// during a background ISR revalidation, and a relative fetch URL (the proxy
// path used by the client-side fetcher in lib/data-fetcher.ts) can't be
// resolved by Node's fetch on the server anyway. Mirrors lib/plots/server-fetch.ts.
import { ExternalApiError } from "@/lib/data-fetcher";
import { cachedFetchJson } from "@/lib/cache/request-cache";

export async function serverFetchFromExternalAPI(endpoint: string): Promise<unknown> {
  const base = process.env.F1_API_URL;
  if (!base) throw new Error("F1_API_URL is not configured");

  // Cache lifetime comes from the request's freshness tier rather than a flat
  // TTL: standings and reference data stay valid for a day, a finished
  // session's data never changes at all, and only the live dashboard needs
  // constant refetching. Previously every one of the page's ~11 upstream calls
  // was repeated on each revalidation.
  //
  // This deliberately reuses the same cache as the browser rather than Next's
  // fetch Data Cache. That cache stores whatever a fetch returns, which is what
  // once let a stale success mask a fresh "session not published yet" error
  // (see the comment in app/api/[...endpoint]/route.ts). Caching here happens
  // *after* parsing instead, so only genuine successes are ever stored — an
  // error simply throws and nothing is written. Server-side it is an in-memory
  // cache holding public F1 data shared by every visitor, which is exactly what
  // we want; nothing user-specific passes through this fetcher.
  return cachedFetchJson(
    `${base.replace(/\/$/, "")}/${endpoint}`,
    {
      headers: { "X-API-Key": process.env.F1_API_KEY ?? "" },
      timeoutMs: 20_000,
    },
    async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.detail ||
          errorData.error ||
          errorData.message ||
          `External API request failed with status ${response.status}`;
        throw new ExternalApiError(message, response.status, errorData.error, errorData.retry_after_seconds);
      }

      const data = await response.json();

      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.error) throw new ExternalApiError(data.detail || data.error, response.status, data.error, data.retry_after_seconds);
        if (data.detail && typeof data.detail === "string") throw new ExternalApiError(data.detail, response.status);
        if (data.message && typeof data.message === "string" && data.message.toLowerCase().includes("error")) {
          throw new ExternalApiError(data.message, response.status);
        }
      }

      return data;
    },
  );
}

