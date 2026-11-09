import { Head, Link } from '@inertiajs/react';
import { Bell, CheckCheck, ChevronRight, FileText, MapPin, Pill, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useState } from 'react';

import { formatWaktuNotifikasi, labelTipeNotifikasi, type NotifikasiItem, type TipeNotifikasi } from '@/data/notifikasi';
import { useNotifikasi } from '@/hooks/use-notifikasi';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const ikonTipe: Record<TipeNotifikasi, LucideIcon> = {
    HASIL_SPESIALIS: FileText,
    RESEP_OBAT: Pill,
    RUJUKAN: MapPin,
    TIDAK_DIRUJUK: ShieldCheck,
    OBAT_DIBERIKAN: CheckCheck,
};

type FilterNotifikasi = 'semua' | 'belum' | 'hasil' | 'resep' | 'rujukan';

const filterNotifikasi: Array<{ key: FilterNotifikasi; label: string }> = [
    { key: 'semua', label: 'Semua' },
    { key: 'belum', label: 'Belum dibaca' },
    { key: 'hasil', label: 'Hasil konsultasi' },
    { key: 'resep', label: 'Resep obat' },
    { key: 'rujukan', label: 'Rujukan' },
];

function cocokFilter(item: NotifikasiItem, filter: FilterNotifikasi): boolean {
    if (filter === 'belum') {
        return !item.dibaca;
    }

    if (filter === 'hasil') {
        return item.tipe === 'HASIL_SPESIALIS' || item.tipe === 'TIDAK_DIRUJUK' || item.tipe === 'OBAT_DIBERIKAN';
    }

    if (filter === 'resep') {
        return item.tipe === 'RESEP_OBAT' || item.tipe === 'OBAT_DIBERIKAN' || item.isi.toLowerCase().includes('resep');
    }

    if (filter === 'rujukan') {
        return item.tipe === 'RUJUKAN' || item.tipe === 'TIDAK_DIRUJUK';
    }

    return true;
}

export default function NotifikasiPerawat() {
    const { daftar, belumDibaca, tandaiDibaca, tandaiSemuaDibaca } = useNotifikasi('perawat');
    const [filter, setFilter] = useState<FilterNotifikasi>('semua');

    const tersaring = daftar.filter((item) => cocokFilter(item, filter));

    return (
        <PerawatAppLayout
            active="beranda"
            title="Notifikasi perawat"
            description="Hasil konsultasi, keputusan rujukan, dan status obat dari dokter spesialis."
        >
            <Head title="Notifikasi perawat" />

            <div className="mx-auto grid w-full max-w-3xl gap-5">
                <section className={cn('rounded-[24px] p-5', glass)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-11 shrink-0 place-items-center rounded-full">
                                <Bell className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <h1 className="text-lg font-bold">Notifikasi</h1>
                                <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                    {belumDibaca > 0 ? `${belumDibaca} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={tandaiSemuaDibaca}
                            disabled={belumDibaca === 0}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3.5 text-[10px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)] disabled:opacity-40"
                        >
                            <CheckCheck className="size-3.5" aria-hidden="true" />
                            Tandai semua dibaca
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter notifikasi">
                        {filterNotifikasi.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.key)}
                                aria-pressed={filter === item.key}
                                className={cn(
                                    'min-h-8 shrink-0 rounded-full border px-3 text-[10px] font-semibold transition-colors',
                                    filter === item.key
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                {tersaring.length === 0 ? (
                    <section className={cn('rounded-[24px] p-8 text-center', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:text-tk-accent mx-auto grid size-12 place-items-center rounded-full">
                            <Bell className="size-6" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-bold">Tidak ada notifikasi</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            Notifikasi baru akan muncul setelah dokter spesialis menyimpan hasil konsultasi.
                        </p>
                    </section>
                ) : (
                    <ul className="grid gap-2.5">
                        {tersaring.map((item) => {
                            const Ikon = ikonTipe[item.tipe];

                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.url}
                                        onClick={() => tandaiDibaca(item.id)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-[20px] border p-4 transition-colors hover:bg-[var(--tk-page-alt)]',
                                            item.dibaca
                                                ? 'border-[var(--tk-glass-border)] bg-[var(--tk-glass)]'
                                                : 'border-tk-green-400/40 bg-tk-green-500/[0.08]',
                                        )}
                                    >
                                        <span className="bg-tk-green-500/15 text-tk-green-500 dark:text-tk-accent mt-0.5 grid size-10 shrink-0 place-items-center rounded-full">
                                            <Ikon className="size-4" aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-bold">{item.judul}</p>
                                                {!item.dibaca && <span className="bg-tk-accent size-1.5 rounded-full" aria-hidden="true" />}
                                            </div>
                                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">{item.isi}</p>
                                            <p className="mt-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                                {labelTipeNotifikasi[item.tipe]} · {formatWaktuNotifikasi(item.waktu)}
                                            </p>
                                        </div>
                                        <ChevronRight className="mt-2 size-4 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </PerawatAppLayout>
    );
}
