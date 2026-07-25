import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtPayload, isJwtExpired } from '@/lib/auth-session';

const PUBLIC_PATHS = ['/login'];

function clearAuthAndRedirect(request: NextRequest, reason: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('reason', reason);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set('accessToken', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('userRole', '', { path: '/', maxAge: 0 });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;
  const roleCookie = request.cookies.get('userRole')?.value;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Expired / invalid token → force re-login
  if (accessToken && isJwtExpired(accessToken)) {
    if (isPublic) {
      const response = NextResponse.next();
      response.cookies.set('accessToken', '', { httpOnly: true, path: '/', maxAge: 0 });
      response.cookies.set('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 });
      response.cookies.set('userRole', '', { path: '/', maxAge: 0 });
      return response;
    }
    return clearAuthAndRedirect(request, 'expired');
  }

  const claims = accessToken ? decodeJwtPayload(accessToken) : null;
  const role = claims?.role || roleCookie;

  // Cross-check role cookie vs JWT claim when both present
  if (accessToken && claims?.role && roleCookie && claims.role !== roleCookie) {
    return clearAuthAndRedirect(request, 'invalid');
  }

  if (pathname === '/') {
    if (!accessToken || !role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const dest = role === 'super_admin' ? '/super-admin' : '/user';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isPublic) {
    // Logged-in users must never stay on /login
    if (accessToken && !isJwtExpired(accessToken)) {
      const destRole = claims?.role || roleCookie;
      if (destRole === 'super_admin' || destRole === 'user') {
        const dest = destRole === 'super_admin' ? '/super-admin' : '/user';
        return NextResponse.redirect(new URL(dest, request.url));
      }
      // Valid token but role unknown — send to root for role resolution
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // All post-login routes require a valid token
  if (!accessToken || !role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    loginUrl.searchParams.set('reason', 'auth');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/super-admin')) {
    if (role !== 'super_admin') {
      // Non–super-admin must not access admin UI
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  if (pathname.startsWith('/user')) {
    if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
    if (role !== 'user') {
      return clearAuthAndRedirect(request, 'invalid');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/super-admin/:path*', '/user/:path*'],
};
