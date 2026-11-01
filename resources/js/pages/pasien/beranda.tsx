import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock, History, LayoutGrid, MapPin, Plus, ShieldCheck, Stethoscope, Wifi } from 'lucide-react';
import { useState } from 'react';

import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';

type StatusKonsultasi = 'MENUNGGU_SKRINING' | 'SKRINING_SELESAI' | 'MENUNGGU_SPESIALIS' | 'DIKONFIRMASI' | 'BERLANGSUNG' | 'SELESAI';

interface KonsultasiAktif {
    id: number;
    status: StatusKonsultasi;
    keluhan: string;
    dokter: string;
    spesialisasi: string;
    jadwal: string;
}

interface Dokter {
    id: number;
    nama: string;
    spesialisasi: string;
    slot: string;
    faskes: string;
    status: 'tersedia' | 'terisi' | 'libur';
}

interface RiwayatItem {
    id: number;
    tanggal: string;
    dokter: string;
    diagnosisKode: string;
    diagnosisNama: string;
    keputusanRujuk: boolean;
}

interface BerandaPasienProps {
    konsultasiAktif: KonsultasiAktif | null;
    ringkasan: {
        totalKonsultasi: number;
        rujukanTerhindarkan: number;
    };
    dokter: Dokter[];
    riwayat: RiwayatItem[];
}

const statusMeta: Record<StatusKonsultasi, { label: string; step: number; tone: string }> = {
    MENUNGGU_SKRINING: { label: 'Menunggu skrining', step: 1, tone: 'text-tk-warning' },
    SKRINING_SELESAI: { label: 'Skrining selesai', step: 2, tone: 'text-tk-green-500 dark:text-tk-accent' },
    MENUNGGU_SPESIALIS: { label: 'Menunggu dokter spesialis', step: 2, tone: 'text-tk-info' },
    DIKONFIRMASI: { label: 'Dikonfirmasi spesialis', step: 3, tone: 'text-tk-info' },
    BERLANGSUNG: { label: 'Konsultasi berlangsung', step: 3, tone: 'text-tk-green-500 dark:text-tk-accent' },
    SELESAI: { label: 'Selesai', step: 4, tone: 'text-tk-green-500 dark:text-tk-accent' },
};

const langkahKonsultasi = ['Skrining', 'Review dokter', 'Spesialis', 'Hasil'];

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const accentChip = 'bg-tk-accent text-tk-deep';

const spesialisasiFilters = ['Semua', 'Anak', 'Penyakit Dalam', 'Kulit', 'Kandungan'];

const quickActions = [
    { label: 'Buat Konsultasi', href: '/pasien/konsultasi/baru', icon: Plus },
    { label: 'Jadwal', href: '/pasien/jadwal', icon: CalendarDays },
    { label: 'Riwayat', href: '/pasien/riwayat', icon: History },
];

function SectionHeading({ title, href, action }: { title: string; href?: string; action?: string }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold">{title}</h2>
            {href && action && (
                <Link href={href} className="text-tk-green-500 dark:text-tk-accent inline-flex items-center gap-0.5 text-xs font-semibold">
                    {action}
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
            )}
        </div>
    );
}

export default function BerandaPasien({ konsultasiAktif, ringkasan, dokter, riwayat }: BerandaPasienProps) {
    const [filter, setFilter] = useState('Semua');
    const [showMore, setShowMore] = useState(false);

    const dokterTersaring = filter === 'Semua' ? dokter : dokter.filter((item) => item.spesialisasi === filter);
    const status = konsultasiAktif ? statusMeta[konsultasiAktif.status] : null;

    return (
        <PasienAppLayout
            active="beranda"
            title="Beranda pasien"
            description="Pantau permintaan konsultasi, temukan jadwal dokter spesialis, dan lihat hasil konsultasi Anda."
        >
            <Head title="Beranda pasien" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-6">
                    <section
                        aria-labelledby="permintaan-aktif"
                        className="relative overflow-hidden rounded-[24px] border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] p-5 shadow-[0_18px_45px_rgba(4,16,14,0.10)] backdrop-blur-[16px] lg:p-6"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(124,199,127,0.28),transparent_65%)]"
                        />

                        <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase" id="permintaan-aktif">
                                        Permintaan aktif
                                    </p>
                                    {konsultasiAktif && status ? (
                                        <p className={cn('mt-1 text-xl leading-tight font-bold', status.tone)}>{status.label}</p>
                                    ) : (
                                        <p className="mt-1 text-xl leading-tight font-bold">Belum ada permintaan</p>
                                    )}
                                </div>
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:text-tk-accent dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-5" aria-hidden="true" />
                                </span>
                            </div>

                            {konsultasiAktif && status ? (
                                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                                    <div>
                                        <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                            <p className="text-[15px] font-bold">{konsultasiAktif.dokter}</p>
                                            <p className="text-tk-green-500 dark:text-tk-accent text-xs font-semibold">
                                                {konsultasiAktif.spesialisasi}
                                            </p>
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--tk-muted)]">
                                                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                                                {konsultasiAktif.jadwal}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--tk-muted)]">Keluhan: {konsultasiAktif.keluhan}</p>
                                        </div>

                                        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--tk-muted)]">
                                            <ShieldCheck
                                                className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0"
                                                aria-hidden="true"
                                            />
                                            Datang ke puskesmas untuk skrining agar permintaan dapat diteruskan ke dokter spesialis.
                                        </p>
                                    </div>

                                    <div className="flex flex-col justify-between gap-4">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--tk-muted)]">
                                                <span>
                                                    Langkah {status.step} dari {langkahKonsultasi.length}
                                                </span>
                                                <span>{langkahKonsultasi[status.step - 1]}</span>
                                            </div>
                                            <div className="mt-2 flex gap-1" aria-hidden="true">
                                                {langkahKonsultasi.map((langkah, index) => (
                                                    <span
                                                        key={langkah}
                                                        className={cn(
                                                            'h-2 flex-1 rounded-full',
                                                            index < status.step ? 'bg-tk-green-500 dark:bg-tk-accent' : 'bg-[var(--tk-glass-border)]',
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <Link
                                            href={`/pasien/konsultasi/${konsultasiAktif.id}`}
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors"
                                        >
                                            Lihat detail permintaan
                                            <ChevronRight className="size-4" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <p className="max-w-[52ch] text-sm text-[var(--tk-muted)]">
                                        Buat permintaan baru, lalu lakukan skrining di puskesmas sebelum dikirim ke dokter spesialis.
                                    </p>
                                    <Link
                                        href="/pasien/konsultasi/baru"
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors"
                                    >
                                        <Plus className="size-4" aria-hidden="true" />
                                        Buat permintaan
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    <section aria-label="Ajakan konsultasi">
                        <div className={cn('relative overflow-hidden rounded-[24px] p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-xl"
                            />
                            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Konsultasi jarak jauh</p>
                                    <p className="text-tk-deep mt-1 max-w-[34ch] text-xl leading-tight font-extrabold">
                                        Spesialis bisa dijangkau tanpa naik kapal.
                                    </p>
                                    <p className="text-tk-deep/75 mt-1.5 max-w-[50ch] text-xs">
                                        Pilih jadwal dokter, lalu perawat akan menyiapkan skrining sebelum konsultasi.
                                    </p>
                                </div>
                                <Link
                                    href="/pasien/konsultasi/baru"
                                    className="bg-tk-deep text-tk-mint inline-flex min-h-10 shrink-0 items-center gap-1 self-start rounded-full px-5 text-xs font-semibold sm:self-auto"
                                >
                                    Mulai konsultasi
                                    <ChevronRight className="size-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="spesialis-tersedia">
                        <SectionHeading title="Spesialis tersedia" href="/pasien/jadwal" action="Semua jadwal" />

                        <div className="flex flex-wrap gap-2">
                            {spesialisasiFilters.map((item) => {
                                const isActive = filter === item;

                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => setFilter(item)}
                                        className={cn(
                                            'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors',
                                            isActive
                                                ? cn(accentChip, 'border-transparent')
                                                : 'border-[var(--tk-glass-border)] bg-[var(--tk-glass)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                        )}
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>

                        {dokterTersaring.length > 0 ? (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {dokterTersaring.map((item) => (
                                    <article key={item.id} className={cn('rounded-[22px] p-3', glass)}>
                                        <div className="relative h-[96px] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)]">
                                            <span className="text-tk-deep/70 absolute inset-0 grid place-items-center text-2xl font-extrabold">
                                                {item.nama
                                                    .replace(/^dr\.\s*/i, '')
                                                    .split(' ')[0]
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                            <span
                                                className={cn(
                                                    'absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                    item.status === 'tersedia'
                                                        ? 'bg-tk-deep/35 text-tk-mint'
                                                        : item.status === 'terisi'
                                                          ? 'bg-tk-warning/25 text-tk-deep'
                                                          : 'bg-tk-deep/35 text-white/70',
                                                )}
                                            >
                                                {item.status === 'tersedia' ? 'Tersedia' : item.status === 'terisi' ? 'Terisi' : 'Libur'}
                                            </span>
                                        </div>

                                        <p className="mt-3 truncate text-[13px] font-bold">{item.nama}</p>
                                        <p className="text-tk-green-500 dark:text-tk-accent truncate text-[11px] font-semibold">
                                            {item.spesialisasi}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                            <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                            {item.faskes}
                                        </p>

                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-semibold text-[var(--tk-muted)]">{item.slot}</span>
                                            <Link
                                                href={`/pasien/konsultasi/baru?dokter=${item.id}`}
                                                aria-label={`Pilih jadwal ${item.nama}`}
                                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint grid size-8 place-items-center rounded-full transition-colors"
                                            >
                                                <ChevronRight className="size-4" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className={cn('mt-4 rounded-2xl p-4 text-sm text-[var(--tk-muted)]', glass)}>
                                Belum ada jadwal untuk spesialisasi ini. Coba pilih filter lain.
                            </p>
                        )}
                    </section>

                    {riwayat.length > 0 && (
                        <section aria-labelledby="riwayat-terakhir">
                            <SectionHeading title="Riwayat terakhir" href="/pasien/riwayat" action="Lihat semua" />

                            <div className={cn('divide-y divide-[var(--tk-glass-border)] overflow-hidden rounded-[22px]', glass)}>
                                {riwayat.map((item) => (
                                    <article key={item.id} className="p-4 lg:px-5">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                                <CheckCircle2 className="size-5" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <p className="text-sm font-bold">
                                                        {item.diagnosisKode} · {item.diagnosisNama}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                            item.keputusanRujuk
                                                                ? 'bg-tk-warning/15 text-tk-warning'
                                                                : 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
                                                        )}
                                                    >
                                                        {item.keputusanRujuk ? 'Dirujuk' : 'Tidak dirujuk'}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                    {item.tanggal} · {item.dokter}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="grid content-start gap-5">
                    <section aria-label="Ringkasan konsultasi" className="grid grid-cols-2 gap-3">
                        <div className={cn('rounded-[20px] p-4', glass)}>
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Konsultasi selesai</p>
                            <p className="mt-2 text-[32px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.totalKonsultasi}</p>
                        </div>
                        <div className={cn('rounded-[20px] p-4', glass)}>
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Rujukan terhindarkan</p>
                            <p className="text-tk-green-500 dark:text-tk-accent mt-2 text-[32px] leading-none font-semibold tracking-[-0.02em]">
                                {ringkasan.rujukanTerhindarkan}
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="aksi-cepat" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aksi-cepat" className="text-[15px] font-bold">
                            Aksi cepat
                        </h2>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {quickActions.map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex min-h-20 flex-col justify-center gap-2 rounded-2xl px-3 py-3 hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="border-tk-green-500/35 text-tk-green-500 dark:border-tk-accent/40 dark:text-tk-accent grid size-10 place-items-center rounded-full border-[1.5px]">
                                        <Icon className="size-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-[11px] leading-tight font-semibold text-[var(--tk-text)]">{label}</span>
                                </Link>
                            ))}

                            <button
                                type="button"
                                onClick={() => setShowMore((value) => !value)}
                                aria-expanded={showMore}
                                className="flex min-h-20 flex-col justify-center gap-2 rounded-2xl px-3 py-3 text-left hover:bg-[var(--tk-page-alt)]"
                            >
                                <span className="border-tk-green-500/35 text-tk-green-500 dark:border-tk-accent/40 dark:text-tk-accent grid size-10 place-items-center rounded-full border-[1.5px]">
                                    <LayoutGrid className="size-5" aria-hidden="true" />
                                </span>
                                <span className="text-[11px] leading-tight font-semibold text-[var(--tk-text)]">Lainnya</span>
                            </button>
                        </div>

                        {showMore && (
                            <div className="mt-3 grid gap-1 border-t border-[var(--tk-glass-border)] pt-3 text-sm">
                                <Link href="/pasien/profil" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Profil pasien
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/settings/profile" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Pengaturan akun
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Bantuan dan informasi
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </section>

                    <section aria-label="Informasi mode koneksi rendah" className={cn('flex items-start gap-3 rounded-[20px] p-5', glass)}>
                        <span className="text-tk-warning bg-tk-warning/15 grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-xs font-bold">Sinyal lemah?</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                Konsultasi tetap berjalan lewat teks dan foto. Pesan tersimpan dan terkirim otomatis saat sinyal kembali.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
