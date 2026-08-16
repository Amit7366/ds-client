'use client';

import { FormEvent, useState } from 'react';
import { apiFetch, formatApiError } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useTheme, type ThemeMode } from '@/components/providers/ThemeProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';

const PASSWORD_HINT = 'Min 8 chars, with upper, lower, and number';

const THEMES: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Bright console' },
  { value: 'dark', label: 'Dark', description: 'Low-glare console' },
];

function passwordRuleError(value: string): string | null {
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(value)) return 'Password must contain a number';
  return null;
}

export function UserSettings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { pushToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    const ruleError = passwordRuleError(newPassword);
    if (ruleError) {
      setPasswordError(ruleError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
        skipAuthRedirect: true,
      });
      pushToast({
        type: 'success',
        title: 'Password updated',
        message: 'Please sign in with your new password.',
      });
      await logout('password');
    } catch (err) {
      setPasswordError(formatApiError(err, 'Unable to change password'));
      pushToast({
        type: 'error',
        title: 'Password change failed',
        message: formatApiError(err, 'Unable to change password'),
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function onSignOut() {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      return;
    }
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Preferences
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">
          Settings
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Appearance, password, and session controls for this account.
        </p>
      </div>

      <section className="surface-card-premium overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Appearance
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {THEMES.map((option) => {
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={selected}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-sm)]'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40'
                }`}
              >
                <p className="text-sm font-semibold text-[var(--fg)]">{option.label}</p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card-premium overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Change password
          </p>
        </div>
        <form className="space-y-4 p-5" onSubmit={(e) => void onChangePassword(e)}>
          <PasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint={PASSWORD_HINT}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordError ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {passwordError}
            </p>
          ) : null}
          <Button type="submit" loading={savingPassword}>
            Update password
          </Button>
        </form>
      </section>

      <section className="surface-card-premium overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Session
          </p>
        </div>
        <div className="space-y-4 p-5">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-[var(--fg-muted)]">Signed in as</dt>
              <dd className="mt-1 text-sm font-medium text-[var(--fg)]">
                {user?.email || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--fg-muted)]">Role</dt>
              <dd className="mt-1 font-mono text-sm text-[var(--fg)]">{user?.role || '—'}</dd>
            </div>
          </dl>
          <p className="text-xs text-[var(--fg-muted)]">
            Signing out ends this console session. You will need your password to sign in again.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={confirmSignOut ? 'danger' : 'secondary'}
              loading={signingOut}
              onClick={() => void onSignOut()}
            >
              {confirmSignOut ? 'Confirm sign out' : 'Sign out'}
            </Button>
            {confirmSignOut ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmSignOut(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
