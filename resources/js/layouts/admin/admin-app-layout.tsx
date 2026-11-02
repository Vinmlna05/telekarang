import { type ReactNode } from 'react';

import RoleDashboardLayout from '@/layouts/dashboard/role-dashboard-layout';

type NavKey = 'dasbor' | 'pengguna' | 'master' | 'log' | 'profil';

interface AdminAppLayoutProps {
    children: ReactNode;
    active?: NavKey;
    title?: string;
    description?: string;
}

export default function AdminAppLayout({ children, active = 'dasbor', title, description }: AdminAppLayoutProps) {
    return (
        <RoleDashboardLayout role="admin" active={active} title={title} description={description}>
            {children}
        </RoleDashboardLayout>
    );
}
