import { DashboardShell } from '@/components/layout/DashboardShell';
import { RequireAuth } from '@/components/auth/RequireAuth';

const nav = [
  { href: '/user', label: 'Overview' },
  { href: '/user/profile', label: 'Profile' },
  { href: '/user/api-documentation', label: 'API Documentation' },
  { href: '/user/settings', label: 'Settings' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth allowedRoles={['user']}>
      <DashboardShell title="User Console" nav={nav}>
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
