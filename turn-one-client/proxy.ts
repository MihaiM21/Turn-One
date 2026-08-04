import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};