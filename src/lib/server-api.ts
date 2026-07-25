import { cookies } from 'next/headers';
import { parseJson, type RequestOptions } from './api';
import type { User } from './types';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';

/** Server-side fetch directly to Express (RSC / route handlers). */
export async function serverApiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = `${SERVER_URL}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? 'no-store',
  });

  return parseJson<T>(response);
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get('accessToken')?.value ?? null;
}

export async function fetchCurrentUserServer(): Promise<User | null> {
  try {
    const token = await getAccessTokenFromCookies();
    if (!token) return null;
    const data = await serverApiFetch<{ user: User }>('/auth/me', { token });
    return data.user;
  } catch {
    return null;
  }
}
