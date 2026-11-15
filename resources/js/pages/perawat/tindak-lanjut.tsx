import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    FileText,
    MapPin,
    Phone,
    Ship,
    Stethoscope,
    UserRound,
} from 'lucide-react';

import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

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

interface HasilData {
    icd10Kode: string;
    icd10Nama: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    waktu: string | null;
}

interface TindakLanjutProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        tanggal: string | null;
        dokter: string | null;
        spesialisasi: string | null;
        faskes: string | null;
        jadwal: string | null;
        keputusanDokter: string | null;
        catatanDokter: string | null;
        alasanStatus: string | null;
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
    skrining: SkriningData | null;
    hasil: HasilData | null;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

function rupiah(nilai: number): string {
    return 'Rp '.concat(nilai.toLocaleString('id-ID', { maximumFractionDigits: 0 }));
}

export default function TindakLanjutPerawat({ konsultasi, pasien, skrining, hasil }: TindakLanjutProps) {
    const perluRujuk = hasil?.keputusanRujuk === true || konsultasi.status === 'DIRUJUK';
    const terhindarkan = hasil !== null && !hasil.keputusanRujuk;

    const langkahTindakLanjut = perluRujuk
        ? [
              'Hubungi pasien dan keluarga untuk menjelaskan rencana rujukan.',
              'Siapkan surat rujukan, hasil skrining, dan catatan konsultasi.',
              'Koordinasikan transportasi kapal dan rumah sakit tujuan.',
              'Catat biaya rujukan aktual dan waktu keberangkatan.',
          ]
        : [
              'Sampaikan saran dokter spesialis dengan bahasa sederhana.',
              'Serahkan resep atau rencana tindakan ke pasien.',
              'Jadwalkan kontrol ulang di puskesmas.',
              'Dokumentasikan tindakan sebagai rujukan terhindarkan.',
          ];

    return (
        <PerawatAppLayout
            active="antrean"
            title={`Tindak lanjut ${pasien.nama}`}
            description="Tindak lanjut hasil konsultasi: rujuk ke RS atau tangani di puskesmas."
        >
            <Head title={`Tindak lanjut ${pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/perawat/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar permintaan
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                    <ClipboardCheck className="size-3" aria-hidden="true" />
                    {konsultasi.nomor}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)} aria-labelledby="ringkasan-tindak-lanjut">
                        <div
                            className={cn(
                                'p-5 md:p-6',
                                perluRujuk ? 'bg-[linear-gradient(135deg,#5A4310_0%,#C98A1B_55%,#F2B84B_100%)]' : bannerGradient,
                                'text-tk-deep',
                            )}
                        >
                            <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                                {perluRujuk ? 'Rujuk ke RS' : 'Tangani di puskesmas'}
                            </span>
                            <h1 id="ringkasan-tindak-lanjut" className="mt-3 text-2xl leading-tight font-extrabold">
                                {pasien.nama}
                            </h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                            </p>
                            <p className="text-tk-deep/80 mt-3 text-[11px] leading-relaxed">
                                {perluRujuk
                                    ? 'Pasien membutuhkan rujukan ke RS. Bantu proses rujukan dan catat biaya perjalanan.'
                                    : 'Kasus dapat diselesaikan di puskesmas. Tindak lanjuti saran dokter dan jadwalkan kontrol.'}
                            </p>
                        </div>

                        <div className="grid gap-3 p-5 md:p-6">
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Keluhan awal</p>
                                <p className="mt-1 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                            </div>

                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[11px]">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter spesialis</dt>
                                    <dd className="mt-0.5 font-semibold">{konsultasi.dokter ?? 'Tidak ada konsultasi spesialis'}</dd>
                                    <dd className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {konsultasi.spesialisasi ?? 'Dirujuk langsung dokter umum'}
                                    </dd>
                                </div>
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-[11px]">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Slot konsultasi</dt>
                                    <dd className="mt-0.5 font-semibold">{konsultasi.jadwal ?? konsultasi.tanggal ?? '-'}</dd>
                                    <dd className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {konsultasi.mode === 'video' ? 'Mode video' : 'Mode teks'}
                                    </dd>
                                </div>
                            </dl>

                            {konsultasi.catatanDokter && (
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                                        Catatan dokter umum
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{konsultasi.catatanDokter}</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {hasil ? (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="hasil-spesialis">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                    <FileText className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="hasil-spesialis" className="text-[15px] font-bold">
                                        Hasil konsultasi spesialis
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                        {konsultasi.dokter} · {hasil.waktu}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3">
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</p>
                                    <p className="mt-1 text-xs font-bold">
                                        <span className="font-mono">{hasil.icd10Kode}</span> · {hasil.icd10Nama}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Saran untuk pasien</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{hasil.saran}</p>
                                </div>
                                {perluRujuk && hasil.alasanRujuk && (
                                    <div className="bg-tk-warning/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Alasan rujukan</p>
                                        <p className="mt-1 text-[11px] leading-relaxed">{hasil.alasanRujuk}</p>
                                    </div>
                                )}
                                {perluRujuk && hasil.biayaRujukan !== null && (
                                    <div className="bg-tk-warning/10 flex items-center justify-between gap-3 rounded-2xl p-4">
                                        <div className="flex items-center gap-2">
                                            <Ship className="text-tk-warning size-4" aria-hidden="true" />
                                            <p className="text-[11px] font-semibold">Estimasi biaya rujukan</p>
                                        </div>
                                        <p className="text-tk-warning text-sm font-extrabold">{rupiah(hasil.biayaRujukan)}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-10 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="text-[15px] font-bold">Dirujuk langsung oleh dokter umum</h2>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        {konsultasi.alasanStatus ?? konsultasi.catatanDokter ?? 'Pasien dirujuk tanpa konsultasi spesialis.'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="langkah-perawat">
                        <h2 id="langkah-perawat" className="text-[15px] font-bold">
                            Langkah tindak lanjut
                        </h2>
                        <ol className="mt-3 grid gap-2.5">
                            {langkahTindakLanjut.map((langkah, index) => (
                                <li key={langkah} className="flex items-start gap-2.5">
                                    <span className="bg-tk-green-500/[0.15] text-tk-green-500 dark:text-tk-accent grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    <span className="text-[11px] leading-relaxed">{langkah}</span>
                                </li>
                            ))}
                        </ol>

                        {terhindarkan && (
                            <p className="bg-tk-green-500/[0.10] text-tk-green-500 dark:text-tk-accent mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold">
                                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Kasus ini tercatat sebagai rujukan terhindarkan dan masuk ke dasbor.
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href="/perawat/permintaan"
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
                            >
                                Kembali ke daftar permintaan
                                <ChevronRight className="size-3.5" aria-hidden="true" />
                            </Link>
                            <Link
                                href={`/perawat/konsultasi/${konsultasi.id}`}
                                className="inline-flex min-h-11 items-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                Lihat detail konsultasi
                            </Link>
                        </div>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="kontak-pasien">
                        <h2 id="kontak-pasien" className="text-[15px] font-bold">
                            Kontak pasien
                        </h2>
                        <ul className="mt-3 grid gap-2.5 text-[11px]">
                            <li className="flex items-center gap-2">
                                <UserRound className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.sumber}
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.telepon}
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.alamat}
                            </li>
                            <li className="flex items-center gap-2">
                                <CalendarDays className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                Konsultasi: {konsultasi.tanggal ?? '-'}
                            </li>
                        </ul>
                    </section>

                    {skrining && (
                        <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="ringkasan-skrining">
                            <h2 id="ringkasan-skrining" className="text-[15px] font-bold">
                                Ringkasan skrining
                            </h2>
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                    <dt className="text-[10px] text-[var(--tk-muted)]">Tekanan darah</dt>
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
                            <p className="mt-2 text-[10px] text-[var(--tk-muted)]">
                                {skrining.perawat} · {skrining.waktu}
                            </p>
                        </section>
                    )}
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
