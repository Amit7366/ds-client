'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { IconAlert, IconCheck, IconInfo, IconX } from '@/components/ui/Icons';

export type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
};

type ToastContextValue = {
  pushToast: (input: { message: string; type?: ToastType; title?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function ToastCard({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const styles =
    item.type === 'success'
      ? {
          wrap: 'border-[var(--success)]/25 bg-[var(--bg-elevated)]',
          iconWrap: 'bg-[var(--success-soft)] text-[var(--success)]',
          title: 'text-[var(--fg)]',
          Icon: IconCheck,
        }
      : item.type === 'error'
        ? {
            wrap: 'border-[var(--danger)]/25 bg-[var(--bg-elevated)]',
            iconWrap: 'bg-[var(--danger-soft)] text-[var(--danger)]',
            title: 'text-[var(--fg)]',
            Icon: IconAlert,
          }
        : {
            wrap: 'border-[var(--border)] bg-[var(--bg-elevated)]',
            iconWrap: 'bg-[var(--accent-soft)] text-[var(--accent)]',
            title: 'text-[var(--fg)]',
            Icon: IconInfo,
          };

  const title =
    item.title ||
    (item.type === 'success' ? 'Success' : item.type === 'error' ? 'Error' : 'Notice');

  return (
    <div
      className={`pointer-events-auto flex w-[min(92vw,380px)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[var(--shadow-lg)] animate-[toast-in_0.28s_ease-out] ${styles.wrap}`}
      role="status"
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
      >
        <styles.Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[var(--fg-muted)]">{item.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 text-[var(--fg-muted)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
        aria-label="Dismiss"
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    ({
      message,
      type = 'info',
      title,
    }: {
      message: string;
      type?: ToastType;
      title?: string;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev, { id, message, type, title }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-4 z-[100] flex flex-col gap-3 sm:right-6">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
