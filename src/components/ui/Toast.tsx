'use client';

import { useEffect } from 'react';

export function Toast({
  message,
  type = 'info',
  onClose,
}: {
  message: string;
  type?: 'info' | 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : type === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-slate-200 bg-white text-slate-800';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${colors}`}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium opacity-70 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  );
}
