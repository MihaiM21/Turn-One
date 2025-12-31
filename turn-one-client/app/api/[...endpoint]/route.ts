import { NextRequest, NextResponse } from 'next/server';

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
  { params }: { params: { endpoint: string[] } }
) {
  try {
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
    const endpoint = params.endpoint.join('/');
    
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
        'Content-Type': 'application/json',
      },
      // Optional: Add cache control
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    // Check if the API request was successful
    if (!response.ok) {
      console.error(`[External API Proxy] API request failed with status ${response.status}`);
      
      // Try to get error details from the API response
      let errorMessage = `External API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the default message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Parse and return the successful response
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
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
  { params }: { params: { endpoint: string[] } }
) {
  try {
    const EXTERNAL_API_URL = process.env.F1_API_URL;
    const EXTERNAL_API_KEY = process.env.F1_API_KEY;

    if (!EXTERNAL_API_URL || !EXTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const endpoint = params.endpoint.join('/');
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
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'External API request failed' },
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
