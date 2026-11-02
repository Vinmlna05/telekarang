import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    History,
    Search,
    ShieldCheck,
    Stethoscope,
    TrendingUp,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

import { konsultasiPerawat } from '@/data/konsultasi-perawat';
import DokterAppLayout from '@/layouts/dokter/dokter-app-layout';
import { cn } from '@/lib/utils';

type Prioritas = 'merah' | 'kuning' | 'normal';
type FilterKey = 'semua' | Prioritas;

interface SkriningItem {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    waktu: string;
    keluhan: string;
    tensi: string;
    suhu: number;
    nadi: number;
    spo2: number;
    prioritas: Prioritas;
    status: string;
    perawat: string;
}

interface ReviewDokterProps {
    ringkasan: {
        menungguReview: number;
        triaseMerah: number;
        dikirimKeSpesialis: number;
        ditanganiDiPuskesmas: number;
    };
    skrining: SkriningItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const dangerGradient = 'bg-[linear-gradient(135deg,#5A1518_0%,#B02A2F_55%,#E5484D_100%)]';

const prioritasMeta: Record<Prioritas, { label: string; tone: string; dot: string }> = {
    merah: {
        label: 'Triage merah',
        tone: 'bg-tk-danger/15 text-tk-danger',
        dot: 'bg-tk-danger',
    },
    kuning: {
        label: 'Perlu perhatian',
        tone: 'bg-tk-warning/15 text-tk-warning',
        dot: 'bg-tk-warning',
    },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
        dot: 'bg-tk-green-500 dark:bg-tk-accent',
    },
};

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export default function ReviewDokter({ ringkasan, skrining }: ReviewDokterProps) {
    const [filter, setFilter] = useState<FilterKey>('semua');
    const [search, setSearch] = useState('');

    const filters: { key: FilterKey; label: string; count: number }[] = [
        { key: 'semua', label: 'Semua', count: skrining.length },
        { key: 'merah', label: 'Triage merah', count: skrining.filter((item) => item.prioritas === 'merah').length },
        { key: 'kuning', label: 'Perlu perhatian', count: skrining.filter((item) => item.prioritas === 'kuning').length },
        { key: 'normal', label: 'Normal', count: skrining.filter((item) => item.prioritas === 'normal').length },
    ];

    const kataKunci = search.trim().toLowerCase();
    const hasil = skrining.filter((item) => {
        const cocokFilter = filter === 'semua' || item.prioritas === filter;
        const cocokCari = kataKunci.length === 0 || item.nama.toLowerCase().includes(kataKunci) || item.keluhan.toLowerCase().includes(kataKunci);

        return cocokFilter && cocokCari;
    });

    const { url } = usePage();
    const tabRiwayat = url.includes('tab=riwayat');
    const hasilSelesai = konsultasiPerawat.filter((item) => item.hasil !== null);
    const jumlahRujuk = hasilSelesai.filter((item) => item.hasil?.keputusanRujuk === true).length;
    const jumlahTerhindarkan = hasilSelesai.length - jumlahRujuk;

    const navigasiTab = (
        <div
            role="tablist"
            aria-label="Bagian review dokter umum"
            className="mb-5 flex w-fit flex-wrap gap-1 rounded-full border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-1"
        >
            <Link
                href="/dokter/review"
                role="tab"
                aria-selected={!tabRiwayat}
                className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[11px] font-semibold transition-colors',
                    !tabRiwayat ? 'bg-tk-accent text-tk-deep' : 'text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                )}
            >
                <ClipboardCheck className="size-3.5" aria-hidden="true" />
                Antrean review
                <span className={cn('text-[10px]', !tabRiwayat ? 'text-tk-deep/70' : 'text-[var(--tk-muted)]')}>{skrining.length}</span>
            </Link>
            <Link
                href="/dokter/review?tab=riwayat"
                role="tab"
                aria-selected={tabRiwayat}
                className={cn(
                    'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[11px] font-semibold transition-colors',
                    tabRiwayat ? 'bg-tk-accent text-tk-deep' : 'text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                )}
            >
                <History className="size-3.5" aria-hidden="true" />
                Riwayat hasil
                <span className={cn('text-[10px]', tabRiwayat ? 'text-tk-deep/70' : 'text-[var(--tk-muted)]')}>{hasilSelesai.length}</span>
            </Link>
        </div>
    );

    if (tabRiwayat) {
        return (
            <DokterAppLayout
                active="riwayat"
                title="Riwayat hasil konsultasi"
                description="Tinjau diagnosis ICD-10, keputusan rujukan, dan verifikasi tindak lanjut pasien yang sudah selesai dikonsultasikan."
            >
                <Head title="Riwayat hasil konsultasi" />

                {navigasiTab}

                <section aria-label="Ringkasan riwayat" className="grid gap-4 sm:grid-cols-3">
                    <article className={cn('rounded-[22px] p-5', glass)}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Total hasil</p>
                                <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{hasilSelesai.length}</p>
                                <p className="mt-2 text-[11px] text-[var(--tk-muted)]">konsultasi selesai</p>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <ClipboardCheck className="size-4" aria-hidden="true" />
                            </span>
                        </div>
                    </article>

                    <article className={cn('rounded-[22px] p-5', glass)}>
                        <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Perlu dirujuk</p>
                        <p className="text-tk-warning mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{jumlahRujuk}</p>
                        <p className="mt-2 text-[11px] text-[var(--tk-muted)]">pasien dirujuk ke RS</p>
                    </article>

                    <article className={cn('rounded-[22px] p-5', glass)}>
                        <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Rujukan terhindarkan</p>
                        <p className="text-tk-green-500 dark:text-tk-accent mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                            {jumlahTerhindarkan}
                        </p>
                        <p className="mt-2 text-[11px] text-[var(--tk-muted)]">cukup ditangani di puskesmas</p>
                    </article>
                </section>

                <section aria-labelledby="daftar-riwayat" className="mt-6 min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h2 id="daftar-riwayat" className="text-[17px] font-bold">
                            Daftar hasil konsultasi
                        </h2>
                        <Link
                            href="/dokter/review"
                            className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                        >
                            <Clock className="size-3.5" aria-hidden="true" />
                            Lihat antrean review
                        </Link>
                    </div>

                    <div className="grid gap-3">
                        {hasilSelesai.length > 0 ? (
                            hasilSelesai.map((item) => {
                                const dirujuk = item.hasil?.keputusanRujuk === true;

                                return (
                                    <article key={item.id} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                                            <div className="flex min-w-0 items-center gap-3 xl:w-[28%]">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold">
                                                    {initials(item.pasien.nama)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-sm font-bold">{item.pasien.nama}</p>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                dirujuk ? 'bg-tk-warning/15 text-tk-warning' : 'bg-tk-success/15 text-tk-success',
                                                            )}
                                                        >
                                                            {dirujuk ? (
                                                                <AlertTriangle className="size-3" aria-hidden="true" />
                                                            ) : (
                                                                <ShieldCheck className="size-3" aria-hidden="true" />
                                                            )}
                                                            {dirujuk ? 'Dirujuk' : 'Tidak dirujuk'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                        {item.pasien.usia} tahun · {item.pasien.noRm}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--tk-muted)]">{item.tanggal}</p>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1 rounded-2xl bg-[var(--tk-page-alt)] px-3.5 py-3">
                                                <p className="text-[11px] font-bold">
                                                    <span className="font-mono">{item.hasil?.icd10Kode}</span> · {item.hasil?.icd10Nama}
                                                </p>
                                                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                                    {item.hasil?.saran}
                                                </p>
                                                <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                    <Stethoscope className="size-3 shrink-0" aria-hidden="true" />
                                                    {item.dokter} · {item.hasil?.waktu}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/dokter/hasil/${item.id}`}
                                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 shrink-0 items-center justify-center gap-1 self-start rounded-full px-4 text-xs font-semibold transition-colors xl:self-center"
                                            >
                                                Lihat hasil
                                                <ChevronRight className="size-3.5" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className={cn('grid justify-items-center gap-2 rounded-[20px] px-4 py-12 text-center', glass)}>
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 place-items-center rounded-full">
                                    <History className="size-6" aria-hidden="true" />
                                </span>
                                <p className="text-sm font-bold">Belum ada hasil konsultasi</p>
                                <p className="max-w-[36ch] text-xs text-[var(--tk-muted)]">
                                    Hasil akan muncul di sini setelah dokter spesialis menyelesaikan konsultasi.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </DokterAppLayout>
        );
    }

    return (
        <DokterAppLayout
            active="review"
            title="Review skrining"
            description="Tinjau hasil skrining perawat dan putuskan apakah pasien perlu diteruskan ke dokter spesialis."
        >
            <Head title="Daftar skrining untuk direview" />

            {navigasiTab}

            <section aria-label="Ringkasan review" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article
                    aria-labelledby="ringkasan-review"
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
                                <p id="ringkasan-review" className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase">
                                    Menunggu review
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--tk-muted)]">Skrining selesai dari perawat</p>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <ClipboardCheck className="size-4" aria-hidden="true" />
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <p className="text-[42px] leading-none font-semibold tracking-[-0.03em]">{ringkasan.menungguReview}</p>
                            <span className="bg-tk-danger/15 text-tk-danger mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                                <AlertTriangle className="size-3" aria-hidden="true" />
                                {ringkasan.triaseMerah} triase merah
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[var(--tk-muted)]">perlu ditinjau lebih dulu sebelum diteruskan</p>
                    </div>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Triase merah</p>
                    <p className="text-tk-danger mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.triaseMerah}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">pasien dengan tanda bahaya</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Dikirim ke spesialis</p>
                    <p className="text-tk-info mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{ringkasan.dikirimKeSpesialis}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">minggu ini</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Ditangani di puskesmas</p>
                    <p className="text-tk-green-500 dark:text-tk-accent mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                        {ringkasan.ditanganiDiPuskesmas}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">minggu ini</p>
                </article>
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.85fr)]">
                <section aria-labelledby="antrean-review" className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id="antrean-review" className="text-[17px] font-bold">
                            Antrean review
                        </h2>
                        <span className="text-[11px] font-semibold text-[var(--tk-muted)]">{hasil.length} skrining</span>
                    </div>

                    <div className={cn('rounded-[20px] p-4', glass)}>
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <label className="relative block w-full xl:max-w-[340px]">
                                <span className="sr-only">Cari pasien atau keluhan</span>
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama pasien atau keluhan"
                                    className="focus:border-tk-green-500/60 focus:ring-tk-green-500/20 h-11 w-full rounded-full border border-[var(--tk-glass-border)] bg-[var(--tk-page)] pr-4 pl-10 text-sm text-[var(--tk-text)] outline-none placeholder:text-[var(--tk-muted)] focus:ring-2"
                                />
                            </label>

                            <div className="flex flex-wrap gap-2">
                                {filters.map((item) => {
                                    const isActive = filter === item.key;

                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() => setFilter(item.key)}
                                            className={cn(
                                                'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold transition-colors',
                                                isActive
                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {item.label}
                                            <span className={cn('ml-1.5', isActive ? 'text-tk-deep/70' : 'text-[var(--tk-muted)]')}>
                                                {item.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3">
                        {hasil.length > 0 ? (
                            hasil.map((item) => {
                                const prioritas = prioritasMeta[item.prioritas];
                                const isMerah = item.prioritas === 'merah';

                                return (
                                    <article
                                        key={item.id}
                                        className={cn(
                                            'relative overflow-hidden rounded-[20px] p-4 lg:p-5',
                                            glass,
                                            isMerah && 'border-tk-danger/40 bg-tk-danger/[0.04]',
                                        )}
                                    >
                                        {isMerah && <span aria-hidden="true" className="bg-tk-danger absolute inset-y-0 left-0 w-1" />}

                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                                            <div className="flex min-w-0 items-center gap-3 xl:w-[27%]">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold">
                                                    {initials(item.nama)}
                                                </span>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-sm font-bold">{item.nama}</p>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                prioritas.tone,
                                                            )}
                                                        >
                                                            <span className={cn('size-1.5 rounded-full', prioritas.dot)} aria-hidden="true" />
                                                            {prioritas.label}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {item.waktu}{' '}
                                                        WITA
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2 rounded-2xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-center xl:w-[32%] xl:shrink-0">
                                                <div>
                                                    <p className="text-[9px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">Tensi</p>
                                                    <p className="mt-0.5 text-[11px] font-bold">{item.tensi}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">Suhu</p>
                                                    <p className="mt-0.5 text-[11px] font-bold">{item.suhu.toFixed(1)}°C</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">Nadi</p>
                                                    <p className="mt-0.5 text-[11px] font-bold">{item.nadi}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">SpO₂</p>
                                                    <p className="mt-0.5 text-[11px] font-bold">{item.spo2}%</p>
                                                </div>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                {isMerah && (
                                                    <p className="bg-tk-danger/10 text-tk-danger mb-2 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold">
                                                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                                        Tanda bahaya terdeteksi. Tinjau dan putuskan rujukan segera.
                                                    </p>
                                                )}

                                                <p className="line-clamp-2 text-xs leading-relaxed text-[var(--tk-muted)]">{item.keluhan}</p>
                                                <span className="text-tk-green-500 dark:text-tk-accent mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold">
                                                    <ShieldCheck className="size-3" aria-hidden="true" />
                                                    Skrining lengkap · {item.perawat}
                                                </span>
                                            </div>

                                            <Link
                                                href={`/dokter/review/${item.id}`}
                                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 shrink-0 items-center justify-center gap-1 self-start rounded-full px-4 text-xs font-semibold transition-colors xl:self-center"
                                            >
                                                Review
                                                <ChevronRight className="size-3.5" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className={cn('grid justify-items-center gap-2 rounded-[20px] px-4 py-12 text-center', glass)}>
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 place-items-center rounded-full">
                                    <CheckCircle2 className="size-6" aria-hidden="true" />
                                </span>
                                <p className="text-sm font-bold">Tidak ada skrining yang cocok</p>
                                <p className="max-w-[36ch] text-xs text-[var(--tk-muted)]">
                                    Ubah filter atau kata kunci pencarian untuk melihat antrean lainnya.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="grid content-start gap-5">
                    {ringkasan.triaseMerah > 0 && (
                        <section aria-label="Peringatan triase merah">
                            <div className={cn('relative overflow-hidden rounded-[24px] p-5 text-white', dangerGradient)}>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full bg-white/15 blur-xl"
                                />
                                <div className="relative">
                                    <span className="grid size-10 place-items-center rounded-full bg-white/15">
                                        <AlertTriangle className="size-5" aria-hidden="true" />
                                    </span>
                                    <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
                                        Perlu ditinjau lebih dulu
                                    </p>
                                    <p className="mt-1 text-lg leading-tight font-extrabold">{ringkasan.triaseMerah} pasien dengan tanda bahaya.</p>
                                    <p className="mt-1.5 max-w-[42ch] text-xs text-white/80">
                                        Skrining menunjukkan tanda bahaya. Segera review untuk memutuskan rujukan darurat.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setFilter('merah')}
                                        className="bg-tk-deep text-tk-mint mt-4 inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-xs font-semibold"
                                    >
                                        Lihat triase merah
                                        <ChevronRight className="size-3.5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-2">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                <Stethoscope className="size-4" aria-hidden="true" />
                            </span>
                            <h2 className="text-[15px] font-bold">Keputusan dokter umum</h2>
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            Keputusanmu menentukan apakah pasien cukup ditangani di puskesmas atau perlu dirujuk ke dokter spesialis.
                        </p>

                        <div className="mt-4 grid gap-2 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                Gerbang skrining lengkap
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3" aria-hidden="true" />
                                Rata-rata tunggu 2 jam
                            </span>
                        </div>
                    </section>

                    <section className={cn('rounded-[20px] p-5', glass)}>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--tk-muted)]">
                            <span className="inline-flex items-center gap-1">
                                <TrendingUp className="size-3" aria-hidden="true" />
                                Data masuk ke dasbor rujukan terhindarkan
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                                <UserRound className="size-3" aria-hidden="true" />
                                Data fiktif
                            </span>
                        </div>
                    </section>
                </aside>
            </div>
        </DokterAppLayout>
    );
}
