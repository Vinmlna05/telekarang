import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
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
    VideoOff,
    Wifi,
    WifiOff,
    Wind,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import {
    cariKonsultasiRuang,
    labelPengirimRuang,
    type KonsultasiRuang,
    type ModeRuang,
    type PesanRuang,
    type StatusRuang,
} from '@/data/konsultasi-spesialis';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';

interface RuangKonsultasiProps {
    konsultasiId: number;
}

type Koneksi = 'stabil' | 'lemah' | 'offline';

interface KoneksiNavigator extends Navigator {
    connection?: {
        effectiveType?: string;
        saveData?: boolean;
    };
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const videoGradient = 'bg-[linear-gradient(160deg,#04100E_0%,#0A2A27_35%,#2E8B6A_100%)]';

const koneksiMeta: Record<Koneksi, { label: string; tone: string; ikon: LucideIcon }> = {
    stabil: { label: 'Stabil', tone: 'bg-tk-success/15 text-tk-success', ikon: Wifi },
    lemah: { label: 'Lemah', tone: 'bg-tk-warning/15 text-tk-warning', ikon: Wifi },
    offline: { label: 'Offline', tone: 'bg-tk-danger/15 text-tk-danger', ikon: WifiOff },
};

const modeMeta: Record<ModeRuang, { label: string; keterangan: string; ikon: LucideIcon }> = {
    video: { label: 'Mode standar', keterangan: 'Video + chat', ikon: Video },
    teks: { label: 'Mode koneksi rendah', keterangan: 'Teks + foto', ikon: MessageSquare },
};

const statusMeta: Record<StatusRuang, { label: string; tone: string }> = {
    DIKONFIRMASI: { label: 'Dikonfirmasi', tone: 'bg-tk-info/15 text-tk-info' },
    BERLANGSUNG: { label: 'Berlangsung', tone: 'bg-tk-success/15 text-tk-success' },
};

const prioritasMeta: Record<KonsultasiRuang['prioritas'], { label: string; tone: string }> = {
    merah: { label: 'Prioritas tinggi', tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
};

const balasanCepat = [
    'Mohon kirim foto area yang dikeluhkan.',
    'Bagaimana kondisi pasien 30 menit terakhir?',
    'Silakan lanjutkan obat dari puskesmas.',
    'Saya siapkan saran tertulis setelah sesi ini.',
];

function deteksiKoneksi(): { status: Koneksi; alasan: string | null } {
    if (typeof window === 'undefined') {
        return { status: 'stabil', alasan: null };
    }

    if (!window.navigator.onLine) {
        return {
            status: 'offline',
            alasan: 'Perangkat sedang offline. Pesan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.',
        };
    }

    const koneksi = (window.navigator as KoneksiNavigator).connection;
    const tipe = koneksi?.effectiveType ?? '';

    if (tipe === 'slow-2g' || tipe === '2g' || koneksi?.saveData === true) {
        return {
            status: 'lemah',
            alasan: 'Sinyal lemah terdeteksi. Beralih ke mode teks agar konsultasi tetap berjalan tanpa terputus.',
        };
    }

    return { status: 'stabil', alasan: null };
}

function alasanModeAwal(mode: ModeRuang, alasan: string | null): string | null {
    if (alasan) {
        return alasan;
    }

    return mode === 'teks'
        ? 'Permintaan ini berjalan pada mode teks karena sinyal di lokasi pasien terbatas. Konsultasi berlangsung asinkron.'
        : null;
}

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

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

function kunciPesan(id: number): string {
    return `telekarang:konsultasi-spesialis:${id}`;
}

function isPesanRuang(nilai: unknown): nilai is PesanRuang {
    if (typeof nilai !== 'object' || nilai === null) {
        return false;
    }

    const item = nilai as Partial<PesanRuang>;

    return (
        typeof item.id === 'number' &&
        (item.pengirim === 'pasien' || item.pengirim === 'perawat' || item.pengirim === 'spesialis') &&
        typeof item.isi === 'string' &&
        typeof item.waktu === 'string'
    );
}

function bacaPesan(id: number): PesanRuang[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const mentah = window.localStorage.getItem(kunciPesan(id));

        if (!mentah) {
            return [];
        }

        const parsed: unknown = JSON.parse(mentah);

        return Array.isArray(parsed) ? parsed.filter(isPesanRuang) : [];
    } catch {
        return [];
    }
}

function simpanPesan(id: number, daftar: PesanRuang[]): boolean {
    try {
        window.localStorage.setItem(kunciPesan(id), JSON.stringify(daftar));

        return true;
    } catch {
        return false;
    }
}

function kompresGambar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const pembaca = new FileReader();

        pembaca.onerror = () => reject(new Error('Gagal membaca berkas.'));
        pembaca.onload = () => {
            const gambar = new Image();

            gambar.onerror = () => reject(new Error('Gagal memuat gambar.'));
            gambar.onload = () => {
                const skala = Math.min(1, 1024 / Math.max(gambar.width, gambar.height));
                const kanvas = document.createElement('canvas');
                kanvas.width = Math.max(1, Math.round(gambar.width * skala));
                kanvas.height = Math.max(1, Math.round(gambar.height * skala));

                const konteks = kanvas.getContext('2d');

                if (!konteks) {
                    reject(new Error('Kanvas tidak tersedia.'));
                    return;
                }

                konteks.fillStyle = '#ffffff';
                konteks.fillRect(0, 0, kanvas.width, kanvas.height);
                konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);

                let kualitas = 0.8;
                let hasil = kanvas.toDataURL('image/jpeg', kualitas);

                while (hasil.length > 200 * 1024 && kualitas > 0.35) {
                    kualitas -= 0.1;
                    hasil = kanvas.toDataURL('image/jpeg', kualitas);
                }

                resolve(hasil);
            };
            gambar.src = String(pembaca.result);
        };
        pembaca.readAsDataURL(file);
    });
}

export default function RuangKonsultasiSpesialis({ konsultasiId }: RuangKonsultasiProps) {
    const data = cariKonsultasiRuang(konsultasiId);

    const [koneksi, setKoneksi] = useState<Koneksi>('stabil');
    const [mode, setMode] = useState<ModeRuang>(data.mode);
    const [modeManual, setModeManual] = useState<ModeRuang | null>(null);
    const [alasanMode, setAlasanMode] = useState<string | null>(null);
    const [pesanLokal, setPesanLokal] = useState<PesanRuang[]>([]);
    const [pesanBaru, setPesanBaru] = useState('');
    const [fotoLampiran, setFotoLampiran] = useState<string | null>(null);
    const [memprosesFoto, setMemprosesFoto] = useState(false);
    const [errorPesan, setErrorPesan] = useState<string>();
    const [statusRuang, setStatusRuang] = useState<StatusRuang>(data.status);
    const [videoAktif, setVideoAktif] = useState(data.status === 'BERLANGSUNG' && data.mode === 'video');
    const [tersalin, setTersalin] = useState(false);
    const [info, setInfo] = useState<string | null>(null);
    const [penyimpananPenuh, setPenyimpananPenuh] = useState(false);

    const ujungChat = useRef<HTMLDivElement>(null);
    const semuaPesan = [...data.pesan, ...pesanLokal];
    const jumlahPesan = semuaPesan.length;
    const metaKoneksi = koneksiMeta[koneksi];
    const IkonKoneksi = metaKoneksi.ikon;
    const metaMode = modeMeta[mode];
    const IkonMode = metaMode.ikon;
    const prioritas = prioritasMeta[data.prioritas];

    useEffect(() => {
        const terdeteksi = deteksiKoneksi();

        setPesanLokal(bacaPesan(data.id));
        setPesanBaru('');
        setFotoLampiran(null);
        setErrorPesan(undefined);
        setStatusRuang(data.status);
        setVideoAktif(data.status === 'BERLANGSUNG' && data.mode === 'video');
        setModeManual(null);
        setKoneksi(terdeteksi.status);
        setMode(terdeteksi.status === 'stabil' ? data.mode : 'teks');
        setAlasanMode(alasanModeAwal(terdeteksi.status === 'stabil' ? data.mode : 'teks', terdeteksi.alasan));
        setInfo(null);
        setPenyimpananPenuh(false);
    }, [data.id, data.mode, data.status]);

    useEffect(() => {
        function perbaruiKoneksi() {
            const terdeteksi = deteksiKoneksi();
            setKoneksi(terdeteksi.status);

            if (modeManual === null) {
                setMode(terdeteksi.status === 'stabil' ? data.mode : 'teks');
                setAlasanMode(alasanModeAwal(terdeteksi.status === 'stabil' ? data.mode : 'teks', terdeteksi.alasan));
            }

            if (terdeteksi.status !== 'offline') {
                setPesanLokal((previous) => {
                    if (!previous.some((pesan) => pesan.statusKirim === 'MENUNGGU')) {
                        return previous;
                    }

                    setInfo('Sinyal kembali. Pesan yang tertunda sudah dikirim.');

                    return previous.map((pesan) => (pesan.statusKirim === 'MENUNGGU' ? { ...pesan, statusKirim: 'TERKIRIM' } : pesan));
                });
            }
        }

        window.addEventListener('online', perbaruiKoneksi);
        window.addEventListener('offline', perbaruiKoneksi);

        return () => {
            window.removeEventListener('online', perbaruiKoneksi);
            window.removeEventListener('offline', perbaruiKoneksi);
        };
    }, [data.mode, modeManual]);

    useEffect(() => {
        if (pesanLokal.length === 0) {
            return;
        }

        const berhasil = simpanPesan(data.id, pesanLokal);
        setPenyimpananPenuh(!berhasil);
    }, [data.id, pesanLokal]);

    useEffect(() => {
        ujungChat.current?.scrollTo({ top: ujungChat.current.scrollHeight, behavior: 'smooth' });
    }, [jumlahPesan]);

    function gantiMode(baru: ModeRuang) {
        setModeManual(baru);
        setMode(baru);
        setInfo(baru === 'teks' ? 'Beralih ke mode teks + foto. Konsultasi tetap berjalan tanpa video.' : 'Kembali ke mode standar video + chat.');

        if (baru === 'teks') {
            setVideoAktif(false);
            setAlasanMode(
                koneksi === 'offline'
                    ? 'Perangkat sedang offline. Pesan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.'
                    : 'Mode teks dipilih manual agar konsultasi tetap berjalan saat sinyal tidak stabil.',
            );
        } else {
            setAlasanMode(null);
        }
    }

    function mulaiVideo() {
        setVideoAktif(true);
        setStatusRuang('BERLANGSUNG');
        setInfo('Sesi video simulasi dimulai. Tautan dapat dibagikan ke perawat pendamping.');
    }

    function akhiriVideo() {
        setVideoAktif(false);
        setInfo('Sesi video diakhiri. Percakapan teks tetap tersedia.');
    }

    async function salinTautan() {
        if (!data.tautanVideo) {
            return;
        }

        try {
            await navigator.clipboard.writeText(data.tautanVideo);
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

        if (isi.length === 0 && !fotoLampiran) {
            setErrorPesan('Tulis pesan atau lampirkan foto terlebih dahulu.');
            return;
        }

        const pesan: PesanRuang = {
            id: Date.now(),
            pengirim: 'spesialis',
            isi: isi.length > 0 ? isi : 'Mengirim foto kondisi pasien.',
            waktu: 'Baru saja',
            foto: fotoLampiran,
            statusKirim: koneksi === 'offline' ? 'MENUNGGU' : 'TERKIRIM',
        };

        setPesanLokal((previous) => [...previous, pesan]);
        setPesanBaru('');
        setFotoLampiran(null);
        setErrorPesan(undefined);

        if (statusRuang === 'DIKONFIRMASI') {
            setStatusRuang('BERLANGSUNG');
        }
    }

    const tandaVital: { label: string; nilai: string; satuan: string; ikon: LucideIcon }[] = [
        { label: 'Berat badan', nilai: String(data.skrining.beratBadan), satuan: 'kg', ikon: Scale },
        { label: 'Tinggi badan', nilai: String(data.skrining.tinggiBadan), satuan: 'cm', ikon: Ruler },
        { label: 'Tekanan darah', nilai: `${data.skrining.sistol}/${data.skrining.diastol}`, satuan: 'mmHg', ikon: Activity },
        { label: 'Suhu tubuh', nilai: angkaDesimal(data.skrining.suhu), satuan: '°C', ikon: Thermometer },
        { label: 'Nadi', nilai: String(data.skrining.nadi), satuan: 'bpm', ikon: HeartPulse },
        { label: 'SpO₂', nilai: String(data.skrining.spo2), satuan: '%', ikon: Wind },
    ];

    return (
        <SpesialisAppLayout
            active="permintaan"
            title={`Ruang konsultasi · ${data.pasien.nama}`}
            description="Simulasi konsultasi video atau teks dengan data skrining pasien dan antrean pesan yang tetap aman saat sinyal lemah."
        >
            <Head title={`Ruang konsultasi ${data.pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/spesialis/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar permintaan
                </Link>
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                        {data.nomor}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold', metaKoneksi.tone)}>
                        <IkonKoneksi className="size-3" aria-hidden="true" />
                        {metaKoneksi.label}
                    </span>
                </div>
            </div>

            {info && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-info/30 bg-tk-info/10 mb-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3"
                >
                    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--tk-text)]">
                        <Info className="text-tk-info mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {info}
                    </p>
                    <button
                        type="button"
                        onClick={() => setInfo(null)}
                        aria-label="Tutup informasi"
                        className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="ringkasan-ruang" className={cn('overflow-hidden rounded-[26px]', glass)}>
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
                                            statusMeta[statusRuang].tone,
                                        )}
                                    >
                                        <span
                                            className={cn('size-1.5 rounded-full', statusRuang === 'BERLANGSUNG' ? 'bg-tk-success' : 'bg-tk-info')}
                                            aria-hidden="true"
                                        />
                                        {statusMeta[statusRuang].label}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-tk-deep inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold',
                                        )}
                                    >
                                        <IkonMode className="size-3.5" aria-hidden="true" />
                                        {metaMode.keterangan}
                                    </span>
                                </div>

                                <h1 id="ringkasan-ruang" className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">
                                    Konsultasi {data.spesialisasi} · {data.pasien.nama}
                                </h1>
                                <p className="text-tk-deep/75 mt-1 text-xs">
                                    {data.pasien.usia} tahun · {data.pasien.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'} · {data.pasien.noRm}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-tk-deep text-tk-mint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                                        <CalendarDays className="size-3.5" aria-hidden="true" />
                                        {data.jadwal}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-tk-deep inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold',
                                            prioritas.tone,
                                        )}
                                    >
                                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                                        {prioritas.label}
                                    </span>
                                    <span className="text-tk-deep inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-[10px] font-bold">
                                        <Stethoscope className="size-3.5" aria-hidden="true" />
                                        Dikirim {data.dokterPengirim}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keluhan utama</p>
                            <p className="mt-1 text-xs leading-relaxed">{data.keluhan}</p>
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                <Clock className="size-3" aria-hidden="true" />
                                Dirasa sejak {data.durasiKeluhan}
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="mode-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                    <IkonMode className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Mode konsultasi</p>
                                    <h2 id="mode-konsultasi" className="mt-0.5 text-[15px] font-bold">
                                        {metaMode.label}
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{metaMode.keterangan}</p>
                                </div>
                            </div>

                            <div className="flex rounded-full border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-1">
                                {(['video', 'teks'] as ModeRuang[]).map((nilai) => (
                                    <button
                                        key={nilai}
                                        type="button"
                                        aria-pressed={mode === nilai}
                                        onClick={() => gantiMode(nilai)}
                                        className={cn(
                                            'inline-flex min-h-8 items-center gap-1 rounded-full px-3 text-[10px] font-semibold transition-colors',
                                            mode === nilai ? 'bg-tk-accent text-tk-deep' : 'text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                        )}
                                    >
                                        {nilai === 'video' ? (
                                            <Video className="size-3" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3" aria-hidden="true" />
                                        )}
                                        {nilai === 'video' ? 'Standar' : 'Koneksi rendah'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {alasanMode && (
                            <div className={cn('relative mt-4 overflow-hidden rounded-2xl p-3.5', bannerGradient)}>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-8 -right-4 size-20 rounded-full bg-white/25 blur-lg"
                                />
                                <p className="text-tk-deep relative flex items-start gap-2 text-[10px] leading-relaxed font-semibold">
                                    <IkonKoneksi className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    {alasanMode}
                                </p>
                            </div>
                        )}

                        <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Mode dipilih otomatis dari kualitas koneksi. Anda tetap bisa menggantinya manual; alasan peralihan selalu ditampilkan.
                        </p>
                    </section>

                    {mode === 'video' ? (
                        <section aria-labelledby="ruang-video" className={cn('overflow-hidden rounded-[24px] p-5 md:p-6', videoGradient)}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-tk-mint inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">
                                    <Video className="size-3.5" aria-hidden="true" />
                                    Simulasi video
                                </span>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold',
                                        videoAktif ? 'bg-tk-success/20 text-tk-mint' : 'bg-white/10 text-white/70',
                                    )}
                                >
                                    <span className={cn('size-1.5 rounded-full', videoAktif ? 'bg-tk-success' : 'bg-white/40')} aria-hidden="true" />
                                    {videoAktif ? 'Terhubung' : 'Belum dimulai'}
                                </span>
                            </div>

                            <div id="ruang-video" className="mt-5 flex flex-col items-center text-center">
                                <div className="relative">
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-0 animate-ping rounded-full bg-[rgba(124,199,127,0.16)] [animation-duration:2.6s]"
                                    />
                                    <span className="text-tk-mint relative grid size-20 place-items-center rounded-full bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-xl font-extrabold">
                                        {inisial(data.pasien.nama)}
                                    </span>
                                </div>
                                <p className="mt-3 text-base font-bold text-white">{data.pasien.nama}</p>
                                <p className="text-tk-mint/85 mt-0.5 text-[11px]">
                                    {data.pasien.usia} tahun · {data.spesialisasi} · {data.faskes}
                                </p>
                                <p className="mt-2 max-w-md text-[10px] leading-relaxed text-white/65">
                                    Ruang video disimulasikan dengan tautan eksternal. Pada produksi, gunakan penyedia video terenkripsi dan
                                    autentikasi peserta.
                                </p>
                            </div>

                            {data.tautanVideo && (
                                <div className="mt-5 rounded-2xl bg-white/10 p-3">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-white/60 uppercase">Tautan video</p>
                                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                                        <input
                                            readOnly
                                            value={data.tautanVideo}
                                            aria-label="Tautan video konsultasi"
                                            className="text-tk-mint min-h-10 w-full rounded-xl border border-white/15 bg-black/25 px-3 font-mono text-[10px] focus:outline-hidden"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={salinTautan}
                                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white/15 px-3 text-[10px] font-semibold text-white transition-colors hover:bg-white/25"
                                            >
                                                <Copy className="size-3.5" aria-hidden="true" />
                                                {tersalin ? 'Tersalin' : 'Salin'}
                                            </button>
                                            <a
                                                href={data.tautanVideo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-tk-mint text-tk-deep hover:bg-tk-accent inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-bold transition-colors"
                                            >
                                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                                Buka
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                {videoAktif ? (
                                    <button
                                        type="button"
                                        onClick={akhiriVideo}
                                        className="bg-tk-danger hover:bg-tk-danger/90 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-bold text-white transition-colors"
                                    >
                                        <VideoOff className="size-4" aria-hidden="true" />
                                        Akhiri video
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={mulaiVideo}
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-bold transition-colors"
                                    >
                                        <Video className="size-4" aria-hidden="true" />
                                        Mulai video
                                    </button>
                                )}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 text-[10px] font-semibold text-white/70">
                                    <MessageSquare className="size-3" aria-hidden="true" />
                                    Chat tetap aktif selama sesi
                                </span>
                            </div>
                        </section>
                    ) : (
                        <section aria-labelledby="ruang-teks" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                                    <MessageSquare className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="ruang-teks" className="text-[15px] font-bold">
                                        Mode teks + foto
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Konsultasi berjalan asinkron. Pesan dan foto terkompres tetap bisa dikirim walaupun sinyal lemah, lalu
                                        disinkronkan ketika koneksi membaik.
                                    </p>
                                </div>
                            </div>

                            <ul className="mt-3 grid gap-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="text-tk-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Foto otomatis diperkecil ke sisi terpanjang ±1024 px dan dikompres hingga ±200 KB.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="text-tk-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Tidak ada video, sehingga konsumsi data jauh lebih kecil dan panggilan tidak terputus.
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="text-tk-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Pesan yang dibuat saat offline masuk antrean dan terkirim otomatis saat sinyal kembali.
                                </li>
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="percakapan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Percakapan</p>
                                <h2 id="percakapan" className="mt-0.5 text-[17px] font-bold">
                                    Chat konsultasi
                                </h2>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                    {jumlahPesan} pesan · {metaMode.keterangan}
                                </p>
                            </div>
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold', metaKoneksi.tone)}>
                                <IkonKoneksi className="size-3" aria-hidden="true" />
                                {metaKoneksi.label}
                            </span>
                        </div>

                        {penyimpananPenuh && (
                            <p className="bg-tk-warning/10 mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <AlertTriangle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Penyimpanan perangkat penuh. Pesan terbaru hanya bertahan selama sesi ini.
                            </p>
                        )}

                        <div ref={ujungChat} className="mt-4 max-h-[430px] space-y-3 overflow-y-auto pr-1" aria-live="polite">
                            {semuaPesan.length === 0 ? (
                                <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[10px] text-[var(--tk-muted)]">
                                    Belum ada pesan. Mulai percakapan dengan pasien atau perawat pendamping.
                                </p>
                            ) : (
                                semuaPesan.map((pesan) => {
                                    const dariSpesialis = pesan.pengirim === 'spesialis';

                                    return (
                                        <div key={pesan.id} className={cn('flex', dariSpesialis && 'justify-end')}>
                                            <div
                                                className={cn(
                                                    'max-w-[85%] rounded-2xl px-4 py-3',
                                                    dariSpesialis
                                                        ? 'bg-tk-accent text-tk-deep rounded-br-md'
                                                        : 'rounded-bl-md bg-[var(--tk-page-alt)] text-[var(--tk-text)]',
                                                )}
                                            >
                                                <p
                                                    className={cn(
                                                        'text-[9px] font-semibold',
                                                        dariSpesialis ? 'text-tk-deep/65' : 'text-[var(--tk-muted)]',
                                                    )}
                                                >
                                                    {labelPengirimRuang[pesan.pengirim]} · {pesan.waktu}
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

                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {balasanCepat.map((saran) => (
                                <button
                                    key={saran}
                                    type="button"
                                    onClick={() => {
                                        setPesanBaru(saran);
                                        setErrorPesan(undefined);
                                    }}
                                    className="rounded-full border border-[var(--tk-glass-border)] px-2.5 py-1 text-[9px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                >
                                    {saran}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={kirimPesan} className="mt-3 border-t border-[var(--tk-glass-border)] pt-4">
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
                                    id={`lampiran-${data.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={pilihFoto}
                                    className="sr-only"
                                    disabled={memprosesFoto}
                                />
                                <label
                                    htmlFor={`lampiran-${data.id}`}
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
                                    placeholder="Tulis pesan untuk pasien atau perawat..."
                                    aria-label="Tulis pesan konsultasi"
                                    aria-invalid={Boolean(errorPesan)}
                                    className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-xs text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                />
                                <button
                                    type="submit"
                                    disabled={memprosesFoto || (!pesanBaru.trim() && !fotoLampiran)}
                                    aria-label="Kirim pesan"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    <Send className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <InputError message={errorPesan} className="text-tk-danger mt-2 text-[10px]" />

                            <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                {koneksi === 'offline'
                                    ? 'Anda sedang offline. Pesan akan disimpan dan dikirim otomatis saat sinyal kembali.'
                                    : 'Pesan dikirim ke pasien dan perawat pendamping di puskesmas.'}
                            </p>
                        </form>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="aksi-ruang" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="aksi-ruang" className="text-[15px] font-bold">
                            Aksi konsultasi
                        </h2>

                        <div className="mt-3 grid gap-2">
                            {statusRuang === 'BERLANGSUNG' ? (
                                <Link
                                    href={`/spesialis/hasil/${data.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition-colors"
                                >
                                    <FileText className="size-4" aria-hidden="true" />
                                    Akhiri & isi hasil
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setStatusRuang('BERLANGSUNG')}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition-colors"
                                >
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                    Mulai konsultasi
                                </button>
                            )}

                            <Link
                                href="/spesialis/permintaan"
                                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                <ArrowLeft className="size-3.5" aria-hidden="true" />
                                Kembali ke daftar permintaan
                            </Link>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Hasil konsultasi wajib memuat diagnosis ICD-10 dan keputusan rujuk/tidak.
                        </p>
                    </section>

                    <section aria-labelledby="data-skrining" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Skrining perawat</p>
                                <h2 id="data-skrining" className="mt-0.5 text-[15px] font-bold">
                                    Data klinis
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2 py-1 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <Lock className="size-3" aria-hidden="true" />
                                Read-only
                            </span>
                        </div>

                        <dl className="mt-3 grid grid-cols-2 gap-2">
                            {tandaVital.map((item) => {
                                const Ikon = item.ikon;

                                return (
                                    <div key={item.label} className="rounded-xl bg-[var(--tk-page-alt)] p-2.5">
                                        <dt className="flex items-center gap-1 text-[9px] font-semibold text-[var(--tk-muted)]">
                                            <Ikon className="size-3" aria-hidden="true" />
                                            {item.label}
                                        </dt>
                                        <dd className="mt-1 text-xs font-bold">
                                            {item.nilai}
                                            <span className="ml-1 text-[9px] font-medium text-[var(--tk-muted)]">{item.satuan}</span>
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>

                        <div
                            className={cn(
                                'mt-3 flex items-start gap-2 rounded-xl p-3',
                                data.skrining.tandaBahaya ? 'bg-tk-danger/10' : 'bg-tk-green-500/[0.08]',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid size-7 shrink-0 place-items-center rounded-full',
                                    data.skrining.tandaBahaya
                                        ? 'bg-tk-danger/15 text-tk-danger'
                                        : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                )}
                            >
                                {data.skrining.tandaBahaya ? (
                                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                                )}
                            </span>
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <span className="font-bold text-[var(--tk-text)]">
                                    {data.skrining.tandaBahaya ? 'Tanda bahaya terdeteksi. ' : 'Tidak ada tanda bahaya. '}
                                </span>
                                {data.skrining.catatan}
                            </p>
                        </div>

                        <p className="mt-2 text-[9px] text-[var(--tk-muted)]">
                            Diisi {data.skrining.perawat} · {data.skrining.waktu}
                        </p>
                    </section>

                    <section aria-labelledby="review-umum" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-2.5">
                            <span className="bg-tk-info/15 text-tk-info grid size-8 shrink-0 place-items-center rounded-full">
                                <Stethoscope className="size-3.5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Review dokter umum</p>
                                <h2 id="review-umum" className="mt-0.5 text-[13px] font-bold">
                                    Catatan pengirim
                                </h2>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.reviewUmum.catatan}</p>
                        <p className="mt-1.5 text-[9px] text-[var(--tk-muted)]">
                            {data.reviewUmum.dokter} · {data.reviewUmum.waktu}
                        </p>
                    </section>

                    <section aria-labelledby="kontak-pasien" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-2">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                {inisial(data.pasien.nama)}
                            </span>
                            <h2 id="kontak-pasien" className="text-[15px] font-bold">
                                Kontak pasien
                            </h2>
                        </div>
                        <dl className="mt-3 grid gap-2 text-[11px]">
                            <div className="flex items-start gap-1.5">
                                <Phone className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="font-semibold">{data.pasien.telepon}</dd>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <MapPin className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="font-semibold">{data.pasien.alamat}</dd>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <UserRound className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="text-[var(--tk-muted)]">
                                    NIK {data.pasien.nik.slice(0, 4)}••••••••{data.pasien.nik.slice(-4)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section aria-label="Catatan koneksi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', metaKoneksi.tone)}>
                            <IkonKoneksi className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Koneksi {metaKoneksi.label.toLowerCase()}</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                {koneksi === 'offline'
                                    ? 'Draf pesan dan foto disimpan di perangkat. Sinkronisasi berjalan otomatis saat jaringan kembali.'
                                    : koneksi === 'lemah'
                                      ? 'Video dinonaktifkan agar konsultasi tidak terputus. Gunakan teks dan foto terkompres.'
                                      : 'Kualitas koneksi memadai untuk video dan chat. Mode tetap bisa diganti manual.'}
                            </p>
                        </div>
                    </section>

                    <Link
                        href="/spesialis/permintaan"
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                    >
                        <ChevronRight className="size-3.5 rotate-180" aria-hidden="true" />
                        Daftar permintaan
                    </Link>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
