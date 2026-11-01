import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Eye,
    EyeOff,
    LayoutGrid,
    Stethoscope,
    TrendingUp,
    Users,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';

import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

type StatusKonsultasi = 'MENUNGGU_SKRINING' | 'SKRINING_SELESAI' | 'MENUNGGU_SPESIALIS';

interface AntreanItem {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    waktu: string;
    keluhan: string;
    status: StatusKonsultasi;
    prioritas: 'normal' | 'merah';
}

interface TindakLanjutItem {
    id: number;
    nama: string;
    diagnosisKode: string;
    diagnosisNama: string;
    keputusanRujuk: boolean;
    tanggal: string;
    dokter: string;
}

interface BerandaPerawatProps {
    ringkasan: {
        rujukanTerhindarkan: number;
        totalRujukan: number;
        persentase: number;
        antreanHariIni: number;
        menungguTindakLanjut: number;
    };
    antrean: AntreanItem[];
    tindakLanjut: TindakLanjutItem[];
}

const statusMeta: Record<StatusKonsultasi, { label: string; tone: string }> = {
    MENUNGGU_SKRINING: { label: 'Belum diskrining', tone: 'bg-tk-warning/15 text-tk-warning' },
    SKRINING_SELESAI: { label: 'Skrining selesai', tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent' },
    MENUNGGU_SPESIALIS: { label: 'Menunggu spesialis', tone: 'bg-tk-info/15 text-tk-info' },
};

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const quickActions = [
    { label: 'Skrining', href: '/perawat/permintaan', icon: ClipboardList },
    { label: 'Pasien', href: '/perawat/pasien', icon: Users },
    { label: 'Jadwal', href: '/perawat/jadwal', icon: CalendarDays },
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

export default function BerandaPerawat({ ringkasan, antrean, tindakLanjut }: BerandaPerawatProps) {
    const [showAngka, setShowAngka] = useState(true);
    const [showMore, setShowMore] = useState(false);

    return (
        <PerawatAppLayout
            active="beranda"
            title="Beranda perawat"
            description="Pantau antrean skrining, tindak lanjut hasil, dan rujukan yang berhasil dihindarkan hari ini."
        >
            <Head title="Dasbor perawat" />

            <section aria-label="Ringkasan utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    aria-labelledby="ringkasan-utama"
                    className={cn(
                        'relative overflow-hidden rounded-[22px] p-5 shadow-[0_18px_45px_rgba(4,16,14,0.10)] sm:col-span-2 xl:col-span-1',
                        glass,
                    )}
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-[radial-gradient(circle,rgba(124,199,127,0.28),transparent_65%)]"
                    />

                    <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p id="ringkasan-utama" className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase">
                                    Rujukan terhindarkan
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--tk-muted)]">Bulan ini · {ringkasan.totalRujukan} rujukan</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAngka((value) => !value)}
                                aria-pressed={!showAngka}
                                aria-label={showAngka ? 'Sembunyikan angka' : 'Tampilkan angka'}
                                className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                            >
                                {showAngka ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <p className="text-[42px] leading-none font-semibold tracking-[-0.03em]">
                                {showAngka ? ringkasan.rujukanTerhindarkan : '••'}
                            </p>
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                <TrendingUp className="size-3" aria-hidden="true" />+{ringkasan.persentase}%
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[var(--tk-muted)]">pasien tidak perlu naik kapal ke RS rujukan</p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                            <span
                                className="bg-tk-green-500 dark:bg-tk-accent block h-full rounded-full"
                                style={{ width: `${Math.min(ringkasan.persentase, 100)}%` }}
                            />
                        </div>
                    </div>
                </article>

                <Link href="/perawat/permintaan" className={cn('hover:border-tk-green-500/40 rounded-[22px] p-5 transition-colors', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Antrean skrining</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.antreanHariIni}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">pasien menunggu hari ini</p>
                </Link>

                <Link href="/perawat/permintaan" className={cn('hover:border-tk-warning/40 rounded-[22px] p-5 transition-colors', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Menunggu tindak lanjut</p>
                    <p className="text-tk-warning mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.menungguTindakLanjut}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">hasil konsultasi perlu diproses</p>
                </Link>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Total rujukan</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.totalRujukan}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">dari {ringkasan.persentase}% berhasil dihindarkan</p>
                </article>
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 gap-6">
                    <section aria-label="Ajakan membuka antrean">
                        <div className={cn('relative overflow-hidden rounded-[24px] p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-xl"
                            />
                            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Antrean hari ini</p>
                                    <p className="text-tk-deep mt-1 max-w-[34ch] text-xl leading-tight font-extrabold">
                                        {ringkasan.antreanHariIni} pasien menunggu skrining perawat.
                                    </p>
                                    <p className="text-tk-deep/75 mt-1.5 max-w-[52ch] text-xs">
                                        Skrining lengkap membuka akses konsultasi ke dokter spesialis dan menjaga data tetap akurat.
                                    </p>
                                </div>
                                <Link
                                    href="/perawat/permintaan"
                                    className="bg-tk-deep text-tk-mint inline-flex min-h-10 shrink-0 items-center gap-1 self-start rounded-full px-5 text-xs font-semibold sm:self-auto"
                                >
                                    Buka antrean
                                    <ChevronRight className="size-4" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="antrean-skrining">
                        <SectionHeading title="Antrean skrining hari ini" href="/perawat/permintaan" action="Lihat semua" />

                        <div className="grid gap-3">
                            {antrean.map((item) => {
                                const status = statusMeta[item.status];
                                const isPrioritas = item.prioritas === 'merah';

                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            'relative overflow-hidden rounded-[20px] p-4 lg:p-5',
                                            glass,
                                            isPrioritas && 'border-tk-danger/40 bg-tk-danger/[0.04]',
                                        )}
                                    >
                                        {isPrioritas && <span aria-hidden="true" className="bg-tk-danger absolute inset-y-0 left-0 w-1" />}

                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                            <div className="flex min-w-0 items-start gap-3 lg:w-[32%]">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full font-bold">
                                                    {item.nama
                                                        .split(' ')
                                                        .slice(0, 2)
                                                        .map((part) => part.charAt(0).toUpperCase())
                                                        .join('')}
                                                </span>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-sm font-bold">{item.nama}</p>
                                                        {isPrioritas && (
                                                            <span className="bg-tk-danger/15 text-tk-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                                                                <AlertTriangle className="size-3" aria-hidden="true" />
                                                                Prioritas merah
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {item.waktu}{' '}
                                                        WITA
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1 lg:border-l lg:border-[var(--tk-glass-border)] lg:pl-5">
                                                <p className="line-clamp-2 text-xs leading-relaxed text-[var(--tk-muted)]">{item.keluhan}</p>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 lg:w-[210px] lg:shrink-0 lg:flex-col lg:items-end">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                        status.tone,
                                                    )}
                                                >
                                                    <Clock className="size-3" aria-hidden="true" />
                                                    {status.label}
                                                </span>

                                                <Link
                                                    href={
                                                        item.status === 'MENUNGGU_SKRINING'
                                                            ? `/perawat/skrining/${item.id}`
                                                            : `/perawat/konsultasi/${item.id}`
                                                    }
                                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors"
                                                >
                                                    {item.status === 'MENUNGGU_SKRINING' ? 'Isi skrining' : 'Lihat permintaan'}
                                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-labelledby="tindak-lanjut">
                        <SectionHeading title="Tindak lanjut hasil konsultasi" href="/perawat/permintaan" action="Semua hasil" />

                        <div className="grid gap-3">
                            {tindakLanjut.map((item) => (
                                <article key={item.id} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                            <span
                                                className={cn(
                                                    'grid size-10 shrink-0 place-items-center rounded-full',
                                                    item.keputusanRujuk
                                                        ? 'bg-tk-warning/15 text-tk-warning'
                                                        : 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
                                                )}
                                            >
                                                {item.keputusanRujuk ? (
                                                    <ArrowUpRight className="size-5" aria-hidden="true" />
                                                ) : (
                                                    <CheckCircle2 className="size-5" aria-hidden="true" />
                                                )}
                                            </span>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <p className="text-sm font-bold">{item.nama}</p>
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                            item.keputusanRujuk
                                                                ? 'bg-tk-warning/15 text-tk-warning'
                                                                : 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
                                                        )}
                                                    >
                                                        {item.keputusanRujuk ? 'Perlu rujuk' : 'Tidak dirujuk'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-[11px] font-semibold text-[var(--tk-text)]">
                                                    {item.diagnosisKode} · {item.diagnosisNama}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                    {item.tanggal} · {item.dokter}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/perawat/tindak-lanjut/${item.id}`}
                                            className="inline-flex min-h-9 shrink-0 items-center gap-1 self-start rounded-full border border-[var(--tk-glass-border)] px-4 text-xs font-semibold sm:self-auto"
                                        >
                                            Tindak lanjut
                                            <ChevronRight className="size-3.5" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="grid content-start gap-5">
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
                                <Link
                                    href="/perawat/konsultasi/baru"
                                    className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium"
                                >
                                    Ajukan konsultasi baru
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/perawat/pasien" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Daftarkan pasien
                                    <ChevronRight className="size-4 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                                <Link href="/settings/profile" className="flex min-h-11 items-center justify-between rounded-xl px-2 font-medium">
                                    Pengaturan akun
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
                            <p className="text-xs font-bold">Sinyal lemah saat skrining?</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                Data tersimpan sebagai draf dan terkirim otomatis saat koneksi kembali. Konsultasi bisa dilanjutkan lewat teks dan
                                foto.
                            </p>
                        </div>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-5', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Stethoscope className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            Skrining hanya dapat diisi perawat. Pasien melihat hasilnya secara read-only.
                        </p>
                    </section>
                </div>
            </div>
        </PerawatAppLayout>
    );
}
