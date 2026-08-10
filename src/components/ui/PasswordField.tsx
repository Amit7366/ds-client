'use client';

import { InputHTMLAttributes, useState } from 'react';
import { IconEye, IconEyeOff } from '@/components/ui/Icons';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  hint?: string;
};

export function PasswordField({
  label,
  error,
  hint,
  id,
  name,
  placeholder,
  className = '',
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className="block space-y-1.5">
      <div className="floating-field">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          className={`floating-input floating-input-password peer ${className}`}
          placeholder={placeholder || ' '}
          {...props}
        />
        <label className="floating-label" htmlFor={inputId}>
          {label}
        </label>
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
    </div>
  );
}
