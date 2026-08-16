'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch, dashboardPathForRole, SESSION_EXPIRED_EVENT } from '@/lib/api';
import {
  clearClientAuthCookies,
  msUntilJwtExpiry,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth-session';
import type { AuthPayload, User } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  loggingOut: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: (reason?: 'manual' | 'expired' | 'password') => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setClientRoleCookie(role: User['role'] | null) {
  if (role) {
    document.cookie = `userRole=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = 'userRole=; path=/; max-age=0; SameSite=Lax';
  }
}

function readAccessTokenFromDocument(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  // httpOnly access token is not readable from JS — expiry is tracked via login response + /auth/me polling
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [loggingOut, setLoggingOut] = useState(false);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(
    async (reason: 'manual' | 'expired' | 'password' = 'manual') => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      setLoggingOut(true);
      clearExpiryTimer();
      try {
        await apiFetch('/auth/logout', { method: 'POST', skipAuthRedirect: true });
      } catch {
        // ignore — still clear local session
      }
      setUser(null);
      setClientRoleCookie(null);
      clearClientAuthCookies();
      const query =
        reason === 'expired'
          ? '?reason=expired'
          : reason === 'password'
            ? '?reason=password'
            : '';
      router.replace(`/login${query}`);
      router.refresh();
      loggingOutRef.current = false;
    },
    [router, clearExpiryTimer],
  );

  const scheduleSessionExpiry = useCallback(
    (token?: string | null) => {
      clearExpiryTimer();
      // Prefer JWT exp when readable; otherwise fall back to full 2h window from now
      let delay = SESSION_MAX_AGE_SECONDS * 1000;
      if (token) {
        delay = msUntilJwtExpiry(token);
      }
      if (delay <= 0) {
        void logout('expired');
        return;
      }
      expiryTimerRef.current = setTimeout(() => {
        void logout('expired');
      }, delay);
    },
    [clearExpiryTimer, logout],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User }>('/auth/me', { skipAuthRedirect: true });
      setUser(data.user);
      setClientRoleCookie(data.user.role);
      scheduleSessionExpiry(readAccessTokenFromDocument());
    } catch {
      setUser(null);
      setClientRoleCookie(null);
      clearClientAuthCookies();
      clearExpiryTimer();
    } finally {
      setLoading(false);
    }
  }, [scheduleSessionExpiry, clearExpiryTimer]);

  useEffect(() => {
    if (!initialUser) {
      void refreshUser();
    } else {
      setClientRoleCookie(initialUser.role);
      scheduleSessionExpiry(readAccessTokenFromDocument());
      setLoading(false);
    }
    return () => clearExpiryTimer();
  }, [initialUser, refreshUser, scheduleSessionExpiry, clearExpiryTimer]);

  // Global handler when any API returns 401
  useEffect(() => {
    const onExpired = () => {
      if (pathname?.startsWith('/login')) return;
      void logout('expired');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout, pathname]);

  // Periodic session validation (every 60s) while logged in
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      void (async () => {
        try {
          await apiFetch<{ user: User }>('/auth/me', { skipAuthRedirect: true });
        } catch {
          void logout('expired');
        }
      })();
    }, 60_000);
    return () => clearInterval(id);
  }, [user, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthPayload>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthRedirect: true,
      });
      setUser(data.user);
      setClientRoleCookie(data.user.role);
      scheduleSessionExpiry(data.accessToken);
      router.replace(dashboardPathForRole(data.user.role));
      router.refresh();
      return data.user;
    },
    [router, scheduleSessionExpiry],
  );

  const value = useMemo(
    () => ({ user, loading, loggingOut, login, logout, refreshUser, setUser }),
    [user, loading, loggingOut, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
