import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ANON_COOKIE_NAME, newAnonId, signAnonCookie } from './lib/server/anon-cookie';

export async function proxy(request: NextRequest) {
  // Check if the user is trying to access an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // For now, we'll rely on client-side checks
    // In production, you'd want to verify the JWT token server-side
    const token = request.cookies.get('token')?.value ||
                 request.headers.get('authorization') ||
                 request.headers.get('x-token');

    // if (!token) {
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }

    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Plant the anonymous identity cookie site-wide so it exists before a
  // visitor's first request. This is what authorizeProxyRequest (see
  // lib/server/proxy-auth.ts) checks to keep the external F1 API proxy from
  // being a fully open relay — identity, not feature permission.
  if (!request.cookies.get(ANON_COOKIE_NAME)?.value) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};