/** Session lifetime: 2 hours (must match server JWT_ACCESS_EXPIRES). */
export const SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

export type JwtClaims = {
  sub?: string;
  email?: string;
  role?: 'super_admin' | 'user';
  exp?: number;
  iat?: number;
};

/** Decode JWT payload without verifying signature (UX / expiry checks only). */
export function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewSeconds = 5): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return claims.exp <= now + skewSeconds;
}

export function msUntilJwtExpiry(token: string, skewSeconds = 5): number {
  const claims = decodeJwtPayload(token);
  if (!claims?.exp) return 0;
  const ms = claims.exp * 1000 - Date.now() - skewSeconds * 1000;
  return Math.max(0, ms);
}

export function clearClientAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
}

export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

export function emitSessionExpired() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}
