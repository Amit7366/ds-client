'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { dashboardPathForRole, formatApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';

export function LoginForm() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    router.replace(dashboardPathForRole(user.role));
  }, [user, authLoading, router]);

  const sessionNotice = useMemo(() => {
    const reason = searchParams.get('reason');
    if (reason === 'expired') {
      return 'Your session expired after 2 hours. Please sign in again.';
    }
    if (reason === 'auth' || reason === 'session') {
      return 'Please sign in to continue.';
    }
    if (reason === 'invalid') {
      return 'Your session was invalid. Please sign in again.';
    }
    return null;
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(formatApiError(err, 'Unable to sign in'));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || user) {
    return (
      <p className="text-center text-sm text-[var(--fg-muted)]">
        {user ? 'Redirecting to your dashboard…' : 'Checking session…'}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {sessionNotice ? (
        <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
          {sessionNotice}
        </div>
      ) : null}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      {error ? (
        <div
          className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
