import { Head, router } from '@inertiajs/react';
import { Activity, CheckCircle2, Clock, Download, Eye, EyeOff, FileText, MessageSquare, Printer, Stethoscope, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import AdminAppLayout from '@/layouts/admin/admin-app-layout';
import { cn } from '@/lib/utils';

type Periode = 'minggu' | 'bulan' | 'tahun';

interface Ringkasan {
    totalKonsultasi: number;
    rujukanTerhindarkan: number;
    rujukanDilakukan: number;
    persentase: number;
    biayaHemat: number;
    jamHemat: number;
    rataWaktuTunggu: number;
    video: number;
    teks: number;
}

interface TrenItem {
    label: string;
    konsultasi: number;
}

interface DiagnosisItem {
    kode: string;
    nama: string;
    jumlah: number;
}

interface SpesialisasiItem {
    nama: string;
    jumlah: number;
}

interface BerandaAdminProps {
    periode: Periode;
    ringkasan: Ringkasan;
    tren: TrenItem[];
    diagnosis: DiagnosisItem[];
    spesialisasi: SpesialisasiItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const periodeMeta: Record<Periode, { label: string; keterangan: string }> = {
    minggu: { label: 'Minggu ini', keterangan: '7 hari terakhir' },
    bulan: { label: 'Bulan ini', keterangan: '30 hari terakhir' },
    tahun: { label: 'Tahun ini', keterangan: '12 bulan terakhir' },
};

const formatAngka = new Intl.NumberFormat('id-ID');
const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function BerandaAdmin({ periode, ringkasan, tren, diagnosis, spesialisasi }: BerandaAdminProps) {
    const [showAngka, setShowAngka] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const totalMode = ringkasan.video + ringkasan.teks;
    const persenVideo = totalMode > 0 ? Math.round((ringkasan.video / totalMode) * 100) : 0;
    const maksimalDiagnosis = Math.max(...diagnosis.map((item) => item.jumlah), 1);
    const maksimalSpesialisasi = Math.max(...spesialisasi.map((item) => item.jumlah), 1);

    const pilihPeriode = (next: Periode) => {
        if (next === periode) {
            return;
        }

        router.get('/admin', { periode: next }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const unduhCsv = () => {
        const baris: (string | number)[][] = [
            ['TeleKarang - Statistik Dasbor Admin'],
            ['Periode', periodeMeta[periode].label],
            ['Total konsultasi', ringkasan.totalKonsultasi],
            ['Rujukan terhindarkan', ringkasan.rujukanTerhindarkan],
            ['Rujukan dilakukan', ringkasan.rujukanDilakukan],
            ['Persentase rujukan terhindarkan', `${ringkasan.persentase}%`],
            ['Estimasi biaya hemat (Rp)', ringkasan.biayaHemat],
            ['Estimasi waktu hemat (jam)', ringkasan.jamHemat],
            ['Rata-rata waktu tunggu (jam)', ringkasan.rataWaktuTunggu],
            ['Konsultasi video', ringkasan.video],
            ['Konsultasi teks', ringkasan.teks],
            [],
            ['Tren konsultasi', 'Jumlah'],
            ...tren.map((item) => [item.label, item.konsultasi]),
            [],
            ['Diagnosis', 'Kode ICD-10', 'Jumlah'],
            ...diagnosis.map((item) => [item.nama, item.kode, item.jumlah]),
            [],
            ['Spesialisasi', 'Jumlah'],
            ...spesialisasi.map((item) => [item.nama, item.jumlah]),
        ];

        const isi = baris.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\r\n');
        const blob = new Blob([`\uFEFF${isi}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const tautan = document.createElement('a');

        tautan.href = url;
        tautan.download = `telekarang-statistik-${periode}.csv`;
        tautan.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminAppLayout
            active="dasbor"
            title="Dasbor statistik"
            description="Ringkasan konsultasi, rujukan terhindarkan, dan dampak layanan TeleKarang bagi pasien Pulau Karang."
        >
            <Head title="Dasbor statistik admin" />

            <section
                aria-label="Pilih periode dan ekspor"
                className={cn('flex flex-col gap-3 rounded-[20px] p-4 sm:flex-row sm:items-center sm:justify-between', glass)}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Periode</span>
                    {(Object.keys(periodeMeta) as Periode[]).map((item) => {
                        const isActive = periode === item;

                        return (
                            <button
                                key={item}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => pilihPeriode(item)}
                                className={cn(
                                    'min-h-10 rounded-full border px-4 text-[12px] font-semibold transition-colors',
                                    isActive
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'hover:border-tk-green-500/50 border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {periodeMeta[item].label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 print:hidden">
                    <button
                        type="button"
                        onClick={unduhCsv}
                        className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold', glass)}
                    >
                        <Download className="size-4" aria-hidden="true" />
                        Unduh CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[12px] font-semibold', glass)}
                    >
                        <Printer className="size-4" aria-hidden="true" />
                        Cetak PDF
                    </button>
                </div>
            </section>

            <section aria-label="Ringkasan utama" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                                <p className="mt-1 text-[11px] text-[var(--tk-muted)]">{periodeMeta[periode].label}</p>
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
                                <TrendingUp className="size-3" aria-hidden="true" />
                                {ringkasan.persentase}%
                            </span>
                        </div>

                        <p className="mt-1 text-[11px] text-[var(--tk-muted)]">
                            dari {formatAngka.format(ringkasan.totalKonsultasi)} konsultasi tidak perlu naik kapal
                        </p>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                            <span
                                className="bg-tk-green-500 dark:bg-tk-accent block h-full rounded-full"
                                style={{ width: `${Math.min(ringkasan.persentase, 100)}%` }}
                            />
                        </div>
                    </div>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Total konsultasi</p>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{formatAngka.format(ringkasan.totalKonsultasi)}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">seluruh permintaan pada periode ini</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Rujukan dilakukan</p>
                    <p className="text-tk-warning mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                        {formatAngka.format(ringkasan.rujukanDilakukan)}
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">pasien yang tetap perlu perjalanan kapal</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <div className="flex items-center gap-2">
                        <span className="text-tk-info bg-tk-info/15 grid size-8 place-items-center rounded-full">
                            <Clock className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Rata-rata waktu tunggu</p>
                    </div>
                    <p className="mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">
                        {ringkasan.rataWaktuTunggu.toFixed(1).replace('.', ',')} <span className="text-base font-semibold">jam</span>
                    </p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">sampai permintaan dikonfirmasi spesialis</p>
                </article>
            </section>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)] print:grid-cols-1">
                <div className="grid min-w-0 gap-5">
                    <section aria-labelledby="tren-konsultasi" className={cn('rounded-[24px] p-5 lg:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 id="tren-konsultasi" className="text-[17px] font-bold">
                                    Tren konsultasi
                                </h2>
                                <p className="mt-0.5 text-[12px] text-[var(--tk-muted)]">{periodeMeta[periode].keterangan}</p>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold">
                                <Activity className="size-3.5" aria-hidden="true" />
                                {formatAngka.format(ringkasan.totalKonsultasi)} total
                            </span>
                        </div>

                        <div className="mt-5 h-[260px] w-full lg:h-[300px]">
                            {mounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={tren} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="trenKonsultasi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#4FBF8F" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#4FBF8F" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,196,188,0.25)" vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: '#A8C4BC' }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={12}
                                        />
                                        <YAxis tick={{ fontSize: 10, fill: '#A8C4BC' }} axisLine={false} tickLine={false} width={36} />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#04100E',
                                                border: '1px solid rgba(255,255,255,0.14)',
                                                borderRadius: 12,
                                                fontSize: 12,
                                                color: '#FFFFFF',
                                            }}
                                            labelStyle={{ color: '#9FE3B5' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="konsultasi"
                                            name="Konsultasi"
                                            stroke="#4FBF8F"
                                            strokeWidth={2}
                                            fill="url(#trenKonsultasi)"
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#7CC77F', stroke: '#04100E', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full rounded-2xl bg-[var(--tk-page-alt)]" aria-hidden="true" />
                            )}
                        </div>
                    </section>

                    <div className="grid gap-5 md:grid-cols-2">
                        <section aria-labelledby="diagnosis-terbanyak" className={cn('rounded-[24px] p-5 lg:p-6', glass)}>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 id="diagnosis-terbanyak" className="text-[15px] font-bold">
                                    Diagnosis terbanyak
                                </h2>
                                <span className="text-[10px] font-semibold text-[var(--tk-muted)]">ICD-10</span>
                            </div>

                            <div className="grid gap-3.5">
                                {diagnosis.map((item, index) => (
                                    <div key={item.kode}>
                                        <div className="flex items-center justify-between gap-2 text-[11px]">
                                            <p className="min-w-0 truncate font-semibold">
                                                <span className="text-tk-green-500 dark:text-tk-accent mr-1.5 font-bold">{item.kode}</span>
                                                {item.nama}
                                            </p>
                                            <span className="shrink-0 font-bold">{item.jumlah}</span>
                                        </div>
                                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                                            <span
                                                className={cn(
                                                    'block h-full rounded-full',
                                                    index === 0 ? 'bg-tk-accent' : 'bg-tk-green-500/70 dark:bg-tk-accent/60',
                                                )}
                                                style={{ width: `${(item.jumlah / maksimalDiagnosis) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                                Menampilkan 5 diagnosis teratas dari seluruh konsultasi.
                            </p>
                        </section>

                        <section aria-labelledby="distribusi-spesialisasi" className={cn('rounded-[24px] p-5 lg:p-6', glass)}>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 id="distribusi-spesialisasi" className="text-[15px] font-bold">
                                    Distribusi spesialisasi
                                </h2>
                                <span className="text-[10px] font-semibold text-[var(--tk-muted)]">Konsultasi</span>
                            </div>

                            <div className="grid gap-3.5">
                                {spesialisasi.map((item) => (
                                    <div key={item.nama}>
                                        <div className="flex items-center justify-between gap-2 text-[11px]">
                                            <p className="truncate font-semibold">{item.nama}</p>
                                            <span className="shrink-0 font-bold">{formatAngka.format(item.jumlah)}</span>
                                        </div>
                                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                                            <span
                                                className="bg-tk-teal-700 dark:bg-tk-mint block h-full rounded-full"
                                                style={{ width: `${(item.jumlah / maksimalSpesialisasi) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                                Jumlah konsultasi yang masuk ke setiap spesialisasi.
                            </p>
                        </section>
                    </div>
                </div>

                <div className="grid content-start gap-5">
                    <section aria-label="Estimasi penghematan" className={cn('relative overflow-hidden rounded-[24px] p-6', bannerGradient)}>
                        <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-xl" />
                        <div className="relative">
                            <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Estimasi penghematan</p>

                            <div className="mt-4 grid gap-4">
                                <div>
                                    <p className="text-tk-deep text-[11px] font-semibold">Biaya perjalanan</p>
                                    <p className="text-tk-deep mt-1 text-[clamp(1.35rem,2.2vw,1.8rem)] leading-tight font-extrabold">
                                        {formatRupiah.format(ringkasan.biayaHemat)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-tk-deep text-[11px] font-semibold">Waktu pasien</p>
                                    <p className="text-tk-deep mt-1 text-[clamp(1.35rem,2.2vw,1.8rem)] leading-tight font-extrabold">
                                        {formatAngka.format(ringkasan.jamHemat)} <span className="text-base font-semibold">jam</span>
                                    </p>
                                </div>
                            </div>

                            <p className="text-tk-deep/70 border-tk-deep/15 mt-4 border-t pt-3 text-[10px] leading-relaxed">
                                {ringkasan.rujukanTerhindarkan} rujukan × Rp 850.000 biaya kapal dan × 6 jam perjalanan pulang-pergi.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Rasio mode konsultasi" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-1.5 text-[13px] font-bold">
                                <MessageSquare className="text-tk-green-500 dark:text-tk-accent size-4" aria-hidden="true" />
                                Rasio mode konsultasi
                            </p>
                            <span className="text-[10px] font-semibold text-[var(--tk-muted)]">{formatAngka.format(totalMode)} total</span>
                        </div>

                        <div className="mt-4 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
                            <span className="bg-tk-green-500 dark:bg-tk-accent block h-full" style={{ width: `${persenVideo}%` }} />
                            <span className="bg-tk-teal-700 dark:bg-tk-mint block h-full" style={{ width: `${100 - persenVideo}%` }} />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="bg-tk-green-500 dark:bg-tk-accent size-2 rounded-full" aria-hidden="true" />
                                Video {ringkasan.video} ({persenVideo}%)
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[var(--tk-muted)]">
                                <span className="bg-tk-teal-700 dark:bg-tk-mint size-2 rounded-full" aria-hidden="true" />
                                Teks {ringkasan.teks} ({100 - persenVideo}%)
                            </span>
                        </div>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-bold">Cara membaca dasbor</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Rujukan terhindarkan dihitung saat spesialis memutuskan pasien tidak perlu dirujuk. Diagnosis memakai kode ICD-10
                                    dan biaya memakai asumsi kapal pulang-pergi.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                            <span className="inline-flex items-center gap-1.5">
                                <Stethoscope className="size-3" aria-hidden="true" />
                                ICD-10 dari dokter spesialis
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <FileText className="size-3" aria-hidden="true" />
                                Data pada prototipe ini fiktif
                            </span>
                        </div>
                    </section>
                </div>
            </div>
        </AdminAppLayout>
    );
}
