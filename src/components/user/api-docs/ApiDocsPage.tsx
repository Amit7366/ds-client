'use client';

import { useState } from 'react';
import { GameLaunchDocs } from './GameLaunchDocs';

const APIS = [
  { id: 'game-launch', label: 'Game Launch', component: GameLaunchDocs },
] as const;

export function ApiDocsPage() {
  const [active, setActive] = useState<(typeof APIS)[number]['id']>('game-launch');
  const ActiveDocs = APIS.find((api) => api.id === active)?.component ?? GameLaunchDocs;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Developers
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">
          API Documentation
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Industry-style reference for integrating with your account credentials.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {APIS.map((api) => {
          const isActive = api.id === active;
          return (
            <button
              key={api.id}
              type="button"
              onClick={() => setActive(api.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]'
              }`}
            >
              {api.label}
            </button>
          );
        })}
      </div>

      <ActiveDocs />
    </div>
  );
}
