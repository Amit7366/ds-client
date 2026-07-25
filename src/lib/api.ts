import type { ApiError, ApiSuccess, User } from './types';
import {
  clearClientAuthCookies,
  emitSessionExpired,
  SESSION_EXPIRED_EVENT,
} from './auth-session';

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  cache?: RequestCache;
  /** Skip session-expiry handling (login / public calls). */
  skipAuthRedirect?: boolean;
};

async function parseJson<T>(response: Response, skipAuthRedirect?: boolean): Promise<T> {
  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiError;
  } catch {
    throw new ApiClientError('Invalid server response', response.status);
  }

  if (response.status === 401 && !skipAuthRedirect) {
    clearClientAuthCookies();
    emitSessionExpired();
  }

  if (!response.ok || !payload.success) {
    const message = 'message' in payload ? payload.message : 'Request failed';
    const details = 'details' in payload ? payload.details : undefined;
    throw new ApiClientError(message, response.status, details);
  }

  return payload.data;
}

/** Browser-side fetch via Next.js proxy route. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `/api/proxy${path.startsWith('/') ? path : `/${path}`}`;
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
    credentials: 'include',
    cache: options.cache ?? 'no-store',
  });

  return parseJson<T>(response, options.skipAuthRedirect);
}

export function dashboardPathForRole(role: User['role']): string {
  return role === 'super_admin' ? '/super-admin' : '/user';
}

export { parseJson, SESSION_EXPIRED_EVENT };
export type { RequestOptions };
