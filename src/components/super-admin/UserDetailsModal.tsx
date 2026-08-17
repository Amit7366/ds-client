'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { UserDetailsPayload } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ServiceBadge, StatusBadge } from '@/components/ui/Badge';
import { CopyableDetail } from '@/components/ui/CopyableDetail';
import { IconX } from '@/components/ui/Icons';

type Props = {
  userId: string;
  onClose: () => void;
};

function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value || '—';
  return new Date(parsed).toLocaleString();
}

export function UserDetailsModal({ userId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserDetailsPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<UserDetailsPayload>(`/users/${userId}/details`);
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof ApiClientError ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const user = data?.user;
  const stats = data?.stats;
  const currency = user?.currency ?? 'BDT';

  const statCards = [
    {
      label: 'Total bet placed',
      value: stats ? formatAmount(stats.totalBetAmount) : '—',
      hint: stats ? `${stats.transactionCount.toLocaleString()} bets` : undefined,
    },
    {
      label: 'Total win',
      value: stats ? formatAmount(stats.totalWin) : '—',
      hint: stats ? `${stats.winCount.toLocaleString()} wins` : undefined,
      tone: 'success' as const,
    },
    {
      label: 'Total loss',
      value: stats ? formatAmount(stats.totalLoss) : '—',
      hint: stats ? `${stats.lossCount.toLocaleString()} losses` : undefined,
      tone: 'danger' as const,
    },
    {
      label: 'Total GGR deduction',
      value: stats ? formatAmount(stats.totalGgrDeduction) : '—',
      hint: user ? `at ${user.ggrDeductionPercent ?? 8}%` : undefined,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[var(--bg-elevated)] p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              User details
            </p>
            <h3 id="user-details-title" className="mt-1 text-lg font-semibold text-[var(--fg)]">
              {user?.name ?? (loading ? 'Loading…' : 'User')}
            </h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {user?.email ?? (error ? 'Could not load this account.' : 'Fetching account and betting totals.')}
            </p>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--fg-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                {card.label}
              </p>
              <p
                className={`mt-2 font-mono text-xl font-semibold ${
                  card.tone === 'success'
                    ? 'text-[var(--success)]'
                    : card.tone === 'danger'
                      ? 'text-[var(--danger)]'
                      : 'text-[var(--fg)]'
                }`}
              >
                {loading ? '…' : card.value}
                {!loading && stats ? (
                  <span className="ml-1 text-xs font-medium text-[var(--fg-muted)]">{currency}</span>
                ) : null}
              </p>
              {card.hint ? (
                <p className="mt-1 text-xs text-[var(--fg-muted)]">{card.hint}</p>
              ) : null}
            </div>
          ))}
        </div>

        {user ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  Status
                </p>
                <div className="mt-2">
                  <StatusBadge status={user.status} />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  Service
                </p>
                <div className="mt-2">
                  <ServiceBadge serviceType={user.serviceType} />
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  GGR balance
                </p>
                <p className="mt-2 font-mono text-lg font-semibold text-[var(--fg)]">
                  {formatAmount(user.ggrBalance ?? 0)} {currency}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)]">
              <div className="border-b border-[var(--border)] bg-[var(--table-head)] px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  Account
                </p>
              </div>
              <dl className="divide-y divide-[var(--border)]">
                <CopyableDetail label="Name" value={user.name} showCopy={false} />
                <CopyableDetail label="Email" value={user.email} />
                <CopyableDetail label="Phone" value={user.phone} />
                <CopyableDetail label="Prefix" value={user.prefix} mono />
                <CopyableDetail label="Currency" value={currency} showCopy={false} />
                <CopyableDetail
                  label="GGR deduction %"
                  value={`${user.ggrDeductionPercent ?? 8}%`}
                  showCopy={false}
                />
                <CopyableDetail
                  label="Whitelist domain"
                  value={user.whitelistDomain || ''}
                  emptyText="Not set"
                  showCopy={Boolean(user.whitelistDomain?.trim())}
                />
                <CopyableDetail
                  label="Whitelist IP"
                  value={user.whitelistIp || ''}
                  emptyText="Not set"
                  mono
                  showCopy={Boolean(user.whitelistIp?.trim())}
                />
                <CopyableDetail
                  label="Created"
                  value={formatDate(user.createdAt)}
                  showCopy={false}
                />
                <CopyableDetail
                  label="Updated"
                  value={formatDate(user.updatedAt)}
                  showCopy={false}
                />
              </dl>
            </div>
          </>
        ) : loading ? (
          <p className="mt-5 text-sm text-[var(--fg-muted)]">Loading account details…</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          {error ? (
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          ) : null}
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
