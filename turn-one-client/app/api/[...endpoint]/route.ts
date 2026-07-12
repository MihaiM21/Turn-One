import { NextRequest, NextResponse } from 'next/server';

const getContentType = (response: Response) => response.headers.get('content-type') || '';

const parseErrorMessage = async (response: Response, fallback: string) => {
  const contentType = getContentType(response);

  if (contentType.includes('application/json')) {
    const errorData = await response.json().catch(() => ({}));
    return errorData.message || errorData.error || fallback;
  }

  const text = await response.text().catch(() => '');
  return text || fallback;
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
      return errorData as Record<string, unknown>;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text) return { error: text };
  }

  return { error: fallback };
};

const buildProxyResponseHeaders = (response: Response) => {
  const proxiedHeaders = new Headers();
  const contentType = response.headers.get('content-type');

  if (contentType) {
    proxiedHeaders.set('Content-Type', contentType);
  }

  // Keep existing cache behavior for proxy responses.
  proxiedHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  return proxiedHeaders;
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

    // Forward the request to the external API with authentication
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': EXTERNAL_API_KEY,
        'Accept': '*/*',
      },
      // Optional: Add cache control
      next: { revalidate: 60 }, // Cache for 60 seconds
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
        { status: response.status }
      );
    }

    // Return JSON as JSON, and forward binary/text payloads without parsing.
    const contentType = getContentType(response);
    const proxyHeaders = buildProxyResponseHeaders(response);

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: proxyHeaders,
      });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: response.status,
      headers: proxyHeaders,
    });

  } catch (error) {
    console.error('[External API Proxy] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: Support POST requests if needed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  try {
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
    });

    if (!response.ok) {
      const errorMessage = await parseErrorMessage(response, 'External API request failed');
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('[External API Proxy] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
