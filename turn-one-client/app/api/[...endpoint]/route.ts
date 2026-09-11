import { NextRequest, NextResponse } from 'next/server';
import { authorizeProxyRequest } from '@/lib/server/proxy-auth';
import { classify, cacheControlFor, NO_STORE } from '@/lib/cache/f1-freshness';
import { messageForStatus, sanitizeErrorMessage } from '@/lib/api-error-message';

/** Upstream can be slow preparing a session; beyond this it is hung, not slow. */
const UPSTREAM_TIMEOUT_MS = 20_000;

const getContentType = (response: Response) => response.headers.get('content-type') || '';

/** True for the abort raised when the upstream request exceeds its timeout. */
const isTimeout = (error: unknown) =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

const parseErrorMessage = async (response: Response, fallback: string) => {
  const contentType = getContentType(response);

  if (contentType.includes('application/json')) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.error;
    return message ? sanitizeErrorMessage(message, response.status) : fallback;
  }

  const text = await response.text().catch(() => '');
  return text ? sanitizeErrorMessage(text, response.status) : fallback;
};

// Like parseErrorMessage, but preserves the full structured error body (e.g.
// { error: "data_not_available", detail, retry_after_seconds }) instead of
// flattening it to a single string, so the client can distinguish transient
// "not ready yet" states from real failures.
const parseErrorBody = async (response: Response, fallback: string) => {
  const contentType = getContentType(response);

  if (contentType.includes('application/json')) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
      // Keep the structured shape (error code, retry_after_seconds) but make
      // sure any human-facing text is fit to display.
      const body = errorData as Record<string, unknown>;
      if (typeof body.detail === 'string') {
        body.detail = sanitizeErrorMessage(body.detail, response.status);
      }
      return body;
    }
  } else {
    // A non-JSON body here is an infrastructure error page, not an API
    // response — Cloudflare serves its 502 page as text/plain. Never forward
    // it; describe the status instead.
    await response.text().catch(() => '');
    return { error: 'upstream_unavailable', detail: messageForStatus(response.status) };
  }

  return { error: fallback };
};

/**
 * Builds response headers, choosing a cache lifetime from the request's
 * freshness tier (see lib/cache/f1-freshness.ts). A finished session's data is
 * immutable and can be cached hard; live data cannot.
 *
 * Note this runs server-side, where the session-start registry the classifier
 * consults is empty — so a *current-season* session can only ever be graded
 * `live` or `unknown` here, never `finished`. That is deliberate: the only way
 * to do better would be to trust a client-supplied freshness hint, which would
 * let one client poison a shared cache for everyone. The browser-side cache,
 * which does know session times, picks up the slack for the current season.
 */
const buildProxyResponseHeaders = (response: Response, cacheControl: string) => {
  const proxiedHeaders = new Headers();
  const contentType = response.headers.get('content-type');

  if (contentType) {
    proxiedHeaders.set('Content-Type', contentType);
  }

  proxiedHeaders.set('Cache-Control', cacheControl);

  return proxiedHeaders;
};

/**
 * Upstream sometimes reports failure as a 200 whose body carries an error
 * sentinel rather than a failure status. Caching one of those would pin an
 * error in front of every visitor for as long as the tier allows — days, for a
 * finished session — so such responses are never cached, whatever the tier.
 */
const hasEmbeddedError = (data: unknown): boolean => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  if (record.error) return true;
  if (typeof record.detail === 'string') return true;
  return typeof record.message === 'string' && record.message.toLowerCase().includes('error');
};

/**
 * External API Proxy Handler
 * 
 * This is a secure proxy that:
 * 1. Accepts requests from the frontend
 * 2. Adds the X-API-Key header server-side (never exposed to browser)
 * 3. Forwards the request to the external API
 * 4. Returns the response to the frontend
 * 
 * Usage: GET /api/[...endpoint]?queryParams
 * Example: /api/top-speed-data?year=2025&gp=1&session=Qualifying
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    // Closes what was previously a fully open, keyed relay to the upstream F1
    // API: every request must carry either a valid backend JWT or a valid
    // signed anon cookie (planted by proxy.ts on first visit). This proves a
    // real client hit the site first.
    const auth = await authorizeProxyRequest(request);
    if (auth.mode === 'deny') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;

    // Get the API configuration from environment variables
    const EXTERNAL_API_URL = process.env.F1_API_URL;
    const EXTERNAL_API_KEY = process.env.F1_API_KEY;

    // Validate environment variables
    if (!EXTERNAL_API_URL || !EXTERNAL_API_KEY) {
      console.error('Missing external API configuration in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Reconstruct the endpoint path
    const endpoint = resolvedParams.endpoint.join('/');
    
    // Get query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Build the full API URL
    const apiUrl = `${EXTERNAL_API_URL}/${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[External API Proxy] Forwarding request to: ${endpoint}`);

    // Forward the request to the external API with authentication.
    // cache: 'no-store' is deliberate here — Next's fetch Data Cache will
    // keep serving a stale successful response if a later revalidation
    // fails/errors, which silently masked "session finished but upstream
    // hasn't published data yet" errors behind old cached data. Any caching
    // we want happens transparently via the Cache-Control response header
    // below instead.
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': EXTERNAL_API_KEY,
        'Accept': '*/*',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    // Check if the API request was successful
    if (!response.ok) {
      console.error(`[External API Proxy] API request failed with status ${response.status}`);

      // Try to get error details from the API response, preserving the full
      // structured body (e.g. retry_after_seconds) rather than flattening it.
      const errorBody = await parseErrorBody(
        response,
        `External API request failed with status ${response.status}`
      );

      return NextResponse.json(
        errorBody,
        { status: response.status, headers: { 'Cache-Control': NO_STORE } }
      );
    }

    // Return JSON as JSON, and forward binary/text payloads without parsing.
    const contentType = getContentType(response);
    const cacheControl = cacheControlFor(
      classify(`${endpoint}${queryString ? `?${queryString}` : ''}`)
    );

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: buildProxyResponseHeaders(
          response,
          hasEmbeddedError(data) ? NO_STORE : cacheControl
        ),
      });
    }

    // Binary payloads (rendered plot PNGs) are the most expensive thing
    // upstream produces and are immutable once a session ends, so they get the
    // same tiered treatment.
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: buildProxyResponseHeaders(response, cacheControl),
    });

  } catch (error) {
    // A hung upstream fetch ties up this handler for every caller, not just the
    // browser tab that triggered it, so surface it as a gateway timeout.
    if (isTimeout(error)) {
      console.error('[External API Proxy] Upstream timed out');
      return NextResponse.json(
        { error: 'upstream_timeout', detail: 'The F1 data service did not respond in time.' },
        { status: 504, headers: { 'Cache-Control': NO_STORE } }
      );
    }

    console.error('[External API Proxy] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: { 'Cache-Control': NO_STORE } }
    );
  }
}

// Optional: Support POST requests if needed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
    const auth = await authorizeProxyRequest(request);
    if (auth.mode === 'deny') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;

    const EXTERNAL_API_URL = process.env.F1_API_URL;
    const EXTERNAL_API_KEY = process.env.F1_API_KEY;

    if (!EXTERNAL_API_URL || !EXTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const endpoint = resolvedParams.endpoint.join('/');
    const body = await request.json();
    
    const apiUrl = `${EXTERNAL_API_URL}/${endpoint}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': EXTERNAL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'External API request failed');
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status, headers: { 'Cache-Control': NO_STORE } }
      );
    }

    const data = await response.json();
    // POSTs are mutations; never cacheable.
    return NextResponse.json(data, { headers: { 'Cache-Control': NO_STORE } });

  } catch (error) {
    if (isTimeout(error)) {
      console.error('[External API Proxy] POST upstream timed out');
      return NextResponse.json(
        { error: 'upstream_timeout', detail: 'The F1 data service did not respond in time.' },
        { status: 504, headers: { 'Cache-Control': NO_STORE } }
      );
    }

    console.error('[External API Proxy] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500, headers: { 'Cache-Control': NO_STORE } }
    );
  }
}
