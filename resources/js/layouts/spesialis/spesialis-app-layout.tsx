import { type ReactNode } from 'react';

import RoleDashboardLayout from '@/layouts/dashboard/role-dashboard-layout';

type NavKey = 'beranda' | 'permintaan' | 'jadwal' | 'profil';

interface SpesialisAppLayoutProps {
    children: ReactNode;
    active?: NavKey;
    title?: string;
    description?: string;
}

export default function SpesialisAppLayout({ children, active = 'beranda', title, description }: SpesialisAppLayoutProps) {
    return (
        <RoleDashboardLayout role="spesialis" active={active} title={title} description={description}>
            {children}
        </RoleDashboardLayout>
    );
}
