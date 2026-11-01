import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Info,
    Lock,
    MapPin,
    MessageSquare,
    Send,
    ShieldCheck,
    Stethoscope,
    Video,
    Wifi,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { Input } from '@/components/ui/input';
import { cariKonsultasi, modeKonsultasiLabels, statusKonsultasiLabels, type PengirimPesan, type PesanKonsultasi } from '@/data/konsultasi-pasien';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';

interface KonsultasiDetailProps {
    konsultasiId: number;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const langkahKonsultasi = ['Permintaan', 'Skrining', 'Review dokter', 'Spesialis', 'Konsultasi', 'Hasil'];

const labelPengirim: Record<PengirimPesan, string> = {
    pasien: 'Anda',
    perawat: 'Perawat',
    spesialis: 'Dokter spesialis',
};

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

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatRupiah(nilai: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(nilai);
}

export default function KonsultasiDetail({ konsultasiId }: KonsultasiDetailProps) {
    const data = cariKonsultasi(konsultasiId);
    const [pesanLokal, setPesanLokal] = useState<PesanKonsultasi[]>([]);
    const [pesanBaru, setPesanBaru] = useState('');
    const semuaPesan = [...data.pesan, ...pesanLokal];
    const modeLabel = modeKonsultasiLabels[data.mode];
    const statusLabel = statusKonsultasiLabels[data.status];

    useEffect(() => {
        setPesanLokal([]);
        setPesanBaru('');
    }, [data.id]);

    function kirimPesan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const isi = pesanBaru.trim();

        if (!isi) {
            return;
        }

        setPesanLokal((previous) => [
            ...previous,
            {
                id: Date.now(),
                pengirim: 'pasien',
                isi,
                waktu: 'Baru saja',
            },
        ]);
        setPesanBaru('');
    }

    const tandaVital = [
        { label: 'Berat badan', nilai: String(data.skrining.beratBadan), satuan: 'kg' },
        { label: 'Tinggi badan', nilai: String(data.skrining.tinggiBadan), satuan: 'cm' },
        { label: 'Tekanan darah', nilai: `${data.skrining.sistol}/${data.skrining.diastol}`, satuan: 'mmHg' },
        { label: 'Suhu tubuh', nilai: angkaDesimal(data.skrining.suhu), satuan: '°C' },
        { label: 'Nadi', nilai: String(data.skrining.nadi), satuan: 'x/menit' },
        { label: 'SpO₂', nilai: String(data.skrining.spo2), satuan: '%' },
    ];

    return (
        <PasienAppLayout
            active="riwayat"
            title="Detail konsultasi"
            description="Lihat status permintaan, hasil skrining perawat, keputusan dokter spesialis, dan percakapan konsultasi Anda."
        >
            <Head title={`Detail konsultasi ${data.nomor}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/pasien/riwayat"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke riwayat
                </Link>
                <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                    {data.nomor}
                </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="status-konsultasi" className={cn('overflow-hidden rounded-[26px]', glass)}>
                        <div className={cn('relative overflow-hidden p-5 md:p-6', bannerGradient)}>
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-white/25 blur-xl"
                            />
                            <div className="relative">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                        {statusLabel}
                                    </span>
                                    <span className="bg-tk-deep/10 text-tk-deep inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                        {data.mode === 'video' ? (
                                            <Video className="size-3.5" aria-hidden="true" />
                                        ) : (
                                            <MessageSquare className="size-3.5" aria-hidden="true" />
                                        )}
                                        {modeLabel}
                                    </span>
                                </div>

                                <h2 id="status-konsultasi" className="text-tk-deep mt-4 text-2xl leading-tight font-extrabold">
                                    Konsultasi selesai
                                </h2>
                                <p className="text-tk-deep/75 mt-1 text-xs">
                                    {data.tanggal} · {data.dokter}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-tk-deep text-tk-mint inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold">
                                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                                        {data.hasil.keputusanRujuk ? 'Dirujuk ke RS' : 'Rujukan terhindarkan'}
                                    </span>
                                    <span className="text-tk-deep inline-flex items-center rounded-full bg-white/25 px-3 py-1.5 text-[10px] font-bold">
                                        {data.hasil.icd10Kode} · {data.hasil.icd10Nama}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6" aria-label="Progres konsultasi">
                                {langkahKonsultasi.map((langkah) => (
                                    <li key={langkah} className="flex flex-col items-center gap-1.5 text-center">
                                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-7 place-items-center rounded-full">
                                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                        </span>
                                        <span className="text-[9px] leading-tight font-semibold text-[var(--tk-muted)]">{langkah}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    <section aria-labelledby="data-skrining" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Skrining perawat</p>
                                <h2 id="data-skrining" className="mt-1 text-[17px] font-bold">
                                    Data klinis awal
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    Diisi {data.skrining.perawat} · {data.skrining.waktu}
                                </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                <Lock className="size-3" aria-hidden="true" />
                                Read-only
                            </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {tandaVital.map((item) => (
                                <div key={item.label} className="rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">{item.label}</dt>
                                    <dd className="mt-1.5 text-sm font-bold">
                                        {item.nilai}
                                        <span className="ml-1 text-[9px] font-medium text-[var(--tk-muted)]">{item.satuan}</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div
                            className={cn(
                                'mt-3 flex items-start gap-2.5 rounded-2xl p-3.5',
                                data.skrining.tandaBahaya ? 'bg-tk-danger/10' : 'bg-tk-green-500/[0.08]',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid size-8 shrink-0 place-items-center rounded-full',
                                    data.skrining.tandaBahaya
                                        ? 'bg-tk-danger/15 text-tk-danger'
                                        : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                )}
                            >
                                {data.skrining.tandaBahaya ? (
                                    <Info className="size-4" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                )}
                            </span>
                            <div>
                                <p className={cn('text-[11px] font-bold', data.skrining.tandaBahaya ? 'text-tk-danger' : 'text-[var(--tk-text)]')}>
                                    {data.skrining.tandaBahaya ? 'Tanda bahaya terdeteksi' : 'Tidak ada tanda bahaya'}
                                </p>
                                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    {data.skrining.tandaBahaya
                                        ? 'Pasien diprioritaskan untuk evaluasi dokter dan kemungkinan rujukan segera.'
                                        : 'Hasil triase otomatis tidak menemukan kondisi yang memerlukan rujukan gawat darurat.'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Catatan perawat</p>
                            <p className="mt-1 text-[11px] leading-relaxed">{data.skrining.catatan}</p>
                        </div>

                        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Data skrining hanya dapat diubah oleh perawat. Pasien melihat data ini sebagai referensi.
                        </p>
                    </section>

                    <section aria-labelledby="hasil-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                                <FileText className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Hasil konsultasi</p>
                                <h2 id="hasil-konsultasi" className="mt-1 text-[17px] font-bold">
                                    Keputusan dokter spesialis
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {data.dokter} · {data.hasil.waktu}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="bg-tk-deep text-tk-mint rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold">
                                    {data.hasil.icd10Kode}
                                </span>
                                <p className="text-sm font-bold">{data.hasil.icd10Nama}</p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Saran dokter</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed">{data.hasil.saran}</p>
                        </div>

                        <div
                            className={cn(
                                'mt-4 rounded-2xl border p-4',
                                data.hasil.keputusanRujuk ? 'border-tk-warning/30 bg-tk-warning/10' : 'border-tk-green-500/30 bg-tk-green-500/[0.08]',
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        'grid size-9 shrink-0 place-items-center rounded-full',
                                        data.hasil.keputusanRujuk
                                            ? 'bg-tk-warning/15 text-tk-warning'
                                            : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                    )}
                                >
                                    {data.hasil.keputusanRujuk ? (
                                        <MapPin className="size-4" aria-hidden="true" />
                                    ) : (
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keputusan</p>
                                    <p className={cn('mt-0.5 text-sm font-bold', data.hasil.keputusanRujuk && 'text-tk-warning')}>
                                        {data.hasil.keputusanRujuk ? 'Perlu dirujuk' : 'Tidak dirujuk'}
                                    </p>
                                    {data.hasil.keputusanRujuk ? (
                                        <>
                                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.hasil.alasanRujuk}</p>
                                            {data.hasil.biayaRujukan !== null && (
                                                <p className="mt-2 inline-flex rounded-full bg-[var(--tk-glass)] px-2.5 py-1 text-[10px] font-semibold">
                                                    Estimasi biaya rujukan: {formatRupiah(data.hasil.biayaRujukan)}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            Keluhan dapat ditangani di Puskesmas Pulau Karang. Kasus ini tercatat sebagai rujukan terhindarkan.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--tk-glass-border)] p-3.5">
                            <p className="text-[9px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Tindak lanjut puskesmas</p>
                            <p className="mt-1 text-[11px] leading-relaxed">{data.hasil.tindakLanjut}</p>
                        </div>
                    </section>

                    <section aria-labelledby="ruang-konsultasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Percakapan</p>
                                <h2 id="ruang-konsultasi" className="mt-1 text-[17px] font-bold">
                                    Ruang konsultasi
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--tk-muted)]">
                                    {semuaPesan.length} pesan · {modeLabel}
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-2.5 py-1.5 text-[9px] font-semibold text-[var(--tk-muted)]">
                                {data.mode === 'video' ? (
                                    <Video className="size-3" aria-hidden="true" />
                                ) : (
                                    <MessageSquare className="size-3" aria-hidden="true" />
                                )}
                                {data.mode === 'video' ? 'Mode standar' : 'Mode koneksi rendah'}
                            </span>
                        </div>

                        {data.mode === 'teks' && (
                            <div className="bg-tk-warning/10 mt-4 flex items-start gap-2.5 rounded-2xl p-3.5">
                                <Wifi className="text-tk-warning mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <span className="font-bold text-[var(--tk-text)]">Sinyal lemah terdeteksi.</span> Konsultasi beralih ke mode teks
                                    dan foto agar tetap berjalan tanpa terputus.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 max-h-[440px] space-y-4 overflow-y-auto pr-1" aria-live="polite">
                            {semuaPesan.map((pesan) => {
                                const dariPasien = pesan.pengirim === 'pasien';

                                return (
                                    <div key={pesan.id} className={cn('flex', dariPasien && 'justify-end')}>
                                        <div
                                            className={cn(
                                                'max-w-[85%] rounded-2xl px-4 py-3',
                                                dariPasien
                                                    ? 'bg-tk-accent text-tk-deep rounded-br-md'
                                                    : 'rounded-bl-md bg-[var(--tk-page-alt)] text-[var(--tk-text)]',
                                            )}
                                        >
                                            <p className={cn('text-[9px] font-semibold', dariPasien ? 'text-tk-deep/65' : 'text-[var(--tk-muted)]')}>
                                                {labelPengirim[pesan.pengirim]} · {pesan.waktu}
                                            </p>
                                            <p className="mt-1 text-[11px] leading-relaxed">{pesan.isi}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={kirimPesan} className="mt-4 flex items-center gap-2 border-t border-[var(--tk-glass-border)] pt-4">
                            <Input
                                value={pesanBaru}
                                onChange={(event) => setPesanBaru(event.target.value)}
                                placeholder="Tulis pesan tindak lanjut..."
                                aria-label="Tulis pesan tindak lanjut"
                                className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-xs text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                            />
                            <button
                                type="submit"
                                disabled={!pesanBaru.trim()}
                                aria-label="Kirim pesan"
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <Send className="size-4" aria-hidden="true" />
                            </button>
                        </form>

                        <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                            Ruang chat tetap terbuka untuk tindak lanjut. Pesan yang dikirim saat offline akan menunggu sampai sinyal kembali.
                        </p>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="dokter-penanggung-jawab" className={cn('rounded-[24px] p-5', glass)}>
                        <p id="dokter-penanggung-jawab" className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">
                            Dokter penanggung jawab
                        </p>

                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-tk-mint grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-[12px] font-extrabold">
                                {inisial(data.dokter, true)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold">{data.dokter}</p>
                                <p className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Spesialis {data.spesialisasi}</p>
                                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                    {data.faskes}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                            <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.jadwal}</p>
                        </div>
                    </section>

                    <section aria-labelledby="ringkasan-detail" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="ringkasan-detail" className="text-[15px] font-bold">
                            Ringkasan
                        </h2>

                        <dl className="mt-4 grid gap-3 text-[11px]">
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Nomor</dt>
                                <dd className="text-right font-semibold">{data.nomor}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Tanggal</dt>
                                <dd className="text-right font-semibold">{data.tanggalSingkat}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Status</dt>
                                <dd className="text-tk-green-500 dark:text-tk-accent text-right font-semibold">{statusLabel}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Mode</dt>
                                <dd className="text-right font-semibold">{modeLabel}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Keputusan</dt>
                                <dd
                                    className={cn(
                                        'text-right font-semibold',
                                        data.hasil.keputusanRujuk ? 'text-tk-warning' : 'text-tk-green-500 dark:text-tk-accent',
                                    )}
                                >
                                    {data.hasil.keputusanRujuk ? 'Dirujuk' : 'Tidak dirujuk'}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-[var(--tk-muted)]">Keluhan</dt>
                                <dd className="max-w-[18ch] text-right font-semibold">{data.keluhan}</dd>
                            </div>
                        </dl>

                        <Link
                            href="/pasien/konsultasi/baru"
                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-[11px] font-bold transition-colors"
                        >
                            Ajukan konsultasi baru
                            <ChevronRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </section>

                    <section aria-label="Informasi tindak lanjut" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'grid size-9 shrink-0 place-items-center rounded-full',
                                    data.hasil.keputusanRujuk
                                        ? 'bg-tk-warning/15 text-tk-warning'
                                        : 'text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12]',
                                )}
                            >
                                {data.hasil.keputusanRujuk ? (
                                    <MapPin className="size-4" aria-hidden="true" />
                                ) : (
                                    <Stethoscope className="size-4" aria-hidden="true" />
                                )}
                            </span>
                            <div>
                                <p className="text-[11px] font-bold">{data.hasil.keputusanRujuk ? 'Rujukan tercatat' : 'Tetap di puskesmas'}</p>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.hasil.tindakLanjut}</p>
                            </div>
                        </div>
                    </section>

                    <section aria-label="Privasi data" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Data konsultasi Anda</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hanya Anda dan tim kesehatan yang menangani yang dapat melihat detail konsultasi ini.
                            </p>
                        </div>
                    </section>

                    <section aria-label="Waktu konsultasi" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <Clock className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold">Waktu konsultasi</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Sesi berlangsung sekitar 35 menit. Hasil dicatat pada {data.hasil.waktu}.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
