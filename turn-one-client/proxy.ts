import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ANON_COOKIE_NAME, newAnonId, signAnonCookie, verifyAnonCookie } from './lib/server/anon-cookie';

export async function proxy(request: NextRequest) {
  // Admin pages can't be gated here: the login token lives in localStorage, so a page
  // navigation carries no credential. Every admin API is enforced by the backend
  // ([Authorize(Roles = "ADMIN")]); the pages themselves are just kept out of search engines.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  const response = NextResponse.next();

  // Plant the anonymous identity cookie site-wide so it exists before a
  // visitor's first request. This is what authorizeProxyRequest (see
  // lib/server/proxy-auth.ts) checks to keep the external F1 API proxy from
  // being a fully open relay — identity, not feature permission.
  //
  // A cookie can be present but no longer valid (ANON_COOKIE_SECRET rotated,
  // or it was signed under the pre-rotation dev fallback secret) — that isn't
  // distinguishable from "missing" to the visitor, so it's re-issued the same
  // way. Without this check, returning visitors with a stale cookie get stuck
  // failing authorizeProxyRequest forever, since the middleware never looks
  // past "a value exists" to plant a fresh one.
  const existing = request.cookies.get(ANON_COOKIE_NAME)?.value;
  const validExisting = existing ? await verifyAnonCookie(existing) : null;
  if (!validExisting) {
    const anonId = newAnonId();
    const signed = await signAnonCookie(anonId);
    response.cookies.set(ANON_COOKIE_NAME, signed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  return response;
}

export const config = {
  // /f1 is public, fully cacheable SEO content and never calls the F1 API proxy, so it
  // is left out: a Set-Cookie on every response makes it uncacheable at the CDN.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health|f1/|f1$).*)'],
};