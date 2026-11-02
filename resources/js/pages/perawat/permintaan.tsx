import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Clock,
    Inbox,
    Search,
    ShieldCheck,
    Stethoscope,
    UserRound,
    Users,
    Wifi,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

type StatusPermintaan = 'MENUNGGU_SKRINING' | 'SKRINING_SELESAI' | 'MENUNGGU_SPESIALIS' | 'KEDALUWARSA';
type StatusFilter = 'SEMUA' | StatusPermintaan;

interface PermintaanItem {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    nik: string;
    waktuMasuk: string;
    keluhan: string;
    spesialisasi: string;
    dokter: string;
    jadwal: string;
    status: StatusPermintaan;
    prioritas: 'normal' | 'merah';
    sumber: string;
}

interface PermintaanPerawatProps {
    ringkasan: {
        total: number;
        menungguSkrining: number;
        skriningSelesai: number;
        menungguSpesialis: number;
        kedaluwarsa: number;
        prioritasMerah: number;
    };
    permintaan: PermintaanItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';

const statusMeta: Record<StatusPermintaan, { label: string; tone: string; icon: LucideIcon }> = {
    MENUNGGU_SKRINING: { label: 'Menunggu skrining', tone: 'bg-tk-warning/15 text-tk-warning', icon: Clock },
    SKRINING_SELESAI: {
        label: 'Skrining selesai',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
        icon: ClipboardCheck,
    },
    MENUNGGU_SPESIALIS: { label: 'Menunggu spesialis', tone: 'bg-tk-info/15 text-tk-info', icon: Stethoscope },
    KEDALUWARSA: { label: 'Kedaluwarsa', tone: 'bg-tk-danger/10 text-tk-danger', icon: AlertTriangle },
};

const filterStatus: Array<{ key: StatusFilter; label: string }> = [
    { key: 'SEMUA', label: 'Semua' },
    { key: 'MENUNGGU_SKRINING', label: 'Menunggu skrining' },
    { key: 'SKRINING_SELESAI', label: 'Skrining selesai' },
    { key: 'MENUNGGU_SPESIALIS', label: 'Menunggu spesialis' },
    { key: 'KEDALUWARSA', label: 'Kedaluwarsa' },
];

const alurSkrining = [
    { label: 'Permintaan masuk', description: 'Pasien atau perawat membuat permintaan konsultasi.' },
    { label: 'Skrining perawat', description: 'Lengkapi tanda vital dan keluhan utama pasien.' },
    { label: 'Review dokter umum', description: 'Dokter memutuskan perlu spesialis atau tidak.' },
    { label: 'Diteruskan ke spesialis', description: 'Konsultasi dijadwalkan sesuai slot tersedia.' },
];

const kriteriaTriase = ['SpO₂ < 92%', 'Sistol ≥ 180 atau diastol ≥ 120', 'Suhu ≥ 40 °C', 'Nadi > 130 atau < 40', 'Sesak berat / tidak sadar'];

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

function maskNik(nik: string): string {
    if (nik.length < 8) {
        return nik;
    }

    return `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;
}

function aksiUntuk(item: PermintaanItem): { label: string; href: string; primary: boolean } | null {
    if (item.status === 'MENUNGGU_SKRINING') {
        return { label: 'Isi skrining', href: `/perawat/skrining/${item.id}`, primary: true };
    }

    if (item.status === 'SKRINING_SELESAI') {
        return { label: 'Lihat skrining', href: `/perawat/konsultasi/${item.id}`, primary: false };
    }

    if (item.status === 'MENUNGGU_SPESIALIS') {
        return { label: 'Pantau konsultasi', href: `/perawat/konsultasi/${item.id}`, primary: false };
    }

    return null;
}

export default function PermintaanPerawat({ ringkasan, permintaan }: PermintaanPerawatProps) {
    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('SEMUA');
    const [hanyaMerah, setHanyaMerah] = useState(false);

    const hasil = useMemo(() => {
        const kataKunci = q.trim().toLowerCase();

        return permintaan.filter((item) => {
            const cocokStatus = statusFilter === 'SEMUA' || item.status === statusFilter;
            const cocokPrioritas = !hanyaMerah || item.prioritas === 'merah';
            const cocokKataKunci =
                kataKunci === '' ||
                [item.nama, item.nik, item.keluhan, item.spesialisasi, item.dokter].some((nilai) => nilai.toLowerCase().includes(kataKunci));

            return cocokStatus && cocokPrioritas && cocokKataKunci;
        });
    }, [permintaan, q, statusFilter, hanyaMerah]);

    const filterAktif = q.trim() !== '' || statusFilter !== 'SEMUA' || hanyaMerah;

    const resetFilter = () => {
        setQ('');
        setStatusFilter('SEMUA');
        setHanyaMerah(false);
    };

    const ringkasanCards: Array<{ key: keyof PermintaanPerawatProps['ringkasan']; label: string; caption: string; icon: LucideIcon }> = [
        { key: 'total', label: 'Total permintaan', caption: 'masuk hari ini dan kemarin', icon: ClipboardList },
        { key: 'menungguSkrining', label: 'Menunggu skrining', caption: 'perlu dilengkapi perawat', icon: Clock },
        { key: 'menungguSpesialis', label: 'Menunggu spesialis', caption: 'sudah lolos review dokter', icon: Stethoscope },
        { key: 'kedaluwarsa', label: 'Kedaluwarsa', caption: 'slot dilepas otomatis', icon: AlertTriangle },
    ];

    return (
        <PerawatAppLayout
            active="antrean"
            title="Daftar permintaan masuk"
            description="Kelola permintaan konsultasi yang masuk, lengkapi skrining, dan pantau status tindak lanjutnya."
        >
            <Head title="Permintaan masuk" />

            {ringkasan.prioritasMerah > 0 && (
                <section
                    aria-label="Peringatan prioritas merah"
                    className={cn('relative mb-5 overflow-hidden rounded-[24px] p-5 md:p-6', bannerGradient)}
                >
                    <div className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/20 blur-xl" aria-hidden="true" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span className="text-tk-danger grid size-10 shrink-0 place-items-center rounded-full bg-white/85">
                                <AlertTriangle className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Perlu perhatian</p>
                                <p className="text-tk-deep mt-1 text-lg leading-tight font-extrabold">
                                    {ringkasan.prioritasMerah} permintaan dengan prioritas merah.
                                </p>
                                <p className="text-tk-deep/75 mt-1 max-w-[52ch] text-xs">
                                    Segera lengkapi skrining dan koordinasikan dengan dokter umum. Tanda bahaya harus ditangani lebih dulu.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setQ('');
                                setStatusFilter('SEMUA');
                                setHanyaMerah(true);
                            }}
                            className="bg-tk-deep text-tk-mint inline-flex min-h-10 shrink-0 items-center gap-1.5 self-start rounded-full px-5 text-xs font-semibold sm:self-auto"
                        >
                            Tampilkan prioritas
                            <ChevronRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </section>
            )}

            <section aria-label="Ringkasan permintaan" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasanCards.map(({ key, label, caption, icon: Icon }) => (
                    <article key={key} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">{label}</p>
                            <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full">
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                        </div>
                        <p className="mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]">{ringkasan[key]}</p>
                        <p className="mt-2 text-[10px] text-[var(--tk-muted)]">{caption}</p>
                    </article>
                ))}
            </section>

            <section aria-label="Cari dan filter permintaan" className={cn('mt-5 rounded-[22px] p-4', glass)}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-[420px]">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                            aria-hidden="true"
                        />
                        <Input
                            type="search"
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            placeholder="Cari nama, NIK, atau keluhan..."
                            aria-label="Cari permintaan berdasarkan nama, NIK, atau keluhan"
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            aria-pressed={hanyaMerah}
                            onClick={() => setHanyaMerah((value) => !value)}
                            className={cn(
                                'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                hanyaMerah
                                    ? 'bg-tk-danger border-transparent text-white'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                            Prioritas merah
                            <span
                                className={cn(
                                    'rounded-full px-1.5 py-0.5 text-[9px]',
                                    hanyaMerah ? 'bg-white/20 text-white' : 'bg-tk-danger/10 text-tk-danger',
                                )}
                            >
                                {ringkasan.prioritasMerah}
                            </span>
                        </button>

                        {filterAktif && (
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="min-h-10 rounded-full px-3 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filterStatus.map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={statusFilter === key}
                            onClick={() => setStatusFilter(key)}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                statusFilter === key
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.9fr)]">
                <section aria-labelledby="daftar-permintaan">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id="daftar-permintaan" className="text-[17px] font-bold">
                            Daftar permintaan
                        </h2>
                        <p role="status" aria-live="polite" className="text-[11px] text-[var(--tk-muted)]">
                            {hasil.length} dari {permintaan.length} permintaan
                        </p>
                    </div>

                    {hasil.length === 0 ? (
                        <div className={cn('grid place-items-center gap-2 rounded-[24px] px-5 py-12 text-center', glass)}>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 place-items-center rounded-full">
                                <Inbox className="size-6" aria-hidden="true" />
                            </span>
                            <p className="mt-1 text-sm font-bold">Tidak ada permintaan yang cocok</p>
                            <p className="max-w-[40ch] text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                Ubah kata kunci atau filter status untuk melihat permintaan lain.
                            </p>
                            <button
                                type="button"
                                onClick={resetFilter}
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-2 inline-flex min-h-10 items-center rounded-full px-4 text-[11px] font-semibold transition-colors"
                            >
                                Tampilkan semua
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {hasil.map((item) => {
                                const status = statusMeta[item.status];
                                const StatusIcon = status.icon;
                                const isPrioritas = item.prioritas === 'merah';
                                const aksi = aksiUntuk(item);

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

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full font-bold">
                                                    {inisial(item.nama)}
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
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2 py-0.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                                            <UserRound className="size-3" aria-hidden="true" />
                                                            {item.sumber}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · NIK{' '}
                                                        {maskNik(item.nik)}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Masuk {item.waktuMasuk} WITA</p>
                                                </div>
                                            </div>

                                            <span
                                                className={cn(
                                                    'inline-flex shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold',
                                                    status.tone,
                                                )}
                                            >
                                                <StatusIcon className="size-3" aria-hidden="true" />
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="mt-3 rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                                            <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                Keluhan utama
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--tk-text)]">{item.keluhan}</p>
                                        </div>

                                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] lg:items-center">
                                            <div>
                                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    Spesialisasi
                                                </p>
                                                <p className="mt-0.5 text-[11px] font-semibold">{item.spesialisasi}</p>
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    Dokter & jadwal
                                                </p>
                                                <p className="mt-0.5 text-[11px] font-semibold">{item.dokter}</p>
                                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{item.jadwal}</p>
                                            </div>

                                            {aksi ? (
                                                <Link
                                                    href={aksi.href}
                                                    className={cn(
                                                        'inline-flex min-h-9 items-center justify-center gap-1 self-start rounded-full px-4 text-xs font-semibold transition-colors lg:self-auto',
                                                        aksi.primary
                                                            ? 'bg-tk-accent text-tk-deep hover:bg-tk-mint'
                                                            : 'border border-[var(--tk-glass-border)] text-[var(--tk-text)] hover:bg-[var(--tk-page-alt)]',
                                                    )}
                                                >
                                                    {aksi.label}
                                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                                </Link>
                                            ) : (
                                                <span className="inline-flex min-h-9 items-center justify-center self-start rounded-full bg-[var(--tk-page-alt)] px-4 text-xs font-semibold text-[var(--tk-muted)] lg:self-auto">
                                                    Slot dilepas
                                                </span>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside className="grid content-start gap-5">
                    <section aria-labelledby="alur-skrining" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <ShieldCheck className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="alur-skrining" className="text-[15px] font-bold">
                                    Alur permintaan
                                </h2>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Skrining menjadi gerbang sebelum ke spesialis.</p>
                            </div>
                        </div>

                        <ol className="mt-4 grid gap-2.5">
                            {alurSkrining.map((langkah, index) => (
                                <li key={langkah.label} className="flex items-start gap-2.5">
                                    <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-bold">{langkah.label}</p>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{langkah.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-3 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Tombol kirim ke spesialis terkunci sampai data skrining lengkap dan lolos validasi rentang tanda vital.
                        </p>
                    </section>

                    <section aria-labelledby="pengingat-triase" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-danger/10 text-tk-danger grid size-9 shrink-0 place-items-center rounded-full">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="pengingat-triase" className="text-[15px] font-bold">
                                    Pengingat triase
                                </h2>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Temuan berikut memunculkan peringatan merah.</p>
                            </div>
                        </div>

                        <ul className="mt-3 grid gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            {kriteriaTriase.map((kriteria) => (
                                <li key={kriteria} className="flex items-start gap-1.5">
                                    <span aria-hidden="true" className="bg-tk-danger mt-1.5 size-1.5 shrink-0 rounded-full" />
                                    {kriteria}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section aria-label="Sinyal lemah" className={cn('flex items-start gap-3 rounded-[20px] p-5', glass)}>
                        <span className="text-tk-warning bg-tk-warning/15 grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-xs font-bold">Sinyal lemah saat skrining?</p>
                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                Draf tersimpan di perangkat dan terkirim otomatis saat koneksi kembali. Konsultasi tetap bisa berjalan lewat teks dan
                                foto.
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="aksi-cepat-permintaan" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aksi-cepat-permintaan" className="text-[15px] font-bold">
                            Aksi cepat
                        </h2>

                        <div className="mt-3 grid gap-1">
                            {[
                                { label: 'Daftarkan pasien baru', href: '/perawat/pasien', icon: Users },
                                { label: 'Ajukan konsultasi', href: '/perawat/konsultasi/baru', icon: ClipboardList },
                                { label: 'Lihat jadwal dokter', href: '/perawat/jadwal', icon: Clock },
                            ].map(({ label, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <Icon className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[11px] font-semibold">{label}</span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Hanya perawat yang dapat mengisi atau mengubah skrining. Pasien melihat hasilnya secara read-only.
                        </p>
                    </section>

                    <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Semua data pada halaman ini adalah data fiktif untuk prototipe TeleKarang.
                    </p>
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
