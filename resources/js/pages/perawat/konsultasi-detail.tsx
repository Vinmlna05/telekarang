import { Head, Link, useForm } from '@inertiajs/react';
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
    ImagePlus,
    Info,
    MapPin,
    MessageSquare,
    Phone,
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
import { useRef, useState, type FormEvent } from 'react';

import ConnectionBadge from '@/components/connection-badge';
import InputError from '@/components/input-error';
import { alasanKoneksi, useConnection } from '@/hooks/use-connection';
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

interface PesanItem {
    id: number;
    pengirim: string;
    peran: string;
    isi: string | null;
    lampiranFoto: string | null;
    statusKirim: string;
    waktu: string | null;
}

interface SlotJadwal {
    id: number;
    hari: string;
    jamMulai: string;
    jamSelesai: string;
    status: string;
}

interface DokterItem {
    id: number;
    nama: string;
    spesialisasi: string;
    faskes: string;
    jadwal: SlotJadwal[];
}

interface KonsultasiDetailProps {
    konsultasi: {
        id: number;
        nomor: string;
        status: string;
        keluhan: string;
        mode: 'video' | 'teks';
        tanggal: string | null;
        tanggalSkrining: string | null;
        dokter: string | null;
        spesialisasi: string | null;
        faskes: string | null;
        jadwal: string | null;
        prioritas: 'darurat' | 'sedang' | null;
        catatanDokter: string | null;
        keputusanDokter: string | null;
        alasanStatus: string | null;
        dikonfirmasiPada: string | null;
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
    dokterTersedia: DokterItem[];
    pesan: PesanItem[];
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-20 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const STATUS_PILIH = ['MENUNGGU_PEMILIHAN_SPESIALIS', 'DIJADWAL_ULANG'];
const STATUS_RUANG = ['DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'];

const statusMeta: Record<string, { label: string; tone: string }> = {
    MENUNGGU_SKRINING: { label: 'Menunggu skrining', tone: 'bg-tk-warning/15 text-tk-warning' },
    SKRINING_SELESAI: { label: 'Skrining selesai', tone: 'bg-tk-info/15 text-tk-info' },
    MENUNGGU_PEMILIHAN_SPESIALIS: { label: 'Pilih dokter & slot', tone: 'bg-tk-info/15 text-tk-info' },
    MENUNGGU_SPESIALIS: { label: 'Menunggu konfirmasi spesialis', tone: 'bg-tk-info/15 text-tk-info' },
    DIKONFIRMASI: {
        label: 'Dikonfirmasi',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    BERLANGSUNG: {
        label: 'Berlangsung',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    SELESAI: {
        label: 'Selesai',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    DIRUJUK: { label: 'Dirujuk ke RS', tone: 'bg-tk-warning/15 text-tk-warning' },
    DITANGANI_PUSKESMAS: {
        label: 'Ditangani di puskesmas',
        tone: 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent',
    },
    DIJADWAL_ULANG: { label: 'Perlu jadwal ulang', tone: 'bg-tk-warning/15 text-tk-warning' },
    DITOLAK: { label: 'Ditolak spesialis', tone: 'bg-tk-danger/15 text-tk-danger' },
    KEDALUWARSA: { label: 'Kedaluwarsa', tone: 'bg-tk-danger/15 text-tk-danger' },
    DIBATALKAN: { label: 'Dibatalkan', tone: 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]' },
};

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

export default function KonsultasiDetailPerawat({ konsultasi, pasien, skrining, hasil, dokterTersedia, pesan }: KonsultasiDetailProps) {
    const koneksi = useConnection();
    const meta = statusMeta[konsultasi.status] ?? statusMeta.MENUNGGU_SKRINING;
    const prioritas = prioritasMeta[skrining?.prioritas ?? (konsultasi.prioritas === 'darurat' ? 'merah' : 'normal')];
    const [dokterId, setDokterId] = useState<number | null>(null);
    const [jadwalId, setJadwalId] = useState<number | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const slotForm = useForm({ dokter_id: 0, jadwal_id: 0 });
    const pesanForm = useForm<{ isi: string; lampiran_foto: File | null }>({ isi: '', lampiran_foto: null });

    const bisaPilih = STATUS_PILIH.includes(konsultasi.status);
    const bisaChat = STATUS_RUANG.includes(konsultasi.status);

    function kirimSlot(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (dokterId === null || jadwalId === null) {
            slotForm.setError('jadwal_id', 'Pilih dokter dan slot jadwal terlebih dahulu.');

            return;
        }

        slotForm.transform(() => ({ dokter_id: dokterId, jadwal_id: jadwalId }));
        slotForm.post(route('perawat.konsultasi.spesialis', konsultasi.id), { preserveScroll: true });
    }

    function kirimPesan(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (pesanForm.data.isi.trim() === '' && pesanForm.data.lampiran_foto === null) {
            pesanForm.setError('isi', 'Tulis pesan atau lampirkan foto.');

            return;
        }

        pesanForm.post(route('perawat.konsultasi.pesan', konsultasi.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                pesanForm.reset();
                if (fileRef.current) {
                    fileRef.current.value = '';
                }
            },
        });
    }

    return (
        <PerawatAppLayout
            active="antrean"
            title={`Konsultasi ${pasien.nama}`}
            description="Pantau status, pilih dokter spesialis, dan tindak lanjuti hasil konsultasi."
        >
            <Head title={`Konsultasi ${pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href="/perawat/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar permintaan
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                    <ConnectionBadge status={koneksi.status} />
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold', meta.tone)}>
                        {meta.label}
                    </span>
                </div>
            </div>

            {koneksi.alasan && (
                <div className={cn('mb-4 flex items-start gap-3 rounded-[20px] p-4 text-[11px] font-semibold', bannerGradient, 'text-tk-deep')}>
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{alasanKoneksi[koneksi.status]}</p>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('overflow-hidden rounded-[24px]', glass)} aria-labelledby="ringkasan-konsultasi">
                        <div className={cn('p-5 md:p-6', bannerGradient, 'text-tk-deep')}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                    <ClipboardCheck className="size-3.5" aria-hidden="true" />
                                    {konsultasi.nomor}
                                </span>
                                <span className="bg-tk-deep/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold">
                                    {konsultasi.mode === 'video' ? (
                                        <Video className="size-3.5" aria-hidden="true" />
                                    ) : (
                                        <MessageSquare className="size-3.5" aria-hidden="true" />
                                    )}
                                    Mode {konsultasi.mode}
                                </span>
                            </div>
                            <h1 id="ringkasan-konsultasi" className="mt-4 text-2xl leading-tight font-extrabold">
                                {pasien.nama}
                            </h1>
                            <p className="text-tk-deep/75 mt-1 text-xs">
                                {pasien.usia} tahun · {pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {pasien.noRm}
                            </p>
                            <p className="text-tk-deep/80 mt-3 line-clamp-2 text-[11px] leading-relaxed">{konsultasi.keluhan}</p>
                        </div>

                        <dl className="grid gap-3 p-5 text-[11px] sm:grid-cols-2 md:p-6">
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Dokter spesialis</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.dokter ?? 'Belum dipilih'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Slot</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.jadwal ?? konsultasi.tanggal ?? 'Belum dijadwalkan'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Keputusan dokter umum</dt>
                                <dd className="mt-0.5 font-semibold">{konsultasi.keputusanDokter?.replaceAll('_', ' ') ?? 'Menunggu review'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Prioritas</dt>
                                <dd className="mt-1">
                                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold', prioritas.tone)}>
                                        {prioritas.label}
                                    </span>
                                </dd>
                            </div>
                            {(konsultasi.alasanStatus || konsultasi.catatanDokter) && (
                                <div className="rounded-2xl bg-[var(--tk-page-alt)] p-3.5 sm:col-span-2">
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Catatan</dt>
                                    <dd className="mt-1 leading-relaxed">{konsultasi.alasanStatus ?? konsultasi.catatanDokter}</dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    {konsultasi.status === 'MENUNGGU_SKRINING' && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-warning/15 text-tk-warning grid size-10 shrink-0 place-items-center rounded-full">
                                    <AlertTriangle className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="text-[15px] font-bold">Skrining belum lengkap</h2>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Permintaan belum bisa diteruskan ke dokter umum sebelum tanda vital dan keluhan diisi perawat.
                                    </p>
                                    <Link
                                        href={`/perawat/skrining/${konsultasi.id}`}
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
                                    >
                                        Isi skrining sekarang
                                        <ChevronRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {skrining && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="data-skrining">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                        <Activity className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="data-skrining" className="text-[15px] font-bold">
                                            Data skrining
                                        </h2>
                                        <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                            {skrining.perawat} · {skrining.waktu}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold', prioritas.tone)}>{prioritas.label}</span>
                            </div>

                            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {[
                                    { label: 'Berat', nilai: `${skrining.beratBadan} kg`, icon: Scale },
                                    { label: 'Tinggi', nilai: `${skrining.tinggiBadan} cm`, icon: Ruler },
                                    { label: 'Tekanan darah', nilai: `${skrining.sistol}/${skrining.diastol}`, icon: Activity },
                                    { label: 'Suhu', nilai: `${skrining.suhu} °C`, icon: Thermometer },
                                    { label: 'Nadi', nilai: `${skrining.nadi} bpm`, icon: HeartPulse },
                                    { label: 'SpO₂', nilai: `${skrining.spo2}%`, icon: Wind },
                                ].map(({ label, nilai, icon: Icon }) => (
                                    <div key={label} className="rounded-xl bg-[var(--tk-page-alt)] px-3 py-2">
                                        <dt className="flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                            <Icon className="size-3" aria-hidden="true" />
                                            {label}
                                        </dt>
                                        <dd className="mt-0.5 text-xs font-bold">{nilai}</dd>
                                    </div>
                                ))}
                            </dl>

                            <p className="mt-3 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[11px] leading-relaxed">
                                {skrining.catatan || 'Tidak ada catatan tambahan dari perawat.'}
                            </p>

                            {skrining.tandaBahaya && (
                                <p className="bg-tk-danger/10 text-tk-danger mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold">
                                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Tanda bahaya terdeteksi saat skrining.
                                </p>
                            )}
                        </section>
                    )}

                    {bisaPilih && (
                        <form onSubmit={kirimSlot} className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="pilih-spesialis">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                    <Stethoscope className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="pilih-spesialis" className="text-[15px] font-bold">
                                        Pilih dokter spesialis dan slot
                                    </h2>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        Dokter umum sudah menyetujui konsultasi. Pilih satu dokter dan slot yang tersedia.
                                    </p>
                                </div>
                            </div>

                            {konsultasi.alasanStatus && (
                                <p className="bg-tk-warning/10 text-tk-warning mt-3 rounded-xl px-3 py-2.5 text-[11px] font-semibold">
                                    {konsultasi.alasanStatus}
                                </p>
                            )}

                            <div className="mt-4 grid gap-3">
                                {dokterTersedia.length === 0 && (
                                    <p className="text-[11px] text-[var(--tk-muted)]">Belum ada dokter spesialis aktif. Hubungi admin.</p>
                                )}
                                {dokterTersedia.map((dokter) => {
                                    const tersedia = dokter.jadwal.filter((slot) => slot.status === 'tersedia');
                                    const dipilih = dokterId === dokter.id;

                                    return (
                                        <div
                                            key={dokter.id}
                                            className={cn(
                                                'rounded-2xl border p-4 transition-colors',
                                                dipilih ? 'border-tk-info/60 bg-tk-info/10' : 'border-[var(--tk-glass-border)]',
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDokterId(dokter.id);
                                                    setJadwalId(null);
                                                }}
                                                className="flex w-full items-start gap-3 text-left"
                                            >
                                                <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full text-xs font-extrabold">
                                                    {dokter.nama
                                                        .replace(/^dr\.?\s+/i, '')
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-bold">{dokter.nama}</span>
                                                    <span className="text-[10px] text-[var(--tk-muted)]">
                                                        {dokter.spesialisasi} · {dokter.faskes}
                                                    </span>
                                                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--tk-muted)]">
                                                        <MapPin className="size-3" aria-hidden="true" />
                                                        {tersedia.length} slot tersedia
                                                    </span>
                                                </span>
                                                {dipilih && <CheckCircle2 className="text-tk-info size-4 shrink-0" aria-hidden="true" />}
                                            </button>

                                            {dipilih && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {dokter.jadwal.length === 0 && (
                                                        <p className="text-[10px] text-[var(--tk-muted)]">Dokter belum mengatur jadwal.</p>
                                                    )}
                                                    {dokter.jadwal.map((slot) => (
                                                        <button
                                                            key={slot.id}
                                                            type="button"
                                                            disabled={slot.status !== 'tersedia'}
                                                            onClick={() => setJadwalId(slot.id)}
                                                            className={cn(
                                                                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-semibold transition-colors',
                                                                jadwalId === slot.id
                                                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                                                    : slot.status === 'tersedia'
                                                                      ? 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]'
                                                                      : 'border-transparent bg-[var(--tk-page-alt)] text-[var(--tk-muted)] line-through',
                                                            )}
                                                        >
                                                            <CalendarDays className="size-3" aria-hidden="true" />
                                                            {slot.hari} {slot.jamMulai}
                                                            {slot.status !== 'tersedia' && ` (${slot.status})`}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <InputError message={slotForm.errors.jadwal_id} className="text-tk-danger mt-2 text-[10px]" />

                            <button
                                type="submit"
                                disabled={slotForm.processing || dokterId === null || jadwalId === null}
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send className="size-4" aria-hidden="true" />
                                Kirim ke dokter spesialis
                            </button>
                        </form>
                    )}

                    {konsultasi.status === 'MENUNGGU_SPESIALIS' && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                    <Clock className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 className="text-[15px] font-bold">Menunggu konfirmasi dokter spesialis</h2>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                        {konsultasi.dokter} akan mengonfirmasi, menjadwal ulang, atau menolak permintaan. Anda akan melihat perubahan
                                        status di halaman ini.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {hasil && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="hasil-konsultasi">
                            <div className="flex items-start gap-3">
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                    <FileText className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="hasil-konsultasi" className="text-[15px] font-bold">
                                        Hasil konsultasi
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
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Saran</p>
                                    <p className="mt-1 text-[11px] leading-relaxed">{hasil.saran}</p>
                                </div>
                                <div className={cn('rounded-2xl p-4', hasil.keputusanRujuk ? 'bg-tk-warning/10' : 'bg-tk-green-500/[0.08]')}>
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Keputusan</p>
                                    <p
                                        className={cn(
                                            'mt-1 text-xs font-bold',
                                            hasil.keputusanRujuk ? 'text-tk-warning' : 'text-tk-green-500 dark:text-tk-accent',
                                        )}
                                    >
                                        {hasil.keputusanRujuk ? 'Rujuk ke RS' : 'Tidak perlu rujuk — tangani di puskesmas'}
                                    </p>
                                    {hasil.keputusanRujuk && hasil.alasanRujuk && (
                                        <p className="mt-1 text-[11px] leading-relaxed">{hasil.alasanRujuk}</p>
                                    )}
                                    {hasil.keputusanRujuk && hasil.biayaRujukan !== null && (
                                        <p className="mt-1 text-[11px]">Estimasi biaya rujukan: {rupiah(hasil.biayaRujukan)}</p>
                                    )}
                                    {!hasil.keputusanRujuk && (
                                        <p className="mt-1 text-[11px] leading-relaxed">Kasus ini dihitung sebagai rujukan terhindarkan.</p>
                                    )}
                                </div>
                            </div>

                            <Link
                                href={`/perawat/tindak-lanjut/${konsultasi.id}`}
                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-5 text-xs font-bold"
                            >
                                Buka tindak lanjut
                                <ChevronRight className="size-3.5" aria-hidden="true" />
                            </Link>
                        </section>
                    )}

                    {bisaChat && (
                        <section className={cn('rounded-[24px] p-5 md:p-6', glass)} aria-labelledby="ruang-konsultasi">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                        <MessageSquare className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="ruang-konsultasi" className="text-[15px] font-bold">
                                            Ruang konsultasi
                                        </h2>
                                        <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Mode teks · pesan tersimpan otomatis</p>
                                    </div>
                                </div>
                                {koneksi.status !== 'stabil' && <ConnectionBadge status={koneksi.status} />}
                            </div>

                            <div className="mt-4 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
                                {pesan.length === 0 && (
                                    <p className="rounded-2xl bg-[var(--tk-page-alt)] p-4 text-center text-[11px] text-[var(--tk-muted)]">
                                        Belum ada pesan. Mulai percakapan dengan dokter spesialis.
                                    </p>
                                )}
                                {pesan.map((item) => {
                                    const milikSendiri = item.peran === 'perawat';

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
                                                <p className="mt-1 text-[9px] text-[var(--tk-muted)]">
                                                    {item.waktu}
                                                    {item.statusKirim === 'menunggu' && ' · Menunggu kirim'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {konsultasi.status !== 'SELESAI' && (
                                <form onSubmit={kirimPesan} className="mt-4">
                                    <label htmlFor="pesan" className="sr-only">
                                        Pesan untuk dokter spesialis
                                    </label>
                                    <textarea
                                        id="pesan"
                                        value={pesanForm.data.isi}
                                        onChange={(event) => pesanForm.setData('isi', event.target.value)}
                                        placeholder="Tulis pesan atau hasil pengukuran ulang…"
                                        className={textareaClass}
                                    />
                                    <InputError message={pesanForm.errors.isi} className="text-tk-danger mt-1.5 text-[10px]" />
                                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                        <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 text-[10px] font-semibold text-[var(--tk-muted)]">
                                            <ImagePlus className="size-3.5" aria-hidden="true" />
                                            Foto
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={(event) => pesanForm.setData('lampiran_foto', event.target.files?.[0] ?? null)}
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={pesanForm.processing}
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
                        </ul>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)} aria-labelledby="alur-konsultasi">
                        <h2 id="alur-konsultasi" className="text-[15px] font-bold">
                            Alur konsultasi
                        </h2>
                        <ol className="mt-3 grid gap-2.5">
                            {[
                                'Skrining perawat',
                                'Review dokter umum',
                                'Pilih dokter & slot',
                                'Konfirmasi spesialis',
                                'Konsultasi',
                                'Hasil & tindak lanjut',
                            ].map((langkah, index) => {
                                const aktif =
                                    (index === 0 && ['SKRINING_SELESAI'].includes(konsultasi.status)) ||
                                    (index === 1 && konsultasi.keputusanDokter !== null) ||
                                    (index === 2 && bisaPilih) ||
                                    (index === 3 && konsultasi.status === 'MENUNGGU_SPESIALIS') ||
                                    (index === 4 && ['DIKONFIRMASI', 'BERLANGSUNG'].includes(konsultasi.status)) ||
                                    (index === 5 && hasil !== null);

                                return (
                                    <li key={langkah} className="flex items-center gap-2.5">
                                        <span
                                            className={cn(
                                                'grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold',
                                                aktif ? 'bg-tk-accent text-tk-deep' : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                            )}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className={cn('text-[11px]', aktif ? 'font-bold' : 'text-[var(--tk-muted)]')}>{langkah}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>

                    <section className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                Hanya perawat dan dokter yang menangani pasien ini yang dapat melihat data skrining dan ruang konsultasi.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
