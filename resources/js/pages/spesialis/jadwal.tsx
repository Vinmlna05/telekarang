import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface SlotJadwal {
    id: number;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    status: 'tersedia' | 'terisi' | 'libur';
    konsultasiAktif: number;
}

interface JadwalSpesialisProps {
    ringkasan: {
        total: number;
        tersedia: number;
        terisi: number;
        libur: number;
    };
    jadwal: SlotJadwal[];
    pilihanHari: string[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const fieldClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)]';

const statusLabel: Record<SlotJadwal['status'], { label: string; tone: string }> = {
    tersedia: {
        label: 'Tersedia',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    terisi: { label: 'Terisi', tone: 'bg-tk-info/15 text-tk-info' },
    libur: { label: 'Libur', tone: 'bg-tk-warning/15 text-tk-warning' },
};

export default function JadwalSpesialis({ ringkasan, jadwal, pilihanHari }: JadwalSpesialisProps) {
    const { flash } = usePage<SharedData>().props;
    const [hariAktif, setHariAktif] = useState<string>('SEMUA');

    const form = useForm({
        hari: pilihanHari[0] ?? 'Senin',
        jam_mulai: '09:00',
        jam_selesai: '12:00',
        status: 'tersedia',
    });

    function tambah() {
        form.post(route('spesialis.jadwal.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('jam_mulai', 'jam_selesai'),
        });
    }

    function ubahStatus(slot: SlotJadwal, status: SlotJadwal['status']) {
        router.patch(
            route('spesialis.jadwal.update', slot.id),
            { hari: slot.hari, jam_mulai: slot.jamMulai, jam_selesai: slot.jamSelesai, status },
            { preserveScroll: true },
        );
    }

    function hapus(slot: SlotJadwal) {
        if (!window.confirm(`Hapus slot ${slot.hari} ${slot.jamMulai}?`)) {
            return;
        }

        router.delete(route('spesialis.jadwal.destroy', slot.id), { preserveScroll: true });
    }

    const daftar = jadwal.filter((slot) => hariAktif === 'SEMUA' || slot.hari === hariAktif);

    return (
        <SpesialisAppLayout active="jadwal" title="Jadwal praktik" description="Atur slot konsultasi yang bisa dipilih perawat puskesmas.">
            <Head title="Jadwal praktik" />

            {flash?.success && (
                <div className="border-tk-green-500/35 bg-tk-green-500/10 mb-4 flex items-start gap-3 rounded-[20px] border p-4">
                    <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">{flash.success}</p>
                </div>
            )}
            {flash?.error && (
                <div className="border-tk-danger/35 bg-tk-danger/10 mb-4 flex items-start gap-3 rounded-[20px] border p-4">
                    <AlertTriangle className="text-tk-danger mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">{flash.error}</p>
                </div>
            )}

            <section aria-label="Ringkasan jadwal" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total slot', nilai: ringkasan.total, icon: CalendarDays },
                    { label: 'Tersedia', nilai: ringkasan.tersedia, icon: Clock },
                    { label: 'Terisi', nilai: ringkasan.terisi, icon: CheckCircle2 },
                    { label: 'Libur', nilai: ringkasan.libur, icon: AlertTriangle },
                ].map(({ label, nilai, icon: Icon }) => (
                    <article key={label} className={cn('rounded-[20px] p-4', glass)}>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">{label}</p>
                            <Icon className="text-tk-green-500 dark:text-tk-accent size-4" aria-hidden="true" />
                        </div>
                        <p className="mt-1 text-2xl font-extrabold">{nilai}</p>
                    </article>
                ))}
            </section>

            <section className={cn('mt-5 rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="tambah-slot">
                <h2 id="tambah-slot" className="text-[15px] font-bold">
                    Tambah slot baru
                </h2>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        tambah();
                    }}
                    className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto]"
                >
                    <div>
                        <label htmlFor="hari" className="text-[10px] font-semibold">
                            Hari
                        </label>
                        <select
                            id="hari"
                            value={form.data.hari}
                            onChange={(event) => form.setData('hari', event.target.value)}
                            className={cn(fieldClass, 'mt-1 w-full')}
                        >
                            {pilihanHari.map((hari) => (
                                <option key={hari} value={hari}>
                                    {hari}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.hari} className="text-tk-danger mt-1 text-[10px]" />
                    </div>
                    <div>
                        <label htmlFor="jam_mulai" className="text-[10px] font-semibold">
                            Mulai
                        </label>
                        <Input
                            id="jam_mulai"
                            type="time"
                            value={form.data.jam_mulai}
                            onChange={(event) => form.setData('jam_mulai', event.target.value)}
                            className={cn(fieldClass, 'mt-1')}
                        />
                        <InputError message={form.errors.jam_mulai} className="text-tk-danger mt-1 text-[10px]" />
                    </div>
                    <div>
                        <label htmlFor="jam_selesai" className="text-[10px] font-semibold">
                            Selesai
                        </label>
                        <Input
                            id="jam_selesai"
                            type="time"
                            value={form.data.jam_selesai}
                            onChange={(event) => form.setData('jam_selesai', event.target.value)}
                            className={cn(fieldClass, 'mt-1')}
                        />
                        <InputError message={form.errors.jam_selesai} className="text-tk-danger mt-1 text-[10px]" />
                    </div>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 self-end rounded-full px-5 text-xs font-bold disabled:opacity-50"
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Tambah
                    </button>
                </form>
            </section>

            <section className={cn('mt-5 rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="daftar-slot">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 id="daftar-slot" className="text-[15px] font-bold">
                        Daftar slot
                    </h2>
                    <div className="flex gap-1.5 overflow-x-auto">
                        {['SEMUA', ...pilihanHari].map((hari) => (
                            <button
                                key={hari}
                                type="button"
                                onClick={() => setHariAktif(hari)}
                                className={cn(
                                    'min-h-8 shrink-0 rounded-full px-3 text-[10px] font-semibold transition-colors',
                                    hariAktif === hari
                                        ? 'bg-tk-accent text-tk-deep'
                                        : 'border border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                )}
                            >
                                {hari === 'SEMUA' ? 'Semua' : hari}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 grid gap-2">
                    {daftar.length === 0 && (
                        <p className="rounded-2xl bg-[var(--tk-page-alt)] p-5 text-center text-[11px] text-[var(--tk-muted)]">
                            Belum ada slot pada hari ini.
                        </p>
                    )}

                    {daftar.map((slot) => {
                        const status = statusLabel[slot.status];

                        return (
                            <div key={slot.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                                <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                                    <CalendarDays className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold">
                                        {slot.hari} · {slot.jamMulai}–{slot.jamSelesai}
                                    </p>
                                    <p className="text-[10px] text-[var(--tk-muted)]">
                                        {slot.konsultasiAktif > 0 ? `${slot.konsultasiAktif} konsultasi aktif` : 'Tidak ada konsultasi aktif'}
                                    </p>
                                </div>
                                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', status.tone)}>{status.label}</span>
                                <select
                                    value={slot.status}
                                    onChange={(event) => ubahStatus(slot, event.target.value as SlotJadwal['status'])}
                                    aria-label={`Ubah status ${slot.hari} ${slot.jamMulai}`}
                                    className="h-9 rounded-full border border-[var(--tk-glass-border)] bg-[var(--tk-surface)] px-3 text-[10px] font-semibold"
                                >
                                    <option value="tersedia">Tersedia</option>
                                    <option value="terisi">Terisi</option>
                                    <option value="libur">Libur</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => hapus(slot)}
                                    aria-label={`Hapus slot ${slot.hari} ${slot.jamMulai}`}
                                    className="text-tk-danger bg-tk-danger/10 hover:bg-tk-danger/20 inline-flex size-9 items-center justify-center rounded-full"
                                >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>
        </SpesialisAppLayout>
    );
}
