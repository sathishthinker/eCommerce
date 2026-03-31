import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/checkout', '/orders', '/account'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for refresh token cookie (the cookie name should match your Flask backend config)
  const refreshToken =
    request.cookies.get('refresh_token_cookie') ||
    request.cookies.get('refresh_token') ||
    request.cookies.get('session');

  if (!refreshToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/checkout/:path*',
    '/orders/:path*',
    '/account/:path*',
  ],
};
