import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    Clock,
    HeartPulse,
    Lock,
    MessageSquare,
    Ruler,
    Scale,
    Send,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    UserRound,
    Video,
    Wind,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import DokterAppLayout from '@/layouts/dokter/dokter-app-layout';
import { cn } from '@/lib/utils';

type Prioritas = 'merah' | 'kuning' | 'normal';
type KeputusanDokter = 'KONSULTASI_SPESIALIS' | 'RUJUK' | 'TANGANI_PUSKESMAS';

interface SkriningReview {
    perawat: string;
    waktu: string | null;
    beratBadan: number;
    tinggiBadan: number;
    sistol: number;
    diastol: number;
    suhu: number;
    nadi: number;
    spo2: number;
    tandaBahaya: boolean;
    prioritas: Prioritas;
    catatan: string;
}

interface ReviewDetailProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        tanggalSkrining: string | null;
        keputusanDokter: KeputusanDokter | null;
        catatanDokter: string | null;
        diputuskanPada: string | null;
        diputuskanOleh: string | null;
    };
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        nik: string;
        noRm: string;
        alamat: string;
        telepon: string;
        sumber: string;
    };
    skrining: SkriningReview | null;
}

type FormErrors = Partial<Record<'keputusan' | 'catatan' | 'konfirmasi', string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const dangerGradient = 'bg-[linear-gradient(135deg,#5A1518_0%,#B02A2F_55%,#E5484D_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const prioritasMeta: Record<Prioritas, { label: string; tone: string; dot: string }> = {
    merah: { label: 'Triase merah', tone: 'bg-tk-danger/15 text-tk-danger', dot: 'bg-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning', dot: 'bg-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
        dot: 'bg-tk-green-500 dark:bg-tk-accent',
    },
};

const keputusanMeta: Record<KeputusanDokter, { label: string; short: string; deskripsi: string }> = {
    KONSULTASI_SPESIALIS: {
        label: 'Konsultasi spesialis',
        short: 'Diteruskan ke spesialis',
        deskripsi: 'Perawat akan memilih dokter spesialis dan slot jadwal, lalu konsultasi berjalan jarak jauh.',
    },
    RUJUK: {
        label: 'Rujuk langsung ke RS',
        short: 'Dirujuk ke RS',
        deskripsi: 'Pasien dirujuk langsung ke RS tanpa konsultasi TeleKarang. Perawat membantu proses rujukan.',
    },
    TANGANI_PUSKESMAS: {
        label: 'Tangani di puskesmas',
        short: 'Ditangani di puskesmas',
        deskripsi: 'Pasien cukup ditangani dokter umum puskesmas dan dihitung sebagai rujukan terhindarkan.',
    },
};

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

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default function ReviewDetailDokter({ konsultasi, pasien, skrining }: ReviewDetailProps) {
    const sudahDiputuskan = konsultasi.keputusanDokter !== null;
    const prioritas = prioritasMeta[skrining?.prioritas ?? 'normal'];
    const merah = skrining?.prioritas === 'merah';
    const headerGradient = merah ? dangerGradient : bannerGradient;
    const headerText = merah ? 'text-white' : 'text-tk-deep';
    const headerSub = merah ? 'text-white/80' : 'text-tk-deep/75';
    const headerChip = merah ? 'bg-white/15 text-white' : 'bg-tk-deep/10 text-tk-deep';

    const [keputusan, setKeputusan] = useState<KeputusanDokter | null>(konsultasi.keputusanDokter);
    const [catatan, setCatatan] = useState(konsultasi.catatanDokter ?? '');
    const [konfirmasi, setKonfirmasi] = useState(sudahDiputuskan);
    const [errors, setErrors] = useState<FormErrors>({});
    const [mengirim, setMengirim] = useState(false);

    const wajibCatatan = keputusan === 'RUJUK' || keputusan === 'TANGANI_PUSKESMAS';

    function pilihKeputusan(nilai: KeputusanDokter) {
        setKeputusan(nilai);
        setErrors((previous) => ({ ...previous, keputusan: undefined }));
    }

    function simpanKeputusan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (!skrining) {
            nextErrors.keputusan = 'Skrining belum lengkap sehingga keputusan belum bisa disimpan.';
        }

        if (!keputusan) {
            nextErrors.keputusan = 'Pilih salah satu keputusan terlebih dahulu.';
        }

        if (wajibCatatan && catatan.trim().length < 10) {
            nextErrors.catatan = 'Tulis catatan minimal 10 karakter untuk keputusan ini.';
        }

        if (!konfirmasi) {
            nextErrors.konfirmasi = 'Konfirmasi bahwa keputusan sudah ditinjau berdasarkan skrining lengkap.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0 || !keputusan) {
            return;
        }

        setMengirim(true);
        router.post(
            route('dokter.review.keputusan', konsultasi.id),
            { keputusan, catatan: catatan.trim() },
            {
                preserveScroll: true,
                onError: (serverErrors) =>
                    setErrors((previous) => ({
                        ...previous,
                        ...(serverErrors.keputusan ? { keputusan: serverErrors.keputusan } : {}),
                        ...(serverErrors.catatan ? { catatan: serverErrors.catatan } : {}),
                    })),
                onFinish: () => setMengirim(false),
            },
        );
    }

    const vital = skrining
        ? [
              { label: 'Berat badan', nilai: String(skrining.beratBadan), satuan: 'kg', icon: Scale, abnormal: false },
              { label: 'Tinggi badan', nilai: String(skrining.tinggiBadan), satuan: 'cm', icon: Ruler, abnormal: false },
              {
                  label: 'Tekanan darah',
                  nilai: `${skrining.sistol}/${skrining.diastol}`,
                  satuan: 'mmHg',
                  icon: Activity,
                  abnormal: skrining.sistol >= 180 || skrining.diastol >= 120,
              },
              { label: 'Suhu tubuh', nilai: angkaDesimal(skrining.suhu), satuan: '°C', icon: Thermometer, abnormal: skrining.suhu >= 40 },
              {
                  label: 'Nadi',
                  nilai: String(skrining.nadi),
                  satuan: 'bpm',
                  icon: HeartPulse,
                  abnormal: skrining.nadi > 130 || skrining.nadi < 40,
              },
              { label: 'SpO₂', nilai: String(skrining.spo2), satuan: '%', icon: Wind, abnormal: skrining.spo2 < 92 },
          ]
        : [];

    return (
        <DokterAppLayout
            active="review"
            title={`Review pasien · ${pasien.nama}`}
            description="Tinjau data pasien dan skrining perawat, lalu putuskan arah penanganan."
        >
            <Head title={`Review ${pasien.nama}`} />

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
                        {sudahDiputuskan && konsultasi.diputuskanPada ? `Diputuskan ${konsultasi.diputuskanPada}` : 'Menunggu keputusan'}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="identitas-pasien" className={cn('overflow-hidden rounded-[24px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', headerGradient)}>
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold', headerChip)}>
                                        <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                        Skrining lengkap
                                    </span>
                                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold', headerChip)}>
                                        {konsultasi.nomor}
                                    </span>
                                </div>
                                <h1 className={cn('mt-4 text-2xl leading-tight font-extrabold', headerText)}>{pasien.nama}</h1>
                                <p className={cn('mt-1 text-xs', headerSub)}>
                                    {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span
                                        className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold', headerChip)}
                                    >
                                        {konsultasi.mode === 'video' ? (
                                            <Video className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                        )}
                                        {konsultasi.mode === 'video' ? 'Mode video' : 'Mode teks'}
                                    </span>
                                    {konsultasi.tanggalSkrining && (
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold',
                                                headerChip,
                                            )}
                                        >
                                            Skrining: {konsultasi.tanggalSkrining}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {merah && (
                            <div className="bg-tk-danger/10 text-tk-danger flex items-start gap-2.5 px-5 py-3.5 text-[11px] font-semibold md:px-6">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <p>Tanda bahaya terdeteksi. Jika kondisi memburuk, koordinasikan rujukan darurat segera.</p>
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
                                    <p className="mt-1 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                                </div>
                            </div>

                            <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[11px] sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">NIK</dt>
                                    <dd className="mt-0.5 font-semibold">{maskNik(pasien.nik)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Telepon</dt>
                                    <dd className="mt-0.5 font-semibold">{pasien.telepon}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Alamat</dt>
                                    <dd className="mt-0.5 font-semibold">{pasien.alamat}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Sumber data</dt>
                                    <dd className="mt-0.5 font-semibold">{pasien.sumber}</dd>
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
                                        {skrining?.perawat ?? 'Perawat puskesmas'} · {skrining?.waktu ?? '-'}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                <ShieldCheck className="size-3" aria-hidden="true" />
                                Gerbang terpenuhi
                            </span>
                        </div>

                        {skrining ? (
                            <>
                                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {vital.map(({ label, nilai, satuan, icon: Icon, abnormal }) => (
                                        <div
                                            key={label}
                                            className={cn(
                                                'rounded-xl border px-3 py-2',
                                                abnormal ? 'bg-tk-danger/10 border-tk-danger/30' : 'border-transparent bg-[var(--tk-page-alt)]',
                                            )}
                                        >
                                            <dt
                                                className={cn(
                                                    'flex items-center gap-1 text-[10px]',
                                                    abnormal ? 'text-tk-danger' : 'text-[var(--tk-muted)]',
                                                )}
                                            >
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
                                    <p className="mt-1.5 text-[11px] leading-relaxed">{skrining.catatan || 'Tidak ada catatan tambahan.'}</p>
                                </div>
                            </>
                        ) : (
                            <p className="bg-tk-danger/10 text-tk-danger mt-4 rounded-xl px-3 py-2.5 text-[11px]">
                                Skrining belum lengkap. Minta perawat melengkapi data sebelum keputusan dikirim.
                            </p>
                        )}
                    </section>

                    {sudahDiputuskan ? (
                        <section aria-labelledby="keputusan-tersimpan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="keputusan-tersimpan" className="text-[15px] font-bold">
                                        Keputusan sudah tercatat
                                    </h2>
                                    <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                        {keputusanMeta[konsultasi.keputusanDokter as KeputusanDokter].short}
                                        {konsultasi.diputuskanOleh ? ` oleh ${konsultasi.diputuskanOleh}` : ''}
                                    </p>
                                </div>
                            </div>

                            {konsultasi.catatanDokter && (
                                <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                        Catatan dokter umum
                                    </p>
                                    <p className="mt-1.5 text-[11px] leading-relaxed">{konsultasi.catatanDokter}</p>
                                </div>
                            )}

                            <Link
                                href="/dokter/review"
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                            >
                                Kembali ke daftar review
                                <ChevronRight className="size-3.5" aria-hidden="true" />
                            </Link>
                        </section>
                    ) : (
                        <form onSubmit={simpanKeputusan} noValidate className="grid gap-5">
                            <section aria-labelledby="keputusan-dokter" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-info/15 text-tk-info grid size-9 shrink-0 place-items-center rounded-full">
                                        <Stethoscope className="size-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="keputusan-dokter" className="text-[15px] font-bold">
                                            Keputusan dokter umum
                                        </h2>
                                        <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                            Pilih arah penanganan setelah meninjau skrining perawat.
                                        </p>
                                    </div>
                                </div>

                                <div role="radiogroup" aria-labelledby="keputusan-dokter" className="mt-4 grid gap-3 sm:grid-cols-3">
                                    {(Object.keys(keputusanMeta) as KeputusanDokter[]).map((kunci) => {
                                        const meta = keputusanMeta[kunci];
                                        const aktif = keputusan === kunci;
                                        const tone =
                                            kunci === 'KONSULTASI_SPESIALIS'
                                                ? { aktif: 'border-tk-info/60 bg-tk-info/10 ring-tk-info/30', icon: 'bg-tk-info/15 text-tk-info' }
                                                : kunci === 'RUJUK'
                                                  ? {
                                                        aktif: 'border-tk-warning/60 bg-tk-warning/10 ring-tk-warning/30',
                                                        icon: 'bg-tk-warning/15 text-tk-warning',
                                                    }
                                                  : {
                                                        aktif: 'border-tk-green-500/60 bg-tk-green-500/[0.10] ring-tk-green-500/30',
                                                        icon: 'bg-tk-green-500/[0.15] text-tk-green-500 dark:bg-tk-accent/[0.15] dark:text-tk-accent',
                                                    };

                                        return (
                                            <button
                                                key={kunci}
                                                type="button"
                                                role="radio"
                                                aria-checked={aktif}
                                                onClick={() => pilihKeputusan(kunci)}
                                                className={cn(
                                                    'rounded-2xl border p-4 text-left transition-colors',
                                                    aktif
                                                        ? cn(tone.aktif, 'ring-2')
                                                        : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                                )}
                                            >
                                                <span className={cn('inline-flex size-9 items-center justify-center rounded-full', tone.icon)}>
                                                    {kunci === 'KONSULTASI_SPESIALIS' ? (
                                                        <Send className="size-4" aria-hidden="true" />
                                                    ) : kunci === 'RUJUK' ? (
                                                        <AlertTriangle className="size-4" aria-hidden="true" />
                                                    ) : (
                                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                                    )}
                                                </span>
                                                <p className="mt-3 text-xs font-bold">{meta.label}</p>
                                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">{meta.deskripsi}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.keputusan} className="text-tk-danger mt-2 text-[10px]" />

                                <div className="mt-5">
                                    <label htmlFor="catatan" className="text-[11px] font-bold">
                                        {keputusan === 'RUJUK'
                                            ? 'Alasan rujukan langsung'
                                            : keputusan === 'TANGANI_PUSKESMAS'
                                              ? 'Rencana penanganan di puskesmas'
                                              : 'Catatan untuk perawat dan spesialis'}
                                        {wajibCatatan && <span className="text-tk-danger"> *</span>}
                                    </label>
                                    <textarea
                                        id="catatan"
                                        rows={3}
                                        value={catatan}
                                        onChange={(event) => {
                                            setCatatan(event.target.value);
                                            setErrors((previous) => ({ ...previous, catatan: undefined }));
                                        }}
                                        aria-invalid={Boolean(errors.catatan)}
                                        placeholder={
                                            keputusan === 'RUJUK'
                                                ? 'Contoh: Nyeri dada berulang dengan EKG abnormal, puskesmas tidak memiliki fasilitas observasi.'
                                                : keputusan === 'TANGANI_PUSKESMAS'
                                                  ? 'Contoh: ISPA tanpa tanda bahaya. Berikan parasetamol, edukasi hidrasi, kontrol 3 hari.'
                                                  : 'Contoh: Mohon evaluasi lanjutan hasil skrining. Pasien sudah diberi oksigen.'
                                        }
                                        className={cn(textareaClass, errors.catatan && 'border-tk-danger focus:ring-tk-danger/30')}
                                    />
                                    <InputError message={errors.catatan} className="text-tk-danger mt-1.5 text-[10px]" />
                                </div>
                            </section>

                            <section aria-labelledby="konfirmasi-review" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                        {skrining ? (
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
                                        skrining ? 'bg-[var(--tk-page-alt)]' : 'bg-tk-danger/10',
                                    )}
                                >
                                    <Checkbox
                                        checked={konfirmasi}
                                        disabled={!skrining}
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

                                <div className="mt-4 grid gap-2 sm:flex">
                                    <button
                                        type="submit"
                                        disabled={!skrining || mengirim}
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Send className="size-4" aria-hidden="true" />
                                        {mengirim ? 'Menyimpan...' : 'Simpan keputusan'}
                                    </button>
                                    <Link
                                        href="/dokter/review"
                                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        Batal
                                    </Link>
                                </div>
                            </section>
                        </form>
                    )}
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="kontak-pasien" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                {inisial(pasien.nama)}
                            </span>
                            <div className="min-w-0">
                                <p id="kontak-pasien" className="truncate text-sm font-bold">
                                    {pasien.nama}
                                </p>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {pasien.usia} tahun · {pasien.noRm}
                                </p>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{pasien.telepon}</p>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="alur-review" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="alur-review" className="text-[15px] font-bold">
                            Alur keputusan
                        </h2>
                        <ol className="mt-3 grid gap-3">
                            {[
                                { label: 'Skrining perawat', selesai: true, keterangan: skrining?.waktu ?? '-' },
                                {
                                    label: 'Review dokter umum',
                                    selesai: sudahDiputuskan,
                                    keterangan: sudahDiputuskan ? 'Keputusan tercatat' : 'Sedang ditinjau',
                                },
                                {
                                    label:
                                        konsultasi.keputusanDokter === 'KONSULTASI_SPESIALIS'
                                            ? 'Pemilihan dokter spesialis'
                                            : konsultasi.keputusanDokter === 'RUJUK'
                                              ? 'Proses rujukan'
                                              : 'Tindak lanjut puskesmas',
                                    selesai:
                                        konsultasi.status === 'SELESAI' ||
                                        konsultasi.status === 'DIRUJUK' ||
                                        konsultasi.status === 'DITANGANI_PUSKESMAS',
                                    keterangan: sudahDiputuskan ? 'Diproses perawat' : 'Menunggu keputusan',
                                },
                            ].map((langkah, index) => (
                                <li key={langkah.label} className="flex items-start gap-2.5">
                                    <span
                                        className={cn(
                                            'grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                            langkah.selesai
                                                ? 'bg-tk-green-500/[0.15] text-tk-green-500 dark:text-tk-accent'
                                                : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
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
                </aside>
            </div>
        </DokterAppLayout>
    );
}
