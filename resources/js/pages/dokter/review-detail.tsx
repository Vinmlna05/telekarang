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
    Lock,
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
import { cariReviewDokter, type KeputusanReview, type PrioritasReview } from '@/data/review-dokter';
import DokterAppLayout from '@/layouts/dokter/dokter-app-layout';
import { cn } from '@/lib/utils';

interface ReviewDetailProps {
    konsultasiId: number;
}

type FormErrors = Partial<Record<'keputusan' | 'rencana' | 'konfirmasi', string>>;

interface ReviewTersimpan {
    konsultasiId: number;
    keputusan: KeputusanReview;
    catatanSpesialis: string;
    rencana: string;
    tindakan: string[];
    dicatatPada: string;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const dangerGradient = 'bg-[linear-gradient(135deg,#5A1518_0%,#B02A2F_55%,#E5484D_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const rencanaPuskesmas = ['Edukasi pasien dan keluarga', 'Berikan obat sesuai indikasi', 'Observasi tanda vital 1×24 jam', 'Jadwalkan kontrol ulang'];

const prioritasMeta: Record<PrioritasReview, { label: string; tone: string; dot: string }> = {
    merah: { label: 'Triase merah', tone: 'bg-tk-danger/15 text-tk-danger', dot: 'bg-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning', dot: 'bg-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
        dot: 'bg-tk-green-500 dark:bg-tk-accent',
    },
};

const keputusanMeta: Record<KeputusanReview, { label: string; short: string; deskripsi: string }> = {
    TERUSKAN: {
        label: 'Teruskan ke dokter spesialis',
        short: 'Diteruskan ke spesialis',
        deskripsi: 'Pasien membutuhkan evaluasi lanjutan oleh dokter spesialis sesuai hasil skrining.',
    },
    TANGANI_SENDIRI: {
        label: 'Tangani di puskesmas',
        short: 'Ditangani di puskesmas',
        deskripsi: 'Pasien cukup ditangani dokter umum puskesmas tanpa rujukan ke spesialis.',
    },
};

function kunciSimpanan(id: number): string {
    return `telekarang:review-dokter:${id}`;
}

function bacaSimpanan(id: number): ReviewTersimpan | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const mentah = window.localStorage.getItem(kunciSimpanan(id));

        if (!mentah) {
            return null;
        }

        const parsed = JSON.parse(mentah) as Partial<ReviewTersimpan>;

        if (parsed.keputusan !== 'TERUSKAN' && parsed.keputusan !== 'TANGANI_SENDIRI') {
            return null;
        }

        return {
            konsultasiId: id,
            keputusan: parsed.keputusan,
            catatanSpesialis: typeof parsed.catatanSpesialis === 'string' ? parsed.catatanSpesialis : '',
            rencana: typeof parsed.rencana === 'string' ? parsed.rencana : '',
            tindakan: Array.isArray(parsed.tindakan) ? parsed.tindakan.filter((nilai): nilai is string => typeof nilai === 'string') : [],
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

export default function ReviewDetailDokter({ konsultasiId }: ReviewDetailProps) {
    const data = cariReviewDokter(konsultasiId);
    const prioritas = prioritasMeta[data.prioritas];
    const skriningLengkap = Boolean(data.skrining);
    const merah = data.prioritas === 'merah';
    const headerGradient = merah ? dangerGradient : bannerGradient;
    const headerText = merah ? 'text-white' : 'text-tk-deep';
    const headerSub = merah ? 'text-white/80' : 'text-tk-deep/75';
    const headerChip = merah ? 'bg-white/15 text-white' : 'bg-tk-deep/10 text-tk-deep';

    const [keputusan, setKeputusan] = useState<KeputusanReview | null>(null);
    const [catatanSpesialis, setCatatanSpesialis] = useState('');
    const [rencana, setRencana] = useState('');
    const [tindakan, setTindakan] = useState<string[]>([]);
    const [konfirmasi, setKonfirmasi] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [berhasil, setBerhasil] = useState(false);
    const [tersimpan, setTersimpan] = useState<ReviewTersimpan | null>(null);

    useEffect(() => {
        const simpanan = bacaSimpanan(data.id);

        if (!simpanan) {
            setTersimpan(null);
            return;
        }

        setTersimpan(simpanan);
        setKeputusan(simpanan.keputusan);
        setCatatanSpesialis(simpanan.catatanSpesialis);
        setRencana(simpanan.rencana);
        setTindakan(simpanan.tindakan);
        setKonfirmasi(true);
    }, [data.id]);

    function pilihKeputusan(nilai: KeputusanReview) {
        setKeputusan(nilai);
        setErrors((previous) => ({ ...previous, keputusan: undefined, rencana: undefined }));
    }

    function toggleTindakan(item: string) {
        setTindakan((previous) => (previous.includes(item) ? previous.filter((nilai) => nilai !== item) : [...previous, item]));
    }

    function simpanKeputusan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (!skriningLengkap) {
            nextErrors.keputusan = 'Skrining belum lengkap sehingga keputusan belum bisa disimpan.';
        }

        if (!keputusan) {
            nextErrors.keputusan = 'Pilih salah satu keputusan terlebih dahulu.';
        }

        if (keputusan === 'TANGANI_SENDIRI' && rencana.trim().length < 10) {
            nextErrors.rencana = 'Tulis rencana penanganan minimal 10 karakter.';
        }

        if (!konfirmasi) {
            nextErrors.konfirmasi = 'Konfirmasi bahwa keputusan sudah ditinjau berdasarkan skrining lengkap.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0 || !keputusan) {
            return;
        }

        const rekaman: ReviewTersimpan = {
            konsultasiId: data.id,
            keputusan,
            catatanSpesialis: catatanSpesialis.trim(),
            rencana: rencana.trim(),
            tindakan,
            dicatatPada: new Date().toISOString(),
        };

        try {
            window.localStorage.setItem(kunciSimpanan(data.id), JSON.stringify(rekaman));
        } catch {
            // Penyimpanan lokal tidak tersedia; keputusan tetap ditampilkan pada sesi ini.
        }

        setTersimpan(rekaman);
        setBerhasil(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function ubahKeputusan() {
        setBerhasil(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const vital = [
        { label: 'Berat badan', nilai: String(data.skrining.beratBadan), satuan: 'kg', icon: Scale, abnormal: false },
        { label: 'Tinggi badan', nilai: String(data.skrining.tinggiBadan), satuan: 'cm', icon: Ruler, abnormal: false },
        {
            label: 'Tekanan darah',
            nilai: `${data.skrining.sistol}/${data.skrining.diastol}`,
            satuan: 'mmHg',
            icon: Activity,
            abnormal: data.skrining.sistol >= 180 || data.skrining.diastol >= 120,
        },
        {
            label: 'Suhu tubuh',
            nilai: angkaDesimal(data.skrining.suhu),
            satuan: '°C',
            icon: Thermometer,
            abnormal: data.skrining.suhu >= 40,
        },
        {
            label: 'Nadi',
            nilai: String(data.skrining.nadi),
            satuan: 'bpm',
            icon: HeartPulse,
            abnormal: data.skrining.nadi > 130 || data.skrining.nadi < 40,
        },
        {
            label: 'SpO₂',
            nilai: String(data.skrining.spo2),
            satuan: '%',
            icon: Wind,
            abnormal: data.skrining.spo2 < 92,
        },
    ];

    if (berhasil && tersimpan) {
        const meta = keputusanMeta[tersimpan.keputusan];
        const diteruskan = tersimpan.keputusan === 'TERUSKAN';

        return (
            <DokterAppLayout
                active="review"
                title="Keputusan tersimpan"
                description="Keputusan dokter umum sudah tercatat dan diteruskan ke alur berikutnya."
            >
                <Head title="Keputusan review tersimpan" />

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
                                <h1 className="text-tk-deep mt-1 text-2xl leading-tight font-extrabold">{meta.short}</h1>
                                <p className="text-tk-deep/75 mx-auto mt-2 max-w-md text-xs leading-relaxed">{meta.deskripsi}</p>
                                <p className="text-tk-deep/60 mt-2 text-[10px]">Dicatat {formatWaktuCatat(tersimpan.dicatatPada)}</p>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Keputusan dokter umum</p>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold',
                                        diteruskan
                                            ? 'bg-tk-info/15 text-tk-info'
                                            : 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
                                    )}
                                >
                                    {diteruskan ? (
                                        <Send className="size-3" aria-hidden="true" />
                                    ) : (
                                        <ShieldCheck className="size-3" aria-hidden="true" />
                                    )}
                                    {meta.short}
                                </span>
                            </div>

                            <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-xs sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Pasien</dt>
                                    <dd className="mt-1 font-bold">{data.pasien.nama}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">{data.pasien.noRm}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Skrining</dt>
                                    <dd className="mt-1 font-bold">Lengkap · {data.skrining.perawat}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">{data.skrining.waktu}</dd>
                                </div>

                                {diteruskan ? (
                                    <>
                                        <div className="sm:col-span-2">
                                            <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                Ditujukan ke
                                            </dt>
                                            <dd className="mt-1 font-bold">
                                                {data.tujuan.spesialisasi} · {data.tujuan.dokter}
                                            </dd>
                                            <dd className="text-[11px] text-[var(--tk-muted)]">
                                                {data.tujuan.faskes} · {data.tujuan.jadwal}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                Catatan untuk spesialis
                                            </dt>
                                            <dd className="mt-1 leading-relaxed">{tersimpan.catatanSpesialis || 'Tidak ada catatan tambahan.'}</dd>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="sm:col-span-2">
                                            <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                Rencana penanganan
                                            </dt>
                                            <dd className="mt-1 leading-relaxed">{tersimpan.rencana}</dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                                Tindakan di puskesmas
                                            </dt>
                                            <dd className="mt-1 leading-relaxed">
                                                {tersimpan.tindakan.length > 0 ? tersimpan.tindakan.join(', ') : 'Belum ada tindakan terpilih.'}
                                            </dd>
                                        </div>
                                    </>
                                )}
                            </dl>

                            <div
                                className={cn(
                                    'mt-4 flex items-start gap-2.5 rounded-2xl p-3.5',
                                    diteruskan ? 'bg-tk-info/10' : 'bg-tk-green-500/[0.10]',
                                )}
                            >
                                <span
                                    className={cn(
                                        'grid size-8 shrink-0 place-items-center rounded-full',
                                        diteruskan ? 'bg-tk-info/15 text-tk-info' : 'bg-tk-green-500/[0.15] text-tk-green-500 dark:text-tk-accent',
                                    )}
                                >
                                    {diteruskan ? (
                                        <Send className="size-4" aria-hidden="true" />
                                    ) : (
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold">
                                        {diteruskan ? 'Permintaan diteruskan ke spesialis' : 'Kasus tercatat sebagai rujukan terhindarkan'}
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        {diteruskan
                                            ? `Perawat dan pasien akan mendapat notifikasi setelah dokter spesialis mengonfirmasi jadwal.`
                                            : 'Pasien ditangani di puskesmas dan data masuk ke hitungan rujukan terhindarkan pada dasbor.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-2 sm:flex">
                                <button
                                    type="button"
                                    onClick={ubahKeputusan}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <Pencil className="size-3.5" aria-hidden="true" />
                                    Ubah keputusan
                                </button>
                                <Link
                                    href="/dokter/review"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    Kembali ke daftar review
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </DokterAppLayout>
        );
    }

    return (
        <DokterAppLayout
            active="review"
            title={`Review pasien · ${data.pasien.nama}`}
            description="Tinjau data pasien dan skrining perawat, lalu putuskan apakah kasus diteruskan ke dokter spesialis atau ditangani di puskesmas."
        >
            <Head title={`Review ${data.pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/dokter/review"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar review
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold', prioritas.tone)}>
                        <span className={cn('size-1.5 rounded-full', prioritas.dot)} aria-hidden="true" />
                        {prioritas.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                        <Clock className="size-3" aria-hidden="true" />
                        {tersimpan ? `Sudah direview ${formatWaktuCatat(tersimpan.dicatatPada)}` : 'Menunggu keputusan'}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="identitas-pasien" className={cn('overflow-hidden rounded-[24px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', headerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-10 -right-6 size-36 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold', headerChip)}>
                                        <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                        Skrining lengkap
                                    </span>
                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold', headerChip)}>
                                        {data.nomor}
                                    </span>
                                </div>
                                <h1 className={cn('mt-4 text-2xl leading-tight font-extrabold', headerText)}>{data.pasien.nama}</h1>
                                <p className={cn('mt-1 text-xs', headerSub)}>
                                    {data.pasien.usia} tahun · {data.pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {data.pasien.noRm}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span
                                        className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold', headerChip)}
                                    >
                                        <Stethoscope className="size-3.5" aria-hidden="true" />
                                        Tujuan awal: {data.tujuan.spesialisasi}
                                    </span>
                                    <span
                                        className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold', headerChip)}
                                    >
                                        {data.tujuan.mode === 'video' ? (
                                            <Video className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                        )}
                                        {data.tujuan.mode === 'video' ? 'Mode video' : 'Mode teks'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {merah && (
                            <div className="bg-tk-danger/10 text-tk-danger flex items-start gap-2.5 px-5 py-3.5 text-[11px] font-semibold md:px-6">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <p>
                                    Tanda bahaya terdeteksi. Jika kondisi memburuk, koordinasikan rujukan darurat tanpa menunggu konfirmasi spesialis.
                                </p>
                            </div>
                        )}

                        <div className="p-5 md:p-6">
                            <div className="flex items-start gap-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                    <UserRound className="size-5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <h2 id="identitas-pasien" className="text-[15px] font-bold">
                                        Keluhan utama
                                    </h2>
                                    <p className="mt-1 text-[11px] leading-relaxed">{data.keluhan}</p>
                                    <p className="mt-1 text-[10px] text-[var(--tk-muted)]">Durasi keluhan: {data.durasiKeluhan}</p>
                                </div>
                            </div>

                            <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[11px] sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">NIK</dt>
                                    <dd className="mt-0.5 font-semibold">{maskNik(data.pasien.nik)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Pekerjaan</dt>
                                    <dd className="mt-0.5 font-semibold">{data.pasien.pekerjaan}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Alamat</dt>
                                    <dd className="mt-0.5 font-semibold">{data.pasien.alamat}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Sumber data</dt>
                                    <dd className="mt-0.5 font-semibold">{data.pasien.sumber}</dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section aria-labelledby="data-skrining" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                    <Activity className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="data-skrining" className="text-[15px] font-bold">
                                        Data skrining perawat
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {data.skrining.perawat} · {data.skrining.waktu}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                <ShieldCheck className="size-3" aria-hidden="true" />
                                Gerbang terpenuhi
                            </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {vital.map(({ label, nilai, satuan, icon: Icon, abnormal }) => (
                                <div
                                    key={label}
                                    className={cn(
                                        'rounded-xl border px-3 py-2',
                                        abnormal ? 'bg-tk-danger/10 border-tk-danger/30' : 'border-transparent bg-[var(--tk-page-alt)]',
                                    )}
                                >
                                    <dt className={cn('flex items-center gap-1 text-[10px]', abnormal ? 'text-tk-danger' : 'text-[var(--tk-muted)]')}>
                                        <Icon className="size-3" aria-hidden="true" />
                                        {label}
                                    </dt>
                                    <dd className={cn('mt-0.5 text-xs font-bold', abnormal && 'text-tk-danger')}>
                                        {nilai} <span className="text-[10px] font-semibold opacity-70">{satuan}</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Catatan perawat</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed">{data.skrining.catatan}</p>
                        </div>

                        {data.pemeriksaanTambahan.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {data.pemeriksaanTambahan.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center justify-between gap-2 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2"
                                    >
                                        <span className="text-[10px] text-[var(--tk-muted)]">{item.label}</span>
                                        <span className="text-[11px] font-bold">
                                            {item.nilai} <span className="text-[10px] font-semibold text-[var(--tk-muted)]">{item.satuan}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <form onSubmit={simpanKeputusan} noValidate className="grid gap-5">
                        <section aria-labelledby="keputusan-teruskan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="keputusan-teruskan" className="text-[15px] font-bold">
                                        Keputusan dokter umum
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Pilih apakah pasien perlu diteruskan ke dokter spesialis atau cukup ditangani di puskesmas.
                                    </p>
                                </div>
                            </div>

                            <div role="radiogroup" aria-labelledby="keputusan-teruskan" className="mt-4 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={keputusan === 'TERUSKAN'}
                                    onClick={() => pilihKeputusan('TERUSKAN')}
                                    className={cn(
                                        'rounded-2xl border p-4 text-left transition-colors',
                                        keputusan === 'TERUSKAN'
                                            ? 'border-tk-info/60 bg-tk-info/10 ring-tk-info/30 ring-2'
                                            : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                    )}
                                >
                                    <span className="bg-tk-info/15 text-tk-info inline-flex size-9 items-center justify-center rounded-full">
                                        <Send className="size-4" aria-hidden="true" />
                                    </span>
                                    <p className="mt-3 text-xs font-bold">Teruskan ke spesialis</p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Kasus perlu evaluasi lanjutan oleh dokter spesialis.
                                    </p>
                                    <span className="text-tk-info mt-2 inline-flex items-center gap-1 text-[10px] font-semibold">
                                        <CalendarDays className="size-3" aria-hidden="true" />
                                        {data.tujuan.jadwal}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={keputusan === 'TANGANI_SENDIRI'}
                                    onClick={() => pilihKeputusan('TANGANI_SENDIRI')}
                                    className={cn(
                                        'rounded-2xl border p-4 text-left transition-colors',
                                        keputusan === 'TANGANI_SENDIRI'
                                            ? 'border-tk-green-500/60 bg-tk-green-500/[0.10] ring-tk-green-500/30 ring-2'
                                            : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                    )}
                                >
                                    <span className="bg-tk-green-500/[0.15] text-tk-green-500 dark:bg-tk-accent/[0.15] dark:text-tk-accent inline-flex size-9 items-center justify-center rounded-full">
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                    </span>
                                    <p className="mt-3 text-xs font-bold">Tangani di puskesmas</p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Terapi dapat diselesaikan dokter umum tanpa rujukan.
                                    </p>
                                    <span className="text-tk-green-500 dark:text-tk-accent mt-2 inline-flex items-center gap-1 text-[10px] font-semibold">
                                        <CheckCircle2 className="size-3" aria-hidden="true" />
                                        Masuk rujukan terhindarkan
                                    </span>
                                </button>
                            </div>
                            <InputError message={errors.keputusan} className="text-tk-danger mt-2 text-[10px]" />

                            {keputusan === 'TERUSKAN' && (
                                <div className="mt-5 grid gap-4">
                                    <div className="bg-tk-info/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Ditujukan ke</p>
                                        <div className="mt-2 flex items-center gap-3">
                                            <span className="text-tk-mint grid size-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[11px] font-extrabold">
                                                {inisial(data.tujuan.dokter, true)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold">{data.tujuan.dokter}</p>
                                                <p className="text-tk-info text-[10px] font-semibold">Spesialis {data.tujuan.spesialisasi}</p>
                                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                                    {data.tujuan.faskes} · {data.tujuan.jadwal}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="catatanSpesialis" className="text-[11px] font-bold">
                                            Catatan untuk dokter spesialis
                                        </label>
                                        <textarea
                                            id="catatanSpesialis"
                                            rows={3}
                                            value={catatanSpesialis}
                                            onChange={(event) => setCatatanSpesialis(event.target.value)}
                                            placeholder="Contoh: Mohon evaluasi nyeri dada dengan riwayat hipertensi tidak terkontrol. Pasien sudah diberi oksigen."
                                            className={textareaClass}
                                        />
                                        <p className="mt-1.5 text-[10px] text-[var(--tk-muted)]">Catatan ini ikut terkirim bersama hasil skrining.</p>
                                    </div>
                                </div>
                            )}

                            {keputusan === 'TANGANI_SENDIRI' && (
                                <div className="mt-5 grid gap-4">
                                    <fieldset>
                                        <legend className="text-[11px] font-bold">Rencana tindakan</legend>
                                        <div className="mt-2 grid gap-2">
                                            {rencanaPuskesmas.map((item) => (
                                                <label
                                                    key={item}
                                                    className="flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--tk-glass-border)] px-3 py-2 text-[11px]"
                                                >
                                                    <Checkbox
                                                        checked={tindakan.includes(item)}
                                                        onCheckedChange={() => toggleTindakan(item)}
                                                        className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                                    />
                                                    {item}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <div>
                                        <label htmlFor="rencana" className="text-[11px] font-bold">
                                            Rencana penanganan <span className="text-tk-danger">*</span>
                                        </label>
                                        <textarea
                                            id="rencana"
                                            rows={3}
                                            value={rencana}
                                            onChange={(event) => {
                                                setRencana(event.target.value);
                                                setErrors((previous) => ({ ...previous, rencana: undefined }));
                                            }}
                                            aria-invalid={Boolean(errors.rencana)}
                                            placeholder="Contoh: Amoksisilin 500 mg 3×1 selama 5 hari, edukasi hidrasi, kontrol 3 hari lagi."
                                            className={cn(textareaClass, errors.rencana && 'border-tk-danger focus:ring-tk-danger/30')}
                                        />
                                        <InputError message={errors.rencana} className="text-tk-danger mt-1.5 text-[10px]" />
                                    </div>
                                </div>
                            )}
                        </section>

                        <section aria-labelledby="konfirmasi-review" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                    {skriningLengkap ? (
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                    ) : (
                                        <Lock className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div>
                                    <h2 id="konfirmasi-review" className="text-[15px] font-bold">
                                        Konfirmasi review
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Pastikan keputusan diambil berdasarkan skrining lengkap dari perawat.
                                    </p>
                                </div>
                            </div>

                            <label
                                className={cn(
                                    'mt-4 flex items-start gap-3 rounded-2xl p-4',
                                    skriningLengkap ? 'bg-[var(--tk-page-alt)]' : 'bg-tk-danger/10',
                                )}
                            >
                                <Checkbox
                                    checked={konfirmasi}
                                    disabled={!skriningLengkap}
                                    onCheckedChange={(checked) => {
                                        setKonfirmasi(checked === true);
                                        setErrors((previous) => ({ ...previous, konfirmasi: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.konfirmasi)}
                                    className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                />
                                <span className="text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Saya sudah meninjau data skrining, tanda vital, dan keluhan pasien sebelum menentukan keputusan ini.
                                </span>
                            </label>
                            <InputError message={errors.konfirmasi} className="text-tk-danger mt-2 text-[10px]" />

                            {!skriningLengkap && (
                                <p className="bg-tk-danger/10 text-tk-danger mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[10px] leading-relaxed">
                                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Skrining belum lengkap. Minta perawat melengkapi data sebelum keputusan dikirim.
                                </p>
                            )}

                            <div className="mt-4 grid gap-2 sm:flex">
                                <button
                                    type="submit"
                                    disabled={!skriningLengkap}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send className="size-4" aria-hidden="true" />
                                    {tersimpan ? 'Perbarui keputusan' : 'Simpan keputusan'}
                                </button>
                                <Link
                                    href="/dokter/review"
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            {tersimpan && (
                                <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    Keputusan sebelumnya tersimpan di perangkat ini dan akan diperbarui saat Anda menyimpan ulang.
                                </p>
                            )}
                        </section>
                    </form>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="kontak-pasien" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                {inisial(data.pasien.nama)}
                            </span>
                            <div className="min-w-0">
                                <p id="kontak-pasien" className="truncate text-sm font-bold">
                                    {data.pasien.nama}
                                </p>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {data.pasien.usia} tahun · {data.pasien.noRm}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    <Phone className="size-3 shrink-0" aria-hidden="true" />
                                    {data.pasien.telepon}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            {data.pasien.alamat}
                        </div>
                    </section>

                    <section aria-labelledby="alur-review" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="alur-review" className="text-[15px] font-bold">
                            Alur keputusan
                        </h2>
                        <ol className="mt-3 grid gap-3">
                            {[
                                { label: 'Skrining perawat', selesai: true, keterangan: data.skrining.waktu },
                                {
                                    label: 'Review dokter umum',
                                    selesai: Boolean(tersimpan),
                                    keterangan: tersimpan ? 'Keputusan tercatat' : 'Sedang ditinjau',
                                },
                                {
                                    label: tersimpan?.keputusan === 'TANGANI_SENDIRI' ? 'Tindak lanjut puskesmas' : 'Konfirmasi spesialis',
                                    selesai: false,
                                    keterangan: tersimpan?.keputusan === 'TANGANI_SENDIRI' ? 'Setelah keputusan' : 'Menunggu keputusan',
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

                    {data.riwayat.length > 0 && (
                        <section aria-labelledby="riwayat-pasien" className={cn('rounded-[24px] p-5', glass)}>
                            <div className="flex items-center gap-2">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                    <FileText className="size-4" aria-hidden="true" />
                                </span>
                                <h2 id="riwayat-pasien" className="text-[15px] font-bold">
                                    Riwayat kunjungan
                                </h2>
                            </div>

                            <ul className="mt-3 grid gap-3">
                                {data.riwayat.map((item) => (
                                    <li key={item.tanggal} className="rounded-xl bg-[var(--tk-page-alt)] p-3">
                                        <p className="text-[10px] font-semibold text-[var(--tk-muted)]">{item.tanggal}</p>
                                        <p className="mt-0.5 text-[11px] font-semibold">{item.keluhan}</p>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{item.tindakan}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {merah && (
                        <section aria-label="Peringatan triase merah" className={cn('rounded-[20px] p-4', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-danger/15 text-tk-danger grid size-9 shrink-0 place-items-center rounded-full">
                                    <AlertTriangle className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <p className="text-[11px] font-bold">Prioritas triase merah</p>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Hubungi dokter spesialis lebih dulu dan siapkan jalur rujukan darurat bila kondisi memburuk.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <Wifi className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Keputusan tersimpan lokal saat offline dan dikirim otomatis ketika sinyal kembali. Data fiktif untuk prototipe TeleKarang.
                        </p>
                    </section>
                </aside>
            </div>
        </DokterAppLayout>
    );
}
