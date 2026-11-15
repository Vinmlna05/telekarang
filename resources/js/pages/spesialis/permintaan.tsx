import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    Clock,
    MessageSquare,
    Search,
    Stethoscope,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

type Prioritas = 'merah' | 'kuning' | 'normal';
type Aksi = 'konfirmasi' | 'jadwal_ulang' | 'tolak';

interface PermintaanItem {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    keluhan: string;
    prioritas: Prioritas;
    status: string;
    mode: 'video' | 'teks';
    jadwal: string | null;
    dokterUmum: string | null;
    diminta: string | null;
    skrining: {
        sistol: number;
        diastol: number;
        suhu: number;
        nadi: number;
        spo2: number;
        prioritas: Prioritas;
        catatan: string;
    } | null;
}

interface PermintaanSpesialisProps {
    ringkasan: {
        menunggu: number;
        dikonfirmasi: number;
        dijadwalUlang: number;
        ditolak: number;
    };
    permintaan: PermintaanItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-20 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const prioritasMeta: Record<Prioritas, { label: string; tone: string }> = {
    merah: { label: 'Prioritas tinggi', tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
};

const statusMeta: Record<string, { label: string; tone: string }> = {
    MENUNGGU_SPESIALIS: { label: 'Menunggu respons', tone: 'bg-tk-info/15 text-tk-info' },
    DIKONFIRMASI: {
        label: 'Dikonfirmasi',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    BERLANGSUNG: {
        label: 'Berlangsung',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    DIJADWAL_ULANG: { label: 'Menunggu jadwal baru', tone: 'bg-tk-warning/15 text-tk-warning' },
    DITOLAK: { label: 'Ditolak', tone: 'bg-tk-danger/15 text-tk-danger' },
};

const aksiMeta: Record<Aksi, { label: string; deskripsi: string; tone: string }> = {
    konfirmasi: {
        label: 'Konfirmasi',
        deskripsi: 'Setujui jadwal dan buka ruang konsultasi.',
        tone: 'bg-tk-green-500 text-white hover:bg-tk-green-400',
    },
    jadwal_ulang: {
        label: 'Jadwal ulang',
        deskripsi: 'Kembalikan ke perawat untuk memilih slot baru.',
        tone: 'bg-tk-warning/15 text-tk-warning hover:bg-tk-warning/20',
    },
    tolak: {
        label: 'Tolak',
        deskripsi: 'Tolak permintaan dengan alasan yang jelas.',
        tone: 'bg-tk-danger/15 text-tk-danger hover:bg-tk-danger/20',
    },
};

const filterTabs: Array<{ key: string; label: string }> = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'MENUNGGU_SPESIALIS', label: 'Perlu respons' },
    { key: 'DIKONFIRMASI', label: 'Dikonfirmasi' },
    { key: 'BERLANGSUNG', label: 'Berlangsung' },
    { key: 'DIJADWAL_ULANG', label: 'Jadwal ulang' },
    { key: 'DITOLAK', label: 'Ditolak' },
];

export default function PermintaanSpesialis({ ringkasan, permintaan }: PermintaanSpesialisProps) {
    const { flash } = usePage<SharedData>().props;
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('SEMUA');
    const [aktif, setAktif] = useState<{ id: number; aksi: Aksi } | null>(null);
    const [alasan, setAlasan] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mengirim, setMengirim] = useState(false);

    const hasil = useMemo(() => {
        const kata = q.trim().toLowerCase();

        return permintaan.filter((item) => {
            const cocokFilter = filter === 'SEMUA' || item.status === filter;
            const cocokKata =
                kata === '' ||
                [item.nama, item.keluhan, item.dokterUmum ?? '', item.jadwal ?? ''].some((nilai) => nilai.toLowerCase().includes(kata));

            return cocokFilter && cocokKata;
        });
    }, [permintaan, q, filter]);

    function bukaAksi(id: number, aksi: Aksi) {
        setAktif({ id, aksi });
        setAlasan('');
        setErrors({});
    }

    function kirim(id: number, aksi: Aksi) {
        if (aksi !== 'konfirmasi' && alasan.trim().length < 5) {
            setErrors({ alasan: 'Tulis alasan minimal 5 karakter.' });

            return;
        }

        setMengirim(true);
        router.post(
            route('spesialis.permintaan.keputusan', id),
            { aksi, alasan: alasan.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAktif(null);
                    setAlasan('');
                },
                onError: (serverErrors) => setErrors(serverErrors as Record<string, string>),
                onFinish: () => setMengirim(false),
            },
        );
    }

    return (
        <SpesialisAppLayout
            active="permintaan"
            title="Permintaan konsultasi"
            description="Terima, jadwal ulang, atau tolak permintaan dari puskesmas."
        >
            <Head title="Permintaan konsultasi" />

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

            <section aria-label="Ringkasan permintaan" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Perlu respons', nilai: ringkasan.menunggu, icon: Clock },
                    { label: 'Aktif', nilai: ringkasan.dikonfirmasi, icon: MessageSquare },
                    { label: 'Menunggu jadwal baru', nilai: ringkasan.dijadwalUlang, icon: CalendarClock },
                    { label: 'Ditolak', nilai: ringkasan.ditolak, icon: XCircle },
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

            <section className={cn('mt-5 rounded-[24px] p-4 md:p-5', glass)}>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] flex-1">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                            aria-hidden="true"
                        />
                        <Input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Cari nama pasien, keluhan, atau dokter pengirim"
                            className={inputClass}
                            aria-label="Cari permintaan"
                        />
                    </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full px-3.5 text-[11px] font-semibold transition-colors',
                                filter === tab.key
                                    ? 'bg-tk-accent text-tk-deep'
                                    : 'border border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:bg-[var(--tk-page-alt)]',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid gap-3">
                    {hasil.length === 0 && (
                        <div className="rounded-2xl bg-[var(--tk-page-alt)] p-6 text-center">
                            <Stethoscope className="mx-auto size-8 text-[var(--tk-muted)]" aria-hidden="true" />
                            <p className="mt-2 text-xs font-semibold">Tidak ada permintaan pada filter ini.</p>
                        </div>
                    )}

                    {hasil.map((item) => {
                        const meta = statusMeta[item.status] ?? statusMeta.MENUNGGU_SPESIALIS;
                        const prioritas = prioritasMeta[item.prioritas] ?? prioritasMeta.normal;
                        const panel = aktif?.id === item.id ? aktif.aksi : null;

                        return (
                            <article key={item.id} className="rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full text-xs font-extrabold">
                                            {item.nama
                                                .split(' ')
                                                .slice(0, 2)
                                                .map((bagian) => bagian.charAt(0).toUpperCase())
                                                .join('')}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold">{item.nama}</p>
                                            <p className="text-[10px] text-[var(--tk-muted)]">
                                                {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} ·{' '}
                                                {item.mode === 'video' ? 'Video' : 'Teks'}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed">{item.keluhan}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', prioritas.tone)}>
                                            {prioritas.label}
                                        </span>
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', meta.tone)}>{meta.label}</span>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-xl bg-[var(--tk-surface)] px-3 py-2">
                                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Slot</p>
                                        <p className="text-[11px] font-semibold">{item.jadwal ?? 'Belum dijadwalkan'}</p>
                                    </div>
                                    <div className="rounded-xl bg-[var(--tk-surface)] px-3 py-2">
                                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter pengirim</p>
                                        <p className="text-[11px] font-semibold">{item.dokterUmum ?? 'Dokter umum puskesmas'}</p>
                                    </div>
                                    <div className="rounded-xl bg-[var(--tk-surface)] px-3 py-2">
                                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diminta</p>
                                        <p className="text-[11px] font-semibold">{item.diminta ?? '-'}</p>
                                    </div>
                                </div>

                                {item.skrining && (
                                    <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                                        <span className="rounded-full bg-[var(--tk-surface)] px-2.5 py-1 font-semibold">
                                            TD {item.skrining.sistol}/{item.skrining.diastol}
                                        </span>
                                        <span className="rounded-full bg-[var(--tk-surface)] px-2.5 py-1 font-semibold">
                                            Suhu {item.skrining.suhu} °C
                                        </span>
                                        <span className="rounded-full bg-[var(--tk-surface)] px-2.5 py-1 font-semibold">
                                            Nadi {item.skrining.nadi}
                                        </span>
                                        <span className="rounded-full bg-[var(--tk-surface)] px-2.5 py-1 font-semibold">
                                            SpO₂ {item.skrining.spo2}%
                                        </span>
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.status === 'MENUNGGU_SPESIALIS' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => bukaAksi(item.id, 'konfirmasi')}
                                                className="bg-tk-green-500 hover:bg-tk-green-400 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold text-white"
                                            >
                                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                Konfirmasi
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bukaAksi(item.id, 'jadwal_ulang')}
                                                className="bg-tk-warning/15 text-tk-warning inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                            >
                                                <CalendarClock className="size-3.5" aria-hidden="true" />
                                                Jadwal ulang
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bukaAksi(item.id, 'tolak')}
                                                className="bg-tk-danger/15 text-tk-danger inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                            >
                                                <XCircle className="size-3.5" aria-hidden="true" />
                                                Tolak
                                            </button>
                                        </>
                                    )}

                                    {(item.status === 'DIKONFIRMASI' || item.status === 'BERLANGSUNG') && (
                                        <Link
                                            href={`/spesialis/konsultasi/${item.id}`}
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                        >
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                            Buka ruang konsultasi
                                        </Link>
                                    )}

                                    {(item.status === 'DIJADWAL_ULANG' || item.status === 'DITOLAK') && (
                                        <Link
                                            href={`/spesialis/konsultasi/${item.id}`}
                                            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold"
                                        >
                                            <UserRound className="size-3.5" aria-hidden="true" />
                                            Lihat detail
                                        </Link>
                                    )}
                                </div>

                                {panel && (
                                    <div className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] p-4">
                                        <p className="text-[11px] font-bold">{aksiMeta[panel].label}</p>
                                        <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{aksiMeta[panel].deskripsi}</p>
                                        {panel !== 'konfirmasi' && (
                                            <>
                                                <label htmlFor={`alasan-${item.id}`} className="mt-2 block text-[10px] font-semibold">
                                                    Alasan
                                                </label>
                                                <textarea
                                                    id={`alasan-${item.id}`}
                                                    value={alasan}
                                                    onChange={(event) => {
                                                        setAlasan(event.target.value);
                                                        setErrors({});
                                                    }}
                                                    placeholder={
                                                        panel === 'tolak'
                                                            ? 'Contoh: pasien perlu datang ke IGD RS karena kondisi darurat.'
                                                            : 'Contoh: jadwal bentrok, mohon pilih slot lain.'
                                                    }
                                                    className={textareaClass}
                                                />
                                                <InputError message={errors.alasan} className="text-tk-danger mt-1 text-[10px]" />
                                            </>
                                        )}
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                disabled={mengirim}
                                                onClick={() => kirim(item.id, panel)}
                                                className={cn(
                                                    'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold disabled:opacity-50',
                                                    aksiMeta[panel].tone,
                                                )}
                                            >
                                                {mengirim ? 'Menyimpan...' : aksiMeta[panel].label}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAktif(null)}
                                                className="inline-flex min-h-10 items-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>

            <div className="mt-4">
                <Link
                    href="/spesialis/beranda"
                    className="inline-flex min-h-10 items-center gap-1 text-[11px] font-semibold text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                >
                    Kembali ke beranda
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                </Link>
            </div>
        </SpesialisAppLayout>
    );
}
