import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronRight,
    Clock,
    Info,
    MapPin,
    MessageSquare,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Stethoscope,
    Video,
} from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { konsultasiPasien, modeKonsultasiLabels, statusKonsultasiLabels } from '@/data/konsultasi-pasien';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';

type FilterHasil = 'semua' | 'terhindarkan' | 'rujukan';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const filterHasil: Array<{ key: FilterHasil; label: string }> = [
    { key: 'semua', label: 'Semua' },
    { key: 'terhindarkan', label: 'Rujukan terhindarkan' },
    { key: 'rujukan', label: 'Dirujuk' },
];

function inisial(nama: string): string {
    return (
        nama
            .replace(/^dr\.?\s+/i, '')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((bagian) => bagian.charAt(0).toUpperCase())
            .join('') || 'DR'
    );
}

export default function RiwayatKonsultasi() {
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState<FilterHasil>('semua');

    const total = konsultasiPasien.length;
    const terhindarkan = konsultasiPasien.filter((item) => !item.hasil.keputusanRujuk).length;
    const dirujuk = total - terhindarkan;
    const persenTerhindarkan = total > 0 ? Math.round((terhindarkan / total) * 100) : 0;

    const kataKunci = q.trim().toLowerCase();
    const tersaring = konsultasiPasien.filter((item) => {
        const cocokPencarian =
            kataKunci.length === 0 ||
            [item.dokter, item.spesialisasi, item.hasil.icd10Kode, item.hasil.icd10Nama, item.keluhan].join(' ').toLowerCase().includes(kataKunci);

        const cocokFilter =
            filter === 'semua' || (filter === 'terhindarkan' && !item.hasil.keputusanRujuk) || (filter === 'rujukan' && item.hasil.keputusanRujuk);

        return cocokPencarian && cocokFilter;
    });

    const filterAktif = kataKunci.length > 0 || filter !== 'semua';

    function resetFilter() {
        setQ('');
        setFilter('semua');
    }

    return (
        <PasienAppLayout
            active="riwayat"
            title="Riwayat konsultasi"
            description="Lihat kembali konsultasi yang sudah selesai, diagnosis, keputusan rujukan, dan tindak lanjutnya."
        >
            <Head title="Riwayat konsultasi" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="ringkasan-riwayat" className={cn('relative overflow-hidden rounded-[26px] p-5 md:p-6', bannerGradient)}>
                        <div aria-hidden="true" className="pointer-events-none absolute -top-14 -right-8 size-44 rounded-full bg-white/25 blur-2xl" />
                        <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <div>
                                <p className="text-tk-deep/70 text-[10px] font-bold tracking-[0.14em] uppercase">Total konsultasi</p>
                                <p className="text-tk-deep mt-1 text-[40px] leading-none font-semibold tracking-[-0.04em]">{total}</p>
                                <p className="text-tk-deep/75 mt-2 max-w-[44ch] text-xs leading-relaxed">
                                    {terhindarkan} dari {total} konsultasi selesai tanpa rujukan ke daratan.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-tk-deep/10 rounded-2xl p-3">
                                    <p className="text-tk-deep/65 text-[9px] font-semibold tracking-[0.08em] uppercase">Terhindarkan</p>
                                    <p className="text-tk-deep mt-1 text-xl font-bold">{terhindarkan}</p>
                                </div>
                                <div className="bg-tk-deep/10 rounded-2xl p-3">
                                    <p className="text-tk-deep/65 text-[9px] font-semibold tracking-[0.08em] uppercase">Dirujuk</p>
                                    <p className="text-tk-deep mt-1 text-xl font-bold">{dirujuk}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section aria-label="Filter riwayat" className={cn('rounded-[24px] p-4 md:p-5', glass)}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                                <Input
                                    type="search"
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    placeholder="Cari dokter, diagnosis, atau keluhan..."
                                    aria-label="Cari riwayat konsultasi"
                                    className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                />
                            </div>

                            {filterAktif && (
                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                >
                                    <RotateCcw className="size-3.5" aria-hidden="true" />
                                    Reset filter
                                </button>
                            )}
                        </div>

                        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {filterHasil.map((item) => {
                                const isActive = filter === item.key;

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => setFilter(item.key)}
                                        className={cn(
                                            'min-h-9 shrink-0 rounded-full border px-3.5 text-[10px] font-semibold transition-colors',
                                            isActive
                                                ? 'bg-tk-accent text-tk-deep border-transparent'
                                                : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-labelledby="daftar-riwayat">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 id="daftar-riwayat" className="text-[17px] font-bold">
                                    Konsultasi selesai
                                </h2>
                                <p aria-live="polite" className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                    {tersaring.length} dari {total} konsultasi ditampilkan
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <Clock className="size-3" aria-hidden="true" />
                                Terbaru lebih dulu
                            </span>
                        </div>

                        {tersaring.length > 0 ? (
                            <div className="grid gap-3">
                                {tersaring.map((item) => {
                                    const dirujukItem = item.hasil.keputusanRujuk;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/pasien/konsultasi/${item.id}`}
                                            className={cn('group hover:border-tk-accent/45 block rounded-[22px] p-4 transition-colors md:p-5', glass)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-tk-mint grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[11px] font-extrabold">
                                                    {inisial(item.dokter)}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-[13px] font-bold">{item.dokter}</p>
                                                        <span
                                                            className={cn(
                                                                'rounded-full px-2 py-0.5 text-[9px] font-bold',
                                                                dirujukItem
                                                                    ? 'bg-tk-warning/15 text-tk-warning'
                                                                    : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                                            )}
                                                        >
                                                            {dirujukItem ? 'Dirujuk' : 'Rujukan terhindarkan'}
                                                        </span>
                                                    </div>
                                                    <p className="text-tk-green-500 dark:text-tk-accent mt-0.5 text-[10px] font-semibold">
                                                        Spesialis {item.spesialisasi}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--tk-muted)]">
                                                        <span className="inline-flex items-center gap-1">
                                                            <CalendarDays className="size-3" aria-hidden="true" />
                                                            {item.tanggalSingkat}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            {item.mode === 'video' ? (
                                                                <Video className="size-3" aria-hidden="true" />
                                                            ) : (
                                                                <MessageSquare className="size-3" aria-hidden="true" />
                                                            )}
                                                            {modeKonsultasiLabels[item.mode]}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <MapPin className="size-3" aria-hidden="true" />
                                                            {item.faskes}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="text-tk-muted group-hover:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] transition-colors">
                                                    <ChevronRight className="size-4" aria-hidden="true" />
                                                </span>
                                            </div>

                                            <div className="mt-3 rounded-xl bg-[var(--tk-page-alt)] p-3">
                                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                    Diagnosis ICD-10
                                                </p>
                                                <p className="mt-1 text-[11px] font-bold">
                                                    <span className="bg-tk-deep text-tk-mint mr-2 rounded px-1.5 py-0.5 font-mono text-[9px]">
                                                        {item.hasil.icd10Kode}
                                                    </span>
                                                    {item.hasil.icd10Nama}
                                                </p>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <p className="line-clamp-1 text-[10px] text-[var(--tk-muted)]">Keluhan: {item.keluhan}</p>
                                                <span className="text-tk-green-500 dark:text-tk-accent inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold">
                                                    Lihat detail
                                                    <ChevronRight className="size-3" aria-hidden="true" />
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={cn('grid place-items-center rounded-[24px] px-6 py-14 text-center', glass)}>
                                <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                    <Search className="size-5" aria-hidden="true" />
                                </span>
                                <p className="mt-3 text-sm font-bold">Riwayat tidak ditemukan</p>
                                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Coba kata kunci lain atau tampilkan semua konsultasi.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className="border-tk-green-500/35 text-tk-green-500 dark:text-tk-accent mt-4 min-h-10 rounded-full border px-4 text-[11px] font-semibold"
                                >
                                    Tampilkan semua
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="statistik-riwayat" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="statistik-riwayat" className="text-[15px] font-bold">
                            Dampak konsultasi
                        </h2>

                        <div className="mt-4 flex items-end gap-2">
                            <p className="text-tk-green-500 dark:text-tk-accent text-[36px] leading-none font-semibold tracking-[-0.03em]">
                                {persenTerhindarkan}%
                            </p>
                            <p className="pb-1 text-[10px] leading-tight text-[var(--tk-muted)]">
                                rujukan berhasil
                                <br />
                                dihindarkan
                            </p>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]">
                            <div className="bg-tk-green-500 dark:bg-tk-accent h-full rounded-full" style={{ width: `${persenTerhindarkan}%` }} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Selesai</p>
                                <p className="mt-1 text-lg font-bold">{total}</p>
                            </div>
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Dirujuk</p>
                                <p className="text-tk-warning mt-1 text-lg font-bold">{dirujuk}</p>
                            </div>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Rujukan terhindarkan dihitung dari konsultasi yang selesai tanpa keputusan rujuk.
                        </p>
                    </section>

                    <section aria-label="Ajakan konsultasi baru" className={cn('relative overflow-hidden rounded-[24px] p-5', bannerGradient)}>
                        <div aria-hidden="true" className="pointer-events-none absolute -top-8 -right-6 size-28 rounded-full bg-white/25 blur-xl" />
                        <div className="relative">
                            <p className="text-tk-deep/70 text-[10px] font-semibold tracking-[0.14em] uppercase">Butuh konsultasi lagi?</p>
                            <p className="text-tk-deep mt-1 max-w-[28ch] text-lg leading-tight font-extrabold">
                                Pilih jadwal spesialis tanpa naik kapal.
                            </p>
                            <Link
                                href="/pasien/konsultasi/baru"
                                className="bg-tk-deep text-tk-mint mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                            >
                                <Plus className="size-3.5" aria-hidden="true" />
                                Buat permintaan
                            </Link>
                        </div>
                    </section>

                    <section aria-labelledby="arti-status" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="arti-status" className="text-[15px] font-bold">
                            Arti keputusan
                        </h2>
                        <div className="mt-4 grid gap-3">
                            <div className="flex items-start gap-2.5">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold">Rujukan terhindarkan</p>
                                    <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                        Kondisi dapat ditangani di puskesmas dan pasien tidak perlu ke daratan.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-8 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold">Dirujuk</p>
                                    <p className="mt-0.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                        Spesialis menilai pasien perlu pemeriksaan atau tindakan di fasilitas rujukan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section aria-label="Privasi riwayat" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Riwayat hanya milik Anda</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Pasien lain tidak dapat melihat diagnosis, skrining, atau percakapan konsultasi ini.
                            </p>
                        </div>
                    </section>

                    <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Status terakhir: {tersaring.length > 0 ? statusKonsultasiLabels[tersaring[0].status] : 'Tidak ada data'}.
                    </p>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
