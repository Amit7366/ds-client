'use client';

import { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { IconCheck, IconCopy } from '@/components/ui/Icons';

export type CodeLanguage = 'curl' | 'javascript' | 'nodejs';

type Props = {
  endpointUrl: string;
  languages: { id: CodeLanguage; label: string; code: string }[];
  successCode: string;
  errorsCode: string;
};

export function CodeExamples({ endpointUrl, languages, successCode, errorsCode }: Props) {
  const { pushToast } = useToast();
  const [lang, setLang] = useState<CodeLanguage>(languages[0]?.id ?? 'javascript');
  const [mode, setMode] = useState<'request' | 'success' | 'errors'>('request');
  const [copied, setCopied] = useState(false);

  const activeLang = languages.find((l) => l.id === lang) ?? languages[0];
  const requestCode = activeLang?.code ?? '';
  const shownCode =
    mode === 'errors' ? errorsCode : mode === 'success' ? successCode : requestCode;
  const shownLabel =
    mode === 'errors'
      ? 'RESPONSE · ERRORS'
      : mode === 'success'
        ? 'RESPONSE · SUCCESS'
        : (activeLang?.label ?? 'CODE').toUpperCase();

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(shownCode);
      setCopied(true);
      pushToast({ type: 'success', title: 'Copied', message: 'Code copied to clipboard.' });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      pushToast({ type: 'error', title: 'Copy failed', message: 'Could not access clipboard.' });
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8 8l-4 4 4 4M16 8l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--fg)]">Code Examples</h3>
        </div>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Copy a starter example and adapt it to your backend. Endpoint:{' '}
          <code className="font-mono text-xs text-[var(--accent)]">{endpointUrl}</code>
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {languages.map((item) => {
            const active = mode === 'request' && item.id === lang;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLang(item.id);
                  setMode('request');
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-sm)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('success')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              mode === 'success'
                ? 'bg-[var(--fg)] text-[var(--bg)]'
                : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            Success
          </button>
          <button
            type="button"
            onClick={() => setMode('errors')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              mode === 'errors'
                ? 'bg-[var(--fg)] text-[var(--bg)]'
                : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            Errors
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--code-bg)] shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <span className="text-[11px] font-semibold tracking-[0.16em] text-slate-400">
            {shownLabel}
          </span>
          <button
            type="button"
            onClick={() => void copyCode()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--code-fg)] transition hover:bg-white/10"
          >
            {copied ? (
              <>
                <IconCheck className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <IconCopy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-slate-100 sm:text-[13px]">
          <code>{shownCode}</code>
        </pre>
      </div>
    </section>
  );
}
