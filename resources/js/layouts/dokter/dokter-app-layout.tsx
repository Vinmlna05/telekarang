import { type ReactNode } from 'react';

import RoleDashboardLayout from '@/layouts/dashboard/role-dashboard-layout';

type NavKey = 'beranda' | 'review' | 'riwayat' | 'profil';

interface DokterAppLayoutProps {
    children: ReactNode;
    active?: NavKey;
    title?: string;
    description?: string;
}

export default function DokterAppLayout({ children, active = 'review', title, description }: DokterAppLayoutProps) {
    return (
        <RoleDashboardLayout role="dokter_umum" active={active} title={title} description={description}>
            {children}
        </RoleDashboardLayout>
    );
}
