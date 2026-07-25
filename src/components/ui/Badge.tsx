import type { ServiceType, UserStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: UserStatus }) {
  const active = status === 'active';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-[var(--success-soft)] text-[var(--success)]'
          : 'bg-[var(--warning-soft)] text-[var(--warning)]'
      }`}
    >
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

export function ServiceBadge({ serviceType }: { serviceType: ServiceType }) {
  const live = serviceType === 'live';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        live
          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'bg-[var(--bg-subtle)] text-[var(--fg-muted)]'
      }`}
    >
      {live ? 'Live' : 'Staging'}
    </span>
  );
}
