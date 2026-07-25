'use client';

import { InputHTMLAttributes, useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/ui/Icons';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2.5 pl-3.5 pr-11 text-sm text-[var(--fg)] outline-none transition placeholder:text-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  hint?: string;
};

export function PasswordField({ label, error, hint, id, name, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          className={inputClass}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--fg-muted)] transition hover:text-[var(--accent)]"
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error ? <span className="text-xs text-[var(--fg-muted)]">{hint}</span> : null}
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
