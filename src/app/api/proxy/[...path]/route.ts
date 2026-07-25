import { NextRequest, NextResponse } from 'next/server';
import { isJwtExpired, SESSION_MAX_AGE_SECONDS } from '@/lib/auth-session';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';

/** Paths that do not require an access token on the proxy layer. */
const PUBLIC_API_PATHS = new Set(['auth/login', 'auth/refresh']);

function extractCookieValue(setCookieHeader: string, name: string): string | null {
  const match = setCookieHeader.match(new RegExp(`(?:^|,\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set('accessToken', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('refreshToken', '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set('userRole', '', { path: '/', maxAge: 0 });
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const targetUrl = `${SERVER_URL}/api/v1/${path}${search}`;

  const accessToken =
    req.cookies.get('accessToken')?.value ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null;

  const isPublic = PUBLIC_API_PATHS.has(path);

  // Proxy-level gate: protected APIs require a non-expired access token
  if (!isPublic) {
    if (!accessToken || isJwtExpired(accessToken)) {
      const unauthorized = NextResponse.json(
        { success: false, message: 'Authentication required or session expired' },
        { status: 401 },
      );
      clearAuthCookies(unauthorized);
      return unauthorized;
    }
  }

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  headers.set('accept', 'application/json');

  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  const refreshToken = req.cookies.get('refreshToken')?.value;
  if (refreshToken) {
    headers.append('cookie', `refreshToken=${refreshToken}`);
  }

  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Upstream API unavailable' },
      { status: 502 },
    );
  }

  const responseBody = await upstream.text();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
    },
  });

  // Session expired / unauthorized on backend → clear cookies
  if (upstream.status === 401) {
    clearAuthCookies(response);
    return response;
  }

  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  const joined = setCookies.join(',');

  const nextAccess =
    setCookies.map((c) => extractCookieValue(c, 'accessToken')).find(Boolean) ||
    extractCookieValue(joined, 'accessToken');
  const nextRefresh =
    setCookies.map((c) => extractCookieValue(c, 'refreshToken')).find(Boolean) ||
    extractCookieValue(joined, 'refreshToken');

  const isLogout = path === 'auth/logout' || path.endsWith('/logout');

  if (isLogout) {
    clearAuthCookies(response);
    return response;
  }

  if (nextAccess) {
    response.cookies.set('accessToken', nextAccess, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
  if (nextRefresh) {
    response.cookies.set('refreshToken', nextRefresh, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }

  try {
    const parsed = JSON.parse(responseBody) as {
      success?: boolean;
      data?: { user?: { role?: string } };
    };
    const role = parsed?.data?.user?.role;
    if (role) {
      response.cookies.set('userRole', role, {
        path: '/',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }
  } catch {
    // non-JSON
  }

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(req, path);
}
