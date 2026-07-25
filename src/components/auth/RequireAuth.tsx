'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { UserRole } from '@/lib/types';
import { dashboardPathForRole } from '@/lib/api';

type Props = {
  allowedRoles: UserRole[];
  children: React.ReactNode;
};

/**
 * Client-side route guard. Backend APIs remain the source of truth;
 * this blocks unauthorized UI navigation and redirects on session loss.
 */
export function RequireAuth({ allowedRoles, children }: Props) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = encodeURIComponent(pathname || '/');
      router.replace(`/login?next=${next}&reason=session`);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [user, loading, allowedRoles, router, pathname, logout]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--fg-muted)]">
        Verifying session…
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--fg-muted)]">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
