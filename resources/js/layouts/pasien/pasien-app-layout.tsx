import { type ReactNode } from 'react';

import RoleDashboardLayout from '@/layouts/dashboard/role-dashboard-layout';

type NavKey = 'beranda' | 'jadwal' | 'riwayat' | 'profil';

interface PasienAppLayoutProps {
    children: ReactNode;
    active?: NavKey;
    title?: string;
    description?: string;
}

export default function PasienAppLayout({ children, active = 'beranda', title, description }: PasienAppLayoutProps) {
    return (
        <RoleDashboardLayout role="pasien" active={active} title={title} description={description}>
            {children}
        </RoleDashboardLayout>
    );
}
