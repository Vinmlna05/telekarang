import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    Info,
    MessageSquare,
    RotateCcw,
    Search,
    ShieldCheck,
    UserRound,
    Video,
    Wifi,
    XCircle,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import {
    labelStatusPermintaan,
    permintaanSpesialisAwal,
    prioritasPermintaanLabels,
    type KeputusanPermintaan,
    type PermintaanSpesialis,
    type PrioritasPermintaan,
    type StatusPermintaan,
    type TindakanPermintaan,
} from '@/data/permintaan-spesialis';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';

type FilterStatus = 'semua' | StatusPermintaan;
type AksiAktif = { id: number; jenis: TindakanPermintaan } | null;
type FormErrors = Partial<Record<'alasan' | 'tanggal' | 'jam', string>>;
type Pesan = { tone: 'sukses' | 'info'; teks: string };

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const textareaClass =
    'focus-visible:ring-tk-accent w-full rounded-xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const kunciPermintaan = 'telekarang:permintaan-spesialis';

const prioritasMeta: Record<PrioritasPermintaan, { label: string; tone: string }> = {
    merah: { label: prioritasPermintaanLabels.merah, tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: prioritasPermintaanLabels.kuning, tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: {
        label: prioritasPermintaanLabels.normal,
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
};

const statusMeta: Record<StatusPermintaan, { tone: string; ikon: typeof Clock }> = {
    MENUNGGU_SPESIALIS: { tone: 'bg-tk-warning/15 text-tk-warning', ikon: Clock },
    DIKONFIRMASI: { tone: 'bg-tk-success/15 text-tk-success', ikon: CheckCircle2 },
    DIJADWAL_ULANG: { tone: 'bg-tk-info/15 text-tk-info', ikon: CalendarClock },
    DITOLAK: { tone: 'bg-tk-danger/15 text-tk-danger', ikon: XCircle },
};

const jenisAksiMeta: Record<TindakanPermintaan, { judul: string; keterangan: string; tombol: string; ikon: typeof Clock }> = {
    terima: {
        judul: 'Terima permintaan',
        keterangan: 'Pasien akan mendapat notifikasi jadwal yang sudah diajukan dokter umum.',
        tombol: 'Konfirmasi & terima',
        ikon: CheckCircle2,
    },
    jadwal_ulang: {
        judul: 'Jadwal ulang',
        keterangan: 'Pilih tanggal dan jam baru. Pasien serta perawat akan dihubungi dengan slot pengganti.',
        tombol: 'Kirim jadwal baru',
        ikon: CalendarClock,
    },
    tolak: {
        judul: 'Tolak permintaan',
        keterangan: 'Tolak hanya jika kasus sudah tertangani, duplikat, atau bukan ranah spesialisasi Anda.',
        tombol: 'Tolak permintaan',
        ikon: XCircle,
    },
};

const alasanCepat: Record<'jadwal_ulang' | 'tolak', string[]> = {
    jadwal_ulang: ['Jadwal bentrok dengan tindakan lain.', 'Data laboratorium pendukung belum lengkap.', 'Perlu konfirmasi ulang kondisi pasien.'],
    tolak: ['Kasus duplikat dengan konsultasi sebelumnya.', 'Bukan ranah spesialisasi saya.', 'Dapat ditangani dokter umum puskesmas.'],
};

const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function initials(nama: string): string {
    return nama
        .split(' ')
        .slice(0, 2)
        .map((bagian) => bagian.charAt(0).toUpperCase())
        .join('');
}

function formatTanggal(nilai: string): string {
    const [tahun, bulan, tanggal] = nilai.split('-').map(Number);

    if (!tahun || !bulan || !tanggal || bulan < 1 || bulan > 12) {
        return nilai;
    }

    return `${tanggal} ${namaBulan[bulan - 1]} ${tahun}`;
}

function isStatusPermintaan(nilai: unknown): nilai is StatusPermintaan {
    return nilai === 'MENUNGGU_SPESIALIS' || nilai === 'DIKONFIRMASI' || nilai === 'DIJADWAL_ULANG' || nilai === 'DITOLAK';
}

function isPermintaan(nilai: unknown): nilai is PermintaanSpesialis {
    if (typeof nilai !== 'object' || nilai === null) {
        return false;
    }

    const item = nilai as Partial<PermintaanSpesialis>;

    return (
        typeof item.id === 'number' &&
        typeof item.nama === 'string' &&
        typeof item.keluhan === 'string' &&
        typeof item.jadwalUsulan === 'string' &&
        isStatusPermintaan(item.status) &&
        typeof item.skrining === 'object' &&
        item.skrining !== null
    );
}

function bacaPermintaan(): PermintaanSpesialis[] | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciPermintaan);

        if (!mentah) {
            return null;
        }

        const parsed: unknown = JSON.parse(mentah);

        if (!Array.isArray(parsed)) {
            return null;
        }

        const valid = parsed.filter(isPermintaan);

        return valid.length > 0 ? valid : null;
    } catch {
        return null;
    }
}

function simpanPermintaan(daftar: PermintaanSpesialis[]): void {
    try {
        window.localStorage.setItem(kunciPermintaan, JSON.stringify(daftar));
    } catch {
        // Penyimpanan lokal tidak tersedia; perubahan tetap berlaku pada sesi ini.
    }
}

function modeLabel(mode: 'video' | 'teks'): string {
    return mode === 'teks' ? 'Mode teks' : 'Mode video';
}

export default function PermintaanSpesialisPage() {
    const [daftar, setDaftar] = useState<PermintaanSpesialis[]>(() => bacaPermintaan() ?? permintaanSpesialisAwal);
    const [filter, setFilter] = useState<FilterStatus>('semua');
    const [cari, setCari] = useState('');
    const [aksi, setAksi] = useState<AksiAktif>(null);
    const [alasan, setAlasan] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [jam, setJam] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [pesan, setPesan] = useState<Pesan | null>(null);

    const jumlah = (status: StatusPermintaan) => daftar.filter((item) => item.status === status).length;
    const menunggu = jumlah('MENUNGGU_SPESIALIS');

    const filterPilihan: { key: FilterStatus; label: string; jumlah: number }[] = [
        { key: 'semua', label: 'Semua', jumlah: daftar.length },
        { key: 'MENUNGGU_SPESIALIS', label: 'Menunggu', jumlah: menunggu },
        { key: 'DIKONFIRMASI', label: 'Dikonfirmasi', jumlah: jumlah('DIKONFIRMASI') },
        { key: 'DIJADWAL_ULANG', label: 'Dijadwal ulang', jumlah: jumlah('DIJADWAL_ULANG') },
        { key: 'DITOLAK', label: 'Ditolak', jumlah: jumlah('DITOLAK') },
    ];

    const kataKunci = cari.trim().toLowerCase();
    const tampil = daftar.filter((item) => {
        const cocokFilter = filter === 'semua' || item.status === filter;
        const cocokCari =
            kataKunci.length === 0 ||
            item.nama.toLowerCase().includes(kataKunci) ||
            item.keluhan.toLowerCase().includes(kataKunci) ||
            item.nomor.toLowerCase().includes(kataKunci);

        return cocokFilter && cocokCari;
    });

    const hariIni = new Date().toISOString().slice(0, 10);
    const itemAksi = aksi === null ? null : (daftar.find((item) => item.id === aksi.id) ?? null);

    function resetForm() {
        setAlasan('');
        setTanggal('');
        setJam('');
        setErrors({});
    }

    function mulaiAksi(id: number, jenis: TindakanPermintaan) {
        resetForm();
        setAksi({ id, jenis });
    }

    function tutupAksi() {
        setAksi(null);
        resetForm();
    }

    function terapkan(daftarBaru: PermintaanSpesialis[], teks: string, tone: Pesan['tone'] = 'sukses') {
        setDaftar(daftarBaru);
        simpanPermintaan(daftarBaru);
        setPesan({ tone, teks });
        setFilter('semua');
        tutupAksi();
    }

    function kirimKeputusan(event: FormEvent<HTMLFormElement>, item: PermintaanSpesialis, jenis: TindakanPermintaan) {
        event.preventDefault();

        const nextErrors: FormErrors = {};
        const catatan = alasan.trim();

        if (jenis !== 'terima' && catatan.length < 10) {
            nextErrors.alasan = 'Alasan wajib diisi minimal 10 karakter agar pasien dan perawat paham.';
        }

        if (jenis === 'jadwal_ulang') {
            if (!tanggal) {
                nextErrors.tanggal = 'Tanggal baru wajib dipilih.';
            }

            if (!jam) {
                nextErrors.jam = 'Jam baru wajib diisi.';
            }
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const statusBaru: StatusPermintaan = jenis === 'terima' ? 'DIKONFIRMASI' : jenis === 'jadwal_ulang' ? 'DIJADWAL_ULANG' : 'DITOLAK';
        const slotBaru =
            jenis === 'jadwal_ulang' ? `${formatTanggal(tanggal)} · ${jam.replace(':', '.')} WITA` : jenis === 'terima' ? item.jadwalUsulan : null;

        const keputusan: KeputusanPermintaan = {
            tindakan: jenis,
            alasan: catatan.length > 0 ? catatan : null,
            slotBaru,
            waktu: 'Baru saja',
        };

        const daftarBaru = daftar.map((nilai) => (nilai.id === item.id ? { ...nilai, status: statusBaru, keputusan } : nilai));

        const teksPesan =
            jenis === 'terima'
                ? `Permintaan ${item.nama} diterima. Pasien dan perawat sudah diberi tahu jadwal ${slotBaru}.`
                : jenis === 'jadwal_ulang'
                  ? `Jadwal baru untuk ${item.nama} dikirim: ${slotBaru}. Menunggu konfirmasi pasien.`
                  : `Permintaan ${item.nama} ditolak. Alasan sudah diteruskan ke dokter umum dan perawat.`;

        terapkan(daftarBaru, teksPesan, jenis === 'terima' ? 'sukses' : 'info');
    }

    function kembalikan(item: PermintaanSpesialis) {
        if (typeof window !== 'undefined' && !window.confirm(`Kembalikan permintaan ${item.nama} ke daftar menunggu konfirmasi?`)) {
            return;
        }

        const daftarBaru = daftar.map((nilai) =>
            nilai.id === item.id ? { ...nilai, status: 'MENUNGGU_SPESIALIS' as const, keputusan: null } : nilai,
        );

        terapkan(daftarBaru, `Permintaan ${item.nama} dikembalikan ke daftar tunggu.`, 'info');
    }

    return (
        <SpesialisAppLayout
            active="permintaan"
            title="Daftar permintaan"
            description="Terima, jadwalkan ulang, atau tolak permintaan konsultasi yang sudah lolos skrining dan review dokter umum."
        >
            <Head title="Daftar permintaan konsultasi" />

            {pesan && (
                <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                        'mb-5 flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-[11px] leading-relaxed',
                        pesan.tone === 'sukses' ? 'border-tk-success/30 bg-tk-success/10' : 'border-tk-info/30 bg-tk-info/10',
                    )}
                >
                    <span className={cn('mt-0.5 shrink-0', pesan.tone === 'sukses' ? 'text-tk-success' : 'text-tk-info')}>
                        {pesan.tone === 'sukses' ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                            <Info className="size-4" aria-hidden="true" />
                        )}
                    </span>
                    <p className="text-[var(--tk-text)]">{pesan.teks}</p>
                </div>
            )}

            <section aria-label="Ringkasan permintaan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className={cn('relative overflow-hidden rounded-[22px] p-5 sm:col-span-2 xl:col-span-1', bannerGradient)}>
                    <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-white/25 blur-xl" />
                    <div className="relative">
                        <p className="text-tk-deep/70 text-[11px] font-semibold tracking-[0.14em] uppercase">Menunggu konfirmasi</p>
                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <p className="text-tk-deep text-[42px] leading-none font-semibold tracking-[-0.03em]">{menunggu}</p>
                            <span className="text-tk-deep mb-0.5 inline-flex items-center gap-1 rounded-full bg-white/30 px-2 py-0.5 text-[11px] font-semibold">
                                <Clock className="size-3" aria-hidden="true" />
                                dijawab ±30 menit
                            </span>
                        </div>
                        <p className="text-tk-deep/75 mt-2 text-[11px]">dari {daftar.length} permintaan yang diteruskan dokter umum</p>
                    </div>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Dikonfirmasi</p>
                    <p className="text-tk-success mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{jumlah('DIKONFIRMASI')}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">siap masuk ruang konsultasi</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Dijadwal ulang</p>
                    <p className="text-tk-info mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{jumlah('DIJADWAL_ULANG')}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">menunggu konfirmasi pasien</p>
                </article>

                <article className={cn('rounded-[22px] p-5', glass)}>
                    <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Ditolak</p>
                    <p className="text-tk-danger mt-3 text-[36px] leading-none font-semibold tracking-[-0.02em]">{jumlah('DITOLAK')}</p>
                    <p className="mt-2 text-[11px] text-[var(--tk-muted)]">dikembalikan ke dokter umum</p>
                </article>
            </section>

            <div className="mt-6 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-label="Pencarian dan filter permintaan" className={cn('min-w-0 rounded-[20px] p-3', glass)}>
                        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                            <div
                                role="tablist"
                                aria-label="Filter status permintaan"
                                className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:pb-0 [&::-webkit-scrollbar]:hidden"
                            >
                                {filterPilihan.map(({ key, label, jumlah: total }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={filter === key}
                                        onClick={() => setFilter(key)}
                                        className={cn(
                                            'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-semibold whitespace-nowrap transition-colors',
                                            filter === key ? 'bg-tk-accent text-tk-deep' : 'text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                        )}
                                    >
                                        {label}
                                        <span className={cn('text-[10px]', filter === key ? 'text-tk-deep/70' : 'text-[var(--tk-muted)]')}>
                                            {total}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full lg:w-[280px] lg:shrink-0">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={cari}
                                    onChange={(event) => setCari(event.target.value)}
                                    placeholder="Cari nama, keluhan, atau nomor"
                                    aria-label="Cari permintaan konsultasi"
                                    className={cn(inputClass, 'h-10 w-full pl-9 text-xs')}
                                />
                            </div>
                        </div>
                    </section>

                    <div className="grid min-w-0 gap-4">
                        {tampil.length === 0 ? (
                            <div className={cn('rounded-[20px] px-5 py-10 text-center', glass)}>
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent mx-auto grid size-12 place-items-center rounded-full">
                                    <ClipboardList className="size-5" aria-hidden="true" />
                                </span>
                                <p className="mt-3 text-sm font-bold">Tidak ada permintaan pada filter ini</p>
                                <p className="mt-1 text-[11px] text-[var(--tk-muted)]">Coba ubah kata kunci pencarian atau pilih tab status lain.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilter('semua');
                                        setCari('');
                                    }}
                                    className="mt-4 inline-flex min-h-9 items-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Tampilkan semua
                                </button>
                            </div>
                        ) : (
                            tampil.map((item) => {
                                const prioritas = prioritasMeta[item.prioritas];
                                const status = statusMeta[item.status];
                                const IkonStatus = status.ikon;
                                const IkonMode = item.mode === 'teks' ? MessageSquare : Video;
                                const aksiItem = aksi?.id === item.id ? aksi : null;
                                const sedangDiaksi = aksiItem !== null;
                                const metaAksi = aksiItem ? jenisAksiMeta[aksiItem.jenis] : null;
                                const IkonAksi = metaAksi?.ikon ?? Clock;

                                return (
                                    <article key={item.id} className={cn('min-w-0 overflow-hidden rounded-[20px] p-4 lg:p-5', glass)}>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold">
                                                    {initials(item.nama)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <h2 className="max-w-full min-w-0 truncate text-sm font-bold">{item.nama}</h2>
                                                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', prioritas.tone)}>
                                                            {prioritas.label}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'} · {item.alamat}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                        {item.nomor} · {item.spesialisasi} · diminta {item.diminta}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={cn(
                                                    'inline-flex w-fit shrink-0 items-center gap-1 self-start rounded-full px-2.5 py-1 text-[10px] font-bold sm:ml-auto',
                                                    status.tone,
                                                )}
                                            >
                                                <IkonStatus className="size-3" aria-hidden="true" />
                                                {labelStatusPermintaan[item.status]}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5">
                                                <p className="text-[10px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">
                                                    Keluhan utama
                                                </p>
                                                <p className="mt-1 text-xs leading-relaxed">{item.keluhan}</p>
                                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">Durasi {item.durasiKeluhan}</p>
                                            </div>

                                            <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[10px] font-semibold tracking-wide text-[var(--tk-muted)] uppercase">
                                                        Skrining perawat
                                                    </p>
                                                    {item.skrining.tandaBahaya ? (
                                                        <span className="text-tk-danger inline-flex items-center gap-1 text-[10px] font-bold">
                                                            <AlertTriangle className="size-3" aria-hidden="true" />
                                                            Tanda bahaya
                                                        </span>
                                                    ) : (
                                                        <span className="text-tk-success inline-flex items-center gap-1 text-[10px] font-bold">
                                                            <ShieldCheck className="size-3" aria-hidden="true" />
                                                            Stabil
                                                        </span>
                                                    )}
                                                </div>
                                                <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-[var(--tk-muted)]">Tensi</dt>
                                                        <dd className="font-semibold">
                                                            {item.skrining.sistol}/{item.skrining.diastol}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-[var(--tk-muted)]">Suhu</dt>
                                                        <dd className="font-semibold">{item.skrining.suhu} °C</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-[var(--tk-muted)]">Nadi</dt>
                                                        <dd className="font-semibold">{item.skrining.nadi} bpm</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-[var(--tk-muted)]">SpO₂</dt>
                                                        <dd className="font-semibold">{item.skrining.spo2}%</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>

                                        <p className="mt-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">{item.catatanSkrining}</p>

                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--tk-glass-border)] pt-3 text-[10px] text-[var(--tk-muted)]">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays className="size-3" aria-hidden="true" />
                                                Usulan: {item.jadwalUsulan}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <IkonMode className="size-3" aria-hidden="true" />
                                                {modeLabel(item.mode)}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <UserRound className="size-3" aria-hidden="true" />
                                                Dikirim {item.dokterPengirim}
                                            </span>
                                        </div>

                                        {item.keputusan && (
                                            <div
                                                className={cn(
                                                    'mt-3 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed',
                                                    item.status === 'DIKONFIRMASI'
                                                        ? 'border-tk-success/30 bg-tk-success/10'
                                                        : item.status === 'DIJADWAL_ULANG'
                                                          ? 'border-tk-info/30 bg-tk-info/10'
                                                          : 'border-tk-danger/30 bg-tk-danger/10',
                                                )}
                                            >
                                                <p className="font-bold">
                                                    {item.status === 'DIKONFIRMASI'
                                                        ? 'Diterima'
                                                        : item.status === 'DIJADWAL_ULANG'
                                                          ? 'Dijadwal ulang'
                                                          : 'Ditolak'}{' '}
                                                    · {item.keputusan.waktu}
                                                </p>
                                                {item.keputusan.slotBaru && (
                                                    <p className="mt-1 inline-flex items-center gap-1 text-[var(--tk-muted)]">
                                                        <Clock className="size-3" aria-hidden="true" />
                                                        Slot: {item.keputusan.slotBaru}
                                                    </p>
                                                )}
                                                {item.keputusan.alasan && <p className="mt-1 text-[var(--tk-muted)]">{item.keputusan.alasan}</p>}
                                            </div>
                                        )}

                                        {item.status === 'MENUNGGU_SPESIALIS' && !sedangDiaksi && (
                                            <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => mulaiAksi(item.id, 'terima')}
                                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors"
                                                >
                                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                                    Terima
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => mulaiAksi(item.id, 'jadwal_ulang')}
                                                    className="border-tk-info/40 text-tk-info hover:bg-tk-info/10 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors"
                                                >
                                                    <CalendarClock className="size-4" aria-hidden="true" />
                                                    Jadwal ulang
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => mulaiAksi(item.id, 'tolak')}
                                                    className="border-tk-danger/40 text-tk-danger hover:bg-tk-danger/10 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors"
                                                >
                                                    <XCircle className="size-4" aria-hidden="true" />
                                                    Tolak
                                                </button>
                                            </div>
                                        )}

                                        {item.status !== 'MENUNGGU_SPESIALIS' && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                {item.status === 'DIKONFIRMASI' && (
                                                    <Link
                                                        href={`/spesialis/konsultasi/${item.id}`}
                                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center gap-1 rounded-full px-4 text-xs font-bold transition-colors"
                                                    >
                                                        Buka ruang konsultasi
                                                        <ChevronRight className="size-3.5" aria-hidden="true" />
                                                    </Link>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => kembalikan(item)}
                                                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                                >
                                                    <RotateCcw className="size-3.5" aria-hidden="true" />
                                                    Kembalikan ke daftar tunggu
                                                </button>
                                            </div>
                                        )}

                                        {aksiItem && metaAksi && itemAksi && (
                                            <form
                                                onSubmit={(event) => kirimKeputusan(event, item, aksiItem.jenis)}
                                                noValidate
                                                className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)]/60 p-4"
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <span
                                                        className={cn(
                                                            'grid size-8 shrink-0 place-items-center rounded-full',
                                                            aksiItem.jenis === 'terima'
                                                                ? 'bg-tk-success/15 text-tk-success'
                                                                : aksiItem.jenis === 'jadwal_ulang'
                                                                  ? 'bg-tk-info/15 text-tk-info'
                                                                  : 'bg-tk-danger/15 text-tk-danger',
                                                        )}
                                                    >
                                                        <IkonAksi className="size-4" aria-hidden="true" />
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-bold">{metaAksi.judul}</p>
                                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                            {metaAksi.keterangan}
                                                        </p>
                                                    </div>
                                                </div>

                                                {aksiItem.jenis !== 'terima' && (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {alasanCepat[aksiItem.jenis].map((saran) => (
                                                            <button
                                                                key={saran}
                                                                type="button"
                                                                onClick={() => {
                                                                    setAlasan(saran);
                                                                    setErrors((previous) => ({ ...previous, alasan: undefined }));
                                                                }}
                                                                className="rounded-full border border-[var(--tk-glass-border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                                            >
                                                                {saran}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {aksiItem.jenis === 'jadwal_ulang' && (
                                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label htmlFor={`tanggal-${item.id}`} className="text-[11px] font-bold">
                                                                Tanggal baru
                                                            </label>
                                                            <Input
                                                                id={`tanggal-${item.id}`}
                                                                type="date"
                                                                min={hariIni}
                                                                value={tanggal}
                                                                onChange={(event) => {
                                                                    setTanggal(event.target.value);
                                                                    setErrors((previous) => ({ ...previous, tanggal: undefined }));
                                                                }}
                                                                aria-invalid={Boolean(errors.tanggal)}
                                                                className={cn(inputClass, 'mt-1.5 w-full')}
                                                            />
                                                            <InputError message={errors.tanggal} className="text-tk-danger mt-1 text-[10px]" />
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`jam-${item.id}`} className="text-[11px] font-bold">
                                                                Jam mulai
                                                            </label>
                                                            <Input
                                                                id={`jam-${item.id}`}
                                                                type="time"
                                                                value={jam}
                                                                onChange={(event) => {
                                                                    setJam(event.target.value);
                                                                    setErrors((previous) => ({ ...previous, jam: undefined }));
                                                                }}
                                                                aria-invalid={Boolean(errors.jam)}
                                                                className={cn(inputClass, 'mt-1.5 w-full')}
                                                            />
                                                            <InputError message={errors.jam} className="text-tk-danger mt-1 text-[10px]" />
                                                        </div>
                                                        <p className="text-[10px] text-[var(--tk-muted)] sm:col-span-2">
                                                            Cek ketersediaan slot di{' '}
                                                            <Link
                                                                href="/spesialis/jadwal"
                                                                className="text-tk-green-500 dark:text-tk-accent font-semibold"
                                                            >
                                                                Kelola jadwal praktik
                                                            </Link>
                                                            .
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="mt-3">
                                                    <label htmlFor={`alasan-${item.id}`} className="text-[11px] font-bold">
                                                        {aksiItem.jenis === 'terima' ? 'Catatan (opsional)' : 'Alasan'}
                                                    </label>
                                                    <textarea
                                                        id={`alasan-${item.id}`}
                                                        value={alasan}
                                                        onChange={(event) => {
                                                            setAlasan(event.target.value);
                                                            setErrors((previous) => ({ ...previous, alasan: undefined }));
                                                        }}
                                                        rows={3}
                                                        placeholder={
                                                            aksiItem.jenis === 'terima'
                                                                ? 'Contoh: Data skrining lengkap, silakan siapkan pasien pada slot yang diajukan.'
                                                                : aksiItem.jenis === 'jadwal_ulang'
                                                                  ? 'Jelaskan alasan penjadwalan ulang agar pasien dan perawat paham.'
                                                                  : 'Jelaskan alasan penolakan dan saran tindak lanjut.'
                                                        }
                                                        aria-invalid={Boolean(errors.alasan)}
                                                        className={cn(textareaClass, 'mt-1.5 text-xs')}
                                                    />
                                                    <InputError message={errors.alasan} className="text-tk-danger mt-1 text-[10px]" />
                                                </div>

                                                <div className="mt-3 grid gap-2 sm:flex">
                                                    <button
                                                        type="submit"
                                                        className={cn(
                                                            'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-colors',
                                                            aksiItem.jenis === 'terima'
                                                                ? 'bg-tk-accent text-tk-deep hover:bg-tk-mint'
                                                                : aksiItem.jenis === 'jadwal_ulang'
                                                                  ? 'bg-tk-info hover:bg-tk-info/90 text-white'
                                                                  : 'bg-tk-danger hover:bg-tk-danger/90 text-white',
                                                        )}
                                                    >
                                                        <IkonAksi className="size-4" aria-hidden="true" />
                                                        {metaAksi.tombol}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={tutupAksi}
                                                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>

                <aside className="grid min-w-0 content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="panduan-keputusan" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-2">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                <ShieldCheck className="size-4" aria-hidden="true" />
                            </span>
                            <h2 id="panduan-keputusan" className="text-[15px] font-bold">
                                Panduan keputusan
                            </h2>
                        </div>
                        <ul className="mt-3 grid gap-3 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-tk-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                    <span className="font-semibold text-[var(--tk-text)]">Terima</span> jika data skrining lengkap dan slot sesuai
                                    jadwal praktik.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CalendarClock className="text-tk-info mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                    <span className="font-semibold text-[var(--tk-text)]">Jadwal ulang</span> jika slot bentrok atau pemeriksaan
                                    penunjang belum lengkap.
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <XCircle className="text-tk-danger mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                    <span className="font-semibold text-[var(--tk-text)]">Tolak</span> hanya dengan alasan jelas agar dokter umum bisa
                                    menindaklanjuti.
                                </span>
                            </li>
                        </ul>
                    </section>

                    <section aria-labelledby="aturan-permintaan" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aturan-permintaan" className="text-[15px] font-bold">
                            Yang perlu diingat
                        </h2>
                        <ul className="mt-3 grid gap-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-2">
                                <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Permintaan hanya masuk setelah skrining perawat lengkap dan disetujui dokter umum.
                            </li>
                            <li className="flex items-start gap-2">
                                <AlertTriangle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Kasus triase merah tetap wajib dievaluasi lebih dulu, termasuk kemungkinan rujukan darurat.
                            </li>
                            <li className="flex items-start gap-2">
                                <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Setiap keputusan otomatis memberi notifikasi ke pasien dan perawat pengirim.
                            </li>
                        </ul>
                    </section>

                    <section aria-label="Catatan koneksi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Mode mengikuti kualitas koneksi</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Permintaan mode teks tetap bisa diterima saat sinyal lemah. Perubahan keputusan disimpan lokal dan disinkronkan ketika
                                koneksi kembali.
                            </p>
                        </div>
                    </section>

                    <Link
                        href="/spesialis"
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                    >
                        Kembali ke beranda spesialis
                    </Link>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
