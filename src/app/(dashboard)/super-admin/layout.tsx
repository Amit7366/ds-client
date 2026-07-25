import { DashboardShell } from '@/components/layout/DashboardShell';
import { RequireAuth } from '@/components/auth/RequireAuth';

const nav = [
  { href: '/super-admin', label: 'Users' },
  { href: '/super-admin/users/new', label: 'Add user' },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth allowedRoles={['super_admin']}>
      <DashboardShell title="Super Admin" nav={nav}>
        {children}
      </DashboardShell>
    </RequireAuth>
  );
}
