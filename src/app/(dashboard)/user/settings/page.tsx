export default function UserSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Preferences
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">
          Settings
        </h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Account preferences and notification controls will be added in a later phase.
        </p>
      </div>
      <div className="surface-card-premium border-dashed p-8 text-center">
        <p className="text-sm font-medium text-[var(--fg)]">Coming soon</p>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Placeholder for password change, notification preferences, and session management.
        </p>
      </div>
    </div>
  );
}
