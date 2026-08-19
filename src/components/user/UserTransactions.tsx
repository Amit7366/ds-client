'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { UserTransactionsPayload } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { DateTimeField, TextField } from '@/components/ui/Field';
import { useToast } from '@/components/providers/ToastProvider';

const PAGE_SIZE = 20;

type TransactionFilter = {
  fromDate: string;
  toDate: string;
  playerId: string;
};

const EMPTY_FILTER: TransactionFilter = { fromDate: '', toDate: '', playerId: '' };

type PresetId = 'all' | 'today' | '24h' | '7d' | '30d' | 'custom';

const PRESETS: { id: Exclude<PresetId, 'custom'>; label: string }[] = [
  { id: 'all', label: 'All time' },
  { id: 'today', label: 'Today' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
];

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 0, 0);
  return next;
}

function rangeForPreset(
  preset: Exclude<PresetId, 'all' | 'custom'>,
): Pick<TransactionFilter, 'fromDate' | 'toDate'> {
  const now = new Date();
  if (preset === 'today') {
    return {
      fromDate: toDateTimeLocalValue(startOfLocalDay(now)),
      toDate: toDateTimeLocalValue(endOfLocalDay(now)),
    };
  }
  if (preset === '24h') {
    return {
      fromDate: toDateTimeLocalValue(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      toDate: toDateTimeLocalValue(now),
    };
  }
  const days = preset === '7d' ? 7 : 30;
  const from = startOfLocalDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  return {
    fromDate: toDateTimeLocalValue(from),
    toDate: toDateTimeLocalValue(endOfLocalDay(now)),
  };
}

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

function hasActiveFilter(filter: TransactionFilter) {
  return Boolean(filter.fromDate || filter.toDate || filter.playerId);
}

export function UserTransactions() {
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserTransactionsPayload | null>(null);
  const [preset, setPreset] = useState<PresetId>('all');
  const [fromDraft, setFromDraft] = useState('');
  const [toDraft, setToDraft] = useState('');
  const [playerDraft, setPlayerDraft] = useState('');
  const [applied, setApplied] = useState<TransactionFilter>(EMPTY_FILTER);

  const load = useCallback(
    async (nextPage: number, filters: TransactionFilter = applied) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
        });
        if (filters.fromDate) params.set('fromDate', filters.fromDate);
        if (filters.toDate) params.set('toDate', filters.toDate);
        if (filters.playerId) params.set('playerId', filters.playerId);
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
    [applied, pushToast],
  );

  useEffect(() => {
    void load(1, applied);
  }, [applied, load]);

  const applyFilters = (filters: TransactionFilter, nextPreset: PresetId) => {
    setFromDraft(filters.fromDate);
    setToDraft(filters.toDate);
    setPlayerDraft(filters.playerId);
    setPreset(nextPreset);
    setApplied(filters);
  };

  const onSubmitCustomRange = (event: FormEvent) => {
    event.preventDefault();
    if (fromDraft && toDraft && fromDraft > toDraft) {
      pushToast({
        type: 'error',
        title: 'Invalid range',
        message: 'From date/time must be before To date/time.',
      });
      return;
    }
    const nextPreset = fromDraft || toDraft ? (preset === 'all' ? 'custom' : preset) : 'all';
    applyFilters(
      { fromDate: fromDraft, toDate: toDraft, playerId: playerDraft.trim() },
      nextPreset,
    );
  };

  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const canPrev = page > 1 && !loading;
  const canNext = page < totalPages && !loading;
  const filtered = hasActiveFilter(applied);

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

      <form className="surface-card-premium space-y-4 p-4 sm:p-5" onSubmit={onSubmitCustomRange}>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-[var(--fg)]">Filter transactions</p>
          <p className="text-xs text-[var(--fg-muted)]">
            Filter by date range, a start time, and/or player ID (e.g. h179).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => {
            const active = preset === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'all') {
                    applyFilters(
                      { fromDate: '', toDate: '', playerId: playerDraft.trim() },
                      'all',
                    );
                    return;
                  }
                  applyFilters(
                    { ...rangeForPreset(item.id), playerId: playerDraft.trim() },
                    item.id,
                  );
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                  active
                    ? 'border-transparent bg-[var(--accent)] text-white'
                    : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <span
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide ${
              preset === 'custom'
                ? 'border-transparent bg-[var(--accent)] text-white'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)]'
            }`}
          >
            Custom range
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr] md:items-end">
          <DateTimeField
            label="From"
            name="fromDate"
            value={fromDraft}
            onChange={(event) => {
              setFromDraft(event.target.value);
              setPreset('custom');
            }}
            hint="Inclusive start"
          />
          <DateTimeField
            label="To"
            name="toDate"
            value={toDraft}
            onChange={(event) => {
              setToDraft(event.target.value);
              setPreset('custom');
            }}
            hint="Inclusive end"
          />
          <TextField
            label="Player ID"
            name="playerId"
            value={playerDraft}
            onChange={(event) => setPlayerDraft(event.target.value)}
            placeholder="h179"
            autoComplete="off"
            hint="Exact player ID"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            Apply
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={
              loading ||
              (!filtered && !fromDraft && !toDraft && !playerDraft.trim())
            }
            onClick={() => applyFilters(EMPTY_FILTER, 'all')}
          >
            Reset
          </Button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total bet',
            value: data?.stats.totalBetAmount,
            hint: data ? `${data.stats.transactionCount.toLocaleString()} bets` : undefined,
          },
          {
            label: 'Total win',
            value: data?.stats.totalWin,
            hint: data ? `${data.stats.winCount.toLocaleString()} wins` : undefined,
            tone: 'success' as const,
          },
          {
            label: 'Total loss',
            value: data?.stats.totalLoss,
            hint: data ? `${data.stats.lossCount.toLocaleString()} losses` : undefined,
            tone: 'danger' as const,
          },
          {
            label: 'GGR deduction',
            value: data?.stats.totalGgrDeduction,
            hint: data ? `at ${data.ggrDeductionPercent}%` : undefined,
          },
        ].map((card) => (
          <div key={card.label} className="surface-card-premium p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
              {card.label}
            </p>
            <p
              className={`mt-2 font-mono text-2xl font-semibold ${
                card.tone === 'success'
                  ? 'text-[var(--success)]'
                  : card.tone === 'danger'
                    ? 'text-[var(--danger)]'
                    : 'text-[var(--fg)]'
              }`}
            >
              {data && card.value !== undefined ? formatAmount(card.value) : '—'}
              {data ? (
                <span className="ml-1 text-xs font-medium text-[var(--fg-muted)]">
                  {data.currency ?? 'BDT'}
                </span>
              ) : null}
            </p>
            {card.hint ? (
              <p className="mt-1 text-xs text-[var(--fg-muted)]">{card.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="surface-card-premium overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <p className="text-sm text-[var(--fg-muted)]">
            {pagination
              ? `${pagination.total.toLocaleString()} ${filtered ? 'matching' : 'total'} · Page ${pagination.page} of ${pagination.totalPages}`
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
                    {filtered ? 'No matching transactions.' : 'No transactions yet.'}
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
