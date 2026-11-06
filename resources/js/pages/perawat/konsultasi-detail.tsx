import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    HeartPulse,
    ImagePlus,
    Info,
    Lock,
    MapPin,
    MessageSquare,
    Phone,
    Ruler,
    Scale,
    Send,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    UserRound,
    Video,
    Wifi,
    Wind,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import ConnectionBadge from '@/components/connection-badge';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { modeKonsultasiLabels, statusKonsultasiLabels, type ModeKonsultasi, type StatusKonsultasi } from '@/data/konsultasi-pasien';
import { cariKonsultasiPerawat, type PesanPerawat } from '@/data/konsultasi-perawat';
import { alasanKoneksi, useConnection } from '@/hooks/use-connection';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { bacaPesanLokal, kompresGambar, simpanPesanLokal } from '@/lib/chat';
import { cn } from '@/lib/utils';

interface KonsultasiDetailProps {
    konsultasiId: number;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const tahapKonsultasi = ['Permintaan', 'Skrining', 'Review dokter', 'Spesialis', 'Konsultasi', 'Hasil'];

const statusKeTahap: Record<StatusKonsultasi, number> = {
    MENUNGGU_SKRINING: 0,
    SKRINING_SELESAI: 1,
    MENUNGGU_SPESIALIS: 2,
    DIKONFIRMASI: 3,
    BERLANGSUNG: 4,
    SELESAI: 5,
    DIJADWAL_ULANG: 2,
    DITOLAK: 2,
    KEDALUWARSA: 1,
    DIBATALKAN: 0,
};

const statusJudul: Record<StatusKonsultasi, string> = {
    MENUNGGU_SKRINING: 'Menunggu skrining perawat',
    SKRINING_SELESAI: 'Skrining selesai, menunggu review',
    MENUNGGU_SPESIALIS: 'Menunggu konfirmasi dokter spesialis',
    DIKONFIRMASI: 'Jadwal dikonfirmasi dokter spesialis',
    BERLANGSUNG: 'Konsultasi sedang berlangsung',
    SELESAI: 'Konsultasi selesai',
    DIJADWAL_ULANG: 'Jadwal diubah dokter spesialis',
    DITOLAK: 'Permintaan ditolak dokter spesialis',
    KEDALUWARSA: 'Permintaan kedaluwarsa',
    DIBATALKAN: 'Permintaan dibatalkan',
};

const statusTone: Record<StatusKonsultasi, string> = {
    MENUNGGU_SKRINING: 'bg-tk-warning/15 text-tk-warning',
    SKRINING_SELESAI: 'bg-tk-info/15 text-tk-info',
    MENUNGGU_SPESIALIS: 'bg-tk-info/15 text-tk-info',
    DIKONFIRMASI: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    BERLANGSUNG: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    SELESAI: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    DIJADWAL_ULANG: 'bg-tk-warning/15 text-tk-warning',
    DITOLAK: 'bg-tk-danger/15 text-tk-danger',
    KEDALUWARSA: 'bg-tk-danger/15 text-tk-danger',
    DIBATALKAN: 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
};

const statusIkon: Record<StatusKonsultasi, LucideIcon> = {
    MENUNGGU_SKRINING: Clock,
    SKRINING_SELESAI: ClipboardCheck,
    MENUNGGU_SPESIALIS: Stethoscope,
    DIKONFIRMASI: CheckCircle2,
    BERLANGSUNG: Video,
    SELESAI: CheckCircle2,
    DIJADWAL_ULANG: CalendarDays,
    DITOLAK: AlertTriangle,
    KEDALUWARSA: AlertTriangle,
    DIBATALKAN: AlertTriangle,
};

const statistikChat = ['MENUNGGU_SPESIALIS', 'DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'] as const;

const labelPengirim: Record<PesanPerawat['pengirim'], string> = {
    pasien: 'Pasien',
    perawat: 'Anda',
    spesialis: 'Dokter spesialis',
};

function inisial(nama: string, abaikanGelar = false): string {
    const namaBersih = abaikanGelar ? nama.replace(/^dr\.?\s+/i, '') : nama;

    return (
        namaBersih
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

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

function formatRupiah(nilai: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(nilai);
}

function bisaChat(status: StatusKonsultasi): boolean {
    return (statistikChat as readonly StatusKonsultasi[]).includes(status);
}

export default function KonsultasiDetailPerawat({ konsultasiId }: KonsultasiDetailProps) {
    const data = cariKonsultasiPerawat(konsultasiId);
    const koneksi = useConnection();
    const kunciPesan = `telekarang:konsultasi-perawat:${data.id}`;

    const [pesanLokal, setPesanLokal] = useState<PesanPerawat[]>([]);
    const [pesanBaru, setPesanBaru] = useState('');
    const [errorPesan, setErrorPesan] = useState<string>();
    const [mode, setMode] = useState<ModeKonsultasi>(data.mode);
    const [modeManual, setModeManual] = useState<ModeKonsultasi | null>(null);
    const [fotoLampiran, setFotoLampiran] = useState<string | null>(null);
    const [memprosesFoto, setMemprosesFoto] = useState(false);
    const [info, setInfo] = useState<string | null>(null);
    const [penyimpananPenuh, setPenyimpananPenuh] = useState(false);
    const [tersalin, setTersalin] = useState(false);

    const ujungChat = useRef<HTMLDivElement>(null);
    const semuaPesan = [...data.pesan, ...pesanLokal];
    const labelStatus = statusKonsultasiLabels[data.status];
    const labelMode = modeKonsultasiLabels[mode];
    const IconStatus = statusIkon[data.status];
    const tahapAktif = statusKeTahap[data.status];
    const chatTerbuka = bisaChat(data.status);
    const tampilkanHasil = data.hasil !== null;
    const tautanVideo = `https://meet.jit.si/TeleKarang-${data.nomor}`;

    const alasanMode =
        mode === 'teks'
            ? koneksi.status === 'offline'
                ? alasanKoneksi.offline
                : koneksi.status === 'lemah'
                  ? alasanKoneksi.lemah
                  : 'Mode teks dipilih manual agar konsultasi tetap berjalan saat sinyal tidak stabil.'
            : null;

    useEffect(() => {
        setPesanLokal(bacaPesanLokal<PesanPerawat>(kunciPesan));
        setPesanBaru('');
        setErrorPesan(undefined);
        setFotoLampiran(null);
        setModeManual(null);
        setMode(data.mode);
        setInfo(null);
        setPenyimpananPenuh(false);
    }, [data.id, data.mode, kunciPesan]);

    useEffect(() => {
        if (modeManual !== null) {
            return;
        }

        setMode(koneksi.status === 'stabil' ? data.mode : 'teks');
    }, [koneksi.status, data.mode, modeManual]);

    useEffect(() => {
        if (koneksi.status === 'offline') {
            return;
        }

        setPesanLokal((previous) => {
            if (!previous.some((pesan) => pesan.statusKirim === 'MENUNGGU')) {
                return previous;
            }

            setInfo('Sinyal kembali. Pesan yang tertunda sudah dikirim.');

            return previous.map((pesan) => (pesan.statusKirim === 'MENUNGGU' ? { ...pesan, statusKirim: 'TERKIRIM' } : pesan));
        });
    }, [koneksi.status]);

    useEffect(() => {
        if (pesanLokal.length === 0) {
            return;
        }

        setPenyimpananPenuh(!simpanPesanLokal(kunciPesan, pesanLokal));
    }, [kunciPesan, pesanLokal]);

    useEffect(() => {
        ujungChat.current?.scrollTo({ top: ujungChat.current.scrollHeight, behavior: 'smooth' });
    }, [semuaPesan.length]);

    function gantiMode(baru: ModeKonsultasi) {
        setModeManual(baru);
        setMode(baru);
        setInfo(baru === 'teks' ? 'Beralih ke mode teks + foto. Konsultasi tetap berjalan tanpa video.' : 'Kembali ke mode standar video + chat.');
    }

    async function salinTautan() {
        try {
            await navigator.clipboard.writeText(tautanVideo);
            setTersalin(true);
            window.setTimeout(() => setTersalin(false), 2000);
        } catch {
            setInfo('Tautan tidak dapat disalin otomatis. Salin manual dari kolom tautan.');
        }
    }

    async function pilihFoto(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setErrorPesan('Lampiran harus berupa gambar.');
            return;
        }

        setMemprosesFoto(true);

        try {
            const hasil = await kompresGambar(file);
            setFotoLampiran(hasil);
            setErrorPesan(undefined);
        } catch {
            setErrorPesan('Foto gagal diproses. Coba gambar lain.');
        } finally {
            setMemprosesFoto(false);
        }
    }

    function kirimPesan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const isi = pesanBaru.trim();

        if (isi.length < 3 && !fotoLampiran) {
            setErrorPesan('Pesan minimal 3 karakter atau lampirkan foto.');
            return;
        }

        setPesanLokal((previous) => [
            ...previous,
            {
                id: Date.now(),
                pengirim: 'perawat',
                isi: isi.length >= 3 ? isi : 'Mengirim foto kondisi pasien.',
                waktu: 'Baru saja',
                foto: fotoLampiran,
                statusKirim: koneksi.status === 'offline' ? 'MENUNGGU' : 'TERKIRIM',
            },
        ]);
        setPesanBaru('');
        setFotoLampiran(null);
        setErrorPesan(undefined);
    }

    const tandaVital = data.skrining
        ? [
              {
                  label: 'Berat badan',
                  nilai: String(data.skrining.beratBadan),
                  satuan: 'kg',
                  icon: Scale,
              },
              {
                  label: 'Tinggi badan',
                  nilai: String(data.skrining.tinggiBadan),
                  satuan: 'cm',
                  icon: Ruler,
              },
              {
                  label: 'Tekanan darah',
                  nilai: `${data.skrining.sistol}/${data.skrining.diastol}`,
                  satuan: 'mmHg',
                  icon: Activity,
              },
              {
                  label: 'Suhu tubuh',
                  nilai: angkaDesimal(data.skrining.suhu),
                  satuan: '°C',
                  icon: Thermometer,
              },
              {
                  label: 'Nadi',
                  nilai: String(data.skrining.nadi),
                  satuan: 'bpm',
                  icon: HeartPulse,
              },
              {
                  label: 'SpO₂',
                  nilai: String(data.skrining.spo2),
                  satuan: '%',
                  icon: Wind,
              },
          ]
        : [];

    return (
        <PerawatAppLayout
            active="antrean"
            title={`Detail konsultasi · ${data.pasien.nama}`}
            description="Pantau status, periksa hasil skrining, dampingi ruang konsultasi, dan catat tindak lanjut pasien."
        >
            <Head title={`Detail konsultasi ${data.pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/perawat/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar permintaan
                </Link>
                <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                    {data.nomor}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="status-konsultasi" className={cn('overflow-hidden rounded-[26px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold',
                                            statusTone[data.status],
                                        )}
                                    >
                                        <IconStatus className="size-3.5" aria-hidden="true" />
                                        {labelStatus}
                                    </span>
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        {mode === 'video' ? (
                                            <Video className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                        )}
                                        {labelMode}
                                    </span>
                                </div>

                                <h1 className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">{statusJudul[data.status]}</h1>
                                <p className="text-tk-deep/75 mt-1 text-xs">
                                    {data.pasien.nama} · {data.pasien.usia} tahun · {data.pasien.noRm}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-tk-deep text-tk-mint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                                        <CalendarDays className="size-3.5" aria-hidden="true" />
                                        {data.jadwal}
                                    </span>
                                    <span className="text-tk-deep inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-[10px] font-bold">
                                        <Stethoscope className="size-3.5" aria-hidden="true" />
                                        Spesialis {data.spesialisasi}
                                    </span>
                                    {data.prioritas === 'merah' && (
                                        <span className="text-tk-danger inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold">
                                            <AlertTriangle className="size-3.5" aria-hidden="true" />
                                            Prioritas merah
                                        </span>
                                    )}
                                </div>

                                {data.status === 'KEDALUWARSA' && (
                                    <p className="text-tk-deep mt-3 flex items-start gap-1.5 text-[10px] font-semibold">
                                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                        Permintaan kedaluwarsa pada {data.kedaluwarsaPada}. Slot sudah dilepas otomatis.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6" aria-label="Progres konsultasi">
                                {tahapKonsultasi.map((tahap, index) => {
                                    const selesai = index <= tahapAktif;
                                    const aktif = index === tahapAktif;

                                    return (
                                        <li key={tahap} className="flex flex-col items-center gap-1.5 text-center">
                                            <span
                                                className={cn(
                                                    'grid size-7 place-items-center rounded-full',
                                                    selesai
                                                        ? 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent'
                                                        : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                                    aktif && 'ring-tk-green-500/30 ring-2',
                                                )}
                                            >
                                                {selesai ? (
                                                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                ) : (
                                                    <span className="text-[9px] font-bold">{index + 1}</span>
                                                )}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[9px] leading-tight font-semibold',
                                                    aktif ? 'text-[var(--tk-text)]' : 'text-[var(--tk-muted)]',
                                                )}
                                            >
                                                {tahap}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    </section>

                    <section aria-labelledby="identitas-keluhan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                    {inisial(data.pasien.nama)}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Pasien</p>
                                    <h2 id="identitas-keluhan" className="mt-0.5 text-lg leading-tight font-bold">
                                        {data.pasien.nama}
                                    </h2>
                                    <p className="mt-1 text-[11px] text-[var(--tk-muted)]">
                                        {data.pasien.usia} tahun · {data.pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {data.pasien.noRm}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">NIK {maskNik(data.pasien.nik)}</p>
                                </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <UserRound className="size-3" aria-hidden="true" />
                                {data.pasien.sumber}
                            </span>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keluhan utama</p>
                            <p className="mt-1 text-[12px] leading-relaxed">{data.keluhan}</p>
                            <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                <Clock className="size-3" aria-hidden="true" />
                                Dirasa sejak {data.durasiKeluhan}
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="data-skrining" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Skrining perawat</p>
                                <h2 id="data-skrining" className="mt-1 text-[17px] font-bold">
                                    Data klinis awal
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {data.skrining
                                        ? `Diisi ${data.skrining.perawat} · ${data.skrining.waktu}`
                                        : 'Belum ada data skrining untuk permintaan ini.'}
                                </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <Lock className="size-3" aria-hidden="true" />
                                Read-only
                            </span>
                        </div>

                        {data.skrining ? (
                            <>
                                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {tandaVital.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div key={item.label} className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                                <dt className="flex items-center gap-1 text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    <Icon className="size-3" aria-hidden="true" />
                                                    {item.label}
                                                </dt>
                                                <dd className="mt-1.5 text-sm font-bold">
                                                    {item.nilai}
                                                    <span className="ml-1 text-[9px] font-medium text-[var(--tk-muted)]">{item.satuan}</span>
                                                </dd>
                                            </div>
                                        );
                                    })}
                                </dl>

                                <div
                                    className={cn(
                                        'mt-3 flex items-start gap-2.5 rounded-2xl p-3.5',
                                        data.skrining.tandaBahaya ? 'bg-tk-danger/10' : 'bg-tk-green-500/[0.08]',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid size-8 shrink-0 place-items-center rounded-full',
                                            data.skrining.tandaBahaya
                                                ? 'bg-tk-danger/15 text-tk-danger'
                                                : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                        )}
                                    >
                                        {data.skrining.tandaBahaya ? (
                                            <AlertTriangle className="size-4" aria-hidden="true" />
                                        ) : (
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        )}
                                    </span>
                                    <div>
                                        <p className={cn('text-[11px] font-bold', data.skrining.tandaBahaya && 'text-tk-danger')}>
                                            {data.skrining.tandaBahaya ? 'Tanda bahaya terdeteksi' : 'Tidak ada tanda bahaya'}
                                        </p>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            {data.skrining.tandaBahaya
                                                ? 'Pasien diprioritaskan untuk evaluasi dokter dan kemungkinan rujukan segera.'
                                                : 'Hasil triase otomatis tidak menemukan tanda bahaya. Permintaan dapat direview dokter umum.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Catatan perawat</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{data.skrining.catatan}</p>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-[var(--tk-glass-border)] px-5 py-8 text-center">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-11 place-items-center rounded-full">
                                    <ClipboardCheck className="size-5" aria-hidden="true" />
                                </span>
                                <p className="mt-3 text-xs font-bold">Skrining belum diisi</p>
                                <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    Lengkapi tanda vital dan keluhan sebelum permintaan dapat direview dokter umum.
                                </p>
                                <Link
                                    href={`/perawat/skrining/${data.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[10px] font-bold"
                                >
                                    Isi skrining
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </section>

                    <section aria-labelledby="review-dokter" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                                <Stethoscope className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Dokter umum</p>
                                <h2 id="review-dokter" className="mt-0.5 text-[15px] font-bold">
                                    Review skrining
                                </h2>
                            </div>
                        </div>

                        {data.reviewUmum ? (
                            <div className="mt-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:text-tk-accent inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                        <CheckCircle2 className="size-3" aria-hidden="true" />
                                        {data.reviewUmum.status === 'DISETUJUI' ? 'Disetujui ke spesialis' : 'Ditangani di puskesmas'}
                                    </span>
                                    <span className="text-[10px] text-[var(--tk-muted)]">{data.reviewUmum.waktu}</span>
                                </div>
                                <p className="mt-3 text-[11px] font-bold">{data.reviewUmum.dokter}</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">{data.reviewUmum.catatan}</p>
                            </div>
                        ) : (
                            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                {data.skrining
                                    ? 'Skrining sudah lengkap dan sedang menunggu review dokter umum sebelum diteruskan ke dokter spesialis.'
                                    : 'Review dokter umum dapat dilakukan setelah skrining perawat lengkap.'}
                            </p>
                        )}
                    </section>

                    {tampilkanHasil && data.hasil && (
                        <section aria-labelledby="hasil-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                    <FileText className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Hasil konsultasi</p>
                                    <h2 id="hasil-konsultasi" className="mt-1 text-[17px] font-bold">
                                        Keputusan dokter spesialis
                                    </h2>
                                    <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                        {data.dokter} · {data.hasil.waktu}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="bg-tk-deep text-tk-mint rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold">
                                        {data.hasil.icd10Kode}
                                    </span>
                                    <p className="text-sm font-bold">{data.hasil.icd10Nama}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Saran dokter</p>
                                <p className="mt-1.5 text-[11px] leading-relaxed">{data.hasil.saran}</p>
                            </div>

                            <div
                                className={cn(
                                    'mt-4 rounded-2xl border p-4',
                                    data.hasil.keputusanRujuk
                                        ? 'border-tk-warning/30 bg-tk-warning/10'
                                        : 'border-tk-green-500/30 bg-tk-green-500/[0.08]',
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={cn(
                                            'grid size-9 shrink-0 place-items-center rounded-full',
                                            data.hasil.keputusanRujuk
                                                ? 'bg-tk-warning/15 text-tk-warning'
                                                : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                        )}
                                    >
                                        {data.hasil.keputusanRujuk ? (
                                            <MapPin className="size-4" aria-hidden="true" />
                                        ) : (
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        )}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keputusan</p>
                                        <p className={cn('mt-0.5 text-sm font-bold', data.hasil.keputusanRujuk && 'text-tk-warning')}>
                                            {data.hasil.keputusanRujuk ? 'Perlu dirujuk' : 'Tidak dirujuk'}
                                        </p>
                                        {data.hasil.keputusanRujuk ? (
                                            <>
                                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.hasil.alasanRujuk}</p>
                                                {data.hasil.biayaRujukan !== null && (
                                                    <p className="mt-2 inline-flex rounded-full bg-[var(--tk-glass)] px-2.5 py-1 text-[10px] font-semibold">
                                                        Estimasi biaya rujukan: {formatRupiah(data.hasil.biayaRujukan)}
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Kasus ini tercatat sebagai rujukan terhindarkan dan dapat ditangani di Puskesmas Pulau Karang.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {data.hasil.tindakLanjut && (
                                <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Tindak lanjut</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{data.hasil.tindakLanjut}</p>
                                </div>
                            )}

                            {!data.hasil.tindakLanjut && (
                                <Link
                                    href={`/perawat/tindak-lanjut/${data.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-bold"
                                >
                                    Catat tindak lanjut
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            )}
                        </section>
                    )}

                    <section aria-labelledby="ruang-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Percakapan</p>
                                <h2 id="ruang-konsultasi" className="mt-1 text-[17px] font-bold">
                                    Ruang konsultasi
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {semuaPesan.length} pesan · {labelMode}
                                </p>
                            </div>
                            <ConnectionBadge status={koneksi.status} />
                        </div>

                        {chatTerbuka ? (
                            <>
                                <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Pilih mode konsultasi">
                                    <button
                                        type="button"
                                        onClick={() => gantiMode('video')}
                                        aria-pressed={mode === 'video'}
                                        className={cn(
                                            'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition-colors',
                                            mode === 'video'
                                                ? 'bg-tk-accent text-tk-deep border-transparent'
                                                : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                        )}
                                    >
                                        <Video className="size-3.5" aria-hidden="true" />
                                        Standar (video + chat)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => gantiMode('teks')}
                                        aria-pressed={mode === 'teks'}
                                        className={cn(
                                            'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition-colors',
                                            mode === 'teks'
                                                ? 'bg-tk-accent text-tk-deep border-transparent'
                                                : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                        )}
                                    >
                                        <MessageSquare className="size-3.5" aria-hidden="true" />
                                        Koneksi rendah (teks + foto)
                                    </button>
                                </div>

                                {info && (
                                    <p className="bg-tk-info/10 text-tk-info mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[10px] leading-relaxed">
                                        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                        {info}
                                    </p>
                                )}

                                {mode === 'video' ? (
                                    <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-4">
                                        <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            Sesi video (simulasi)
                                        </p>
                                        <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            Bagikan tautan ini kepada dokter spesialis. Pada produksi, gunakan penyedia video terenkripsi dan
                                            autentikasi peserta.
                                        </p>
                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                            <Input
                                                readOnly
                                                value={tautanVideo}
                                                aria-label="Tautan video konsultasi"
                                                className="h-10 w-full rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page)] font-mono text-[10px]"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={salinTautan}
                                                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--tk-glass)] px-3 text-[10px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                                >
                                                    <Copy className="size-3.5" aria-hidden="true" />
                                                    {tersalin ? 'Tersalin' : 'Salin'}
                                                </button>
                                                <a
                                                    href={tautanVideo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-bold transition-colors"
                                                >
                                                    <ExternalLink className="size-3.5" aria-hidden="true" />
                                                    Gabung video
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    alasanMode && (
                                        <div className="bg-tk-warning/10 mt-4 flex items-start gap-2.5 rounded-2xl p-3.5">
                                            <Wifi className="text-tk-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                <span className="font-bold text-[var(--tk-text)]">Mode koneksi rendah aktif.</span> {alasanMode}
                                            </p>
                                        </div>
                                    )
                                )}

                                {penyimpananPenuh && (
                                    <p className="bg-tk-warning/10 mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        <AlertTriangle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                        Penyimpanan perangkat penuh. Pesan terbaru hanya bertahan selama sesi ini.
                                    </p>
                                )}

                                <div ref={ujungChat} className="mt-4 max-h-[440px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
                                    {semuaPesan.length === 0 ? (
                                        <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[10px] text-[var(--tk-muted)]">
                                            Belum ada pesan pada ruang konsultasi ini.
                                        </p>
                                    ) : (
                                        semuaPesan.map((pesan) => {
                                            const dariPerawat = pesan.pengirim === 'perawat';

                                            return (
                                                <div key={pesan.id} className={cn('flex', dariPerawat && 'justify-end')}>
                                                    <div
                                                        className={cn(
                                                            'max-w-[85%] rounded-2xl px-4 py-3',
                                                            dariPerawat
                                                                ? 'bg-tk-accent text-tk-deep rounded-br-md'
                                                                : 'rounded-bl-md bg-[var(--tk-page-alt)] text-[var(--tk-text)]',
                                                        )}
                                                    >
                                                        <p
                                                            className={cn(
                                                                'text-[9px] font-semibold',
                                                                dariPerawat ? 'text-tk-deep/65' : 'text-[var(--tk-muted)]',
                                                            )}
                                                        >
                                                            {labelPengirim[pesan.pengirim]} · {pesan.waktu}
                                                            {pesan.statusKirim === 'MENUNGGU' && ' · Menunggu kirim'}
                                                        </p>
                                                        {pesan.foto && (
                                                            <img
                                                                src={pesan.foto}
                                                                alt="Lampiran foto konsultasi"
                                                                className="mt-2 max-h-56 w-full rounded-xl object-cover"
                                                            />
                                                        )}
                                                        <p className="mt-1 text-[11px] leading-relaxed">{pesan.isi}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <form onSubmit={kirimPesan} className="mt-4 border-t border-[var(--tk-glass-border)] pt-4">
                                    {fotoLampiran && (
                                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--tk-page-alt)] p-2">
                                            <img src={fotoLampiran} alt="Pratinjau foto terkompres" className="size-14 rounded-lg object-cover" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-semibold">Foto siap dikirim</p>
                                                <p className="text-[9px] text-[var(--tk-muted)]">Dikompres otomatis · maksimal ±200 KB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFotoLampiran(null)}
                                                aria-label="Hapus foto lampiran"
                                                className="text-tk-muted grid size-8 shrink-0 place-items-center rounded-full hover:bg-[var(--tk-glass)] hover:text-[var(--tk-text)]"
                                            >
                                                <X className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            id={`lampiran-perawat-${data.id}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={pilihFoto}
                                            className="sr-only"
                                            disabled={memprosesFoto}
                                        />
                                        <label
                                            htmlFor={`lampiran-perawat-${data.id}`}
                                            aria-label="Lampirkan foto"
                                            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--tk-glass-border)] text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-page-alt)] hover:text-[var(--tk-text)]"
                                        >
                                            <ImagePlus className={cn('size-4', memprosesFoto && 'animate-pulse')} aria-hidden="true" />
                                        </label>
                                        <Input
                                            value={pesanBaru}
                                            onChange={(event) => {
                                                setPesanBaru(event.target.value);
                                                setErrorPesan(undefined);
                                            }}
                                            placeholder="Tulis pesan untuk dokter spesialis..."
                                            aria-label="Tulis pesan untuk dokter spesialis"
                                            aria-invalid={Boolean(errorPesan)}
                                            className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-xs text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={memprosesFoto || (pesanBaru.trim().length < 3 && !fotoLampiran)}
                                            aria-label="Kirim pesan"
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                                        >
                                            <Send className="size-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <InputError message={errorPesan} className="text-tk-danger mt-2 text-[10px]" />
                                </form>

                                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    {koneksi.status === 'offline'
                                        ? 'Anda sedang offline. Pesan dan foto disimpan di perangkat lalu dikirim otomatis saat sinyal kembali.'
                                        : 'Pesan dan foto terkompres terkirim ke dokter spesialis dan pasien.'}
                                </p>
                            </>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-[var(--tk-glass-border)] px-5 py-8 text-center">
                                <span className="grid size-11 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                    <Lock className="size-5" aria-hidden="true" />
                                </span>
                                <p className="mt-3 text-xs font-bold">Ruang konsultasi belum dibuka</p>
                                <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    {data.status === 'SKRINING_SELESAI'
                                        ? 'Tunggu review dokter umum dan konfirmasi dokter spesialis sebelum konsultasi dimulai.'
                                        : data.status === 'KEDALUWARSA'
                                          ? 'Permintaan ini sudah kedaluwarsa. Buat permintaan baru untuk menjadwalkan konsultasi.'
                                          : 'Ruang konsultasi akan terbuka setelah dokter spesialis mengonfirmasi jadwal.'}
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="dokter-penanggung-jawab" className={cn('rounded-[24px] p-5', glass)}>
                        <p id="dokter-penanggung-jawab" className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                            Dokter penanggung jawab
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-tk-mint grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[12px] font-extrabold">
                                {inisial(data.dokter, true)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold">{data.dokter}</p>
                                <p className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Spesialis {data.spesialisasi}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                    {data.faskes}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.jadwal}</p>
                        </div>
                    </section>

                    <section aria-labelledby="kontak-pasien" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="kontak-pasien" className="text-[15px] font-bold">
                            Kontak pasien
                        </h2>
                        <dl className="mt-3 grid gap-3 text-[11px]">
                            <div>
                                <dt className="text-[10px] text-[var(--tk-muted)]">Telepon</dt>
                                <dd className="mt-0.5 flex items-center gap-1.5 font-semibold">
                                    <Phone className="size-3 text-[var(--tk-muted)]" aria-hidden="true" />
                                    {data.pasien.telepon}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] text-[var(--tk-muted)]">Alamat</dt>
                                <dd className="mt-0.5 flex items-start gap-1.5 font-semibold">
                                    <MapPin className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                    {data.pasien.alamat}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] text-[var(--tk-muted)]">Sumber permintaan</dt>
                                <dd className="mt-0.5 font-semibold">{data.pasien.sumber}</dd>
                            </div>
                        </dl>
                    </section>

                    <section aria-labelledby="aksi-perawat" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aksi-perawat" className="text-[15px] font-bold">
                            Aksi perawat
                        </h2>

                        <div className="mt-3 grid gap-1">
                            {data.status === 'MENUNGGU_SKRINING' && (
                                <Link
                                    href={`/perawat/skrining/${data.id}`}
                                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[11px] font-semibold">Isi skrining sekarang</span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            )}

                            {data.skrining && data.status !== 'SELESAI' && data.status !== 'KEDALUWARSA' && (
                                <Link
                                    href={`/perawat/skrining/${data.id}`}
                                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[11px] font-semibold">Perbarui skrining</span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            )}

                            {data.status === 'SELESAI' && (
                                <Link
                                    href={`/perawat/tindak-lanjut/${data.id}`}
                                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <FileText className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[11px] font-semibold">
                                        {data.hasil?.tindakLanjut ? 'Lihat tindak lanjut' : 'Catat tindak lanjut'}
                                    </span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            )}

                            {data.status === 'KEDALUWARSA' && (
                                <Link
                                    href="/perawat/konsultasi/baru"
                                    className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="bg-tk-warning/15 text-tk-warning grid size-8 shrink-0 place-items-center rounded-full">
                                        <CalendarDays className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[11px] font-semibold">Buat permintaan baru</span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            )}

                            <Link
                                href="/perawat/permintaan"
                                className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1 text-[11px] font-semibold">Kembali ke antrean</span>
                                <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                            </Link>
                        </div>
                    </section>

                    <section aria-label="Status koneksi" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'grid size-9 shrink-0 place-items-center rounded-full',
                                    mode === 'teks'
                                        ? 'bg-tk-warning/15 text-tk-warning'
                                        : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                )}
                            >
                                {mode === 'teks' ? <Wifi className="size-4" aria-hidden="true" /> : <Video className="size-4" aria-hidden="true" />}
                            </span>
                            <div>
                                <p className="text-[11px] font-bold">{mode === 'teks' ? 'Mode koneksi rendah' : 'Mode standar'}</p>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    {mode === 'teks'
                                        ? 'Teks dan foto dipakai karena sinyal tidak stabil. Pesan tetap tersimpan saat offline.'
                                        : 'Video dan chat tersedia karena kualitas koneksi mencukupi.'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Hanya perawat, dokter umum, dan dokter spesialis yang menangani yang dapat melihat detail ini. Semua data adalah data
                            fiktif untuk prototipe TeleKarang.
                        </p>
                    </section>
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
