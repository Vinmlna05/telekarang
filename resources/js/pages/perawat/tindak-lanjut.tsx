import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Copy,
    FileText,
    HeartPulse,
    Info,
    MapPin,
    Pencil,
    Phone,
    Ruler,
    Save,
    Scale,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    UserRound,
    Wifi,
    Wind,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cariKonsultasiPerawat } from '@/data/konsultasi-perawat';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

interface TindakLanjutProps {
    konsultasiId: number;
}

type FormErrors = Partial<Record<'tanggal' | 'tindakan' | 'biaya' | 'pendamping' | 'catatan' | 'persiapan' | 'konfirmasi', string>>;

interface TindakLanjutTersimpan {
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

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const pilNetral =
    'inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]';

const tindakanPuskesmas = [
    'Edukasi pasien dan keluarga',
    'Berikan obat sesuai resep',
    'Jadwalkan kontrol ulang',
    'Hubungi pasien dalam 3 hari',
    'Lengkapi catatan rekam medis',
];

const transportasiRujukan = ['Kapal cepat', 'Kapal perintis', 'Ambulans puskesmas'];

const persiapanRujukan = [
    'Kondisi pasien stabil sebelum berangkat',
    'Ringkasan skrining dan hasil konsultasi dibawa',
    'Tempat tidur di RS tujuan sudah dikonfirmasi',
];

const biayaKapal = 850000;
const jamPerjalanan = 6;

function kunciSimpanan(id: number): string {
    return `telekarang:tindak-lanjut:${id}`;
}

function bacaSimpanan(id: number): TindakLanjutTersimpan | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciSimpanan(id));

        if (!mentah) {
            return null;
        }

        const parsed = JSON.parse(mentah) as Partial<TindakLanjutTersimpan>;

        if (typeof parsed.tanggal !== 'string' || typeof parsed.catatan !== 'string') {
            return null;
        }

        return {
            konsultasiId: id,
            rujuk: parsed.rujuk === true,
            tanggal: parsed.tanggal,
            tindakan: Array.isArray(parsed.tindakan) ? parsed.tindakan.filter((nilai): nilai is string => typeof nilai === 'string') : [],
            transport: typeof parsed.transport === 'string' ? parsed.transport : transportasiRujukan[0],
            biaya: typeof parsed.biaya === 'string' ? parsed.biaya : '',
            pendamping: typeof parsed.pendamping === 'string' ? parsed.pendamping : '',
            catatan: parsed.catatan,
            dicatatPada: typeof parsed.dicatatPada === 'string' ? parsed.dicatatPada : new Date().toISOString(),
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

function tanggalHariIni(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function TindakLanjutPerawat({ konsultasiId }: TindakLanjutProps) {
    const data = cariKonsultasiPerawat(konsultasiId);
    const hasil = data.hasil;
    const rujuk = hasil?.keputusanRujuk === true;

    const [tanggal, setTanggal] = useState(tanggalHariIni);
    const [tindakan, setTindakan] = useState<string[]>([]);
    const [transport, setTransport] = useState(transportasiRujukan[0]);
    const [biaya, setBiaya] = useState(hasil?.biayaRujukan ? String(hasil.biayaRujukan) : '1250000');
    const [pendamping, setPendamping] = useState('');
    const [persiapan, setPersiapan] = useState<string[]>([]);
    const [catatan, setCatatan] = useState('');
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [berhasil, setBerhasil] = useState(false);
    const [tersimpan, setTersimpan] = useState<TindakLanjutTersimpan | null>(null);
    const [tersalin, setTersalin] = useState(false);

    useEffect(() => {
        const simpanan = bacaSimpanan(data.id);

        if (!simpanan) {
            setTersimpan(null);
            return;
        }

        setTersimpan(simpanan);
        setTanggal(simpanan.tanggal);
        setTindakan(simpanan.tindakan);
        setTransport(simpanan.transport);
        setBiaya(simpanan.biaya);
        setPendamping(simpanan.pendamping);
        setPersiapan(simpanan.rujuk ? persiapanRujukan : []);
        setCatatan(simpanan.catatan);
        setKonfirmasi(true);
    }, [data.id]);

    function toggleDaftar(item: string, daftar: string[], setDaftar: (nilai: string[]) => void, kunci: 'tindakan' | 'persiapan') {
        setDaftar(daftar.includes(item) ? daftar.filter((nilai) => nilai !== item) : [...daftar, item]);
        setErrors((previous) => ({ ...previous, [kunci]: undefined }));
    }

    function simpanTindakLanjut(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (!tanggal) {
            nextErrors.tanggal = rujuk ? 'Tanggal keberangkatan wajib diisi.' : 'Tanggal kontrol wajib diisi.';
        }

        if (!rujuk && tindakan.length === 0) {
            nextErrors.tindakan = 'Pilih minimal satu tindakan yang dilakukan.';
        }

        if (rujuk) {
            const nilaiBiaya = Number(biaya);

            if (!Number.isFinite(nilaiBiaya) || nilaiBiaya <= 0) {
                nextErrors.biaya = 'Estimasi biaya rujukan harus lebih dari 0.';
            }

            if (pendamping.trim().length < 3) {
                nextErrors.pendamping = 'Nama pendamping minimal 3 karakter.';
            }

            if (persiapan.length < persiapanRujukan.length) {
                nextErrors.persiapan = 'Centang semua persiapan rujukan sebelum menyimpan.';
            }
        }

        if (catatan.trim().length < 10) {
            nextErrors.catatan = 'Tulis catatan tindak lanjut minimal 10 karakter.';
        }

        if (!konfirmasi) {
            nextErrors.konfirmasi = 'Konfirmasi bahwa tindak lanjut sudah dijelaskan kepada pasien.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const rekaman: TindakLanjutTersimpan = {
            konsultasiId: data.id,
            rujuk,
            tanggal,
            tindakan,
            transport,
            biaya,
            pendamping: pendamping.trim(),
            catatan: catatan.trim(),
            dicatatPada: new Date().toISOString(),
        };

        try {
            window.localStorage.setItem(kunciSimpanan(data.id), JSON.stringify(rekaman));
        } catch {
            // Penyimpanan lokal tidak tersedia; catatan tetap ditampilkan pada sesi ini.
        }

        setTersimpan(rekaman);
        setBerhasil(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function salinRingkasan(teks: string) {
        try {
            await navigator.clipboard.writeText(teks);
            setTersalin(true);
            window.setTimeout(() => setTersalin(false), 2000);
        } catch {
            setTersalin(false);
        }
    }

    function ubahCatatan() {
        setBerhasil(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (!hasil) {
        return (
            <PerawatAppLayout
                active="antrean"
                title="Tindak lanjut hasil"
                description="Tindak lanjut dapat dicatat setelah dokter spesialis mengisi hasil konsultasi."
            >
                <Head title="Tindak lanjut hasil" />
                <div className={cn('mx-auto max-w-xl rounded-[24px] p-6 text-center', glass)}>
                    <span className="bg-tk-warning/15 text-tk-warning mx-auto grid size-12 place-items-center rounded-full">
                        <Clock className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="mt-3 text-lg font-bold">Hasil konsultasi belum tersedia</h1>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                        Tindak lanjut hanya dapat dicatat setelah dokter spesialis mengisi diagnosis ICD-10 dan keputusan rujukan.
                    </p>
                    <Link
                        href={`/perawat/konsultasi/${data.id}`}
                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        Kembali ke detail konsultasi
                    </Link>
                </div>
            </PerawatAppLayout>
        );
    }

    const rekaman = tersimpan;
    const tanggalCatat = rekaman?.tanggal ?? tanggal;
    const transportCatat = rekaman?.transport ?? transport;
    const tindakanCatat = rekaman?.tindakan ?? tindakan;
    const biayaCatat = rekaman?.biaya ?? biaya;
    const catatanCatat = rekaman?.catatan ?? catatan.trim();

    const ringkasanPasien = rujuk
        ? `Dokter spesialis menyarankan ${data.pasien.nama} dirujuk ke ${data.faskes}. Rencana keberangkatan ${formatTanggal(tanggalCatat)} dengan ${transportCatat.toLowerCase()}. Perkiraan biaya ${formatRupiah(Number(biayaCatat) || 0)}.`
        : `Dokter spesialis menyarankan ${data.pasien.nama} dirawat di puskesmas tanpa rujukan. Tindakan yang dilakukan: ${tindakanCatat.join(', ') || 'belum dicatat'}. Jadwal kontrol ${formatTanggal(tanggalCatat)}.`;

    if (berhasil) {
        return (
            <PerawatAppLayout
                active="antrean"
                title="Tindak lanjut tersimpan"
                description="Catatan tindak lanjut sudah masuk ke riwayat konsultasi pasien."
            >
                <Head title="Tindak lanjut tersimpan" />

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
                                <p className="text-tk-deep/70 mt-4 text-[10px] font-bold tracking-[0.16em] uppercase">Tersimpan</p>
                                <h1 className="text-tk-deep mt-1 text-2xl leading-tight font-extrabold">Tindak lanjut tercatat</h1>
                                <p className="text-tk-deep/75 mx-auto mt-2 max-w-md text-xs leading-relaxed">
                                    {rujuk ? 'Proses rujukan pasien sudah dicatat.' : 'Tindakan puskesmas dan kontrol pasien sudah dicatat.'}
                                </p>
                                {rekaman && <p className="text-tk-deep/60 mt-2 text-[10px]">Dicatat {formatWaktuCatat(rekaman.dicatatPada)}</p>}
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
                                        {rujuk ? 'Tanggal keberangkatan' : 'Tanggal kontrol'}
                                    </dt>
                                    <dd className="mt-1 font-bold">{formatTanggal(tanggalCatat)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        {rujuk ? 'Transportasi' : 'Tindakan tercatat'}
                                    </dt>
                                    <dd className="mt-1 font-bold">{rujuk ? transportCatat : `${tindakanCatat.length} tindakan`}</dd>
                                </div>
                                {rujuk && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            RS tujuan dan pendamping
                                        </dt>
                                        <dd className="mt-1 font-bold">
                                            {data.faskes} · {rekaman?.pendamping || pendamping.trim()}
                                        </dd>
                                    </div>
                                )}
                                <div className="sm:col-span-2">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Catatan</dt>
                                    <dd className="mt-1 leading-relaxed">{catatanCatat}</dd>
                                </div>
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
                                        {rujuk ? 'Rujukan perlu diproses' : 'Kasus tercatat sebagai rujukan terhindarkan'}
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        {rujuk
                                            ? `Estimasi biaya ${formatRupiah(Number(biayaCatat) || 0)} dengan transportasi ${transportCatat.toLowerCase()}.`
                                            : `Estimasi penghematan ${formatRupiah(biayaKapal)} dan ${jamPerjalanan} jam perjalanan pulang-pergi.`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                            Ringkasan untuk pasien
                                        </p>
                                        <p className="mt-2 text-[11px] leading-relaxed">{ringkasanPasien}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => salinRingkasan(ringkasanPasien)}
                                    className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3.5 text-[10px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <Copy className="size-3.5" aria-hidden="true" />
                                    {tersalin ? 'Ringkasan tersalin' : 'Salin ringkasan'}
                                </button>
                            </div>

                            <div className="mt-5 grid gap-2 sm:flex">
                                <button
                                    type="button"
                                    onClick={ubahCatatan}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <Pencil className="size-3.5" aria-hidden="true" />
                                    Ubah catatan
                                </button>
                                <Link
                                    href={`/perawat/konsultasi/${data.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    Lihat detail konsultasi
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/perawat/permintaan"
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Kembali ke antrean
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </PerawatAppLayout>
        );
    }

    return (
        <PerawatAppLayout
            active="antrean"
            title="Tindak lanjut hasil"
            description="Catat tindakan puskesmas atau proses rujukan setelah dokter spesialis memberikan hasil konsultasi."
        >
            <Head title="Tindak lanjut hasil" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={`/perawat/konsultasi/${data.id}`}
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke detail konsultasi
                </Link>
                <span className={pilNetral}>
                    <Clock className="size-3" aria-hidden="true" />
                    {tersimpan ? `Sudah dicatat ${formatWaktuCatat(tersimpan.dicatatPada)}` : 'Belum ditindaklanjuti'}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="keputusan-spesialis" className={cn('overflow-hidden rounded-[24px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        <FileText className="size-3.5" aria-hidden="true" />
                                        Hasil konsultasi selesai
                                    </span>
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        {data.nomor}
                                    </span>
                                </div>
                                <h1 className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">Tindak lanjut hasil konsultasi</h1>
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
                                    <h2 id="keputusan-spesialis" className="text-[15px] font-bold">
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

                            {rujuk && (
                                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Building2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    <span>
                                        RS tujuan: <span className="font-bold text-[var(--tk-text)]">{data.faskes}</span> · {data.spesialisasi}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>

                    <form onSubmit={simpanTindakLanjut} noValidate className="grid gap-5">
                        <section aria-labelledby="form-tindak-lanjut" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        'grid size-9 shrink-0 place-items-center rounded-full',
                                        rujuk ? 'bg-tk-warning/15 text-tk-warning' : 'bg-tk-success/15 text-tk-success',
                                    )}
                                >
                                    {rujuk ? (
                                        <MapPin className="size-4" aria-hidden="true" />
                                    ) : (
                                        <ClipboardCheck className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div>
                                    <h2 id="form-tindak-lanjut" className="text-[15px] font-bold">
                                        {rujuk ? 'Proses rujukan' : 'Tindakan di puskesmas'}
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        {rujuk
                                            ? 'Catat persiapan keberangkatan dan perkiraan biaya agar proses rujukan dapat dipantau.'
                                            : 'Catat tindakan yang sudah dilakukan dan jadwalkan kontrol pasien.'}
                                    </p>
                                </div>
                            </div>

                            {rujuk ? (
                                <div className="mt-5 grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="tanggal" className="text-[11px] font-bold">
                                                Tanggal keberangkatan <span className="text-tk-danger">*</span>
                                            </label>
                                            <Input
                                                id="tanggal"
                                                type="date"
                                                value={tanggal}
                                                onChange={(event) => {
                                                    setTanggal(event.target.value);
                                                    setErrors((previous) => ({ ...previous, tanggal: undefined }));
                                                }}
                                                aria-invalid={Boolean(errors.tanggal)}
                                                className={cn(inputClass, 'mt-2')}
                                            />
                                            <InputError message={errors.tanggal} className="text-tk-danger mt-1.5 text-[10px]" />
                                        </div>

                                        <div>
                                            <label htmlFor="biaya" className="text-[11px] font-bold">
                                                Estimasi biaya <span className="text-tk-danger">*</span>
                                            </label>
                                            <Input
                                                id="biaya"
                                                type="number"
                                                min={0}
                                                value={biaya}
                                                onChange={(event) => {
                                                    setBiaya(event.target.value);
                                                    setErrors((previous) => ({ ...previous, biaya: undefined }));
                                                }}
                                                aria-invalid={Boolean(errors.biaya)}
                                                className={cn(inputClass, 'mt-2')}
                                            />
                                            <InputError message={errors.biaya} className="text-tk-danger mt-1.5 text-[10px]" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold">Transportasi</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {transportasiRujukan.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    aria-pressed={transport === item}
                                                    onClick={() => setTransport(item)}
                                                    className={cn(
                                                        'min-h-9 rounded-full border px-3.5 text-[10px] font-semibold transition-colors',
                                                        transport === item
                                                            ? 'bg-tk-accent text-tk-deep border-transparent'
                                                            : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                                    )}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="pendamping" className="text-[11px] font-bold">
                                            Pendamping pasien <span className="text-tk-danger">*</span>
                                        </label>
                                        <Input
                                            id="pendamping"
                                            value={pendamping}
                                            onChange={(event) => {
                                                setPendamping(event.target.value);
                                                setErrors((previous) => ({ ...previous, pendamping: undefined }));
                                            }}
                                            aria-invalid={Boolean(errors.pendamping)}
                                            placeholder="Nama keluarga atau petugas yang mendampingi"
                                            className={cn(inputClass, 'mt-2')}
                                        />
                                        <InputError message={errors.pendamping} className="text-tk-danger mt-1.5 text-[10px]" />
                                    </div>

                                    <fieldset>
                                        <legend className="flex w-full items-center justify-between gap-2 text-[11px] font-bold">
                                            <span>
                                                Persiapan rujukan <span className="text-tk-danger">*</span>
                                            </span>
                                            <span className="text-[10px] font-semibold text-[var(--tk-muted)]">
                                                {persiapan.length}/{persiapanRujukan.length}
                                            </span>
                                        </legend>
                                        <div className="mt-2 grid gap-2">
                                            {persiapanRujukan.map((item) => (
                                                <label
                                                    key={item}
                                                    className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--tk-glass-border)] px-3 py-2 text-[11px]"
                                                >
                                                    <Checkbox
                                                        checked={persiapan.includes(item)}
                                                        onCheckedChange={() => toggleDaftar(item, persiapan, setPersiapan, 'persiapan')}
                                                        aria-invalid={Boolean(errors.persiapan)}
                                                        className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                                    />
                                                    {item}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.persiapan} className="text-tk-danger mt-1.5 text-[10px]" />
                                    </fieldset>
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-4">
                                    <fieldset>
                                        <legend className="text-[11px] font-bold">
                                            Tindakan yang dilakukan <span className="text-tk-danger">*</span>
                                        </legend>
                                        <div className="mt-2 grid gap-2">
                                            {tindakanPuskesmas.map((item) => (
                                                <label
                                                    key={item}
                                                    className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--tk-glass-border)] px-3 py-2 text-[11px]"
                                                >
                                                    <Checkbox
                                                        checked={tindakan.includes(item)}
                                                        onCheckedChange={() => toggleDaftar(item, tindakan, setTindakan, 'tindakan')}
                                                        aria-invalid={Boolean(errors.tindakan)}
                                                        className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                                    />
                                                    {item}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.tindakan} className="text-tk-danger mt-1.5 text-[10px]" />
                                    </fieldset>

                                    <div>
                                        <label htmlFor="tanggal" className="text-[11px] font-bold">
                                            Tanggal kontrol <span className="text-tk-danger">*</span>
                                        </label>
                                        <Input
                                            id="tanggal"
                                            type="date"
                                            value={tanggal}
                                            onChange={(event) => {
                                                setTanggal(event.target.value);
                                                setErrors((previous) => ({ ...previous, tanggal: undefined }));
                                            }}
                                            aria-invalid={Boolean(errors.tanggal)}
                                            className={cn(inputClass, 'mt-2')}
                                        />
                                        <InputError message={errors.tanggal} className="text-tk-danger mt-1.5 text-[10px]" />
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <label htmlFor="catatan" className="text-[11px] font-bold">
                                    Catatan tindak lanjut <span className="text-tk-danger">*</span>
                                </label>
                                <textarea
                                    id="catatan"
                                    rows={4}
                                    value={catatan}
                                    onChange={(event) => {
                                        setCatatan(event.target.value);
                                        setErrors((previous) => ({ ...previous, catatan: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.catatan)}
                                    placeholder={
                                        rujuk
                                            ? 'Contoh: Rujukan dijadwalkan dengan kapal cepat pukul 07.00. Keluarga sudah dihubungi.'
                                            : 'Contoh: Pasien diberikan edukasi diet dan obat. Kontrol ulang minggu depan.'
                                    }
                                    className={cn(textareaClass, errors.catatan && 'border-tk-danger focus:ring-tk-danger/30')}
                                />
                                <InputError message={errors.catatan} className="text-tk-danger mt-1.5 text-[10px]" />
                            </div>
                        </section>

                        <section aria-labelledby="konfirmasi-tindak-lanjut" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="konfirmasi-tindak-lanjut" className="text-[15px] font-bold">
                                        Konfirmasi
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Pastikan tindak lanjut sudah dijelaskan kepada pasien atau keluarganya.
                                    </p>
                                </div>
                            </div>

                            <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <Checkbox
                                    checked={konfirmasi}
                                    onCheckedChange={(checked) => {
                                        setKonfirmasi(checked === true);
                                        setErrors((previous) => ({ ...previous, konfirmasi: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.konfirmasi)}
                                    className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                />
                                <span className="text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Saya sudah menjelaskan {rujuk ? 'proses rujukan' : 'rencana perawatan dan jadwal kontrol'} kepada pasien atau
                                    pendampingnya.
                                </span>
                            </label>
                            <InputError message={errors.konfirmasi} className="text-tk-danger mt-2 text-[10px]" />

                            <div className="mt-4 grid gap-2 sm:flex">
                                <button
                                    type="submit"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors"
                                >
                                    <Save className="size-4" aria-hidden="true" />
                                    {tersimpan ? 'Perbarui tindak lanjut' : 'Simpan tindak lanjut'}
                                </button>
                                <Link
                                    href={`/perawat/konsultasi/${data.id}`}
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            {tersimpan && (
                                <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    Catatan sebelumnya tersimpan di perangkat ini dan akan diperbarui saat Anda menyimpan ulang.
                                </p>
                            )}
                        </section>
                    </form>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="pasien-tindak-lanjut" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                {inisial(data.pasien.nama)}
                            </span>
                            <div className="min-w-0">
                                <p id="pasien-tindak-lanjut" className="truncate text-sm font-bold">
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
                            <p className="flex items-center gap-1.5">
                                <FileText className="size-3 shrink-0" aria-hidden="true" />
                                {data.pasien.noRm} · {data.pasien.sumber}
                            </p>
                            <p className="flex items-start gap-1.5">
                                <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                {data.pasien.alamat}
                            </p>
                        </div>
                    </section>

                    {data.skrining && (
                        <section aria-labelledby="skrining-tindak-lanjut" className={cn('rounded-[24px] p-5', glass)}>
                            <div className="flex items-center justify-between gap-2">
                                <h2 id="skrining-tindak-lanjut" className="text-[15px] font-bold">
                                    Ringkasan skrining
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
                                {[
                                    {
                                        label: 'Tekanan darah',
                                        nilai: `${data.skrining.sistol}/${data.skrining.diastol}`,
                                        satuan: 'mmHg',
                                        icon: Activity,
                                    },
                                    { label: 'Suhu', nilai: angkaDesimal(data.skrining.suhu), satuan: '°C', icon: Thermometer },
                                    { label: 'Nadi', nilai: String(data.skrining.nadi), satuan: 'bpm', icon: HeartPulse },
                                    { label: 'SpO₂', nilai: String(data.skrining.spo2), satuan: '%', icon: Wind },
                                    { label: 'Berat', nilai: String(data.skrining.beratBadan), satuan: 'kg', icon: Scale },
                                    { label: 'Tinggi', nilai: String(data.skrining.tinggiBadan), satuan: 'cm', icon: Ruler },
                                ].map(({ label, nilai, satuan, icon: Icon }) => (
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

                            <p className="mt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <span className="font-bold text-[var(--tk-text)]">Catatan perawat: </span>
                                {data.skrining.catatan}
                            </p>
                        </section>
                    )}

                    <section aria-labelledby="dampak-tindak-lanjut" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="dampak-tindak-lanjut" className="text-[15px] font-bold">
                            {rujuk ? 'Estimasi biaya' : 'Dampak tindakan'}
                        </h2>

                        {rujuk ? (
                            <div className="mt-3">
                                <p className="text-[32px] leading-none font-semibold tracking-[-0.02em]">{formatRupiah(Number(biaya) || 0)}</p>
                                <p className="mt-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    Perkiraan biaya rujukan dengan {transport.toLowerCase()} ke {data.faskes}. Biaya final mengikuti fasilitas tujuan.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-3">
                                <p className="text-tk-success text-[32px] leading-none font-semibold tracking-[-0.02em]">
                                    {formatRupiah(biayaKapal)}
                                </p>
                                <p className="mt-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    Estimasi biaya perjalanan yang terhindarkan, setara {jamPerjalanan} jam pulang-pergi.
                                </p>
                            </div>
                        )}

                        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            {rujuk
                                ? 'Data biaya dipakai untuk memantau beban rujukan pada dasbor.'
                                : 'Kasus ini masuk hitungan rujukan terhindarkan pada dasbor.'}
                        </div>
                    </section>

                    <section aria-labelledby="dokter-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <p id="dokter-hasil" className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
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
                                    <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
                                    {data.jadwal}
                                </p>
                            </div>
                        </div>
                    </section>

                    {!rujuk && (
                        <section aria-label="Pengingat kontrol" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                            <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                                <Clock className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[11px] font-bold">Jangan lupa kontrol</p>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    Hubungi pasien jika kontrol terlewat. Pasien tanpa akun tetap bisa dihubungi lewat telepon atau kunjungan rumah.
                                </p>
                            </div>
                        </section>
                    )}

                    {rujuk && (
                        <section aria-label="Persiapan rujukan" className={cn('rounded-[20px] p-4', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                                    <AlertTriangle className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold">Persiapan rujukan</p>
                                    <ul className="mt-1 grid gap-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        <li>Pastikan kondisi pasien stabil sebelum berangkat.</li>
                                        <li>Bawa ringkasan skrining dan hasil konsultasi.</li>
                                        <li>Konfirmasi ketersediaan tempat tidur di RS tujuan.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Catatan tersimpan lokal saat offline dan dikirim otomatis ketika sinyal kembali. Data fiktif untuk prototipe TeleKarang.
                        </p>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <UserRound className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Tindak lanjut dicatat oleh perawat. Keputusan rujuk/tidak sepenuhnya mengikuti hasil dokter spesialis.
                        </p>
                    </section>
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
