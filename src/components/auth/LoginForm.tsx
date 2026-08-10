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
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
    } catch (err) {
      setError(formatApiError(err, 'Unable to sign in'));
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (user && !success && !loading)) {
    return (
      <p className="text-center text-sm text-[var(--fg-muted)]">
        {user ? 'Redirecting to your dashboard…' : 'Checking session…'}
      </p>
    );
  }

  if (success || user) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="auth-success-mark flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--fg)]">Signed in</p>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {sessionNotice ? (
        <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2.5 text-sm text-[var(--warning)]">
          {sessionNotice}
        </div>
      ) : null}

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-2 text-right text-xs text-[var(--fg-muted)]">
          Forgot password? Ask your admin to reset it.
        </p>
      </div>

      {error ? (
        <div
          key={shakeKey}
          className="auth-shake rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2.5 text-sm text-[var(--danger)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" className="mt-1 w-full py-3" loading={loading}>
        Sign in
      </Button>
    </form>
  );
}
