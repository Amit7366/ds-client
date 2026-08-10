import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--fg)] outline-none transition placeholder:text-[var(--fg-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]';

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  error,
  hint,
  id,
  placeholder,
  className = '',
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id || props.name;
  return (
    <div className="block space-y-1.5">
      <div className="floating-field">
        <input
          id={inputId}
          className={`floating-input peer ${className}`}
          placeholder={placeholder || ' '}
          {...props}
        />
        <label className="floating-label" htmlFor={inputId}>
          {label}
        </label>
      </div>
      {hint && !error ? <span className="text-xs text-[var(--fg-muted)]">{hint}</span> : null}
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </div>
  );
}

export function SelectField({
  label,
  error,
  id,
  children,
  ...props
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
      <select id={inputId} className={fieldClass} {...props}>
        {children}
      </select>
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  error,
  id,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--fg)]">{label}</span>
      <textarea id={inputId} className={fieldClass} rows={3} {...props} />
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
