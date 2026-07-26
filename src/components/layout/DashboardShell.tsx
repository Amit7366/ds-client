'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export type NavItem = {
  href: string;
  label: string;
};

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const sidebarHeader = (
    <div className="shrink-0 border-b border-white/8 px-5 py-6">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <span className="text-sm font-bold">UD</span>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-muted)]">
        Console
      </p>
      <h1 className="mt-1 text-lg font-semibold tracking-tight text-[var(--sidebar-fg)]">
        {title}
      </h1>
    </div>
  );

  const sidebarNav = (
    <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
      <div className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--sidebar-muted)] hover:bg-white/5 hover:text-[var(--sidebar-fg)]'
              }`}
            >
              {active ? (
                <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-[var(--accent)]" />
              ) : null}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  const sidebarFooter = (
    <div className="shrink-0 border-t border-white/8 p-4">
      <div className="rounded-xl bg-white/5 p-3">
        <p className="truncate text-sm font-medium text-[var(--sidebar-fg)]">{user?.name}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--sidebar-muted)]">{user?.email}</p>
      </div>
      <Button
        variant="ghost"
        className="mt-3 w-full !justify-start !text-[var(--sidebar-muted)] hover:!bg-white/8 hover:!text-[var(--sidebar-fg)]"
        onClick={() => void logout()}
      >
        Sign out
      </Button>
    </div>
  );

  const sidebarBody = (
    <>
      {sidebarHeader}
      {sidebarNav}
      {sidebarFooter}
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col border-r border-white/5 bg-[var(--sidebar)] text-[var(--sidebar-fg)] md:flex">
        {sidebarBody}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-screen w-[min(86vw,300px)] flex-col bg-[var(--sidebar)] text-[var(--sidebar-fg)] shadow-[var(--shadow-lg)] animate-[fade-up_0.25s_ease-out]">
            <div className="flex shrink-0 items-center justify-between px-4 pt-4">
              <p className="text-sm font-semibold">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-[var(--sidebar-muted)] hover:bg-white/8"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 7l10 10M17 7L7 17"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{sidebarBody}</div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)] md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                Signed in
              </p>
              <p className="truncate text-sm font-medium text-[var(--fg)]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </div>
        </header>
        <main className="page-enter flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
