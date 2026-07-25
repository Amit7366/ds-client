'use client';

import { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { IconCheck, IconCopy } from '@/components/ui/Icons';

type Props = {
  label: string;
  value: string;
  copyValue?: string;
  mono?: boolean;
  emptyText?: string;
  showCopy?: boolean;
  actions?: React.ReactNode;
};

export function CopyableDetail({
  label,
  value,
  copyValue,
  mono = false,
  emptyText = '—',
  showCopy = true,
  actions,
}: Props) {
  const { pushToast } = useToast();
  const [copied, setCopied] = useState(false);
  const display = value?.trim() ? value : emptyText;
  const toCopy = (copyValue ?? value)?.trim();
  const canCopy = Boolean(toCopy) && showCopy;

  async function handleCopy() {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      pushToast({
        type: 'success',
        title: 'Copied',
        message: `${label} copied to clipboard.`,
      });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      pushToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Could not access the clipboard.',
      });
    }
  }

  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[160px_1fr] sm:items-center sm:px-5">
      <dt className="text-sm text-[var(--fg-muted)]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2">
        <span
          className={`min-w-0 flex-1 break-all text-sm font-medium text-[var(--fg)] ${
            mono ? 'font-mono text-xs tracking-wide' : ''
          }`}
        >
          {display}
        </span>
        {(actions || showCopy) && (
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            {showCopy ? (
              <button
                type="button"
                title={canCopy ? `Copy ${label}` : undefined}
                disabled={!canCopy}
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-xs font-medium text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? (
                  <IconCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <IconCopy className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            ) : null}
          </div>
        )}
      </dd>
    </div>
  );
}
