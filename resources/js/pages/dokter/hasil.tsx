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
    FileText,
    HeartPulse,
    Info,
    MapPin,
    MessageSquare,
    Pencil,
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
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { cariKonsultasiPerawat } from '@/data/konsultasi-perawat';
import DokterAppLayout from '@/layouts/dokter/dokter-app-layout';
import { cn } from '@/lib/utils';

interface HasilDokterProps {
    konsultasiId: number;
}

type FormErrors = Partial<Record<'konfirmasi', string>>;

interface TindakLanjutPerawatTersimpan {
    konsultasiId: number;
    rujuk: boolean;
    tanggal: string;
    tindakan: string[];
    transport: string;
    biaya: string;
    pendamping: string;
    catatan: string;
    dicatatPada: string;
}

interface VerifikasiTersimpan {
    konsultasiId: number;
    keputusanRujuk: boolean;
    catatan: string;
    verifikasi: string[];
    diverifikasiPada: string;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const biayaKapal = 850000;
const jamPerjalanan = 6;

const verifikasiRujuk = [
    'Tempat tidur dan jadwal RS tujuan sudah dikonfirmasi',
    'Transportasi serta pendamping pasien sudah siap',
    'Ringkasan skrining dan hasil konsultasi diserahkan',
];

const verifikasiPuskesmas = [
    'Obat dan edukasi sudah diberikan kepada pasien',
    'Jadwal kontrol sudah disepakati',
    'Pasien dan keluarga memahami tanda bahaya',
];

function kunciTindakLanjut(id: number): string {
    return `telekarang:tindak-lanjut:${id}`;
}

function kunciVerifikasi(id: number): string {
    return `telekarang:hasil-dokter:${id}`;
}

function bacaTindakLanjutPerawat(id: number): TindakLanjutPerawatTersimpan | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciTindakLanjut(id));

        if (!mentah) {
            return null;
        }

        const parsed = JSON.parse(mentah) as Partial<TindakLanjutPerawatTersimpan>;

        if (typeof parsed.tanggal !== 'string' || typeof parsed.catatan !== 'string') {
            return null;
        }

        return {
            konsultasiId: id,
            rujuk: parsed.rujuk === true,
            tanggal: parsed.tanggal,
            tindakan: Array.isArray(parsed.tindakan) ? parsed.tindakan.filter((nilai): nilai is string => typeof nilai === 'string') : [],
            transport: typeof parsed.transport === 'string' ? parsed.transport : '',
            biaya: typeof parsed.biaya === 'string' ? parsed.biaya : '',
            pendamping: typeof parsed.pendamping === 'string' ? parsed.pendamping : '',
            catatan: parsed.catatan,
            dicatatPada: typeof parsed.dicatatPada === 'string' ? parsed.dicatatPada : new Date().toISOString(),
        };
    } catch {
        return null;
    }
}

function bacaVerifikasi(id: number): VerifikasiTersimpan | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciVerifikasi(id));

        if (!mentah) {
            return null;
        }

        const parsed = JSON.parse(mentah) as Partial<VerifikasiTersimpan>;

        return {
            konsultasiId: id,
            keputusanRujuk: parsed.keputusanRujuk === true,
            catatan: typeof parsed.catatan === 'string' ? parsed.catatan : '',
            verifikasi: Array.isArray(parsed.verifikasi) ? parsed.verifikasi.filter((nilai): nilai is string => typeof nilai === 'string') : [],
            diverifikasiPada: typeof parsed.diverifikasiPada === 'string' ? parsed.diverifikasiPada : new Date().toISOString(),
        };
    } catch {
        return null;
    }
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

function maskNik(nik: string): string {
    if (nik.length < 8) {
        return nik;
    }

    return `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;
}

function formatRupiah(nilai: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(nilai);
}

function formatTanggal(nilai: string): string {
    if (!nilai) {
        return '-';
    }

    const tanggal = new Date(`${nilai}T00:00:00`);

    if (Number.isNaN(tanggal.getTime())) {
        return nilai;
    }

    return tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatWaktuCatat(nilai: string): string {
    const tanggal = new Date(nilai);

    if (Number.isNaN(tanggal.getTime())) {
        return nilai;
    }

    return tanggal.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

export default function HasilDokter({ konsultasiId }: HasilDokterProps) {
    const data = cariKonsultasiPerawat(konsultasiId);
    const hasil = data.hasil;
    const rujuk = hasil?.keputusanRujuk === true;

    const [tindakLanjutPerawat, setTindakLanjutPerawat] = useState<TindakLanjutPerawatTersimpan | null>(null);
    const [tersimpan, setTersimpan] = useState<VerifikasiTersimpan | null>(null);
    const [verifikasi, setVerifikasi] = useState<string[]>([]);
    const [catatan, setCatatan] = useState('');
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [berhasil, setBerhasil] = useState(false);

    useEffect(() => {
        setTindakLanjutPerawat(bacaTindakLanjutPerawat(data.id));
        setBerhasil(false);

        const simpanan = bacaVerifikasi(data.id);

        if (!simpanan) {
            setTersimpan(null);
            setVerifikasi([]);
            setCatatan('');
            setKonfirmasi(false);
            return;
        }

        setTersimpan(simpanan);
        setVerifikasi(simpanan.verifikasi);
        setCatatan(simpanan.catatan);
        setKonfirmasi(true);
    }, [data.id]);

    function toggleVerifikasi(item: string) {
        setVerifikasi((previous) => (previous.includes(item) ? previous.filter((nilai) => nilai !== item) : [...previous, item]));
    }

    function simpanVerifikasi(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!konfirmasi) {
            setErrors({ konfirmasi: 'Konfirmasi bahwa hasil dan tindak lanjut sudah ditinjau.' });
            return;
        }

        if (!hasil) {
            return;
        }

        const rekaman: VerifikasiTersimpan = {
            konsultasiId: data.id,
            keputusanRujuk: hasil.keputusanRujuk,
            catatan: catatan.trim(),
            verifikasi,
            diverifikasiPada: new Date().toISOString(),
        };

        try {
            window.localStorage.setItem(kunciVerifikasi(data.id), JSON.stringify(rekaman));
        } catch {
            // Penyimpanan lokal tidak tersedia; verifikasi tetap ditampilkan pada sesi ini.
        }

        setTersimpan(rekaman);
        setErrors({});
        setBerhasil(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function ubahVerifikasi() {
        setBerhasil(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!hasil) {
        return (
            <DokterAppLayout
                active="riwayat"
                title="Hasil konsultasi"
                description="Hasil konsultasi dan tindak lanjut dapat ditinjau setelah dokter spesialis menyelesaikan konsultasi."
            >
                <Head title="Hasil konsultasi" />
                <div className={cn('mx-auto max-w-xl rounded-[24px] p-6 text-center', glass)}>
                    <span className="bg-tk-warning/15 text-tk-warning mx-auto grid size-12 place-items-center rounded-full">
                        <Clock className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="mt-3 text-lg font-bold">Hasil konsultasi belum tersedia</h1>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                        Halaman ini menampilkan diagnosis ICD-10, saran, dan keputusan rujukan setelah dokter spesialis mengisi hasil konsultasi.
                    </p>
                    <Link
                        href="/dokter/review?tab=riwayat"
                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        Kembali ke riwayat hasil
                    </Link>
                </div>
            </DokterAppLayout>
        );
    }

    const labelVerifikasi = rujuk ? verifikasiRujuk : verifikasiPuskesmas;
    const sudahDiverifikasi = Boolean(tersimpan);

    if (berhasil && tersimpan) {
        return (
            <DokterAppLayout
                active="riwayat"
                title="Hasil terverifikasi"
                description="Hasil konsultasi dan tindak lanjut pasien sudah diverifikasi dokter umum."
            >
                <Head title="Hasil konsultasi terverifikasi" />

                <div className="mx-auto grid w-full max-w-2xl gap-5">
                    <section className={cn('overflow-hidden rounded-[28px]', glass)}>
                        <div className={cn('relative overflow-hidden px-6 py-8 text-center md:px-8', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <span className="bg-tk-deep/10 text-tk-deep mx-auto grid size-16 place-items-center rounded-full">
                                    <CheckCircle2 className="size-8" aria-hidden="true" />
                                </span>
                                <p className="text-tk-deep/70 mt-4 text-[10px] font-bold tracking-[0.16em] uppercase">Terverifikasi</p>
                                <h1 className="text-tk-deep mt-1 text-2xl leading-tight font-extrabold">
                                    {rujuk ? 'Rujukan terkoordinasi' : 'Kasus selesai ditindaklanjuti'}
                                </h1>
                                <p className="text-tk-deep/75 mx-auto mt-2 max-w-md text-xs leading-relaxed">
                                    {rujuk
                                        ? 'Proses rujukan pasien sudah ditinjau dan dikoordinasikan.'
                                        : 'Tindakan puskesmas sudah ditinjau dan kasus tercatat sebagai rujukan terhindarkan.'}
                                </p>
                                <p className="text-tk-deep/60 mt-2 text-[10px]">Diverifikasi {formatWaktuCatat(tersimpan.diverifikasiPada)}</p>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Keputusan dokter spesialis</p>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold',
                                        rujuk ? 'bg-tk-warning/15 text-tk-warning' : 'bg-tk-success/15 text-tk-success',
                                    )}
                                >
                                    {rujuk ? <MapPin className="size-3" aria-hidden="true" /> : <ShieldCheck className="size-3" aria-hidden="true" />}
                                    {rujuk ? 'Dirujuk' : 'Rujukan terhindarkan'}
                                </span>
                            </div>

                            <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-xs sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Pasien</dt>
                                    <dd className="mt-1 font-bold">{data.pasien.nama}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">{data.pasien.noRm}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</dt>
                                    <dd className="mt-1 font-bold">
                                        <span className="font-mono">{hasil.icd10Kode}</span> · {hasil.icd10Nama}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Tindak lanjut perawat
                                    </dt>
                                    <dd className="mt-1 font-bold">
                                        {tindakLanjutPerawat ? `Tercatat ${formatWaktuCatat(tindakLanjutPerawat.dicatatPada)}` : 'Belum tercatat'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter spesialis</dt>
                                    <dd className="mt-1 font-bold">{data.dokter}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">{data.spesialisasi}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Catatan verifikasi
                                    </dt>
                                    <dd className="mt-1 leading-relaxed">{tersimpan.catatan || 'Tidak ada catatan tambahan.'}</dd>
                                </div>
                                {tersimpan.verifikasi.length > 0 && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            Butir terverifikasi
                                        </dt>
                                        <dd className="mt-1 grid gap-1">
                                            {tersimpan.verifikasi.map((item) => (
                                                <span key={item} className="inline-flex items-start gap-1.5 leading-relaxed">
                                                    <CheckCircle2 className="text-tk-success mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                                    {item}
                                                </span>
                                            ))}
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            <div className={cn('mt-4 flex items-start gap-2.5 rounded-2xl p-3.5', rujuk ? 'bg-tk-warning/10' : 'bg-tk-success/10')}>
                                <span
                                    className={cn(
                                        'grid size-8 shrink-0 place-items-center rounded-full',
                                        rujuk ? 'bg-tk-warning/15 text-tk-warning' : 'bg-tk-success/15 text-tk-success',
                                    )}
                                >
                                    {rujuk ? <MapPin className="size-4" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold">
                                        {rujuk ? 'Rujukan sudah dikoordinasikan' : 'Kasus tercatat sebagai rujukan terhindarkan'}
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        {rujuk
                                            ? `Estimasi biaya ${formatRupiah(Number(tindakLanjutPerawat?.biaya ?? hasil.biayaRujukan ?? 0))} dengan transportasi ${
                                                  tindakLanjutPerawat?.transport.toLowerCase() ?? 'kapal'
                                              }.`
                                            : `Estimasi penghematan ${formatRupiah(biayaKapal)} dan ${jamPerjalanan} jam perjalanan pulang-pergi.`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-2 sm:flex">
                                <button
                                    type="button"
                                    onClick={ubahVerifikasi}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <Pencil className="size-3.5" aria-hidden="true" />
                                    Ubah verifikasi
                                </button>
                                <Link
                                    href="/dokter/review?tab=riwayat"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    Kembali ke riwayat hasil
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </DokterAppLayout>
        );
    }

    const vital = data.skrining
        ? [
              { label: 'Berat', nilai: String(data.skrining.beratBadan), satuan: 'kg', icon: Scale },
              { label: 'Tinggi', nilai: String(data.skrining.tinggiBadan), satuan: 'cm', icon: Ruler },
              { label: 'Tekanan darah', nilai: `${data.skrining.sistol}/${data.skrining.diastol}`, satuan: 'mmHg', icon: Activity },
              { label: 'Suhu', nilai: angkaDesimal(data.skrining.suhu), satuan: '°C', icon: Thermometer },
              { label: 'Nadi', nilai: String(data.skrining.nadi), satuan: 'bpm', icon: HeartPulse },
              { label: 'SpO₂', nilai: String(data.skrining.spo2), satuan: '%', icon: Wind },
          ]
        : [];

    return (
        <DokterAppLayout
            active="riwayat"
            title={`Hasil konsultasi · ${data.pasien.nama}`}
            description="Tinjau hasil konsultasi dokter spesialis dan pastikan tindak lanjut pasien sudah dijalankan."
        >
            <Head title={`Hasil konsultasi ${data.pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/dokter/review?tab=riwayat"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke riwayat hasil
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                    <Clock className="size-3" aria-hidden="true" />
                    {tersimpan ? `Sudah diverifikasi ${formatWaktuCatat(tersimpan.diverifikasiPada)}` : 'Belum diverifikasi'}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="hasil-konsultasi" className={cn('overflow-hidden rounded-[24px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        <FileText className="size-3.5" aria-hidden="true" />
                                        Konsultasi selesai
                                    </span>
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        {data.nomor}
                                    </span>
                                </div>
                                <h1 className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">Hasil konsultasi dan tindak lanjut</h1>
                                <p className="text-tk-deep/75 mt-1 text-xs">
                                    {data.pasien.nama} · {data.pasien.usia} tahun · {data.pasien.noRm}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-tk-deep text-tk-mint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                                        ICD-10 {hasil.icd10Kode}
                                    </span>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold',
                                            rujuk ? 'text-tk-warning bg-white/90' : 'text-tk-success bg-white/90',
                                        )}
                                    >
                                        {rujuk ? (
                                            <MapPin className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <ShieldCheck className="size-3.5" aria-hidden="true" />
                                        )}
                                        {rujuk ? 'Perlu dirujuk' : 'Tidak dirujuk'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex items-start gap-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="hasil-konsultasi" className="text-[15px] font-bold">
                                        {hasil.icd10Nama}
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {data.dokter} · {hasil.waktu}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-3 text-[11px] leading-relaxed">{hasil.saran}</p>

                            {rujuk && hasil.alasanRujuk && (
                                <p className="bg-tk-warning/10 mt-3 rounded-xl px-3 py-2.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <span className="font-bold text-[var(--tk-text)]">Alasan rujukan: </span>
                                    {hasil.alasanRujuk}
                                </p>
                            )}

                            <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <span>
                                    Jadwal konsultasi: <span className="font-bold text-[var(--tk-text)]">{data.jadwal}</span> ·{' '}
                                    {data.mode === 'video' ? 'Mode video' : 'Mode teks'}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="tindak-lanjut-perawat" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        'grid size-10 shrink-0 place-items-center rounded-full',
                                        tindakLanjutPerawat
                                            ? 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent'
                                            : 'bg-tk-warning/15 text-tk-warning',
                                    )}
                                >
                                    <ClipboardCheck className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="tindak-lanjut-perawat" className="text-[15px] font-bold">
                                        Tindak lanjut perawat
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {tindakLanjutPerawat
                                            ? `Dicatat ${formatWaktuCatat(tindakLanjutPerawat.dicatatPada)}`
                                            : 'Belum ada catatan tindak lanjut'}
                                    </p>
                                </div>
                            </div>
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold',
                                    tindakLanjutPerawat ? 'bg-tk-success/15 text-tk-success' : 'bg-tk-warning/15 text-tk-warning',
                                )}
                            >
                                {tindakLanjutPerawat ? (
                                    <CheckCircle2 className="size-3" aria-hidden="true" />
                                ) : (
                                    <Clock className="size-3" aria-hidden="true" />
                                )}
                                {tindakLanjutPerawat ? 'Tercatat' : 'Menunggu'}
                            </span>
                        </div>

                        {tindakLanjutPerawat ? (
                            <>
                                <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[11px] sm:grid-cols-2">
                                    <div>
                                        <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            {rujuk ? 'Tanggal keberangkatan' : 'Tanggal kontrol'}
                                        </dt>
                                        <dd className="mt-1 font-bold">{formatTanggal(tindakLanjutPerawat.tanggal)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            {rujuk ? 'Transportasi' : 'Tindakan puskesmas'}
                                        </dt>
                                        <dd className="mt-1 font-bold">
                                            {rujuk ? tindakLanjutPerawat.transport : `${tindakLanjutPerawat.tindakan.length} tindakan`}
                                        </dd>
                                    </div>
                                    {rujuk && (
                                        <>
                                            <div>
                                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                    Estimasi biaya
                                                </dt>
                                                <dd className="mt-1 font-bold">{formatRupiah(Number(tindakLanjutPerawat.biaya) || 0)}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                    Pendamping
                                                </dt>
                                                <dd className="mt-1 font-bold">{tindakLanjutPerawat.pendamping || '-'}</dd>
                                            </div>
                                        </>
                                    )}
                                    {!rujuk && tindakLanjutPerawat.tindakan.length > 0 && (
                                        <div className="sm:col-span-2">
                                            <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                Daftar tindakan
                                            </dt>
                                            <dd className="mt-1 leading-relaxed">{tindakLanjutPerawat.tindakan.join(', ')}</dd>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2">
                                        <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            Catatan perawat
                                        </dt>
                                        <dd className="mt-1 leading-relaxed">{tindakLanjutPerawat.catatan}</dd>
                                    </div>
                                </dl>

                                <p className="text-tk-green-500 dark:text-tk-accent mt-3 flex items-center gap-1.5 text-[10px] font-semibold">
                                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                                    Tindak lanjut sudah dijelaskan kepada pasien atau pendampingnya.
                                </p>
                            </>
                        ) : (
                            <div className="bg-tk-warning/10 mt-4 flex items-start gap-2.5 rounded-2xl p-4">
                                <AlertTriangle className="text-tk-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <div>
                                    <p className="text-[11px] font-bold">Tindak lanjut belum dicatat perawat</p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Verifikasi tetap bisa dilakukan, tetapi pastikan tindakan puskesmas atau proses rujukan sudah dijalankan
                                        sebelum menutup kasus.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    <form onSubmit={simpanVerifikasi} noValidate className="grid gap-5">
                        <section aria-labelledby="verifikasi-dokter" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="verifikasi-dokter" className="text-[15px] font-bold">
                                        Verifikasi dokter umum
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        {rujuk
                                            ? 'Pastikan koordinasi rujukan berjalan sebelum kasus ditutup.'
                                            : 'Pastikan pasien mendapat terapi dan jadwal kontrol di puskesmas.'}
                                    </p>
                                </div>
                            </div>

                            <fieldset className="mt-4">
                                <legend className="text-[11px] font-bold">Butir yang sudah dipastikan</legend>
                                <div className="mt-2 grid gap-2">
                                    {labelVerifikasi.map((item) => (
                                        <label
                                            key={item}
                                            className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--tk-glass-border)] px-3 py-2 text-[11px]"
                                        >
                                            <Checkbox
                                                checked={verifikasi.includes(item)}
                                                onCheckedChange={() => toggleVerifikasi(item)}
                                                className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                            />
                                            {item}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="mt-4">
                                <label htmlFor="catatan" className="text-[11px] font-bold">
                                    Catatan verifikasi
                                </label>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    value={catatan}
                                    onChange={(event) => setCatatan(event.target.value)}
                                    placeholder={
                                        rujuk
                                            ? 'Contoh: Tempat tidur RS sudah dikonfirmasi, pasien berangkat dengan kapal cepat besok pagi.'
                                            : 'Contoh: Obat sudah diberikan, kontrol ulang 3 hari lagi, edukasi tanda bahaya sudah disampaikan.'
                                    }
                                    className={textareaClass}
                                />
                                <p className="mt-1.5 text-[10px] text-[var(--tk-muted)]">Opsional. Tampil pada riwayat konsultasi pasien.</p>
                            </div>
                        </section>

                        <section aria-labelledby="konfirmasi-hasil" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                    <UserRound className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="konfirmasi-hasil" className="text-[15px] font-bold">
                                        Konfirmasi akhir
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Pastikan hasil konsultasi sudah dibaca dan tindak lanjut sudah sesuai.
                                    </p>
                                </div>
                            </div>

                            <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <Checkbox
                                    checked={konfirmasi}
                                    onCheckedChange={(checked) => {
                                        setKonfirmasi(checked === true);
                                        setErrors({});
                                    }}
                                    aria-invalid={Boolean(errors.konfirmasi)}
                                    className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                />
                                <span className="text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Saya sudah meninjau hasil dokter spesialis dan memastikan tindak lanjut pasien sudah dijalankan.
                                </span>
                            </label>
                            <InputError message={errors.konfirmasi} className="text-tk-danger mt-2 text-[10px]" />

                            <div className="mt-4 grid gap-2 sm:flex">
                                <button
                                    type="submit"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors"
                                >
                                    <Send className="size-4" aria-hidden="true" />
                                    {tersimpan ? 'Perbarui verifikasi' : 'Simpan verifikasi'}
                                </button>
                                <Link
                                    href="/dokter/review?tab=riwayat"
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            {tersimpan && (
                                <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    Verifikasi sebelumnya tersimpan di perangkat ini dan akan diperbarui saat Anda menyimpan ulang.
                                </p>
                            )}
                        </section>
                    </form>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="pasien-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                {inisial(data.pasien.nama)}
                            </span>
                            <div className="min-w-0">
                                <p id="pasien-hasil" className="truncate text-sm font-bold">
                                    {data.pasien.nama}
                                </p>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {data.pasien.usia} tahun · {data.pasien.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    <Phone className="size-3 shrink-0" aria-hidden="true" />
                                    {data.pasien.telepon}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] text-[var(--tk-muted)]">
                            <p>
                                NIK <span className="font-semibold text-[var(--tk-text)]">{maskNik(data.pasien.nik)}</span> · {data.pasien.noRm}
                            </p>
                            <p className="flex items-start gap-1.5">
                                <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                {data.pasien.alamat}
                            </p>
                        </div>
                    </section>

                    {data.skrining && (
                        <section aria-labelledby="skrining-hasil" className={cn('rounded-[24px] p-5', glass)}>
                            <div className="flex items-center justify-between gap-2">
                                <h2 id="skrining-hasil" className="text-[15px] font-bold">
                                    Skrining perawat
                                </h2>
                                {data.skrining.tandaBahaya ? (
                                    <span className="bg-tk-danger/15 text-tk-danger inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                        <AlertTriangle className="size-3" aria-hidden="true" />
                                        Tanda bahaya
                                    </span>
                                ) : (
                                    <span className="bg-tk-success/15 text-tk-success inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                        <ShieldCheck className="size-3" aria-hidden="true" />
                                        Stabil
                                    </span>
                                )}
                            </div>

                            <dl className="mt-3 grid grid-cols-2 gap-2">
                                {vital.map(({ label, nilai, satuan, icon: Icon }) => (
                                    <div key={label} className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                        <dt className="flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                            <Icon className="size-3" aria-hidden="true" />
                                            {label}
                                        </dt>
                                        <dd className="mt-0.5 text-xs font-bold">
                                            {nilai} <span className="text-[10px] font-semibold text-[var(--tk-muted)]">{satuan}</span>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    <section aria-labelledby="dampak-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="dampak-hasil" className="text-[15px] font-bold">
                            {rujuk ? 'Dampak rujukan' : 'Dampak tindakan'}
                        </h2>
                        <p className={cn('mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]', !rujuk && 'text-tk-success')}>
                            {rujuk ? formatRupiah(Number(tindakLanjutPerawat?.biaya ?? hasil.biayaRujukan ?? 0)) : formatRupiah(biayaKapal)}
                        </p>
                        <p className="mt-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            {rujuk
                                ? 'Estimasi biaya rujukan yang sudah tercatat. Biaya final mengikuti fasilitas tujuan.'
                                : `Estimasi biaya perjalanan yang terhindarkan, setara ${jamPerjalanan} jam pulang-pergi.`}
                        </p>
                        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            {rujuk
                                ? 'Data biaya dipakai untuk memantau beban rujukan pada dasbor admin.'
                                : 'Kasus ini masuk hitungan rujukan terhindarkan pada dasbor.'}
                        </div>
                    </section>

                    <section aria-labelledby="dokter-spesialis" className={cn('rounded-[24px] p-5', glass)}>
                        <p id="dokter-spesialis" className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                            Dokter pemberi hasil
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-tk-mint grid size-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[11px] font-extrabold">
                                {inisial(data.dokter, true)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold">{data.dokter}</p>
                                <p className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Spesialis {data.spesialisasi}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    {data.mode === 'video' ? (
                                        <Video className="size-3 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <MessageSquare className="size-3 shrink-0" aria-hidden="true" />
                                    )}
                                    {data.mode === 'video' ? 'Konsultasi video' : 'Konsultasi teks'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="alur-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="alur-hasil" className="text-[15px] font-bold">
                            Alur penyelesaian
                        </h2>
                        <ol className="mt-3 grid gap-3">
                            {[
                                { label: 'Konsultasi spesialis', selesai: true, keterangan: hasil.waktu },
                                {
                                    label: 'Tindak lanjut perawat',
                                    selesai: Boolean(tindakLanjutPerawat),
                                    keterangan: tindakLanjutPerawat ? 'Sudah dicatat' : 'Menunggu pencatatan',
                                },
                                {
                                    label: 'Verifikasi dokter umum',
                                    selesai: sudahDiverifikasi,
                                    keterangan: sudahDiverifikasi ? 'Sudah diverifikasi' : 'Menunggu verifikasi',
                                },
                            ].map((langkah, index) => (
                                <li key={langkah.label} className="flex items-start gap-3">
                                    <span
                                        className={cn(
                                            'grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                            langkah.selesai
                                                ? 'bg-tk-green-500 text-white'
                                                : 'border border-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                        )}
                                    >
                                        {langkah.selesai ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : index + 1}
                                    </span>
                                    <div>
                                        <p className="text-[11px] font-semibold">{langkah.label}</p>
                                        <p className="text-[10px] text-[var(--tk-muted)]">{langkah.keterangan}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Catatan tersimpan lokal saat offline dan dikirim otomatis ketika sinyal kembali. Data fiktif untuk prototipe TeleKarang.
                        </p>
                    </section>
                </aside>
            </div>
        </DokterAppLayout>
    );
}
