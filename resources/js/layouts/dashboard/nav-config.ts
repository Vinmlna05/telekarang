import {
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Database,
    History,
    Home,
    LayoutGrid,
    ScrollText,
    UserRound,
    Users,
    type LucideIcon,
} from 'lucide-react';

export type DashboardRole = 'pasien' | 'perawat' | 'dokter_umum' | 'spesialis' | 'admin';

export interface DashboardNavItem {
    key: string;
    label: string;
    href: string;
    icon: LucideIcon;
}

export interface DashboardRoleConfig {
    label: string;
    workspace: string;
    home: string;
    profile: string;
    defaultTitle: string;
    defaultDescription: string;
    items: DashboardNavItem[];
}

export const dashboardRoles: Record<DashboardRole, DashboardRoleConfig> = {
    pasien: {
        label: 'Pasien',
        workspace: 'Ruang kerja pasien',
        home: '/pasien',
        profile: '/pasien/profil',
        defaultTitle: 'Beranda pasien',
        defaultDescription: 'Pantau permintaan konsultasi, jadwal dokter spesialis, dan hasil konsultasi Anda.',
        items: [
            { key: 'beranda', label: 'Beranda', href: '/pasien', icon: Home },
            { key: 'jadwal', label: 'Jadwal', href: '/pasien/jadwal', icon: CalendarDays },
            { key: 'riwayat', label: 'Riwayat', href: '/pasien/riwayat', icon: History },
            { key: 'profil', label: 'Profil', href: '/pasien/profil', icon: UserRound },
        ],
    },
    perawat: {
        label: 'Perawat',
        workspace: 'Ruang kerja perawat',
        home: '/perawat',
        profile: '/settings/profile',
        defaultTitle: 'Beranda perawat',
        defaultDescription: 'Pantau antrean skrining, tindak lanjut hasil, dan rujukan yang berhasil dihindarkan.',
        items: [
            { key: 'beranda', label: 'Beranda', href: '/perawat', icon: Home },
            { key: 'antrean', label: 'Antrean', href: '/perawat/permintaan', icon: ClipboardList },
            { key: 'pasien', label: 'Pasien', href: '/perawat/pasien', icon: Users },
            { key: 'profil', label: 'Profil', href: '/settings/profile', icon: UserRound },
        ],
    },
    dokter_umum: {
        label: 'Dokter umum',
        workspace: 'Ruang kerja dokter umum',
        home: '/dokter',
        profile: '/settings/profile',
        defaultTitle: 'Review skrining',
        defaultDescription: 'Tinjau hasil skrining perawat dan putuskan apakah pasien perlu diteruskan ke dokter spesialis.',
        items: [
            { key: 'beranda', label: 'Beranda', href: '/dokter', icon: Home },
            { key: 'review', label: 'Review', href: '/dokter/review', icon: ClipboardCheck },
            { key: 'riwayat', label: 'Riwayat', href: '/dokter/riwayat', icon: History },
            { key: 'profil', label: 'Profil', href: '/settings/profile', icon: UserRound },
        ],
    },
    spesialis: {
        label: 'Dokter spesialis',
        workspace: 'Ruang kerja dokter spesialis',
        home: '/spesialis',
        profile: '/settings/profile',
        defaultTitle: 'Beranda spesialis',
        defaultDescription: 'Kelola permintaan konsultasi, jadwal praktik, dan konsultasi yang sedang berlangsung.',
        items: [
            { key: 'beranda', label: 'Beranda', href: '/spesialis', icon: Home },
            { key: 'permintaan', label: 'Permintaan', href: '/spesialis/permintaan', icon: ClipboardList },
            { key: 'jadwal', label: 'Jadwal', href: '/spesialis/jadwal', icon: CalendarDays },
            { key: 'profil', label: 'Profil', href: '/settings/profile', icon: UserRound },
        ],
    },
    admin: {
        label: 'Admin',
        workspace: 'Ruang kerja admin',
        home: '/admin',
        profile: '/settings/profile',
        defaultTitle: 'Dasbor statistik',
        defaultDescription: 'Ringkasan konsultasi, rujukan terhindarkan, dan dampak layanan TeleKarang.',
        items: [
            { key: 'dasbor', label: 'Dasbor', href: '/admin', icon: LayoutGrid },
            { key: 'pengguna', label: 'Pengguna', href: '/admin/pengguna', icon: Users },
            { key: 'master', label: 'Master', href: '/admin/dokter', icon: Database },
            { key: 'log', label: 'Log', href: '/admin/log', icon: ScrollText },
        ],
    },
};
