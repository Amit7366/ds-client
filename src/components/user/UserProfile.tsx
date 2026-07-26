'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { User } from '@/lib/types';
import { ServiceBadge, StatusBadge } from '@/components/ui/Badge';
import { CopyableDetail } from '@/components/ui/CopyableDetail';
import { useToast } from '@/components/providers/ToastProvider';
import { IconEye, IconEyeOff, IconKey } from '@/components/ui/Icons';

function formatDate(value?: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function UserProfile() {
  const { pushToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiSecret, setApiSecret] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User }>('/users/me/profile');
      setUser(data.user);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load profile');
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function toggleRevealSecret() {
    if (apiSecret) {
      setApiSecret(null);
      return;
    }
    setRevealing(true);
    try {
      const data = await apiFetch<{ apiSecret: string }>('/users/me/reveal-secret', {
        method: 'POST',
      });
      setApiSecret(data.apiSecret);
      pushToast({
        type: 'info',
        title: 'Secret revealed',
        message: 'You can copy your API secret now.',
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Unable to reveal API secret';
      pushToast({ type: 'error', title: 'Reveal failed', message });
    } finally {
      setRevealing(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
        {error}
      </div>
    );
  }

  if (!user) {
    return <p className="text-sm text-[var(--fg-muted)]">Loading profile…</p>;
  }

  const secretDisplay =
    apiSecret || user.apiSecretMasked || '••••••••••••••••••••••••••••••••';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Identity
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">
          Profile & credentials
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          API credentials can be revealed and copied. Account details are read-only.
        </p>
      </div>

      <div className="surface-card-premium overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3.5">
          <IconKey className="h-4 w-4 text-[var(--accent)]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            API credentials
          </p>
        </div>
        <dl className="divide-y divide-[var(--border)]">
          <CopyableDetail label="Prefix" value={user.prefix} mono />
          <CopyableDetail
            label="API secret"
            value={secretDisplay}
            copyValue={apiSecret || undefined}
            mono
            actions={
              <button
                type="button"
                title={apiSecret ? 'Hide secret' : 'Reveal secret'}
                disabled={revealing || user.canRevealSecret === false}
                onClick={() => void toggleRevealSecret()}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs font-medium text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {apiSecret ? (
                  <IconEyeOff className="h-3.5 w-3.5" />
                ) : (
                  <IconEye className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {revealing ? '…' : apiSecret ? 'Hide' : 'Reveal'}
                </span>
              </button>
            }
          />
        </dl>
        <p className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--fg-muted)]">
          {user.canRevealSecret === false
            ? 'Your secret cannot be revealed yet. Ask a super admin to regenerate it once.'
            : 'Reveal to view the full secret, then use Copy. Contact your administrator to regenerate.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card-premium p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Whitelist domain
          </p>
          <p className="mt-3 break-all text-sm font-medium text-[var(--fg)]">
            {user.whitelistDomain?.trim() || 'Not set'}
          </p>
        </div>
        <div className="surface-card-premium p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Whitelist IP
          </p>
          <p className="mt-3 break-all font-mono text-sm font-medium text-[var(--fg)]">
            {user.whitelistIp?.trim() || 'Not set'}
          </p>
        </div>
      </div>

      <div className="surface-card-premium overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Account details
          </p>
        </div>
        <dl className="divide-y divide-[var(--border)]">
          <CopyableDetail label="Name" value={user.name} showCopy={false} />
          <CopyableDetail label="Email" value={user.email} showCopy={false} />
          <CopyableDetail label="Phone" value={user.phone} showCopy={false} />
          <CopyableDetail label="Role" value={user.role} mono showCopy={false} />
          <CopyableDetail label="Prefix" value={user.prefix} mono showCopy={false} />
          <CopyableDetail
            label="GGR balance"
            value={Number(user.ggrBalance ?? 0).toLocaleString()}
            mono
            showCopy={false}
          />
          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[160px_1fr] sm:items-center sm:px-5">
            <dt className="text-sm text-[var(--fg-muted)]">Status</dt>
            <dd>
              <StatusBadge status={user.status} />
            </dd>
          </div>
          <div className="grid gap-2 px-4 py-4 sm:grid-cols-[160px_1fr] sm:items-center sm:px-5">
            <dt className="text-sm text-[var(--fg-muted)]">Service type</dt>
            <dd>
              <ServiceBadge serviceType={user.serviceType} />
            </dd>
          </div>
          <CopyableDetail label="Created" value={formatDate(user.createdAt)} showCopy={false} />
          <CopyableDetail label="Updated" value={formatDate(user.updatedAt)} showCopy={false} />
        </dl>
      </div>
    </div>
  );
}
