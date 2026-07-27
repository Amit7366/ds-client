import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md page-enter">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
            <span className="text-sm font-bold tracking-wide">AV</span>
          </div>
          
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--fg)] sm:text-4xl">
            Sign in
          </h1>
        </div>
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <Suspense fallback={<p className="text-sm text-[var(--fg-muted)]">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
