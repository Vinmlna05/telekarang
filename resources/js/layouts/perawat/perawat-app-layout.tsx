import { type ReactNode } from 'react';

import RoleDashboardLayout from '@/layouts/dashboard/role-dashboard-layout';

type NavKey = 'beranda' | 'antrean' | 'pasien' | 'profil';

interface PerawatAppLayoutProps {
    children: ReactNode;
    active?: NavKey;
    title?: string;
    description?: string;
}

export default function PerawatAppLayout({ children, active = 'beranda', title, description }: PerawatAppLayoutProps) {
    return (
        <RoleDashboardLayout role="perawat" active={active} title={title} description={description}>
            {children}
        </RoleDashboardLayout>
    );
}
