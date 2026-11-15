import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    ImagePlus,
    Info,
    MessageSquare,
    Send,
    Stethoscope,
    UserRound,
    Video,
} from 'lucide-react';
import { useRef, type FormEvent } from 'react';

import ConnectionBadge from '@/components/connection-badge';
import InputError from '@/components/input-error';
import { alasanKoneksi, useConnection } from '@/hooks/use-connection';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

type Prioritas = 'merah' | 'kuning' | 'normal';

interface SkriningData {
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

interface PesanItem {
    id: number;
    pengirim: string;
    peran: string;
    isi: string | null;
    lampiranFoto: string | null;
    statusKirim: string;
    waktu: string | null;
}

interface KonsultasiSpesialisProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        jadwal: string | null;
        dokterUmum: string | null;
        prioritas: 'darurat' | 'sedang' | null;
        dikonfirmasiPada: string | null;
    };
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        noRm: string;
        alamat: string;
        telepon: string;
        punyaAkun: boolean;
    };
    skrining: SkriningData | null;
    hasil: {
        icd10Kode: string;
        icd10Nama: string;
        saran: string;
        keputusanRujuk: boolean;
        waktu: string | null;
    } | null;
    pesan: PesanItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-20 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const prioritasMeta: Record<Prioritas, { label: string; tone: string }> = {
    merah: { label: 'Prioritas tinggi', tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
};

const statusLabel: Record<string, string> = {
    MENUNGGU_SPESIALIS: 'Menunggu konfirmasi',
    DIKONFIRMASI: 'Dikonfirmasi',
    BERLANGSUNG: 'Berlangsung',
    SELESAI: 'Selesai',
};

export default function KonsultasiSpesialis({ konsultasi, pasien, skrining, hasil, pesan }: KonsultasiSpesialisProps) {
    const koneksi = useConnection();
    const { flash } = usePage<SharedData>().props;
    const fileRef = useRef<HTMLInputElement>(null);

    const form = useForm<{ isi: string; lampiran_foto: File | null }>({ isi: '', lampiran_foto: null });

    const prioritas = prioritasMeta[skrining?.prioritas ?? (konsultasi.prioritas === 'darurat' ? 'merah' : 'normal')];
    const bisaChat = ['DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'].includes(konsultasi.status);
    const bisaIsiHasil = ['DIKONFIRMASI', 'BERLANGSUNG'].includes(konsultasi.status);

    function kirim(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.data.isi.trim() === '' && form.data.lampiran_foto === null) {
            form.setError('isi', 'Tulis pesan atau lampirkan foto.');

            return;
        }

        form.post(route('spesialis.konsultasi.pesan', konsultasi.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                if (fileRef.current) {
                    fileRef.current.value = '';
                }
            },
        });
    }

    return (
        <SpesialisAppLayout active="permintaan" title={`Konsultasi ${pasien.nama}`} description="Ruang konsultasi jarak jauh dengan puskesmas.">
            <Head title={`Konsultasi ${pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/spesialis/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke permintaan
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <ConnectionBadge status={koneksi.status} />
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                        {statusLabel[konsultasi.status] ?? konsultasi.status}
                    </span>
                    <span className="bg-tk-info/15 text-tk-info inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                        {konsultasi.mode === 'video' ? (
                            <Video className="size-3" aria-hidden="true" />
                        ) : (
                            <MessageSquare className="size-3" aria-hidden="true" />
                        )}
                        Mode {konsultasi.mode}
                    </span>
                </div>
            </div>

            {koneksi.alasan && (
                <div className={cn('mb-4 flex items-start gap-3 rounded-[20px] p-4 text-[11px] font-semibold', bannerGradient, 'text-tk-deep')}>
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{alasanKoneksi[koneksi.status]}</p>
                </div>
            )}

            {flash?.success && (
                <div className="border-tk-green-500/35 bg-tk-green-500/10 mb-4 flex items-start gap-3 rounded-[20px] border p-4">
                    <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">{flash.success}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)} aria-labelledby="identitas-pasien">
                        <div className={cn('p-5 md:p-6', bannerGradient, 'text-tk-deep')}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                    {konsultasi.nomor}
                                </span>
                                <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold', prioritas.tone)}>{prioritas.label}</span>
                            </div>
                            <h1 id="identitas-pasien" className="mt-3 text-2xl leading-tight font-extrabold">
                                {pasien.nama}
                            </h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                            </p>
                            <p className="text-tk-deep/80 mt-3 line-clamp-3 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                        </div>
                        <dl className="grid gap-3 p-5 text-[11px] sm:grid-cols-2 md:p-6">
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter pengirim</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.dokterUmum ?? 'Dokter umum puskesmas'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Slot</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.jadwal ?? 'Belum dijadwalkan'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Lokasi pasien</dt>
                                <dd className="mt-0.5 font-semibold">{pasien.alamat}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Kontak</dt>
                                <dd className="mt-0.5 font-semibold">{pasien.telepon}</dd>
                            </div>
                        </dl>
                    </section>

                    {skrining && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="skrining-pasien">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                        <Activity className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="skrining-pasien" className="text-[15px] font-bold">
                                            Skrining perawat
                                        </h2>
                                        <p className="text-[10px] text-[var(--tk-muted)]">
                                            {skrining.perawat} · {skrining.waktu}
                                        </p>
                                    </div>
                                </div>
                                {skrining.tandaBahaya && (
                                    <span className="bg-tk-danger/15 text-tk-danger inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                        <AlertTriangle className="size-3" aria-hidden="true" />
                                        Tanda bahaya
                                    </span>
                                )}
                            </div>

                            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {[
                                    ['Berat', `${skrining.beratBadan} kg`],
                                    ['Tinggi', `${skrining.tinggiBadan} cm`],
                                    ['TD', `${skrining.sistol}/${skrining.diastol}`],
                                    ['Suhu', `${skrining.suhu} °C`],
                                    ['Nadi', `${skrining.nadi} bpm`],
                                    ['SpO₂', `${skrining.spo2}%`],
                                ].map(([label, nilai]) => (
                                    <div key={label} className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                        <dt className="text-[10px] text-[var(--tk-muted)]">{label}</dt>
                                        <dd className="mt-0.5 text-xs font-bold">{nilai}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p className="mt-3 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[11px] leading-relaxed">
                                {skrining.catatan || 'Tidak ada catatan tambahan.'}
                            </p>
                        </section>
                    )}

                    {hasil && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="hasil-tersimpan">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                    <FileText className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="hasil-tersimpan" className="text-[15px] font-bold">
                                        Hasil konsultasi
                                    </h2>
                                    <p className="text-[10px] text-[var(--tk-muted)]">{hasil.waktu}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs font-bold">
                                <span className="font-mono">{hasil.icd10Kode}</span> · {hasil.icd10Nama}
                            </p>
                            <p className="mt-1 text-[11px] leading-relaxed">{hasil.saran}</p>
                            <p
                                className={cn(
                                    'mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold',
                                    hasil.keputusanRujuk
                                        ? 'bg-tk-warning/15 text-tk-warning'
                                        : 'bg-tk-green-500/[0.12] text-tk-green-500 dark:text-tk-accent',
                                )}
                            >
                                {hasil.keputusanRujuk ? 'Keputusan: rujuk ke RS' : 'Keputusan: tidak perlu rujuk'}
                            </p>
                        </section>
                    )}

                    {bisaChat && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="ruang-chat">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                        <MessageSquare className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="ruang-chat" className="text-[15px] font-bold">
                                            Ruang konsultasi
                                        </h2>
                                        <p className="text-[10px] text-[var(--tk-muted)]">Mode teks · pesan tersimpan di server</p>
                                    </div>
                                </div>
                                {bisaIsiHasil && (
                                    <Link
                                        href={`/spesialis/hasil/${konsultasi.id}`}
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                    >
                                        <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                        Isi hasil
                                    </Link>
                                )}
                            </div>

                            <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                                {pesan.length === 0 && (
                                    <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[11px] text-[var(--tk-muted)]">
                                        Belum ada pesan. Sapa perawat untuk memulai konsultasi.
                                    </p>
                                )}
                                {pesan.map((item) => {
                                    const milikSendiri = item.peran === 'spesialis';

                                    return (
                                        <div key={item.id} className={cn('flex', milikSendiri ? 'justify-end' : 'justify-start')}>
                                            <div
                                                className={cn(
                                                    'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                                                    milikSendiri ? 'bg-tk-green-500/[0.14] dark:bg-tk-accent/[0.16]' : 'bg-[var(--tk-page-alt)]',
                                                )}
                                            >
                                                <p className="text-[10px] font-bold text-[var(--tk-muted)]">{item.pengirim}</p>
                                                {item.isi && <p className="mt-0.5 text-[11px] leading-relaxed whitespace-pre-line">{item.isi}</p>}
                                                {item.lampiranFoto && (
                                                    <p className="text-tk-info mt-1 inline-flex items-center gap-1 text-[10px]">
                                                        <ImagePlus className="size-3" aria-hidden="true" />
                                                        Lampiran foto
                                                    </p>
                                                )}
                                                <p className="mt-1 text-[9px] text-[var(--tk-muted)]">{item.waktu}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {konsultasi.status !== 'SELESAI' && (
                                <form onSubmit={kirim} className="mt-4">
                                    <label htmlFor="pesan-spesialis" className="sr-only">
                                        Pesan untuk perawat
                                    </label>
                                    <textarea
                                        id="pesan-spesialis"
                                        value={form.data.isi}
                                        onChange={(event) => form.setData('isi', event.target.value)}
                                        placeholder="Tulis instruksi, pertanyaan, atau saran…"
                                        className={textareaClass}
                                    />
                                    <InputError message={form.errors.isi} className="text-tk-danger mt-1.5 text-[10px]" />
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                        <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 text-[10px] font-semibold text-[var(--tk-muted)]">
                                            <ImagePlus className="size-3.5" aria-hidden="true" />
                                            Foto
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(event) => form.setData('lampiran_foto', event.target.files?.[0] ?? null)}
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={form.processing}
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold disabled:opacity-50"
                                        >
                                            <Send className="size-3.5" aria-hidden="true" />
                                            Kirim
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>
                    )}
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="pasien-singkat">
                        <h2 id="pasien-singkat" className="text-[15px] font-bold">
                            Pasien
                        </h2>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="bg-tk-info/15 text-tk-info grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-extrabold">
                                <UserRound className="size-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{pasien.nama}</p>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {pasien.usia} tahun · {pasien.noRm}
                                </p>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {pasien.punyaAkun ? 'Punya akun pasien' : 'Tanpa akun, didaftarkan perawat'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="alur-spesialis">
                        <h2 id="alur-spesialis" className="text-[15px] font-bold">
                            Alur konsultasi
                        </h2>
                        <ol className="mt-3 grid gap-2.5">
                            {['Permintaan dikonfirmasi', 'Konsultasi berlangsung', 'Isi diagnosis ICD-10', 'Perawat menindaklanjuti'].map(
                                (langkah, index) => {
                                    const selesai =
                                        (index === 0 && ['DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'].includes(konsultasi.status)) ||
                                        (index === 1 && ['BERLANGSUNG', 'SELESAI'].includes(konsultasi.status)) ||
                                        (index === 2 && hasil !== null) ||
                                        (index === 3 && hasil !== null);

                                    return (
                                        <li key={langkah} className="flex items-center gap-2.5">
                                            <span
                                                className={cn(
                                                    'grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold',
                                                    selesai ? 'bg-tk-accent text-tk-deep' : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                                )}
                                            >
                                                {selesai ? '✓' : index + 1}
                                            </span>
                                            <span className={cn('text-[11px]', selesai ? 'font-bold' : 'text-[var(--tk-muted)]')}>{langkah}</span>
                                        </li>
                                    );
                                },
                            )}
                        </ol>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-2.5">
                            <Stethoscope className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Diagnosis wajib memakai kode ICD-10 dan keputusan rujuk wajib diisi sebelum konsultasi ditutup.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
