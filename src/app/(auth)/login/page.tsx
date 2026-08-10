import { Suspense } from 'react';
import { LoginBrandPanel } from '@/components/auth/LoginBrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  return (
    <div className="login-shell">
      <LoginBrandPanel />

      <main className="login-panel">
        <div className="login-panel-mesh" aria-hidden />

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[420px]">
          {/* Mobile / tablet brand strip */}
          <div className="mb-8 flex items-center gap-3 lg:hidden page-enter">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--accent)]/20">
              <span className="font-mono text-sm font-semibold tracking-tight">AV</span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-[var(--fg)]">ApiVexo</p>
              <p className="text-xs text-[var(--fg-muted)]">Operator console</p>
            </div>
          </div>

          <div className="auth-stagger">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg)] sm:text-[2rem]">
                Sign in
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                Enter your credentials to continue to the dashboard.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 shadow-[var(--shadow-lg)] sm:p-8">
              <Suspense
                fallback={
                  <p className="text-center text-sm text-[var(--fg-muted)]">Loading…</p>
                }
              >
                <LoginForm />
              </Suspense>
            </div>

            <p className="mt-6 text-center text-xs text-[var(--fg-muted)]">
              Need access? Contact your administrator.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
