import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[var(--shadow-sm)] hover:shadow-[0_8px_20px_var(--accent-glow)]',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
  ghost: 'bg-transparent text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={`btn-animated inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="btn-spinner" aria-hidden />
            Please wait…
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
