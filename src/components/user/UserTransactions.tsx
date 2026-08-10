'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { UserTransactionsPayload } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';

const PAGE_SIZE = 20;

function formatAmount(value: number) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatTimestamp(value: string) {
  const ms = Number(value);
  if (Number.isFinite(ms) && String(ms) === value.trim()) {
    return new Date(ms).toLocaleString();
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleString();
  }
  return value;
}

export function UserTransactions() {
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserTransactionsPayload | null>(null);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
        });
        const result = await apiFetch<UserTransactionsPayload>(
          `/users/me/transactions?${params.toString()}`,
        );
        setData(result);
        setPage(nextPage);
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Failed to load transactions';
        pushToast({ type: 'error', title: 'Load failed', message });
      } finally {
        setLoading(false);
      }
    },
    [pushToast],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Activity
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">
            Transactions
          </h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            All bets for your account. GGR deduction is computed from your current rate.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card-premium p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Current GGR balance
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[var(--fg)]">
            {data ? Number(data.currentGgrBalance).toLocaleString() : '—'}
          </p>
        </div>
        <div className="surface-card-premium p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            GGR deduction rate
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[var(--fg)]">
            {data ? `${data.ggrDeductionPercent}%` : '—'}
          </p>
        </div>
        <div className="surface-card-premium p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Currency
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-[var(--fg)]">
            {data ? data.currency ?? 'BDT' : '—'}
          </p>
        </div>
      </div>

      <div className="surface-card-premium overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <p className="text-sm text-[var(--fg-muted)]">
            {pagination
              ? `${pagination.total.toLocaleString()} total · Page ${pagination.page} of ${pagination.totalPages}`
              : 'Loading…'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={!canPrev}
              onClick={() => void load(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={!canNext}
              onClick={() => void load(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--table-head)] text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Game</th>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Bet</th>
                <th className="px-4 py-3 font-medium">Win amount</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">GGR deduction</th>
                <th className="px-4 py-3 font-medium">Currency</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--fg-muted)]">
                    Loading transactions…
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--fg-muted)]">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                data.items.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--fg-muted)]">
                      {formatTimestamp(tx.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--fg)]">
                      {tx.game_uid}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--fg)]">
                      {tx.member_account}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">
                      {formatAmount(tx.bet_amount)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">
                      {formatAmount(tx.win_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          tx.result === 'win'
                            ? 'font-medium text-[var(--success)]'
                            : 'font-medium text-[var(--fg-muted)]'
                        }
                      >
                        {tx.result === 'win' ? 'Win' : 'Loss'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">
                      {formatAmount(tx.ggrDeduction)}
                    </td>
                    <td className="px-4 py-3 text-[var(--fg-muted)]">
                      {data.currency || tx.currency_code || 'BDT'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
