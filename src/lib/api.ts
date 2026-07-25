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

/** Turn API / network errors into a user-facing string (incl. Zod field details). */
export function formatApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiClientError) {
    const fromDetails = formatErrorDetails(err.details);
    if (fromDetails) {
      return err.message && err.message !== 'Validation failed'
        ? `${err.message}: ${fromDetails}`
        : fromDetails;
    }
    if (err.message?.trim()) return err.message;
    if (err.status === 401) return 'Invalid email or password';
    if (err.status === 403) return 'Access denied. Your account may be paused.';
    if (err.status === 429) return 'Too many attempts. Please try again later.';
    if (err.status >= 500) return 'Server error. Please try again shortly.';
    return fallback;
  }

  if (err instanceof TypeError) {
    return 'Unable to reach the server. Check your connection and try again.';
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return fallback;
}

function formatErrorDetails(details: unknown): string | null {
  if (!details) return null;

  if (typeof details === 'string' && details.trim()) {
    return details;
  }

  if (Array.isArray(details)) {
    const parts = details
      .map((item) => (typeof item === 'string' ? item : null))
      .filter(Boolean) as string[];
    return parts.length ? parts.join('. ') : null;
  }

  if (typeof details === 'object') {
    const entries = Object.entries(details as Record<string, unknown>);
    const parts: string[] = [];
    for (const [field, value] of entries) {
      if (Array.isArray(value) && value.length) {
        parts.push(`${field}: ${value.map(String).join(', ')}`);
      } else if (typeof value === 'string' && value.trim()) {
        parts.push(`${field}: ${value}`);
      }
    }
    return parts.length ? parts.join('. ') : null;
  }

  return null;
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
  const raw = await response.text();
  let payload: (ApiSuccess<T> | ApiError) | null = null;

  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
    } catch {
      throw new ApiClientError(
        response.status >= 500
          ? 'Server error. Please try again shortly.'
          : 'Invalid server response',
        response.status,
      );
    }
  }

  if (response.status === 401 && !skipAuthRedirect) {
    clearClientAuthCookies();
    emitSessionExpired();
  }

  if (!response.ok || !payload || !('success' in payload) || !payload.success) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? typeof payload.message === 'string'
          ? payload.message
          : 'Request failed'
        : response.status === 401
          ? 'Invalid email or password'
          : response.status === 429
            ? 'Too many attempts. Please try again later.'
            : response.statusText || 'Request failed';

    const details =
      payload && typeof payload === 'object' && 'details' in payload
        ? payload.details
        : undefined;

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
