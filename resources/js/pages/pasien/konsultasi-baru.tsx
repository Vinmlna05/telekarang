import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    Info,
    MapPin,
    Send,
    ShieldCheck,
    Stethoscope,
    UserRound,
    Wifi,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { jadwalDokter, spesialisasiFilters, type Spesialisasi, type StatusJadwal } from '@/data/jadwal-dokter';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface KonsultasiBaruProps {
    dokterAwal: number | null;
    jadwalAwal: string;
}

type FormErrors = Partial<Record<'dokter' | 'slot' | 'keluhan' | 'persetujuan', string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const nomorPermintaan = 'KNS-2026-0142';

const statusMeta: Record<StatusJadwal, { label: string; tone: string }> = {
    tersedia: {
        label: 'Tersedia',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    terisi: {
        label: 'Slot penuh',
        tone: 'bg-tk-warning/15 text-tk-warning',
    },
    libur: {
        label: 'Libur',
        tone: 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
    },
};

const durasiKeluhan = ['Kurang dari 1 hari', '1–3 hari', '4–7 hari', 'Lebih dari 1 minggu'];

const langkahSetelahKirim = [
    'Datang ke Puskesmas Pulau Karang untuk skrining perawat.',
    'Dokter umum mereview hasil skrining sebelum diteruskan.',
    'Dokter spesialis mengonfirmasi jadwal dan mode konsultasi.',
    'Hasil, saran, dan keputusan rujukan muncul di riwayat konsultasi.',
];

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

function StepHeading({ step, title, description }: { step: number; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full text-xs font-extrabold">
                {step}
            </span>
            <div>
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
            </div>
        </div>
    );
}

export default function KonsultasiBaru({ dokterAwal, jadwalAwal }: KonsultasiBaruProps) {
    const { auth } = usePage<SharedData>().props;
    const dokterAwalData = jadwalDokter.find((dokter) => dokter.id === dokterAwal && dokter.status === 'tersedia' && dokter.slots.length > 0) ?? null;

    const [filterSpesialisasi, setFilterSpesialisasi] = useState<Spesialisasi | 'Semua'>('Semua');
    const [dokterId, setDokterId] = useState<number | null>(dokterAwalData?.id ?? null);
    const [slot, setSlot] = useState(() => {
        if (!dokterAwalData) {
            return '';
        }

        return dokterAwalData.slots.includes(jadwalAwal) ? jadwalAwal : dokterAwalData.slots[0];
    });
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState(durasiKeluhan[1]);
    const [setuju, setSetuju] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [berhasil, setBerhasil] = useState(false);

    const dokterTerpilih = dokterId ? (jadwalDokter.find((dokter) => dokter.id === dokterId) ?? null) : null;
    const dokterTersaring =
        filterSpesialisasi === 'Semua' ? jadwalDokter : jadwalDokter.filter((dokter) => dokter.spesialisasi === filterSpesialisasi);
    const jumlahDokterTersedia = dokterTersaring.filter((dokter) => dokter.status === 'tersedia').length;
    const namaPasien = auth.user.name;

    useEffect(() => {
        if (berhasil) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [berhasil]);

    function pilihSpesialisasi(item: Spesialisasi | 'Semua') {
        setFilterSpesialisasi(item);

        if (item !== 'Semua' && dokterTerpilih && dokterTerpilih.spesialisasi !== item) {
            setDokterId(null);
            setSlot('');
            setErrors((previous) => ({ ...previous, dokter: undefined, slot: undefined }));
        }
    }

    function pilihDokter(id: number) {
        const dokter = jadwalDokter.find((item) => item.id === id);

        if (!dokter || dokter.status !== 'tersedia' || dokter.slots.length === 0) {
            return;
        }

        setDokterId(dokter.id);
        setSlot(dokter.slots[0]);
        setErrors((previous) => ({ ...previous, dokter: undefined, slot: undefined }));
    }

    function kirimPermintaan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (!dokterTerpilih) {
            nextErrors.dokter = 'Pilih dokter spesialis terlebih dahulu.';
        } else if (!slot) {
            nextErrors.slot = 'Pilih salah satu slot jadwal yang tersedia.';
        }

        if (keluhan.trim().length < 10) {
            nextErrors.keluhan = 'Ceritakan keluhan minimal 10 karakter agar perawat dapat menyiapkan skrining.';
        }

        if (!setuju) {
            nextErrors.persetujuan = 'Centang persetujuan sebelum mengirim permintaan.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setBerhasil(true);
    }

    function buatPermintaanLagi() {
        setBerhasil(false);
        setFilterSpesialisasi('Semua');
        setDokterId(null);
        setSlot('');
        setKeluhan('');
        setDurasi(durasiKeluhan[1]);
        setSetuju(false);
        setErrors({});
    }

    if (berhasil && dokterTerpilih && slot) {
        return (
            <PasienAppLayout
                active="beranda"
                title="Permintaan terkirim"
                description="Permintaan konsultasi Anda sudah masuk antrean skrining perawat."
            >
                <Head title="Permintaan terkirim" />

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
                                <p className="text-tk-deep/70 mt-4 text-[10px] font-bold tracking-[0.16em] uppercase">Permintaan diterima</p>
                                <h1 className="text-tk-deep mt-1 text-2xl leading-tight font-extrabold">Permintaan konsultasi terkirim</h1>
                                <p className="text-tk-deep/75 mx-auto mt-2 max-w-md text-xs leading-relaxed">
                                    Nomor permintaan <span className="font-bold">{nomorPermintaan}</span>. Perawat akan melakukan skrining saat Anda
                                    datang ke puskesmas.
                                </p>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-[var(--tk-muted)]">Status permintaan</p>
                                <span className="bg-tk-warning/15 text-tk-warning inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                    <Clock className="size-3" aria-hidden="true" />
                                    Menunggu skrining
                                </span>
                            </div>

                            <dl className="mt-4 grid gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4 text-xs sm:grid-cols-2">
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter spesialis</dt>
                                    <dd className="mt-1 font-bold">{dokterTerpilih.nama}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">Spesialis {dokterTerpilih.spesialisasi}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Jadwal dipilih</dt>
                                    <dd className="mt-1 font-bold">
                                        {dokterTerpilih.hariTerdekat}, {slot} WIT
                                    </dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">{dokterTerpilih.faskes}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keluhan</dt>
                                    <dd className="mt-1 leading-relaxed">{keluhan.trim()}</dd>
                                </div>
                            </dl>

                            <div className="mt-5">
                                <h2 className="text-[13px] font-bold">Yang terjadi selanjutnya</h2>
                                <ol className="mt-3 grid gap-3">
                                    {langkahSetelahKirim.map((langkah, index) => (
                                        <li key={langkah} className="flex items-start gap-3">
                                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[10px] font-bold text-[var(--tk-muted)]">
                                                {index + 1}
                                            </span>
                                            <p className="pt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">{langkah}</p>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <p className="mt-5 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Permintaan ini tercatat sebagai data demo pada prototipe TeleKarang dan belum terhubung ke fasilitas kesehatan nyata.
                            </p>

                            <div className="mt-5 grid gap-2 sm:flex">
                                <Link
                                    href="/pasien"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    Kembali ke beranda
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={buatPermintaanLagi}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Buat permintaan lain
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </PasienAppLayout>
        );
    }

    return (
        <PasienAppLayout
            active="jadwal"
            title="Buat permintaan konsultasi"
            description="Pilih dokter spesialis, jadwal, dan ceritakan keluhan Anda. Perawat akan menyiapkan skrining saat Anda datang."
        >
            <Head title="Buat permintaan konsultasi" />

            <div className="mb-4">
                <Link
                    href="/pasien/jadwal"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke jadwal dokter
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <form id="form-permintaan" onSubmit={kirimPermintaan} noValidate className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="langkah-dokter" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={1}
                            title="Pilih dokter spesialis"
                            description="Pilih spesialisasi yang sesuai, lalu pilih dokter dengan slot tersedia."
                        />

                        <div className="mt-5">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Spesialisasi</p>
                            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {spesialisasiFilters.map((item) => {
                                    const isActive = filterSpesialisasi === item;

                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() => pilihSpesialisasi(item)}
                                            className={cn(
                                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                                isActive
                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                            )}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <fieldset className="mt-4">
                            <legend className="sr-only">Pilih dokter spesialis</legend>
                            <div className="flex flex-wrap items-end justify-between gap-1">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Dokter tersedia</p>
                                <span aria-live="polite" className="text-[10px] text-[var(--tk-muted)]">
                                    {jumlahDokterTersedia} dokter siap menerima konsultasi
                                </span>
                            </div>

                            <div className="mt-2 grid gap-3 md:grid-cols-2">
                                {dokterTersaring.map((dokter) => {
                                    const tersedia = dokter.status === 'tersedia' && dokter.slots.length > 0;
                                    const terpilih = dokter.id === dokterId;
                                    const status = statusMeta[dokter.status];

                                    return (
                                        <button
                                            key={dokter.id}
                                            type="button"
                                            disabled={!tersedia}
                                            aria-pressed={terpilih}
                                            onClick={() => pilihDokter(dokter.id)}
                                            className={cn(
                                                'rounded-[20px] border p-4 text-left transition-all',
                                                terpilih
                                                    ? 'border-tk-accent bg-tk-accent/[0.08] ring-tk-accent/30 ring-2'
                                                    : 'hover:border-tk-accent/50 border-[var(--tk-glass-border)]',
                                                !tersedia && 'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="text-tk-mint grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[11px] font-extrabold">
                                                    {inisial(dokter.nama, true)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start gap-2">
                                                        <p className="min-w-0 flex-1 text-[13px] leading-snug font-bold">{dokter.nama}</p>
                                                        {terpilih && (
                                                            <CheckCircle2
                                                                className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </div>
                                                    <p className="text-tk-green-500 dark:text-tk-accent mt-0.5 text-[10px] font-semibold">
                                                        Spesialis {dokter.spesialisasi}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-1 text-[10px] text-[var(--tk-muted)]">
                                                <p className="flex items-center gap-1.5">
                                                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                                    {dokter.faskes}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <CalendarDays className="size-3 shrink-0" aria-hidden="true" />
                                                    {dokter.hari.join(' & ')} · {dokter.jam}
                                                </p>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--tk-glass-border)] pt-2.5">
                                                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', status.tone)}>
                                                    {status.label}
                                                </span>
                                                <span className="text-[10px] font-semibold text-[var(--tk-muted)]">
                                                    {tersedia ? `Slot ${dokter.slotTerdekat}` : 'Tidak tersedia'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <InputError message={errors.dokter} className="text-tk-danger mt-3 text-[11px]" />
                    </section>

                    <section aria-labelledby="langkah-jadwal" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={2}
                            title="Pilih jadwal"
                            description="Slot di bawah mengikuti jadwal praktik terdekat dokter yang dipilih."
                        />

                        <div className="mt-5">
                            {dokterTerpilih ? (
                                <>
                                    <div className="flex items-center gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                        <span className="text-tk-mint grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[11px] font-extrabold">
                                            {inisial(dokterTerpilih.nama, true)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold">{dokterTerpilih.nama}</p>
                                            <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                {dokterTerpilih.hariTerdekat} · {dokterTerpilih.jam}
                                            </p>
                                        </div>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--tk-glass)] px-2.5 py-1 text-[9px] font-bold text-[var(--tk-muted)]">
                                            <Clock className="size-3" aria-hidden="true" />
                                            WIT
                                        </span>
                                    </div>

                                    <fieldset className="mt-4">
                                        <legend className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                            Slot tersedia
                                        </legend>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {dokterTerpilih.slots.map((item) => {
                                                const isActive = slot === item;

                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        aria-pressed={isActive}
                                                        onClick={() => {
                                                            setSlot(item);
                                                            setErrors((previous) => ({ ...previous, slot: undefined }));
                                                        }}
                                                        className={cn(
                                                            'min-h-11 rounded-full border px-4 text-xs font-bold transition-colors',
                                                            isActive
                                                                ? 'bg-tk-accent text-tk-deep border-transparent'
                                                                : 'hover:border-tk-accent/60 border-[var(--tk-glass-border)] text-[var(--tk-text)]',
                                                        )}
                                                    >
                                                        {item}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </fieldset>

                                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                        Jadwal final akan dikonfirmasi dokter spesialis. Jika berubah, Anda akan menerima notifikasi.
                                    </div>

                                    <InputError message={errors.slot} className="text-tk-danger mt-3 text-[11px]" />
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-[var(--tk-glass-border)] px-5 py-8 text-center">
                                    <span className="grid size-11 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                        <CalendarDays className="size-5" aria-hidden="true" />
                                    </span>
                                    <p className="mt-3 text-xs font-bold">Pilih dokter terlebih dahulu</p>
                                    <p className="mx-auto mt-1 max-w-xs text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Slot jadwal akan muncul setelah Anda memilih dokter spesialis di langkah 1.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section aria-labelledby="langkah-keluhan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={3}
                            title="Ceritakan keluhan"
                            description="Tulis keluhan utama dan berapa lama sudah dirasakan. Perawat akan memeriksa tanda vital saat skrining."
                        />

                        <div className="mt-5 grid gap-4">
                            <div>
                                <div className="flex items-end justify-between gap-2">
                                    <label htmlFor="keluhan" className="text-[11px] font-bold">
                                        Keluhan utama <span className="text-tk-danger">*</span>
                                    </label>
                                    <span className="text-[10px] text-[var(--tk-muted)]">{keluhan.length}/600</span>
                                </div>
                                <textarea
                                    id="keluhan"
                                    rows={5}
                                    maxLength={600}
                                    value={keluhan}
                                    onChange={(event) => {
                                        setKeluhan(event.target.value);
                                        setErrors((previous) => ({ ...previous, keluhan: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.keluhan)}
                                    aria-describedby={errors.keluhan ? 'keluhan-error' : undefined}
                                    placeholder="Contoh: Demam sejak tiga hari, batuk berdahak, dan sulit tidur."
                                    className={cn(
                                        'focus-visible:ring-tk-accent focus:border-tk-green-500 focus:ring-tk-accent/30 mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden',
                                        errors.keluhan && 'border-tk-danger focus:ring-tk-danger/30',
                                    )}
                                />
                                <InputError id="keluhan-error" message={errors.keluhan} className="text-tk-danger mt-2 text-[11px]" />
                            </div>

                            <div>
                                <p className="text-[11px] font-bold">Sudah berapa lama?</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {durasiKeluhan.map((item) => {
                                        const isActive = durasi === item;

                                        return (
                                            <button
                                                key={item}
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => setDurasi(item)}
                                                className={cn(
                                                    'min-h-9 rounded-full border px-3.5 text-[10px] font-semibold transition-colors',
                                                    isActive
                                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                                )}
                                            >
                                                {item}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <ShieldCheck className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                Keluhan dan hasil skrining hanya dapat dibaca oleh pasien, perawat, dokter umum, dan dokter spesialis yang menangani.
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="langkah-konfirmasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={4}
                            title="Konfirmasi dan kirim"
                            description="Periksa kembali pilihan Anda. Permintaan akan masuk antrean skrining perawat."
                        />

                        <div className="mt-5">
                            <div className="flex items-start gap-3 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <Checkbox
                                    id="persetujuan"
                                    checked={setuju}
                                    onCheckedChange={(checked) => {
                                        setSetuju(checked === true);
                                        setErrors((previous) => ({ ...previous, persetujuan: undefined }));
                                    }}
                                    aria-invalid={Boolean(errors.persetujuan)}
                                    className="data-[state=checked]:border-tk-green-500 data-[state=checked]:bg-tk-green-500 border-[var(--tk-glass-border)] data-[state=checked]:text-white"
                                />
                                <label htmlFor="persetujuan" className="text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Saya setuju data keluhan dan hasil skrining dibagikan kepada dokter umum dan dokter spesialis yang menangani
                                    permintaan ini.
                                </label>
                            </div>

                            <InputError message={errors.persetujuan} className="text-tk-danger mt-2 text-[11px]" />

                            <div className="mt-4 grid gap-2 sm:flex sm:items-center">
                                <button
                                    type="submit"
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors"
                                >
                                    <Send className="size-4" aria-hidden="true" />
                                    Kirim permintaan konsultasi
                                </button>
                                <Link
                                    href="/pasien/jadwal"
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                Setelah dikirim, status permintaan menjadi “Menunggu skrining”. Datang ke puskesmas untuk menyelesaikan skrining.
                            </p>
                        </div>
                    </section>
                </form>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="ringkasan-permintaan" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="ringkasan-permintaan" className="text-[15px] font-bold">
                                Ringkasan permintaan
                            </h2>
                            <span className="bg-tk-warning/15 text-tk-warning rounded-full px-2.5 py-1 text-[9px] font-bold">Draf</span>
                        </div>

                        <div className="mt-4 flex items-center gap-3 border-b border-[var(--tk-glass-border)] pb-4">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-extrabold">
                                {inisial(namaPasien)}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold">{namaPasien}</p>
                                <p className="truncate text-[10px] text-[var(--tk-muted)]">{auth.user.email}</p>
                            </div>
                        </div>

                        <dl className="mt-4 grid gap-3 text-xs">
                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <Stethoscope className="size-3" aria-hidden="true" />
                                    Dokter spesialis
                                </dt>
                                <dd className="mt-1 font-bold">{dokterTerpilih ? dokterTerpilih.nama : 'Belum dipilih'}</dd>
                                {dokterTerpilih && <dd className="text-[10px] text-[var(--tk-muted)]">Spesialis {dokterTerpilih.spesialisasi}</dd>}
                            </div>

                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <CalendarDays className="size-3" aria-hidden="true" />
                                    Jadwal
                                </dt>
                                <dd className="mt-1 font-bold">
                                    {dokterTerpilih && slot ? `${dokterTerpilih.hariTerdekat}, ${slot} WIT` : 'Belum dipilih'}
                                </dd>
                            </div>

                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <Clock className="size-3" aria-hidden="true" />
                                    Durasi keluhan
                                </dt>
                                <dd className="mt-1 font-bold">{durasi}</dd>
                            </div>

                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <UserRound className="size-3" aria-hidden="true" />
                                    Keluhan
                                </dt>
                                <dd className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    {keluhan.trim() || 'Belum diisi'}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Wifi className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            Mode konsultasi ditentukan otomatis saat sesi dimulai. Jika sinyal lemah, konsultasi beralih ke teks dan foto.
                        </div>
                    </section>

                    <section aria-labelledby="setelah-dikirim" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="setelah-dikirim" className="text-[15px] font-bold">
                            Setelah dikirim
                        </h2>
                        <ol className="mt-4 grid gap-3">
                            {langkahSetelahKirim.map((langkah, index) => (
                                <li key={langkah} className="flex items-start gap-3">
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[10px] font-bold text-[var(--tk-muted)]">
                                        {index + 1}
                                    </span>
                                    <p className="pt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{langkah}</p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section aria-label="Bantuan skrining" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Tidak bisa datang hari ini?</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hubungi perawat puskesmas. Permintaan yang tidak diskrining dalam 3 hari akan kedaluwarsa dan slot dilepas.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
