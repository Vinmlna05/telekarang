import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ChevronRight,
    Database,
    History,
    IdCard,
    KeyRound,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Settings,
    ShieldCheck,
    Stethoscope,
    Users,
    type LucideIcon,
} from 'lucide-react';

import AdminAppLayout from '@/layouts/admin/admin-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const profilAdmin = {
    nomorPegawai: 'ADM-2026-0004',
    unit: 'Manajemen layanan',
    faskes: 'Puskesmas Pulau Karang',
    wilayah: 'Kabupaten Kepulauan',
    telepon: '+62 812-0000-8899',
    loginTerakhir: 'Hari ini, 08.12',
};

const ringkasanAdmin = [
    { label: 'Pengguna', value: '12', caption: 'akun terdaftar' },
    { label: 'Konsultasi', value: '95', caption: 'bulan ini' },
    { label: 'Terhindarkan', value: '38', caption: '40% dari konsultasi' },
    { label: 'Aktivitas', value: '7', caption: 'tercatat hari ini' },
];

const aksiCepat: Array<{ label: string; description: string; href: string; icon: LucideIcon }> = [
    {
        label: 'Kelola pengguna dan peran',
        description: 'Buat akun staf dan atur hak akses',
        href: '/admin/pengguna',
        icon: Users,
    },
    {
        label: 'Data dokter',
        description: 'Spesialisasi, faskes, dan status dokter',
        href: '/admin/dokter',
        icon: Stethoscope,
    },
    {
        label: 'Data ICD-10',
        description: 'Daftar diagnosis untuk hasil konsultasi',
        href: '/admin/icd10',
        icon: Database,
    },
    {
        label: 'Log aktivitas',
        description: 'Telusuri jejak perubahan data',
        href: '/admin/log',
        icon: History,
    },
];

function inisial(nama: string): string {
    return (
        nama
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((bagian) => bagian.charAt(0).toUpperCase())
            .join('') || 'AD'
    );
}

function formatTanggal(value: string): string {
    const tanggal = new Date(value);

    if (Number.isNaN(tanggal.getTime())) {
        return value;
    }

    return tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function SectionHeader({ icon: Icon, title, description, badge }: { icon: LucideIcon; title: string; description: string; badge?: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                    <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-[15px] font-bold">{title}</h2>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
                </div>
            </div>
            {badge && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                    {badge}
                </span>
            )}
        </div>
    );
}

export default function ProfilAdmin() {
    const { auth } = usePage<SharedData>().props;
    const emailTerverifikasi = auth.user.email_verified_at !== null;

    const identitasAkun = [
        { label: 'Nama lengkap', value: auth.user.name },
        { label: 'Email', value: auth.user.email },
        { label: 'Peran', value: 'Admin' },
        { label: 'Nomor pegawai', value: profilAdmin.nomorPegawai },
        { label: 'Faskes', value: profilAdmin.faskes },
        { label: 'Unit kerja', value: profilAdmin.unit },
        { label: 'Terdaftar sejak', value: formatTanggal(auth.user.created_at) },
        { label: 'Status akun', value: 'Aktif' },
    ];

    return (
        <AdminAppLayout
            active="profil"
            title="Profil admin"
            description="Identitas akun, keamanan akses, dan ringkasan peran admin dalam layanan TeleKarang."
        >
            <Head title="Profil admin" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section
                        aria-labelledby="profil-admin-utama"
                        className={cn('overflow-hidden rounded-[32px] shadow-[0_18px_45px_rgba(4,16,14,0.14)]', glass)}
                    >
                        <div className={cn('relative px-5 pt-4 pb-4 md:px-6 md:pt-5 md:pb-5', bannerGradient)}>
                            <div
                                className="pointer-events-none absolute -top-8 -right-6 size-32 rounded-full bg-white/20 blur-2xl"
                                aria-hidden="true"
                            />

                            <div className="relative flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                    <span className="text-tk-mint grid size-16 shrink-0 place-items-center rounded-[22px] border-4 border-white/10 bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-lg font-extrabold shadow-[0_10px_30px_rgba(4,16,14,0.18)] sm:size-20">
                                        {inisial(auth.user.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <h2
                                            id="profil-admin-utama"
                                            className="truncate text-xl font-extrabold tracking-[-0.03em] text-white sm:text-[2rem]"
                                        >
                                            {auth.user.name}
                                        </h2>
                                        <p className="mt-1 text-[10px] text-white/80 sm:text-[12px]">Admin · {profilAdmin.faskes}</p>
                                        <p className="mt-0.5 text-[10px] text-white/65">Bergabung {formatTanggal(auth.user.created_at)}</p>
                                    </div>
                                </div>

                                <Link
                                    href={route('admin.akun')}
                                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                                >
                                    <Settings className="size-3.5" aria-hidden="true" />
                                    Kelola akun
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-4 md:grid-cols-4 md:px-5 md:pb-5">
                            {ringkasanAdmin.map((item) => (
                                <div key={item.label} className="rounded-[18px] bg-[var(--tk-page-alt)] p-3">
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">{item.label}</dt>
                                    <dd className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-[var(--tk-text)]">{item.value}</dd>
                                    <p className="mt-0.5 text-[9px] text-[var(--tk-muted)]">{item.caption}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="identitas-akun-admin" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader
                            icon={IdCard}
                            title="Identitas akun"
                            description="Data akun internal yang dipakai untuk mengakses ruang kerja admin."
                            badge="Akun internal"
                        />

                        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                            {identitasAkun.map((item) => (
                                <div key={item.label} className="rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">{item.label}</dt>
                                    <dd className="mt-1 text-[11px] leading-relaxed font-semibold break-words">{item.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-3 flex flex-col gap-1.5 rounded-2xl border border-[var(--tk-glass-border)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)] sm:flex-row sm:items-center sm:justify-between">
                            <span className="flex items-start gap-1.5">
                                <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                Wilayah kerja: {profilAdmin.wilayah}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Activity className="size-3 shrink-0" aria-hidden="true" />
                                Login terakhir: {profilAdmin.loginTerakhir}
                            </span>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Nama, email, dan kata sandi diubah melalui halaman Kelola akun. Data medis pasien tidak dapat diubah dari halaman profil
                            ini.
                        </p>
                    </section>

                    <section aria-labelledby="keamanan-akun-admin" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader
                            icon={ShieldCheck}
                            title="Keamanan akun"
                            description="Kelola akses akun admin dan keluar dari perangkat ini."
                        />

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                <div className="flex items-center gap-2">
                                    <Mail className="size-3.5 text-[var(--tk-muted)]" aria-hidden="true" />
                                    <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Email</p>
                                </div>
                                <p className="mt-1.5 truncate text-[11px] font-bold">{auth.user.email}</p>
                                <span
                                    className={cn(
                                        'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold',
                                        emailTerverifikasi
                                            ? 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]'
                                            : 'bg-tk-warning/15 text-tk-warning',
                                    )}
                                >
                                    {emailTerverifikasi ? 'Terverifikasi' : 'Belum terverifikasi'}
                                </span>
                            </div>

                            <div className="rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="size-3.5 text-[var(--tk-muted)]" aria-hidden="true" />
                                    <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Kata sandi</p>
                                </div>
                                <p className="mt-1.5 text-[11px] font-bold">Kelola dari pengaturan akun</p>
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold">
                                    Terlindungi
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:flex">
                            <Link
                                href={`${route('admin.akun')}#informasi-akun`}
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[10px] font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                Ubah profil
                            </Link>
                            <Link
                                href={`${route('admin.akun')}#kata-sandi`}
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[10px] font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                Ganti kata sandi
                            </Link>
                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/10 px-4 text-[10px] font-semibold text-red-500 transition-colors hover:bg-red-500/15"
                            >
                                <LogOut className="size-3.5" aria-hidden="true" />
                                Keluar
                            </Link>
                        </div>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="akses-cepat-admin" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="akses-cepat-admin" className="text-[15px] font-bold">
                            Akses cepat
                        </h2>
                        <div className="mt-3 grid gap-1">
                            {aksiCepat.map(({ label, description, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <Icon className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[10px] font-bold">{label}</span>
                                        <span className="block truncate text-[9px] text-[var(--tk-muted)]">{description}</span>
                                    </span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="tugas-admin" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="tugas-admin" className="text-[15px] font-bold">
                                Peran admin
                            </h2>
                            <span className="bg-tk-warning/15 text-tk-warning rounded-full px-2.5 py-1 text-[9px] font-bold">Akses penuh</span>
                        </div>

                        <ul className="mt-3 grid gap-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-2">
                                <ShieldCheck className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Mengelola akun staf dan peran akses.
                            </li>
                            <li className="flex items-start gap-2">
                                <Stethoscope className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Menjaga data master dokter dan ICD-10.
                            </li>
                            <li className="flex items-start gap-2">
                                <History className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Memantau dasbor dan log aktivitas layanan.
                            </li>
                        </ul>
                    </section>

                    <section aria-label="Privasi profil admin" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                            <Lock className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Akses terbatas</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Halaman ini hanya untuk pengelola sistem. Data pasien tetap mengikuti kewenangan peran dan tidak ditampilkan di sini.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Bantuan admin" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                            <Settings className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Butuh bantuan?</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hubungi koordinator puskesmas di {profilAdmin.telepon} untuk perubahan kewenangan akun.
                            </p>
                        </div>
                    </section>

                    <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Semua data pada profil ini adalah data fiktif untuk prototipe TeleKarang.
                    </p>
                </aside>
            </div>
        </AdminAppLayout>
    );
}
