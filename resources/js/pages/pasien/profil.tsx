import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronRight,
    Droplet,
    HeartPulse,
    History,
    IdCard,
    KeyRound,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Phone,
    Pill,
    Plus,
    ShieldCheck,
    Stethoscope,
    UserRound,
    type LucideIcon,
} from 'lucide-react';

import { konsultasiPasien } from '@/data/konsultasi-pasien';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const profilPasien = {
    nomorRekamMedis: 'RM-2026-0018',
    nik: '9271 •••• •••• 42',
    tanggalLahir: '14 Februari 1989',
    usia: 37,
    jenisKelamin: 'laki-laki',
    telepon: '+62 812-0000-1234',
    alamat: 'Dusun Karang Indah, Pulau Karang, Kabupaten Kepulauan',
    golonganDarah: 'O+',
    alergi: 'Tidak ada',
    kondisiKronis: 'Hipertensi esensial',
    obatRutin: 'Amlodipine 5 mg',
    kontakDarurat: {
        nama: 'Rahmat Hidayat',
        hubungan: 'teman',
        telepon: '+62 812-0000-5678',
        teleponHref: 'tel:+6281200005678',
    },
    skriningTerakhir: {
        tanggal: '21 September 2026',
        beratBadan: 68,
        tinggiBadan: 164,
        tekananDarah: '150/95',
        spo2: 98,
    },
};

const identitasPasien = [
    { label: 'NIK', value: profilPasien.nik },
    { label: 'Tanggal lahir', value: profilPasien.tanggalLahir },
    { label: 'Jenis kelamin', value: profilPasien.jenisKelamin },
    { label: 'Nomor rekam medis', value: profilPasien.nomorRekamMedis },
    { label: 'Nomor telepon', value: profilPasien.telepon },
    { label: 'Alamat', value: profilPasien.alamat, lebar: true },
];

const ringkasanKesehatan: Array<{ label: string; value: string; catatan: string; icon: LucideIcon; tone: string }> = [
    {
        label: 'Golongan darah',
        value: profilPasien.golonganDarah,
        catatan: 'Tercatat di rekam medis',
        icon: Droplet,
        tone: 'text-tk-danger bg-tk-danger/10',
    },
    {
        label: 'Alergi',
        value: profilPasien.alergi,
        catatan: 'Alergi obat yang diketahui',
        icon: ShieldCheck,
        tone: 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
    },
    {
        label: 'Kondisi kronis',
        value: profilPasien.kondisiKronis,
        catatan: 'Perlu dipantau saat skrining',
        icon: HeartPulse,
        tone: 'text-tk-warning bg-tk-warning/15',
    },
    {
        label: 'Obat rutin',
        value: profilPasien.obatRutin,
        catatan: 'Diminum setiap pagi',
        icon: Pill,
        tone: 'text-tk-info bg-tk-info/10',
    },
];

const aksiCepat = [
    {
        label: 'Buat permintaan konsultasi',
        description: 'Pilih dokter spesialis dan jadwal',
        href: '/pasien/konsultasi/baru',
        icon: Plus,
    },
    {
        label: 'Lihat jadwal dokter',
        description: 'Cek spesialis yang tersedia',
        href: '/pasien/jadwal',
        icon: CalendarDays,
    },
    {
        label: 'Riwayat konsultasi',
        description: 'Buka hasil dan diagnosis sebelumnya',
        href: '/pasien/riwayat',
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
            .join('') || 'PS'
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

export default function ProfilPasien() {
    const { auth } = usePage<SharedData>().props;
    const emailTerverifikasi = auth.user.email_verified_at !== null;

    const totalKonsultasi = konsultasiPasien.length;
    const rujukanTerhindarkan = konsultasiPasien.filter((item) => !item.hasil.keputusanRujuk).length;
    const rujukan = totalKonsultasi - rujukanTerhindarkan;
    const konsultasiTerakhir = konsultasiPasien[0];

    return (
        <PasienAppLayout
            active="profil"
            title="Profil pasien"
            description="Identitas, kontak darurat, ringkasan kesehatan, dan keamanan akun Anda di TeleKarang."
        >
            <Head title="Profil pasien" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section
                        aria-labelledby="profil-utama"
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
                                            id="profil-utama"
                                            className="truncate text-xl font-extrabold tracking-[-0.03em] text-white sm:text-[2rem]"
                                        >
                                            {auth.user.name}
                                        </h2>
                                        <p className="mt-1 text-[10px] text-white/80 sm:text-[12px]">
                                            {profilPasien.nomorRekamMedis} · Terdaftar sejak {formatTanggal(auth.user.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href="/pasien/akun"
                                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                                >
                                    <UserRound className="size-3.5" aria-hidden="true" />
                                    Kelola akun
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-2 px-4 pt-4 pb-4 sm:grid-cols-2 md:grid-cols-4 md:px-5 md:pb-5">
                            <div className="rounded-[18px] bg-[var(--tk-page-alt)] p-3">
                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Usia</dt>
                                <dd className="mt-1 text-[22px] font-bold tracking-[-0.03em] text-[var(--tk-text)]">{profilPasien.usia}</dd>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">tahun</p>
                            </div>
                            <div className="rounded-[18px] bg-[var(--tk-page-alt)] p-3">
                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Gender</dt>
                                <dd className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-[var(--tk-text)]">{profilPasien.jenisKelamin}</dd>
                            </div>
                            <div className="rounded-[18px] bg-[var(--tk-page-alt)] p-3">
                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Gol. darah</dt>
                                <dd className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-[var(--tk-text)]">{profilPasien.golonganDarah}</dd>
                            </div>
                            <div className="rounded-[18px] bg-[var(--tk-page-alt)] p-3">
                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Kontak</dt>
                                <dd className="mt-1 truncate text-[15px] font-bold tracking-[-0.02em] text-[var(--tk-text)]">
                                    {profilPasien.telepon}
                                </dd>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="identitas-pasien" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader
                            icon={IdCard}
                            title="Identitas pasien"
                            description="Data ini digunakan perawat untuk memverifikasi pasien saat skrining."
                            badge="Diverifikasi puskesmas"
                        />

                        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                            {identitasPasien.map((item) => (
                                <div key={item.label} className={cn('rounded-2xl bg-[var(--tk-page-alt)] p-3.5', item.lebar && 'sm:col-span-2')}>
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">{item.label}</dt>
                                    <dd className="mt-1 text-[11px] leading-relaxed font-semibold">{item.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Perubahan nama, NIK, tanggal lahir, dan alamat dilakukan petugas puskesmas agar sesuai rekam medis.
                        </p>
                    </section>

                    <section aria-labelledby="kesehatan-pasien" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader
                            icon={Stethoscope}
                            title="Ringkasan kesehatan"
                            description="Informasi penting yang membantu perawat dan dokter saat konsultasi."
                            badge="Data terbaru"
                        />

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {ringkasanKesehatan.map((item) => (
                                <div key={item.label} className="rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                    <div className="flex items-start gap-2.5">
                                        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', item.tone)}>
                                            <item.icon className="size-4" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 text-[11px] font-bold">{item.value}</p>
                                            <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">{item.catatan}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[10px] font-bold">Skrining terakhir</p>
                                <span className="text-[9px] text-[var(--tk-muted)]">{profilPasien.skriningTerakhir.tanggal}</span>
                            </div>
                            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                    <dt className="text-[9px] text-[var(--tk-muted)]">Berat</dt>
                                    <dd className="mt-0.5 text-xs font-bold">
                                        {profilPasien.skriningTerakhir.beratBadan}{' '}
                                        <span className="text-[9px] font-medium text-[var(--tk-muted)]">kg</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[9px] text-[var(--tk-muted)]">Tinggi</dt>
                                    <dd className="mt-0.5 text-xs font-bold">
                                        {profilPasien.skriningTerakhir.tinggiBadan}{' '}
                                        <span className="text-[9px] font-medium text-[var(--tk-muted)]">cm</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[9px] text-[var(--tk-muted)]">Tekanan darah</dt>
                                    <dd className="mt-0.5 text-xs font-bold">
                                        {profilPasien.skriningTerakhir.tekananDarah}{' '}
                                        <span className="text-[9px] font-medium text-[var(--tk-muted)]">mmHg</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[9px] text-[var(--tk-muted)]">SpO₂</dt>
                                    <dd className="mt-0.5 text-xs font-bold">
                                        {profilPasien.skriningTerakhir.spo2} <span className="text-[9px] font-medium text-[var(--tk-muted)]">%</span>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section aria-labelledby="kontak-darurat" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader
                            icon={Phone}
                            title="Kontak darurat"
                            description="Dihubungi jika pasien membutuhkan bantuan atau perubahan jadwal mendadak."
                            badge="Wajib diperbarui"
                        />

                        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-extrabold">
                                    {inisial(profilPasien.kontakDarurat.nama)}
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold">{profilPasien.kontakDarurat.nama}</p>
                                    <p className="text-[10px] text-[var(--tk-muted)]">
                                        {profilPasien.kontakDarurat.hubungan} · {profilPasien.kontakDarurat.telepon}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={profilPasien.kontakDarurat.teleponHref}
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--tk-glass)] px-4 text-[10px] font-bold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                <Phone className="size-3.5" aria-hidden="true" />
                                Hubungi
                            </a>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Pastikan kontak darurat aktif. Perawat dapat memperbarui data ini saat Anda datang ke puskesmas.
                        </p>
                    </section>

                    <section aria-labelledby="keamanan-akun" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeader icon={ShieldCheck} title="Keamanan akun" description="Kelola akses akun tanpa mengubah data medis Anda." />

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
                                <p className="mt-1.5 text-[11px] font-bold">Terakhir diubah 2 minggu lalu</p>
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold">
                                    Terlindungi
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:flex">
                            <Link
                                href="/pasien/akun#informasi-akun"
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[10px] font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                Ubah nama atau email
                            </Link>
                            <Link
                                href="/pasien/akun#kata-sandi"
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
                    <section aria-labelledby="aktivitas-profil" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="aktivitas-profil" className="text-[15px] font-bold">
                                Aktivitas konsultasi
                            </h2>
                            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] rounded-full px-2.5 py-1 text-[9px] font-bold">
                                {totalKonsultasi} selesai
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Terhindarkan</p>
                                <p className="text-tk-green-500 dark:text-tk-accent mt-1 text-xl font-semibold">{rujukanTerhindarkan}</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Dirujuk</p>
                                <p className="text-tk-warning mt-1 text-xl font-semibold">{rujukan}</p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] p-3">
                            <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Konsultasi terakhir</p>
                            <p className="mt-1 text-[11px] font-bold">{konsultasiTerakhir.hasil.icd10Nama}</p>
                            <p className="mt-0.5 text-[9px] text-[var(--tk-muted)]">
                                {konsultasiTerakhir.tanggalSingkat} · {konsultasiTerakhir.dokter}
                            </p>
                        </div>

                        <Link
                            href="/pasien/riwayat"
                            className="text-tk-green-500 dark:text-tk-accent mt-3 inline-flex min-h-9 items-center gap-0.5 text-[10px] font-semibold"
                        >
                            Lihat semua riwayat
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </section>

                    <section aria-labelledby="kelengkapan-profil" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="kelengkapan-profil" className="text-[15px] font-bold">
                                Kelengkapan profil
                            </h2>
                            <span className="text-tk-green-500 dark:text-tk-accent text-[10px] font-bold">Lengkap</span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]">
                            <div className="bg-tk-green-500 dark:bg-tk-accent h-full w-full rounded-full" />
                        </div>

                        <p className="mt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Identitas, kontak darurat, dan ringkasan kesehatan sudah tersedia untuk mendukung skrining.
                        </p>
                    </section>

                    <section aria-labelledby="akses-cepat-profil" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="akses-cepat-profil" className="text-[15px] font-bold">
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

                    <section aria-label="Privasi profil" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                            <Lock className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Data pribadi Anda</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Profil dan riwayat konsultasi hanya dapat diakses oleh Anda dan tim kesehatan yang menangani.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Bantuan puskesmas" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                            <Phone className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Perlu memperbarui data?</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hubungi perawat Puskesmas Pulau Karang saat berkunjung atau sebelum jadwal skrining.
                            </p>
                        </div>
                    </section>

                    <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Semua data pada profil ini adalah data fiktif untuk prototipe TeleKarang.
                    </p>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
