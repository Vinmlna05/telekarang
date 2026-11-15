import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock, Info, Send, ShieldCheck, Stethoscope, UserRound, Wifi } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';

interface TanggalSkrining {
    value: string;
    label: string;
    singkat: string;
}

interface KonsultasiBaruProps {
    tanggalTersedia: TanggalSkrining[];
    tanggalAwal: string | null;
}

type FormErrors = Partial<Record<'tanggal_skrining' | 'keluhan' | 'persetujuan', string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const durasiKeluhan = ['Kurang dari 1 hari', '1–3 hari', '4–7 hari', 'Lebih dari 1 minggu'];

const langkahSetelahKirim = [
    'Datang ke Puskesmas Pulau Karang pada tanggal skrining yang dipilih.',
    'Perawat mengisi tanda vital dan keluhan Anda.',
    'Dokter umum memutuskan penanganan: konsultasi spesialis, rujuk, atau tangani di puskesmas.',
    'Bila perlu spesialis, perawat memilih dokter dan slot jadwal untuk Anda.',
];

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

export default function KonsultasiBaru({ tanggalTersedia, tanggalAwal }: KonsultasiBaruProps) {
    const [tanggal, setTanggal] = useState<string | null>(
        tanggalAwal && tanggalTersedia.some((item) => item.value === tanggalAwal) ? tanggalAwal : null,
    );
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState(durasiKeluhan[1]);
    const [setuju, setSetuju] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [mengirim, setMengirim] = useState(false);

    const tanggalTerpilih = tanggal ? (tanggalTersedia.find((item) => item.value === tanggal) ?? null) : null;

    function kirimPermintaan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextErrors: FormErrors = {};

        if (!tanggalTerpilih) {
            nextErrors.tanggal_skrining = 'Pilih tanggal skrining terlebih dahulu.';
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

        setMengirim(true);
        router.post(
            route('pasien.konsultasi.store'),
            {
                tanggal_skrining: tanggal,
                keluhan: keluhan.trim(),
                durasi,
                persetujuan: setuju,
            },
            {
                preserveScroll: true,
                onError: (serverErrors) =>
                    setErrors((previous) => ({
                        ...previous,
                        ...(serverErrors.tanggal_skrining ? { tanggal_skrining: serverErrors.tanggal_skrining } : {}),
                        ...(serverErrors.keluhan ? { keluhan: serverErrors.keluhan } : {}),
                        ...(serverErrors.persetujuan ? { persetujuan: serverErrors.persetujuan } : {}),
                    })),
                onFinish: () => setMengirim(false),
            },
        );
    }

    return (
        <PasienAppLayout
            active="konsultasi"
            title="Buat permintaan konsultasi"
            description="Pilih tanggal skrining dan ceritakan keluhan Anda. Dokter umum akan memutuskan penanganan setelah skrining."
        >
            <Head title="Buat permintaan konsultasi" />

            <div className="mb-4">
                <Link
                    href="/pasien"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke beranda
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <form id="form-permintaan" onSubmit={kirimPermintaan} noValidate className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="langkah-tanggal" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={1}
                            title="Pilih tanggal skrining"
                            description="Anda akan datang ke Puskesmas Pulau Karang pada tanggal ini untuk diperiksa perawat."
                        />

                        <div className="mt-5">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Tanggal tersedia</p>
                            <p className="mt-1 text-[10px] text-[var(--tk-muted)]">Hanya hari kerja (Senin–Jumat) dalam 14 hari ke depan.</p>

                            {tanggalTersedia.length === 0 ? (
                                <p className="mt-3 rounded-2xl border border-dashed border-[var(--tk-glass-border)] px-4 py-6 text-center text-[11px] text-[var(--tk-muted)]">
                                    Belum ada tanggal skrining tersedia. Hubungi perawat puskesmas.
                                </p>
                            ) : (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tanggalTersedia.map((item) => {
                                        const isActive = tanggal === item.value;

                                        return (
                                            <button
                                                key={item.value}
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() => {
                                                    setTanggal(item.value);
                                                    setErrors((previous) => ({ ...previous, tanggal_skrining: undefined }));
                                                }}
                                                className={cn(
                                                    'min-h-11 min-w-20 rounded-2xl border px-3 py-2 text-left text-[11px] font-semibold transition-colors',
                                                    isActive
                                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                                        : 'hover:border-tk-accent/60 border-[var(--tk-glass-border)] text-[var(--tk-text)]',
                                                )}
                                            >
                                                <span className="block text-[9px] font-bold tracking-[0.08em] uppercase">{item.singkat}</span>
                                                <span className="mt-0.5 block text-[10px] leading-snug">{item.label.split(', ')[0]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <InputError message={errors.tanggal_skrining} className="text-tk-danger mt-3 text-[11px]" />
                        </div>
                    </section>

                    <section aria-labelledby="langkah-keluhan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <StepHeading
                            step={2}
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
                            step={3}
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
                                    disabled={mengirim}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors disabled:pointer-events-none disabled:opacity-60"
                                >
                                    <Send className="size-4" aria-hidden="true" />
                                    {mengirim ? 'Mengirim permintaan...' : 'Kirim permintaan konsultasi'}
                                </button>
                                <Link
                                    href="/pasien"
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                Setelah dikirim, status permintaan menjadi “Menunggu skrining”. Datang ke puskesmas pada tanggal yang dipilih.
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

                        <dl className="mt-4 grid gap-3 text-xs">
                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <CalendarDays className="size-3" aria-hidden="true" />
                                    Tanggal skrining
                                </dt>
                                <dd className="mt-1 font-bold">{tanggalTerpilih ? tanggalTerpilih.label : 'Belum dipilih'}</dd>
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

                            <div>
                                <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                    <Stethoscope className="size-3" aria-hidden="true" />
                                    Dokter spesialis
                                </dt>
                                <dd className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Ditentukan perawat setelah dokter umum memutuskan konsultasi spesialis.
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
                            <p className="text-[11px] font-bold">Tidak bisa datang pada tanggal itu?</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hubungi perawat puskesmas. Permintaan yang tidak diskrining dalam 3 hari setelah tanggal skrining akan kedaluwarsa.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
