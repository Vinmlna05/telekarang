import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, ClipboardCheck, FileText, Search, Ship, Stethoscope } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

type Prioritas = 'merah' | 'kuning' | 'normal';

interface Icd10Item {
    kode: string;
    nama: string;
}

interface HasilSpesialisProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        jadwal: string | null;
        dokterUmum: string | null;
        prioritas: 'darurat' | 'sedang' | null;
    };
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        noRm: string;
    };
    skrining: {
        sistol: number;
        diastol: number;
        suhu: number;
        nadi: number;
        spo2: number;
        prioritas: Prioritas;
        catatan: string;
        waktu: string | null;
    } | null;
    hasil: {
        icd10Kode: string;
        icd10Nama: string | null;
        saran: string;
        keputusanRujuk: boolean;
        alasanRujuk: string | null;
        biayaRujukan: number | null;
        waktu: string | null;
    } | null;
    daftarIcd10: Icd10Item[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

function rupiah(nilai: number): string {
    return 'Rp '.concat(nilai.toLocaleString('id-ID', { maximumFractionDigits: 0 }));
}

export default function HasilSpesialis({ konsultasi, pasien, skrining, hasil, daftarIcd10 }: HasilSpesialisProps) {
    const { flash } = usePage<SharedData>().props;
    const [cari, setCari] = useState('');
    const [kodeDipilih, setKodeDipilih] = useState<string>(hasil?.icd10Kode ?? '');

    const form = useForm({
        icd10_kode: hasil?.icd10Kode ?? '',
        saran: hasil?.saran ?? '',
        keputusan_rujuk: hasil?.keputusanRujuk ?? false,
        alasan_rujuk: hasil?.alasanRujuk ?? '',
        biaya_rujukan: hasil?.biayaRujukan !== null && hasil?.biayaRujukan !== undefined ? String(hasil.biayaRujukan) : '',
    });

    const hasilCari = useMemo(() => {
        const kata = cari.trim().toLowerCase();

        if (kata === '') {
            return daftarIcd10.slice(0, 8);
        }

        return daftarIcd10.filter((item) => item.kode.toLowerCase().includes(kata) || item.nama.toLowerCase().includes(kata)).slice(0, 12);
    }, [cari, daftarIcd10]);

    const terpilih = daftarIcd10.find((item) => item.kode === kodeDipilih) ?? null;

    function simpan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!kodeDipilih) {
            form.setError('icd10_kode', 'Pilih diagnosis ICD-10 terlebih dahulu.');

            return;
        }

        form.transform((data) => ({
            ...data,
            icd10_kode: kodeDipilih,
            biaya_rujukan: data.keputusan_rujuk && data.biaya_rujukan !== '' ? data.biaya_rujukan : null,
            alasan_rujuk: data.keputusan_rujuk ? data.alasan_rujuk : null,
        }));
        form.post(route('spesialis.hasil.store', konsultasi.id), { preserveScroll: true });
    }

    return (
        <SpesialisAppLayout
            active="permintaan"
            title={`Hasil konsultasi ${pasien.nama}`}
            description="Isi diagnosis ICD-10, saran, dan keputusan rujuk."
        >
            <Head title={`Hasil konsultasi ${pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={`/spesialis/konsultasi/${konsultasi.id}`}
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke ruang konsultasi
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                    {konsultasi.nomor}
                </span>
            </div>

            {flash?.success && (
                <div className="border-tk-green-500/35 bg-tk-green-500/10 mb-4 flex items-start gap-3 rounded-[20px] border p-4">
                    <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="text-xs leading-relaxed">{flash.success}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)} aria-labelledby="ringkasan-pasien">
                        <div className={cn('p-5 md:p-6', bannerGradient, 'text-tk-deep')}>
                            <h1 id="ringkasan-pasien" className="text-2xl leading-tight font-extrabold">
                                {pasien.nama}
                            </h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                            </p>
                            <p className="text-tk-deep/80 mt-3 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                        </div>
                        <div className="grid gap-2 p-5 text-[11px] sm:grid-cols-2 md:p-6">
                            <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                <p className="text-[10px] text-[var(--tk-muted)]">Dokter pengirim</p>
                                <p className="font-semibold">{konsultasi.dokterUmum ?? 'Dokter umum puskesmas'}</p>
                            </div>
                            <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                <p className="text-[10px] text-[var(--tk-muted)]">Slot</p>
                                <p className="font-semibold">{konsultasi.jadwal ?? '-'}</p>
                            </div>
                            {skrining && (
                                <>
                                    <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                        <p className="text-[10px] text-[var(--tk-muted)]">Tanda vital</p>
                                        <p className="font-semibold">
                                            TD {skrining.sistol}/{skrining.diastol} · {skrining.suhu} °C · {skrining.nadi} bpm · SpO₂ {skrining.spo2}%
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                        <p className="text-[10px] text-[var(--tk-muted)]">Catatan perawat</p>
                                        <p className="font-semibold">{skrining.catatan || '-'}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {hasil ? (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="hasil-tersimpan">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                    <FileText className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="hasil-tersimpan" className="text-[15px] font-bold">
                                        Hasil sudah tersimpan
                                    </h2>
                                    <p className="text-[10px] text-[var(--tk-muted)]">{hasil.waktu}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs font-bold">
                                <span className="font-mono">{hasil.icd10Kode}</span> · {hasil.icd10Nama ?? 'Tanpa diagnosis'}
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
                                {hasil.keputusanRujuk ? 'Rujuk ke RS' : 'Tidak perlu rujuk'}
                            </p>
                            {hasil.keputusanRujuk && hasil.alasanRujuk && (
                                <p className="bg-tk-warning/10 mt-3 rounded-2xl p-3.5 text-[11px] leading-relaxed">{hasil.alasanRujuk}</p>
                            )}
                            {hasil.keputusanRujuk && hasil.biayaRujukan !== null && (
                                <p className="text-tk-warning mt-2 text-[11px] font-semibold">Estimasi biaya rujukan: {rupiah(hasil.biayaRujukan)}</p>
                            )}
                            <Link
                                href="/spesialis/permintaan"
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
                            >
                                Kembali ke daftar permintaan
                                <ChevronRight className="size-3.5" aria-hidden="true" />
                            </Link>
                        </section>
                    ) : (
                        <form onSubmit={simpan} noValidate className="grid gap-5">
                            <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="diagnosis-icd10">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                        <Stethoscope className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="diagnosis-icd10" className="text-[15px] font-bold">
                                            Diagnosis ICD-10
                                        </h2>
                                        <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">Wajib dipilih dari daftar ICD-10.</p>
                                    </div>
                                </div>

                                {terpilih ? (
                                    <div className="bg-tk-green-500/[0.10] mt-4 flex items-start justify-between gap-3 rounded-2xl p-4">
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Terpilih</p>
                                            <p className="mt-0.5 text-xs font-bold">
                                                <span className="font-mono">{terpilih.kode}</span> · {terpilih.nama}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setKodeDipilih('');
                                                form.setData('icd10_kode', '');
                                            }}
                                            className="text-tk-danger shrink-0 text-[10px] font-semibold"
                                        >
                                            Ganti
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative mt-4">
                                            <Search
                                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                value={cari}
                                                onChange={(event) => setCari(event.target.value)}
                                                placeholder="Cari kode atau nama diagnosis…"
                                                className={inputClass}
                                                aria-label="Cari diagnosis ICD-10"
                                            />
                                        </div>
                                        <div className="mt-2 grid max-h-64 gap-1.5 overflow-y-auto">
                                            {hasilCari.map((item) => (
                                                <button
                                                    key={item.kode}
                                                    type="button"
                                                    onClick={() => {
                                                        setKodeDipilih(item.kode);
                                                        form.setData('icd10_kode', item.kode);
                                                    }}
                                                    className="rounded-xl border border-[var(--tk-glass-border)] px-3 py-2 text-left text-[11px] transition-colors hover:bg-[var(--tk-page-alt)]"
                                                >
                                                    <span className="font-mono font-bold">{item.kode}</span> · {item.nama}
                                                </button>
                                            ))}
                                            {hasilCari.length === 0 && (
                                                <p className="py-4 text-center text-[11px] text-[var(--tk-muted)]">Diagnosis tidak ditemukan.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                                <InputError message={form.errors.icd10_kode} className="text-tk-danger mt-2 text-[10px]" />
                            </section>

                            <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="saran-dan-rujukan">
                                <h2 id="saran-dan-rujukan" className="text-[15px] font-bold">
                                    Saran dan keputusan
                                </h2>

                                <div className="mt-3">
                                    <label htmlFor="saran" className="text-[11px] font-bold">
                                        Saran untuk pasien dan perawat <span className="text-tk-danger">*</span>
                                    </label>
                                    <textarea
                                        id="saran"
                                        value={form.data.saran}
                                        onChange={(event) => form.setData('saran', event.target.value)}
                                        placeholder="Contoh: berikan parasetamol 3×500 mg, hidrasi adekuat, kontrol 3 hari atau lebih cepat bila memburuk."
                                        className={textareaClass}
                                    />
                                    <InputError message={form.errors.saran} className="text-tk-danger mt-1.5 text-[10px]" />
                                </div>

                                <div className="mt-4">
                                    <p className="text-[11px] font-bold">
                                        Keputusan rujuk <span className="text-tk-danger">*</span>
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => form.setData('keputusan_rujuk', false)}
                                            className={cn(
                                                'rounded-2xl border p-4 text-left transition-colors',
                                                !form.data.keputusan_rujuk
                                                    ? 'border-tk-green-500/60 bg-tk-green-500/[0.10] ring-tk-green-500/30 ring-2'
                                                    : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                            )}
                                        >
                                            <span className="bg-tk-green-500/[0.15] text-tk-green-500 dark:text-tk-accent inline-flex size-8 items-center justify-center rounded-full">
                                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                            </span>
                                            <p className="mt-2 text-xs font-bold">Tidak perlu rujuk</p>
                                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Tangani di puskesmas, dihitung sebagai rujukan terhindarkan.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => form.setData('keputusan_rujuk', true)}
                                            className={cn(
                                                'rounded-2xl border p-4 text-left transition-colors',
                                                form.data.keputusan_rujuk
                                                    ? 'border-tk-warning/60 bg-tk-warning/10 ring-tk-warning/30 ring-2'
                                                    : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                            )}
                                        >
                                            <span className="bg-tk-warning/15 text-tk-warning inline-flex size-8 items-center justify-center rounded-full">
                                                <Ship className="size-4" aria-hidden="true" />
                                            </span>
                                            <p className="mt-2 text-xs font-bold">Rujuk ke RS</p>
                                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Perawat akan membantu proses rujukan ke daratan.
                                            </p>
                                        </button>
                                    </div>
                                    <InputError message={form.errors.keputusan_rujuk} className="text-tk-danger mt-1.5 text-[10px]" />
                                </div>

                                {form.data.keputusan_rujuk && (
                                    <div className="bg-tk-warning/10 mt-4 grid gap-3 rounded-2xl p-4">
                                        <div>
                                            <label htmlFor="alasan_rujuk" className="text-[11px] font-bold">
                                                Alasan rujuk <span className="text-tk-danger">*</span>
                                            </label>
                                            <textarea
                                                id="alasan_rujuk"
                                                value={form.data.alasan_rujuk}
                                                onChange={(event) => form.setData('alasan_rujuk', event.target.value)}
                                                placeholder="Contoh: perlu observasi EKG dan pemeriksaan enzim jantung di RS."
                                                className={textareaClass}
                                            />
                                            <InputError message={form.errors.alasan_rujuk} className="text-tk-danger mt-1.5 text-[10px]" />
                                        </div>
                                        <div>
                                            <label htmlFor="biaya_rujukan" className="text-[11px] font-bold">
                                                Estimasi biaya rujukan (opsional)
                                            </label>
                                            <Input
                                                id="biaya_rujukan"
                                                type="number"
                                                min={0}
                                                value={form.data.biaya_rujukan}
                                                onChange={(event) => form.setData('biaya_rujukan', event.target.value)}
                                                placeholder="1500000"
                                                className="focus-visible:ring-tk-accent mt-1 h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm"
                                            />
                                            <InputError message={form.errors.biaya_rujukan} className="text-tk-danger mt-1 text-[10px]" />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-xs font-bold disabled:opacity-50"
                                    >
                                        <ClipboardCheck className="size-4" aria-hidden="true" />
                                        Simpan hasil dan tutup konsultasi
                                    </button>
                                    <Link
                                        href={`/spesialis/konsultasi/${konsultasi.id}`}
                                        className="inline-flex min-h-12 items-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        Batal
                                    </Link>
                                </div>
                            </section>
                        </form>
                    )}
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="peringatan-hasil">
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="text-tk-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <div>
                                <h2 id="peringatan-hasil" className="text-[12px] font-bold">
                                    Sebelum menyimpan
                                </h2>
                                <ul className="mt-2 grid gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <li>• Diagnosis wajib memakai kode ICD-10.</li>
                                    <li>• Keputusan rujuk wajib diisi.</li>
                                    <li>• Alasan rujuk wajib bila memilih rujuk.</li>
                                    <li>• Status konsultasi menjadi SELESAI setelah disimpan.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {skrining && (
                        <section className={cn('rounded-[24px] p-5', glass)}>
                            <h2 className="text-[15px] font-bold">Ringkasan skrining</h2>
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                    <dt className="text-[10px] text-[var(--tk-muted)]">TD</dt>
                                    <dd className="font-bold">
                                        {skrining.sistol}/{skrining.diastol}
                                    </dd>
                                </div>
                                <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                    <dt className="text-[10px] text-[var(--tk-muted)]">Suhu</dt>
                                    <dd className="font-bold">{skrining.suhu} °C</dd>
                                </div>
                                <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                    <dt className="text-[10px] text-[var(--tk-muted)]">Nadi</dt>
                                    <dd className="font-bold">{skrining.nadi} bpm</dd>
                                </div>
                                <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                    <dt className="text-[10px] text-[var(--tk-muted)]">SpO₂</dt>
                                    <dd className="font-bold">{skrining.spo2}%</dd>
                                </div>
                            </dl>
                        </section>
                    )}
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
