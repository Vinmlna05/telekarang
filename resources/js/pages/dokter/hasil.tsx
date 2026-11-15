import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
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

import DokterAppLayout from '@/layouts/dokter/dokter-app-layout';
import { cn } from '@/lib/utils';

type Prioritas = 'merah' | 'kuning' | 'normal';

interface HasilDokterProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        tanggal: string | null;
        dokter: string;
        spesialisasi: string;
        faskes: string;
        catatanDokter: string | null;
        keputusanDokter: string | null;
    };
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        noRm: string;
        alamat: string;
        telepon: string;
    };
    skrining: {
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
    } | null;
    hasil: {
        icd10Kode: string;
        icd10Nama: string;
        saran: string;
        keputusanRujuk: boolean;
        alasanRujuk: string | null;
        biayaRujukan: number | null;
        waktu: string | null;
    } | null;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';

const prioritasMeta: Record<Prioritas, { label: string; tone: string }> = {
    merah: { label: 'Triase merah', tone: 'bg-tk-danger/15 text-tk-danger' },
    kuning: { label: 'Perlu perhatian', tone: 'bg-tk-warning/15 text-tk-warning' },
    normal: {
        label: 'Normal',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
};

function rupiah(nilai: number): string {
    return 'Rp '.concat(nilai.toLocaleString('id-ID', { maximumFractionDigits: 0 }));
}

export default function HasilDokter({ konsultasi, pasien, skrining, hasil }: HasilDokterProps) {
    const perluRujuk = hasil?.keputusanRujuk === true;

    return (
        <DokterAppLayout
            active="riwayat"
            title={`Hasil konsultasi ${pasien.nama}`}
            description="Pantau hasil konsultasi spesialis dan tindak lanjut perawat."
        >
            <Head title={`Hasil ${pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/dokter/review?tab=riwayat"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke riwayat
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 py-1 text-[10px] font-semibold text-[var(--tk-muted)]">
                    {konsultasi.nomor}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)} aria-labelledby="ringkasan-hasil">
                        <div className={cn('p-5 md:p-6', needRujukGradient(perluRujuk), 'text-tk-deep')}>
                            <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                                {perluRujuk ? 'Dirujuk ke RS' : 'Rujukan terhindarkan'}
                            </span>
                            <h1 id="ringkasan-hasil" className="mt-3 text-2xl leading-tight font-extrabold">
                                {pasien.nama}
                            </h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                            </p>
                            <p className="text-tk-deep/80 mt-3 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                        </div>

                        <dl className="grid gap-3 p-5 text-[11px] sm:grid-cols-2 md:p-6">
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter spesialis</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.dokter}</dd>
                                <dd className="text-[10px] text-[var(--tk-muted)]">
                                    {konsultasi.spesialisasi} · {konsultasi.faskes}
                                </dd>
                            </div>
                            <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3.5">
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Tanggal konsultasi</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.tanggal ?? '-'}</dd>
                                <dd className="text-[10px] text-[var(--tk-muted)]">Mode {konsultasi.mode}</dd>
                            </div>
                            {konsultasi.catatanDokter && (
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3.5 sm:col-span-2">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Catatan dokter umum
                                    </dt>
                                    <dd className="mt-1 leading-relaxed">{konsultasi.catatanDokter}</dd>
                                </div>
                            )}
                        </dl>
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
                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{hasil.waktu}</p>
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
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Saran</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{hasil.saran}</p>
                                </div>
                                <div className={cn('rounded-2xl p-4', perluRujuk ? 'bg-tk-warning/10' : 'bg-tk-green-500/[0.08]')}>
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Keputusan</p>
                                    <p
                                        className={cn(
                                            'mt-1 text-xs font-bold',
                                            perluRujuk ? 'text-tk-warning' : 'text-tk-green-500 dark:text-tk-accent',
                                        )}
                                    >
                                        {perluRujuk ? 'Rujuk ke RS' : 'Tidak perlu rujuk'}
                                    </p>
                                    {perluRujuk && hasil.alasanRujuk && <p className="mt-1 text-[11px] leading-relaxed">{hasil.alasanRujuk}</p>}
                                    {perluRujuk && hasil.biayaRujukan !== null && (
                                        <p className="mt-1 text-[11px] font-semibold">Estimasi biaya rujukan: {rupiah(hasil.biayaRujukan)}</p>
                                    )}
                                    {!perluRujuk && (
                                        <p className="mt-1 text-[11px] leading-relaxed">
                                            Perawat menindaklanjuti di puskesmas. Kasus masuk hitungan rujukan terhindarkan.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-10 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="text-[15px] font-bold">Dirujuk langsung ke RS</h2>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Tidak ada konsultasi spesialis karena dokter umum langsung merujuk pasien.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {skrining && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="skrining-hasil">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                        <Activity className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="skrining-hasil" className="text-[15px] font-bold">
                                            Skrining awal
                                        </h2>
                                        <p className="text-[10px] text-[var(--tk-muted)]">
                                            {skrining.perawat} · {skrining.waktu}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold', prioritasMeta[skrining.prioritas].tone)}>
                                    {prioritasMeta[skrining.prioritas].label}
                                </span>
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
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="kontak-pasien">
                        <h2 id="kontak-pasien" className="text-[15px] font-bold">
                            Kontak pasien
                        </h2>
                        <ul className="mt-3 grid gap-2.5 text-[11px]">
                            <li className="flex items-center gap-2">
                                <UserRound className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.nama}
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.telepon}
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                {pasien.alamat}
                            </li>
                        </ul>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="tindak-lanjut-info">
                        <h2 id="tindak-lanjut-info" className="text-[15px] font-bold">
                            Tindak lanjut
                        </h2>
                        <ul className="mt-3 grid gap-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                {perluRujuk
                                    ? 'Perawat menyiapkan surat rujukan dan transportasi.'
                                    : 'Perawat memberikan obat, edukasi, dan jadwal kontrol.'}
                            </li>
                            <li className="flex items-start gap-2">
                                <ClipboardCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                {perluRujuk ? 'Biaya rujukan dicatat untuk dasbor.' : 'Kasus dicatat sebagai rujukan terhindarkan.'}
                            </li>
                            {perluRujuk && (
                                <li className="flex items-start gap-2">
                                    <Ship className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Estimasi perjalanan kapal ±3 jam sekali jalan.
                                </li>
                            )}
                            {skrining?.tandaBahaya && (
                                <li className="text-tk-danger flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Skrining menandai tanda bahaya.
                                </li>
                            )}
                        </ul>
                        <Link
                            href="/dokter/review?tab=riwayat"
                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                        >
                            Kembali ke riwayat
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </section>
                </aside>
            </div>
        </DokterAppLayout>
    );
}

function needRujukGradient(perluRujuk: boolean): string {
    return perluRujuk ? 'bg-[linear-gradient(135deg,#5A4310_0%,#C98A1B_55%,#F2B84B_100%)]' : bannerGradient;
}
