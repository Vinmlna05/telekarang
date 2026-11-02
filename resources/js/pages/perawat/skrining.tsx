import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    HeartPulse,
    Info,
    Lock,
    MessageSquare,
    Ruler,
    Scale,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    UserRound,
    Wind,
    X,
    type LucideIcon,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

type StatusPermintaan = 'MENUNGGU_SKRINING' | 'SKRINING_SELESAI' | 'MENUNGGU_SPESIALIS' | 'KEDALUWARSA';
type VitalKey = 'berat' | 'tinggi' | 'suhu' | 'nadi' | 'sistol' | 'diastol' | 'spo2';

interface Pasien {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    nik: string;
    noRm: string;
    alamat: string;
    keluhan: string;
    spesialisasi: string;
    dokter: string;
    jadwal: string;
    status: StatusPermintaan;
    prioritas: 'normal' | 'merah';
    sumber: string;
    waktuMasuk: string;
}

interface NilaiAwal {
    berat: string;
    tinggi: string;
    suhu: string;
    nadi: string;
    sistol: string;
    diastol: string;
    spo2: string;
    catatan: string;
}

interface SkriningPerawatProps {
    konsultasiId: number;
    pasien: Pasien;
    nilaiAwal: NilaiAwal;
}

interface VitalConfig {
    label: string;
    unit: string;
    min: number;
    max: number;
    step: string;
    placeholder: string;
    hint: string;
    icon: LucideIcon;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const primaryButton =
    'bg-tk-green-500 hover:bg-tk-green-400 focus-visible:ring-tk-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tk-page)] disabled:pointer-events-none disabled:opacity-50';

const vitalConfig: Record<VitalKey, VitalConfig> = {
    berat: { label: 'Berat badan', unit: 'kg', min: 2, max: 250, step: '0.1', placeholder: '58', hint: '2–250 kg', icon: Scale },
    tinggi: { label: 'Tinggi badan', unit: 'cm', min: 30, max: 250, step: '0.1', placeholder: '160', hint: '30–250 cm', icon: Ruler },
    suhu: { label: 'Suhu tubuh', unit: '°C', min: 30, max: 45, step: '0.1', placeholder: '36.8', hint: '30–45 °C', icon: Thermometer },
    nadi: { label: 'Nadi', unit: 'bpm', min: 30, max: 220, step: '1', placeholder: '84', hint: '30–220 bpm', icon: HeartPulse },
    sistol: { label: 'Tekanan sistol', unit: 'mmHg', min: 50, max: 260, step: '1', placeholder: '120', hint: '50–260 mmHg', icon: Activity },
    diastol: { label: 'Tekanan diastol', unit: 'mmHg', min: 30, max: 150, step: '1', placeholder: '80', hint: '30–150 mmHg', icon: Activity },
    spo2: { label: 'SpO₂', unit: '%', min: 50, max: 100, step: '1', placeholder: '98', hint: '50–100%', icon: Wind },
};

const vitalKeys = Object.keys(vitalConfig) as VitalKey[];

const statusLabel: Record<StatusPermintaan, string> = {
    MENUNGGU_SKRINING: 'Menunggu skrining',
    SKRINING_SELESAI: 'Skrining selesai',
    MENUNGGU_SPESIALIS: 'Menunggu spesialis',
    KEDALUWARSA: 'Kedaluwarsa',
};

const langkahAlur = [
    { label: 'Permintaan', caption: 'Selesai' },
    { label: 'Skrining', caption: 'Sedang diisi' },
    { label: 'Dokter umum', caption: 'Review skrining' },
    { label: 'Spesialis', caption: 'Konsultasi' },
];

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

function angka(value: string): number | null {
    const normalized = value.replace(',', '.').trim();

    if (normalized === '') {
        return null;
    }

    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
}

function errorVital(key: VitalKey, value: string): string | undefined {
    if (value.trim() === '') {
        return undefined;
    }

    const nilai = angka(value);

    if (nilai === null) {
        return 'Masukkan angka yang valid.';
    }

    const { min, max, unit } = vitalConfig[key];

    if (nilai < min || nilai > max) {
        return `Harus ${min}–${max} ${unit}.`;
    }

    return undefined;
}

function hitungKriteriaBahaya(vital: Record<VitalKey, string>, keluhan: string): string[] {
    const kriteria: string[] = [];
    const spo2 = angka(vital.spo2);
    const sistol = angka(vital.sistol);
    const diastol = angka(vital.diastol);
    const suhu = angka(vital.suhu);
    const nadi = angka(vital.nadi);

    if (spo2 !== null && spo2 < 92) {
        kriteria.push('SpO₂ di bawah 92%');
    }

    if ((sistol !== null && sistol >= 180) || (diastol !== null && diastol >= 120)) {
        kriteria.push('Tekanan darah sangat tinggi');
    }

    if (suhu !== null && suhu >= 40) {
        kriteria.push('Suhu tubuh 40 °C atau lebih');
    }

    if (nadi !== null && (nadi > 130 || nadi < 40)) {
        kriteria.push('Nadi di luar rentang aman');
    }

    const teksKeluhan = keluhan.toLowerCase();

    if (teksKeluhan.includes('sesak berat')) {
        kriteria.push('Keluhan sesak berat');
    }

    if (teksKeluhan.includes('tidak sadar')) {
        kriteria.push('Keluhan tidak sadar');
    }

    return kriteria;
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
            </div>
        </div>
    );
}

export default function SkriningPerawat({ konsultasiId, pasien, nilaiAwal }: SkriningPerawatProps) {
    const [vital, setVital] = useState<Record<VitalKey, string>>({
        berat: nilaiAwal.berat,
        tinggi: nilaiAwal.tinggi,
        suhu: nilaiAwal.suhu,
        nadi: nilaiAwal.nadi,
        sistol: nilaiAwal.sistol,
        diastol: nilaiAwal.diastol,
        spo2: nilaiAwal.spo2,
    });
    const [keluhan, setKeluhan] = useState(pasien.keluhan);
    const [catatan, setCatatan] = useState(nilaiAwal.catatan);
    const [dicobaKirim, setDicobaKirim] = useState(false);
    const [tersimpan, setTersimpan] = useState(false);

    const errors = useMemo(
        () => Object.fromEntries(vitalKeys.map((key) => [key, errorVital(key, vital[key])])) as Record<VitalKey, string | undefined>,
        [vital],
    );
    const keluhanError = keluhan.trim().length < 10 ? 'Tulis keluhan utama minimal 10 karakter.' : undefined;
    const lengkap = vitalKeys.every((key) => !errors[key]) && !keluhanError;
    const kriteriaBahaya = useMemo(() => hitungKriteriaBahaya(vital, keluhan), [vital, keluhan]);
    const totalKomponen = vitalKeys.length + 1;
    const terisi = vitalKeys.filter((key) => !errors[key]).length + (keluhanError ? 0 : 1);
    const persentase = Math.round((terisi / totalKomponen) * 100);
    const prioritasMerah = pasien.prioritas === 'merah' || kriteriaBahaya.length > 0;

    const ubahVital = (key: VitalKey, value: string) => {
        setVital((previous) => ({ ...previous, [key]: value }));
        setTersimpan(false);
    };

    const simpan: FormEventHandler = (event) => {
        event.preventDefault();
        setDicobaKirim(true);

        if (!lengkap) {
            return;
        }

        setTersimpan(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <PerawatAppLayout
            active="antrean"
            title="Form skrining pasien"
            description="Lengkapi tanda vital dan keluhan sebelum meneruskan permintaan ke dokter umum."
        >
            <Head title={`Skrining ${pasien.nama}`} />

            <Link
                href={route('perawat.permintaan')}
                className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-full text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Kembali ke daftar permintaan
            </Link>

            <section aria-labelledby="ringkasan-pasien" className={cn('relative overflow-hidden rounded-[28px] p-5 md:p-6', bannerGradient)}>
                <div className="pointer-events-none absolute -top-12 -right-8 size-44 rounded-full bg-white/20 blur-2xl" aria-hidden="true" />

                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                        <span className="text-tk-mint grid size-16 shrink-0 place-items-center rounded-[22px] border-4 border-white/15 bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-lg font-extrabold shadow-[0_10px_30px_rgba(4,16,14,0.18)]">
                            {inisial(pasien.nama)}
                        </span>

                        <div className="min-w-0">
                            <p className="text-[9px] font-semibold tracking-[0.18em] text-white/70 uppercase">Skrining pasien</p>
                            <h1 id="ringkasan-pasien" className="mt-1 truncate text-xl font-extrabold tracking-[-0.03em] text-white sm:text-2xl">
                                {pasien.nama}
                            </h1>
                            <p className="mt-1 text-[10px] text-white/80">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · NIK {maskNik(pasien.nik)}
                            </p>
                            <p className="mt-0.5 text-[10px] text-white/65">
                                {pasien.noRm} · {pasien.alamat}
                            </p>

                            <div className="mt-2.5 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-white">
                                    <ClipboardList className="size-3" aria-hidden="true" />
                                    {statusLabel[pasien.status]}
                                </span>
                                {prioritasMerah && (
                                    <span className="text-tk-deep inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-bold">
                                        <AlertTriangle className="text-tk-danger size-3" aria-hidden="true" />
                                        Prioritas merah
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-white">
                                    <UserRound className="size-3" aria-hidden="true" />
                                    {pasien.sumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-sm lg:w-[280px] lg:shrink-0">
                        <p className="text-[9px] font-semibold tracking-[0.12em] text-white/60 uppercase">Konsultasi tujuan</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-white">
                            <Stethoscope className="size-3.5 shrink-0" aria-hidden="true" />
                            {pasien.spesialisasi}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-white/90">{pasien.dokter}</p>
                        <p className="mt-0.5 text-[10px] text-white/70">{pasien.jadwal}</p>
                        <p className="mt-2 border-t border-white/15 pt-2 text-[9px] text-white/60">
                            Masuk {pasien.waktuMasuk} WITA · ID #{konsultasiId}
                        </p>
                    </div>
                </div>
            </section>

            <section aria-label="Tahapan alur konsultasi" className={cn('mt-4 rounded-[22px] p-3', glass)}>
                <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {langkahAlur.map((langkah, index) => {
                        const aktif = index === 1;
                        const selesai = index < 1;

                        return (
                            <li
                                key={langkah.label}
                                className={cn(
                                    'flex items-center gap-2 rounded-2xl px-3 py-2',
                                    aktif ? 'border-tk-accent/40 bg-tk-accent/10 border' : 'bg-[var(--tk-page-alt)]',
                                )}
                                aria-current={aktif ? 'step' : undefined}
                            >
                                <span
                                    className={cn(
                                        'grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                        selesai
                                            ? 'bg-tk-green-500 text-white'
                                            : aktif
                                              ? 'bg-tk-accent text-tk-deep'
                                              : 'bg-[var(--tk-glass-border)] text-[var(--tk-muted)]',
                                    )}
                                >
                                    {selesai ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : index + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-[10px] font-bold">{langkah.label}</p>
                                    <p className="truncate text-[9px] text-[var(--tk-muted)]">{langkah.caption}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </section>

            {tersimpan && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 mt-4 flex items-start gap-3 rounded-[20px] border p-4"
                >
                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.15] dark:bg-tk-accent/[0.15] grid size-9 shrink-0 place-items-center rounded-full">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[12px] font-bold">Skrining lengkap (demo).</p>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            {kriteriaBahaya.length > 0
                                ? 'Tanda bahaya terdeteksi. Segera koordinasikan rujukan dengan dokter umum.'
                                : 'Data tanda vital sudah lengkap. Permintaan siap diteruskan ke dokter umum.'}
                        </p>
                        <Link
                            href={route('perawat.permintaan')}
                            className="text-tk-green-500 dark:text-tk-accent mt-2 inline-flex items-center text-[10px] font-semibold underline underline-offset-2"
                        >
                            Kembali ke daftar permintaan
                        </Link>
                    </div>
                </div>
            )}

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.9fr)]">
                <form onSubmit={simpan} noValidate className="grid min-w-0 content-start gap-5">
                    {pasien.status === 'SKRINING_SELESAI' && (
                        <div className="border-tk-info/30 bg-tk-info/10 flex items-start gap-2 rounded-2xl border p-3.5 text-[10px] leading-relaxed text-[var(--tk-text)]">
                            <Info className="text-tk-info mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <p>Pasien ini sudah memiliki data skrining. Perubahan yang Anda simpan akan menggantikan data sebelumnya.</p>
                        </div>
                    )}

                    <section aria-labelledby="judul-tanda-vital" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-tanda-vital">
                            <SectionHeader
                                icon={HeartPulse}
                                title="Tanda vital"
                                description="Ukur saat pasien duduk tenang. Nilai di luar rentang akan ditolak otomatis."
                            />
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {vitalKeys.map((key) => {
                                const config = vitalConfig[key];
                                const Icon = config.icon;
                                const error = errors[key];
                                const tampilkanError = Boolean(error) && (dicobaKirim || vital[key].trim() !== '');

                                return (
                                    <div key={key} className="grid content-start gap-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <Label htmlFor={`vital-${key}`} className="flex items-center gap-1.5 text-[11px] font-semibold">
                                                <Icon className="text-tk-green-500 dark:text-tk-accent size-3.5" aria-hidden="true" />
                                                {config.label}
                                            </Label>
                                            <span className="text-[9px] text-[var(--tk-muted)]">{config.unit}</span>
                                        </div>

                                        <Input
                                            id={`vital-${key}`}
                                            type="number"
                                            inputMode="decimal"
                                            min={config.min}
                                            max={config.max}
                                            step={config.step}
                                            value={vital[key]}
                                            onChange={(event) => ubahVital(key, event.target.value)}
                                            placeholder={config.placeholder}
                                            aria-invalid={tampilkanError}
                                            aria-describedby={tampilkanError ? `error-${key}` : undefined}
                                            className={cn(inputClass, tampilkanError && 'border-tk-danger focus-visible:ring-tk-danger/40')}
                                        />

                                        <div className="flex min-h-4 items-start justify-between gap-2">
                                            <p className="text-[9px] text-[var(--tk-muted)]">Rentang {config.hint}</p>
                                            {tampilkanError && (
                                                <p id={`error-${key}`} role="alert" className="text-tk-danger text-[9px] font-semibold">
                                                    {error}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section aria-labelledby="judul-keluhan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-keluhan">
                            <SectionHeader
                                icon={MessageSquare}
                                title="Keluhan & catatan"
                                description="Tulis keluhan dengan kata-kata pasien. Perawat dapat memperjelas, pasien hanya membaca."
                            />
                        </div>

                        <div className="mt-5 grid gap-4">
                            <div>
                                <div className="flex items-end justify-between gap-2">
                                    <Label htmlFor="keluhan" className="text-[11px] font-bold">
                                        Keluhan utama <span className="text-tk-danger">*</span>
                                    </Label>
                                    <span className="text-[10px] text-[var(--tk-muted)]">{keluhan.length}/600</span>
                                </div>
                                <textarea
                                    id="keluhan"
                                    rows={4}
                                    maxLength={600}
                                    value={keluhan}
                                    onChange={(event) => {
                                        setKeluhan(event.target.value);
                                        setTersimpan(false);
                                    }}
                                    aria-invalid={Boolean(keluhanError) && dicobaKirim}
                                    aria-describedby={keluhanError && dicobaKirim ? 'keluhan-error' : undefined}
                                    placeholder="Contoh: Demam sejak tiga hari, batuk berdahak, dan sulit tidur."
                                    className={cn(textareaClass, keluhanError && dicobaKirim && 'border-tk-danger focus:ring-tk-danger/30')}
                                />
                                {keluhanError && dicobaKirim && (
                                    <p id="keluhan-error" role="alert" className="text-tk-danger mt-1.5 text-[10px] font-semibold">
                                        {keluhanError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-end justify-between gap-2">
                                    <Label htmlFor="catatan" className="text-[11px] font-bold">
                                        Catatan perawat <span className="font-normal text-[var(--tk-muted)]">(opsional)</span>
                                    </Label>
                                    <span className="text-[10px] text-[var(--tk-muted)]">{catatan.length}/400</span>
                                </div>
                                <textarea
                                    id="catatan"
                                    rows={3}
                                    maxLength={400}
                                    value={catatan}
                                    onChange={(event) => {
                                        setCatatan(event.target.value);
                                        setTersimpan(false);
                                    }}
                                    placeholder="Contoh: Pasien tampak lemas, sudah minum obat penurun panas."
                                    className={textareaClass}
                                />
                                <p className="mt-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                    Catatan ini terlihat oleh dokter umum dan dokter spesialis.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="judul-gerbang" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-gerbang">
                            <SectionHeader
                                icon={ShieldCheck}
                                title="Gerbang ke spesialis"
                                description="Skrining lengkap membuka akses konsultasi dan menjaga keselamatan pasien."
                            />
                        </div>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            <p>
                                Tombol simpan aktif setelah {totalKomponen} komponen wajib lengkap dan valid. Data ini menjadi dasar review dokter
                                umum sebelum diteruskan ke dokter spesialis.
                            </p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <button type="submit" disabled={!lengkap} className={primaryButton}>
                                {lengkap ? <ClipboardCheck className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                                Simpan skrining
                            </button>

                            <Link
                                href={route('perawat.permintaan')}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                Batal
                            </Link>

                            <p className="text-[10px] text-[var(--tk-muted)]" role="status" aria-live="polite">
                                {terisi}/{totalKomponen} komponen lengkap
                            </p>
                        </div>
                    </section>
                </form>

                <aside className="grid content-start gap-5">
                    <section
                        aria-labelledby="status-triase"
                        className={cn('rounded-[24px] p-5', glass, kriteriaBahaya.length > 0 && 'border-tk-danger/45 bg-tk-danger/[0.04]')}
                    >
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'grid size-10 shrink-0 place-items-center rounded-full',
                                    kriteriaBahaya.length > 0
                                        ? 'bg-tk-danger/15 text-tk-danger'
                                        : lengkap
                                          ? 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent'
                                          : 'bg-tk-warning/15 text-tk-warning',
                                )}
                            >
                                {kriteriaBahaya.length > 0 ? (
                                    <AlertTriangle className="size-5" aria-hidden="true" />
                                ) : lengkap ? (
                                    <ShieldCheck className="size-5" aria-hidden="true" />
                                ) : (
                                    <Activity className="size-5" aria-hidden="true" />
                                )}
                            </span>
                            <div>
                                <h2 id="status-triase" className="text-[15px] font-bold">
                                    {kriteriaBahaya.length > 0
                                        ? 'SEGERA RUJUK / GAWAT DARURAT'
                                        : lengkap
                                          ? 'Tidak ada tanda bahaya'
                                          : 'Menunggu data lengkap'}
                                </h2>
                                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    {kriteriaBahaya.length > 0
                                        ? 'Triase otomatis menemukan tanda bahaya. Koordinasikan dengan dokter umum segera.'
                                        : lengkap
                                          ? 'Semua tanda vital dalam rentang aman. Lanjutkan review dokter umum.'
                                          : 'Lengkapi tanda vital dan keluhan untuk menilai triase.'}
                                </p>
                            </div>
                        </div>

                        {kriteriaBahaya.length > 0 && (
                            <ul className="mt-3 grid gap-1.5 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] font-semibold">
                                {kriteriaBahaya.map((kriteria) => (
                                    <li key={kriteria} className="text-tk-danger flex items-start gap-1.5">
                                        <span aria-hidden="true" className="bg-tk-danger mt-1.5 size-1.5 shrink-0 rounded-full" />
                                        {kriteria}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-3 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            Triase otomatis adalah pengingat, bukan pengganti penilaian klinis perawat dan dokter.
                        </p>
                    </section>

                    <section aria-labelledby="kelengkapan-skrining" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="kelengkapan-skrining" className="text-[15px] font-bold">
                                Kelengkapan skrining
                            </h2>
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent rounded-full px-2.5 py-1 text-[10px] font-bold">
                                {persentase}%
                            </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--tk-page-alt)]" aria-hidden="true">
                            <span
                                className="bg-tk-green-500 dark:bg-tk-accent block h-full rounded-full transition-[width]"
                                style={{ width: `${persentase}%` }}
                            />
                        </div>

                        <p className="mt-2 text-[10px] text-[var(--tk-muted)]">
                            {terisi} dari {totalKomponen} komponen wajib terisi.
                        </p>

                        <ul className="mt-3 grid gap-1.5">
                            {vitalKeys.map((key) => {
                                const selesai = !errors[key];

                                return (
                                    <li key={key} className="flex items-center gap-2 text-[10px]">
                                        <span
                                            className={cn(
                                                'grid size-4 shrink-0 place-items-center rounded-full',
                                                selesai
                                                    ? 'bg-tk-green-500/[0.15] text-tk-green-500 dark:bg-tk-accent/[0.15] dark:text-tk-accent'
                                                    : 'bg-tk-danger/10 text-tk-danger',
                                            )}
                                        >
                                            {selesai ? (
                                                <CheckCircle2 className="size-3" aria-hidden="true" />
                                            ) : (
                                                <X className="size-3" aria-hidden="true" />
                                            )}
                                        </span>
                                        <span className={selesai ? '' : 'text-[var(--tk-muted)]'}>{vitalConfig[key].label}</span>
                                    </li>
                                );
                            })}

                            <li className="flex items-center gap-2 text-[10px]">
                                <span
                                    className={cn(
                                        'grid size-4 shrink-0 place-items-center rounded-full',
                                        keluhanError
                                            ? 'bg-tk-danger/10 text-tk-danger'
                                            : 'bg-tk-green-500/[0.15] text-tk-green-500 dark:bg-tk-accent/[0.15] dark:text-tk-accent',
                                    )}
                                >
                                    {keluhanError ? (
                                        <X className="size-3" aria-hidden="true" />
                                    ) : (
                                        <CheckCircle2 className="size-3" aria-hidden="true" />
                                    )}
                                </span>
                                <span className={keluhanError ? 'text-[var(--tk-muted)]' : ''}>Keluhan utama</span>
                            </li>
                        </ul>
                    </section>

                    <section aria-labelledby="panduan-pengisian" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="panduan-pengisian" className="text-[15px] font-bold">
                            Panduan pengisian
                        </h2>

                        <ul className="mt-3 grid gap-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-1.5">
                                <span aria-hidden="true" className="bg-tk-green-500 dark:bg-tk-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                                Ukur tekanan darah setelah pasien duduk tenang minimal lima menit.
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span aria-hidden="true" className="bg-tk-green-500 dark:bg-tk-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                                Ulangi pengukuran bila hasil berada jauh di luar rentang normal.
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span aria-hidden="true" className="bg-tk-green-500 dark:bg-tk-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                                Catat keluhan dengan kata-kata pasien, termasuk lama keluhan dirasakan.
                            </li>
                        </ul>

                        <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Skrining hanya dapat diisi perawat. Pasien melihat hasilnya secara read-only.
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
