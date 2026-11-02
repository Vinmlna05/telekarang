import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    HeartPulse,
    Info,
    MapPin,
    MessageSquare,
    Phone,
    RotateCcw,
    Ruler,
    Save,
    Scale,
    Search,
    ShieldCheck,
    Stethoscope,
    Thermometer,
    UserRound,
    Video,
    Wind,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { daftarIcd10, type Icd10Item } from '@/data/icd10';
import { cariKonsultasiRuang, type ModeRuang } from '@/data/konsultasi-spesialis';
import SpesialisAppLayout from '@/layouts/spesialis/spesialis-app-layout';
import { cn } from '@/lib/utils';

interface HasilKonsultasiProps {
    konsultasiId: number;
}

type Keputusan = '' | 'rujuk' | 'tidak_rujuk';

type HasilErrors = Partial<Record<'icd' | 'saran' | 'keputusan' | 'alasan' | 'biaya', string>>;

interface HasilTersimpan {
    konsultasiId: number;
    kodeIcd: string;
    namaIcd: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    ringkasanPasien: string | null;
    waktu: string;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';

const BIAYA_TERHINDARKAN = 750_000;
const JAM_TERHINDARKAN = 6;

const modeMeta: Record<ModeRuang, { label: string; ikon: LucideIcon }> = {
    video: { label: 'Mode standar', ikon: Video },
    teks: { label: 'Mode koneksi rendah', ikon: MessageSquare },
};

const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

function kunciHasil(id: number): string {
    return `telekarang:hasil-spesialis:${id}`;
}

function angkaDesimal(nilai: number): string {
    return nilai.toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

function bacaHasil(id: number): HasilTersimpan | null {
    try {
        const mentah = window.localStorage.getItem(kunciHasil(id));

        if (!mentah) {
            return null;
        }

        const parsed: unknown = JSON.parse(mentah);

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const obj = parsed as Record<string, unknown>;

        if (typeof obj.kodeIcd !== 'string' || typeof obj.namaIcd !== 'string' || typeof obj.saran !== 'string') {
            return null;
        }

        return {
            konsultasiId: typeof obj.konsultasiId === 'number' ? obj.konsultasiId : id,
            kodeIcd: obj.kodeIcd,
            namaIcd: obj.namaIcd,
            saran: obj.saran,
            keputusanRujuk: obj.keputusanRujuk === true,
            alasanRujuk: typeof obj.alasanRujuk === 'string' ? obj.alasanRujuk : null,
            biayaRujukan: typeof obj.biayaRujukan === 'number' ? obj.biayaRujukan : null,
            ringkasanPasien: typeof obj.ringkasanPasien === 'string' ? obj.ringkasanPasien : null,
            waktu: typeof obj.waktu === 'string' ? obj.waktu : '',
        };
    } catch {
        return null;
    }
}

function simpanHasil(hasil: HasilTersimpan): boolean {
    try {
        window.localStorage.setItem(kunciHasil(hasil.konsultasiId), JSON.stringify(hasil));

        return true;
    } catch {
        return false;
    }
}

export default function HasilKonsultasiSpesialis({ konsultasiId }: HasilKonsultasiProps) {
    const data = cariKonsultasiRuang(konsultasiId);

    const [kodeIcd, setKodeIcd] = useState('');
    const [pencarian, setPencarian] = useState('');
    const [saran, setSaran] = useState('');
    const [keputusan, setKeputusan] = useState<Keputusan>('');
    const [alasan, setAlasan] = useState('');
    const [biaya, setBiaya] = useState('');
    const [ringkasan, setRingkasan] = useState('');
    const [errors, setErrors] = useState<HasilErrors>({});
    const [tersimpan, setTersimpan] = useState<HasilTersimpan | null>(null);
    const [selesai, setSelesai] = useState(false);
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        const tersimpanAwal = bacaHasil(data.id);

        setTersimpan(tersimpanAwal);
        setSelesai(false);
        setPencarian('');
        setErrors({});
        setInfo(null);

        if (!tersimpanAwal) {
            setKodeIcd('');
            setSaran('');
            setKeputusan('');
            setAlasan('');
            setBiaya('');
            setRingkasan('');

            return;
        }

        setKodeIcd(tersimpanAwal.kodeIcd);
        setSaran(tersimpanAwal.saran);
        setKeputusan(tersimpanAwal.keputusanRujuk ? 'rujuk' : 'tidak_rujuk');
        setAlasan(tersimpanAwal.alasanRujuk ?? '');
        setBiaya(tersimpanAwal.biayaRujukan !== null ? String(tersimpanAwal.biayaRujukan) : '');
        setRingkasan(tersimpanAwal.ringkasanPasien ?? '');
        setInfo('Hasil konsultasi sudah pernah disimpan. Perubahan akan memperbarui rekaman sebelumnya.');
    }, [data.id]);

    const kodeTerpilih: Icd10Item | null = daftarIcd10.find((item) => item.kode === kodeIcd) ?? null;
    const kataKunci = pencarian.trim().toLowerCase();
    const hasilPencarian = kataKunci
        ? daftarIcd10.filter((item) => item.kode.toLowerCase().includes(kataKunci) || item.nama.toLowerCase().includes(kataKunci))
        : daftarIcd10;

    const rujuk = keputusan === 'rujuk';
    const metaMode = modeMeta[data.mode];
    const IkonMode = metaMode.ikon;
    const biayaAngka = biaya ? Number(biaya) : null;

    function pilihIcd(item: Icd10Item) {
        setKodeIcd(item.kode);
        setPencarian('');
        setErrors((previous) => ({ ...previous, icd: undefined }));
    }

    function hapusIcd() {
        setKodeIcd('');
        setPencarian('');
    }

    function pilihKeputusan(nilai: Exclude<Keputusan, ''>) {
        setKeputusan(nilai);
        setErrors((previous) => ({ ...previous, keputusan: undefined, alasan: undefined, biaya: undefined }));
    }

    function kirimHasil(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const kesalahan: HasilErrors = {};
        const item = daftarIcd10.find((icd) => icd.kode === kodeIcd);
        const saranBersih = saran.trim();
        const alasanBersih = alasan.trim();
        let biayaFinal: number | null = null;

        if (!item) {
            kesalahan.icd = 'Pilih satu diagnosis ICD-10 dari daftar.';
        }

        if (saranBersih.length < 20) {
            kesalahan.saran = 'Tulis saran minimal 20 karakter agar jelas untuk puskesmas dan pasien.';
        }

        if (keputusan === '') {
            kesalahan.keputusan = 'Keputusan rujuk atau tidak wajib dipilih.';
        }

        if (keputusan === 'rujuk') {
            if (alasanBersih.length < 15) {
                kesalahan.alasan = 'Alasan rujukan minimal 15 karakter.';
            }

            if (biayaAngka === null || !Number.isFinite(biayaAngka) || biayaAngka <= 0) {
                kesalahan.biaya = 'Isi estimasi biaya rujukan lebih dari nol.';
            } else {
                biayaFinal = Math.round(biayaAngka);
            }
        }

        setErrors(kesalahan);

        if (Object.keys(kesalahan).length > 0) {
            setInfo('Beberapa isian belum lengkap. Periksa kembali bagian yang ditandai.');
            return;
        }

        if (!item) {
            return;
        }

        const rekaman: HasilTersimpan = {
            konsultasiId: data.id,
            kodeIcd: item.kode,
            namaIcd: item.nama,
            saran: saranBersih,
            keputusanRujuk: keputusan === 'rujuk',
            alasanRujuk: keputusan === 'rujuk' ? alasanBersih : null,
            biayaRujukan: biayaFinal,
            ringkasanPasien: ringkasan.trim().length > 0 ? ringkasan.trim() : null,
            waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        };

        const berhasil = simpanHasil(rekaman);

        setTersimpan(rekaman);
        setSelesai(true);
        setInfo(
            berhasil
                ? 'Hasil konsultasi tersimpan dan siap diteruskan ke perawat serta dokter umum.'
                : 'Hasil tampil pada sesi ini, tetapi penyimpanan di perangkat gagal. Salin hasil sebelum menutup halaman.',
        );
    }

    const tandaVital: { label: string; nilai: string; satuan: string; ikon: LucideIcon }[] = [
        { label: 'Berat', nilai: String(data.skrining.beratBadan), satuan: 'kg', ikon: Scale },
        { label: 'Tinggi', nilai: String(data.skrining.tinggiBadan), satuan: 'cm', ikon: Ruler },
        {
            label: 'Tekanan darah',
            nilai: `${data.skrining.sistol}/${data.skrining.diastol}`,
            satuan: 'mmHg',
            ikon: Activity,
        },
        { label: 'Suhu', nilai: angkaDesimal(data.skrining.suhu), satuan: '°C', ikon: Thermometer },
        { label: 'Nadi', nilai: String(data.skrining.nadi), satuan: 'bpm', ikon: HeartPulse },
        { label: 'SpO₂', nilai: String(data.skrining.spo2), satuan: '%', ikon: Wind },
    ];

    const daftarPeriksa = [
        { label: 'Diagnosis ICD-10 dipilih', selesai: Boolean(kodeTerpilih) },
        { label: 'Saran dan tindak lanjut terisi', selesai: saran.trim().length >= 20 },
        { label: 'Keputusan rujuk ditentukan', selesai: keputusan !== '' },
        ...(rujuk
            ? [
                  { label: 'Alasan rujukan terisi', selesai: alasan.trim().length >= 15 },
                  { label: 'Estimasi biaya rujukan terisi', selesai: biayaAngka !== null && biayaAngka > 0 },
              ]
            : []),
    ];

    return (
        <SpesialisAppLayout
            active="permintaan"
            title={`Isi hasil konsultasi — ${data.pasien.nama}`}
            description="Catat diagnosis ICD-10, saran, dan keputusan rujuk setelah konsultasi spesialis selesai."
        >
            <Head title={`Hasil konsultasi ${data.pasien.nama}`} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={`/spesialis/konsultasi/${data.id}`}
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke ruang konsultasi
                </Link>
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                        {data.nomor}
                    </span>
                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold">
                        <IkonMode className="size-3" aria-hidden="true" />
                        {metaMode.label}
                    </span>
                </div>
            </div>

            {info && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-info/30 bg-tk-info/10 mb-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3"
                >
                    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[var(--tk-text)]">
                        <Info className="text-tk-info mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        {info}
                    </p>
                    <button
                        type="button"
                        onClick={() => setInfo(null)}
                        aria-label="Tutup informasi"
                        className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            )}

            {tersimpan && !selesai && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-4 py-3">
                    <p className="flex items-center gap-2 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                        <CheckCircle2 className="text-tk-success size-4 shrink-0" aria-hidden="true" />
                        Hasil tersimpan {tersimpan.waktu}. Formulir sudah terisi otomatis.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSelesai(true)}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3 text-[10px] font-bold transition-colors hover:bg-[var(--tk-glass)]"
                    >
                        Lihat ringkasan
                        <ChevronRight className="size-3" aria-hidden="true" />
                    </button>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    {selesai && tersimpan ? (
                        <section aria-labelledby="hasil-tersimpan" className={cn('overflow-hidden rounded-[26px]', glass)}>
                            <div className={cn('relative overflow-hidden p-6 text-center', bannerGradient)}>
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-12 -right-8 size-40 rounded-full bg-white/25 blur-xl"
                                />
                                <div className="relative">
                                    <span className="text-tk-accent mx-auto grid size-14 place-items-center rounded-full bg-white/90">
                                        <CheckCircle2 className="size-7" aria-hidden="true" />
                                    </span>
                                    <h1 className="mt-3 text-xl leading-tight font-extrabold text-white">Hasil konsultasi tersimpan</h1>
                                    <p className="mt-1.5 text-xs text-white/85">
                                        {data.pasien.nama} · {data.nomor}
                                    </p>
                                    <p className="mt-1 text-[10px] text-white/70">{tersimpan.waktu}</p>
                                </div>
                            </div>

                            <div className="space-y-4 p-5 md:p-6">
                                <div>
                                    <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Diagnosis ICD-10</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="bg-tk-deep text-tk-mint inline-flex items-center rounded-full px-3 py-1.5 font-mono text-[11px] font-bold">
                                            {tersimpan.kodeIcd}
                                        </span>
                                        <p className="text-sm font-bold">{tersimpan.namaIcd}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                        Saran dan tindak lanjut
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed whitespace-pre-line text-[var(--tk-text)]">{tersimpan.saran}</p>
                                </div>

                                {tersimpan.ringkasanPasien && (
                                    <div className="bg-tk-green-500/[0.08] dark:bg-tk-accent/[0.08] rounded-2xl p-3.5">
                                        <p className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">
                                            Ringkasan untuk pasien
                                        </p>
                                        <p className="mt-1.5 text-xs leading-relaxed">{tersimpan.ringkasanPasien}</p>
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        'flex items-start gap-3 rounded-2xl p-4',
                                        tersimpan.keputusanRujuk ? 'bg-tk-warning/10' : 'bg-tk-success/10',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid size-9 shrink-0 place-items-center rounded-full',
                                            tersimpan.keputusanRujuk ? 'bg-tk-warning/15 text-tk-warning' : 'bg-tk-success/15 text-tk-success',
                                        )}
                                    >
                                        {tersimpan.keputusanRujuk ? (
                                            <MapPin className="size-4" aria-hidden="true" />
                                        ) : (
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        )}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold">
                                            {tersimpan.keputusanRujuk ? 'Pasien perlu dirujuk' : 'Tidak perlu dirujuk'}
                                        </p>
                                        {tersimpan.keputusanRujuk ? (
                                            <>
                                                <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">{tersimpan.alasanRujuk}</p>
                                                <p className="mt-1.5 text-[11px] font-semibold">
                                                    Estimasi biaya rujukan {formatRupiah.format(tersimpan.biayaRujukan ?? 0)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mt-1 text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                                Kasus tercatat sebagai rujukan terhindarkan. Estimasi hemat {formatRupiah.format(BIAYA_TERHINDARKAN)}{' '}
                                                dan {JAM_TERHINDARKAN} jam perjalanan.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelesai(false)}
                                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        <RotateCcw className="size-3.5" aria-hidden="true" />
                                        Ubah hasil
                                    </button>
                                    <Link
                                        href="/spesialis/permintaan"
                                        className="bg-tk-deep text-tk-mint inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold"
                                    >
                                        Daftar permintaan
                                        <ChevronRight className="size-3.5" aria-hidden="true" />
                                    </Link>
                                    <Link
                                        href="/spesialis"
                                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        Beranda
                                    </Link>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <form onSubmit={kirimHasil} noValidate className="grid gap-5">
                            <section aria-labelledby="icd10" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full">
                                        <Stethoscope className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="icd10" className="text-[15px] font-bold">
                                            Diagnosis ICD-10
                                        </h2>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            Wajib diisi. Cari berdasarkan kode atau nama diagnosis.
                                        </p>
                                    </div>
                                </div>

                                {kodeTerpilih && (
                                    <div className="bg-tk-green-500/[0.08] dark:bg-tk-accent/[0.08] mt-4 flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="bg-tk-deep text-tk-mint shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold">
                                                {kodeTerpilih.kode}
                                            </span>
                                            <p className="truncate text-xs font-semibold">{kodeTerpilih.nama}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={hapusIcd}
                                            aria-label="Hapus diagnosis terpilih"
                                            className="grid size-7 shrink-0 place-items-center rounded-full text-[var(--tk-muted)] hover:text-[var(--tk-text)]"
                                        >
                                            <X className="size-3.5" aria-hidden="true" />
                                        </button>
                                    </div>
                                )}

                                <div className="relative mt-3">
                                    <Search
                                        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        id="pencarian-icd"
                                        value={pencarian}
                                        onChange={(event) => setPencarian(event.target.value)}
                                        placeholder="Contoh: J06.9 atau infeksi saluran napas"
                                        className="h-11 rounded-2xl pl-10 text-xs"
                                        autoComplete="off"
                                        aria-describedby="icd-bantuan"
                                    />
                                </div>
                                <p id="icd-bantuan" className="mt-1.5 text-[10px] text-[var(--tk-muted)]">
                                    {hasilPencarian.length} diagnosis tersedia
                                    {kataKunci ? ` untuk “${pencarian.trim()}”` : ' pada daftar master'}.
                                </p>

                                <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[var(--tk-glass-border)]">
                                    {hasilPencarian.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-[11px] text-[var(--tk-muted)]">
                                            Diagnosis tidak ditemukan. Hubungi admin untuk menambah kode ICD-10.
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-[var(--tk-glass-border)]">
                                            {hasilPencarian.map((item) => {
                                                const dipilih = item.kode === kodeIcd;

                                                return (
                                                    <li key={item.kode}>
                                                        <button
                                                            type="button"
                                                            onClick={() => pilihIcd(item)}
                                                            aria-pressed={dipilih}
                                                            className={cn(
                                                                'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--tk-page-alt)]',
                                                                dipilih && 'bg-[var(--tk-page-alt)]',
                                                            )}
                                                        >
                                                            <span className="bg-tk-deep text-tk-mint w-16 shrink-0 rounded-md px-2 py-1 text-center font-mono text-[10px] font-bold">
                                                                {item.kode}
                                                            </span>
                                                            <span className="min-w-0 flex-1 text-[11px] leading-snug">{item.nama}</span>
                                                            {dipilih && (
                                                                <CheckCircle2 className="text-tk-success size-4 shrink-0" aria-hidden="true" />
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                                <InputError message={errors.icd} className="mt-2" />
                            </section>

                            <section aria-labelledby="saran" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-info/[0.12] text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                                        <FileText className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="saran" className="text-[15px] font-bold">
                                            Saran dan tindak lanjut
                                        </h2>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            Wajib diisi. Saran diteruskan ke perawat dan dokter umum puskesmas.
                                        </p>
                                    </div>
                                </div>

                                <label htmlFor="saran-teks" className="mt-4 inline-block text-[11px] font-semibold">
                                    Saran klinis <span className="text-tk-danger">*</span>
                                </label>
                                <textarea
                                    id="saran-teks"
                                    rows={5}
                                    value={saran}
                                    onChange={(event) => {
                                        setSaran(event.target.value);
                                        setErrors((previous) => ({ ...previous, saran: undefined }));
                                    }}
                                    placeholder="Contoh: Terapi simtomatik sesuai dosis, kontrol ulang 3 hari, edukasi tanda bahaya pneumonia."
                                    className={textareaClass}
                                    aria-invalid={Boolean(errors.saran)}
                                    aria-describedby="saran-bantuan"
                                />
                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                    <p id="saran-bantuan" className="text-[10px] text-[var(--tk-muted)]">
                                        Minimal 20 karakter. Tuliskan dosis dan jadwal kontrol bila ada.
                                    </p>
                                    <span
                                        className={cn(
                                            'shrink-0 text-[10px] font-semibold',
                                            saran.trim().length >= 20 ? 'text-tk-success' : 'text-[var(--tk-muted)]',
                                        )}
                                    >
                                        {saran.trim().length}/20
                                    </span>
                                </div>
                                <InputError message={errors.saran} className="mt-1" />

                                <label htmlFor="ringkasan-teks" className="mt-4 inline-block text-[11px] font-semibold">
                                    Ringkasan untuk pasien <span className="text-[10px] font-normal text-[var(--tk-muted)]">(opsional)</span>
                                </label>
                                <textarea
                                    id="ringkasan-teks"
                                    rows={3}
                                    value={ringkasan}
                                    onChange={(event) => setRingkasan(event.target.value)}
                                    placeholder="Bahasa sederhana, misalnya: Demam karena infeksi ringan. Minum obat sesuai aturan dan kembali bila sesak."
                                    className={textareaClass}
                                />
                            </section>

                            <section aria-labelledby="keputusan-rujuk" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                                <div className="flex items-start gap-3">
                                    <span className="bg-tk-warning/15 text-tk-warning grid size-10 shrink-0 place-items-center rounded-full">
                                        <ClipboardList className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 id="keputusan-rujuk" className="text-[15px] font-bold">
                                            Keputusan rujuk
                                        </h2>
                                        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            Wajib dipilih. Keputusan ini masuk ke dasbor rujukan terhindarkan.
                                        </p>
                                    </div>
                                </div>

                                <div role="radiogroup" aria-label="Keputusan rujuk" className="mt-4 grid gap-2.5 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={keputusan === 'tidak_rujuk'}
                                        onClick={() => pilihKeputusan('tidak_rujuk')}
                                        className={cn(
                                            'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                                            keputusan === 'tidak_rujuk'
                                                ? 'border-tk-success bg-tk-success/10'
                                                : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                        )}
                                    >
                                        <span className="bg-tk-success/15 text-tk-success grid size-8 shrink-0 place-items-center rounded-full">
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xs font-bold">Tidak perlu dirujuk</span>
                                            <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Tindakan dilanjutkan di puskesmas.
                                            </span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={keputusan === 'rujuk'}
                                        onClick={() => pilihKeputusan('rujuk')}
                                        className={cn(
                                            'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                                            keputusan === 'rujuk'
                                                ? 'border-tk-warning bg-tk-warning/10'
                                                : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                        )}
                                    >
                                        <span className="bg-tk-warning/15 text-tk-warning grid size-8 shrink-0 place-items-center rounded-full">
                                            <MapPin className="size-4" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xs font-bold">Perlu dirujuk</span>
                                            <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Perlu tindakan di RS daratan.
                                            </span>
                                        </span>
                                    </button>
                                </div>
                                <InputError message={errors.keputusan} className="mt-2" />

                                {rujuk && (
                                    <div className="mt-4 grid gap-3">
                                        <div>
                                            <label htmlFor="alasan-rujuk" className="inline-block text-[11px] font-semibold">
                                                Alasan rujukan <span className="text-tk-danger">*</span>
                                            </label>
                                            <textarea
                                                id="alasan-rujuk"
                                                rows={3}
                                                value={alasan}
                                                onChange={(event) => {
                                                    setAlasan(event.target.value);
                                                    setErrors((previous) => ({ ...previous, alasan: undefined }));
                                                }}
                                                placeholder="Contoh: Perlu pemeriksaan laboratorium dan rontgen toraks yang tidak tersedia di puskesmas."
                                                className={textareaClass}
                                                aria-invalid={Boolean(errors.alasan)}
                                            />
                                            <InputError message={errors.alasan} className="mt-1" />
                                        </div>

                                        <div>
                                            <label htmlFor="biaya-rujuk" className="inline-block text-[11px] font-semibold">
                                                Estimasi biaya rujukan <span className="text-tk-danger">*</span>
                                            </label>
                                            <div className="relative mt-2">
                                                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[11px] font-semibold text-[var(--tk-muted)]">
                                                    Rp
                                                </span>
                                                <Input
                                                    id="biaya-rujuk"
                                                    inputMode="numeric"
                                                    value={biaya}
                                                    onChange={(event) => {
                                                        setBiaya(event.target.value.replace(/[^0-9]/g, ''));
                                                        setErrors((previous) => ({ ...previous, biaya: undefined }));
                                                    }}
                                                    placeholder="1500000"
                                                    className="h-11 rounded-2xl pl-10 text-xs"
                                                    aria-invalid={Boolean(errors.biaya)}
                                                />
                                            </div>
                                            <p className="mt-1.5 text-[10px] text-[var(--tk-muted)]">
                                                {biayaAngka !== null && biayaAngka > 0
                                                    ? `Tercatat ${formatRupiah.format(biayaAngka)} untuk transportasi dan biaya RS.`
                                                    : 'Perkiraan biaya kapal, transportasi darat, dan biaya RS.'}
                                            </p>
                                            <InputError message={errors.biaya} className="mt-1" />
                                        </div>

                                        <p className="bg-tk-warning/10 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                            <AlertTriangle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                            Rujukan sebaiknya hanya dipilih bila tindakan benar-benar tidak bisa dilakukan di puskesmas.
                                        </p>
                                    </div>
                                )}

                                {keputusan === 'tidak_rujuk' && (
                                    <div className="bg-tk-success/10 mt-4 flex items-start gap-3 rounded-2xl p-3.5">
                                        <span className="bg-tk-success/15 text-tk-success grid size-8 shrink-0 place-items-center rounded-full">
                                            <ShieldCheck className="size-4" aria-hidden="true" />
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-bold">Kasus dihitung sebagai rujukan terhindarkan</p>
                                            <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                                Estimasi hemat {formatRupiah.format(BIAYA_TERHINDARKAN)} dan {JAM_TERHINDARKAN} jam perjalanan
                                                pulang-pergi bagi pasien.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <div className={cn('flex flex-col gap-3 rounded-[24px] p-5 sm:flex-row sm:items-center sm:justify-between', glass)}>
                                <p className="flex items-start gap-2 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    Setelah disimpan, hasil langsung terlihat oleh perawat, dokter umum, dan pasien.
                                </p>
                                <button
                                    type="submit"
                                    className="bg-tk-deep text-tk-mint inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold transition-transform active:scale-[0.98]"
                                >
                                    <Save className="size-4" aria-hidden="true" />
                                    Simpan hasil konsultasi
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <aside className="grid min-w-0 content-start gap-4">
                    <section aria-labelledby="pasien-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-11 shrink-0 place-items-center rounded-full text-sm font-extrabold">
                                {data.pasien.nama
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((bagian) => bagian.charAt(0))
                                    .join('')}
                            </span>
                            <div className="min-w-0">
                                <h2 id="pasien-hasil" className="truncate text-sm font-bold">
                                    {data.pasien.nama}
                                </h2>
                                <p className="text-[10px] text-[var(--tk-muted)]">
                                    {data.pasien.usia} tahun · {data.pasien.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {data.pasien.noRm}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-4 grid gap-2 text-[10px]">
                            <div className="flex items-start gap-1.5">
                                <CalendarDays className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="font-semibold">{data.jadwal}</dd>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <Phone className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="text-[var(--tk-muted)]">{data.pasien.telepon}</dd>
                            </div>
                            <div className="flex items-start gap-1.5">
                                <UserRound className="mt-0.5 size-3 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                <dd className="text-[var(--tk-muted)]">Pengirim {data.dokterPengirim}</dd>
                            </div>
                        </dl>

                        <p className="mt-3 rounded-xl bg-[var(--tk-page-alt)] px-3 py-2.5 text-[10px] leading-relaxed">
                            <span className="font-bold">Keluhan: </span>
                            {data.keluhan}
                        </p>
                    </section>

                    <section aria-labelledby="skrining-hasil" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-2">
                            <h2 id="skrining-hasil" className="text-[11px] font-bold">
                                Data skrining
                            </h2>
                            {data.skrining.tandaBahaya && (
                                <span className="bg-tk-danger/15 text-tk-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold">
                                    <AlertTriangle className="size-2.5" aria-hidden="true" />
                                    Tanda bahaya
                                </span>
                            )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {tandaVital.map((vital) => {
                                const Ikon = vital.ikon;

                                return (
                                    <div key={vital.label} className="rounded-xl bg-[var(--tk-page-alt)] px-2.5 py-2">
                                        <p className="flex items-center gap-1 text-[9px] text-[var(--tk-muted)]">
                                            <Ikon className="size-2.5" aria-hidden="true" />
                                            {vital.label}
                                        </p>
                                        <p className="mt-0.5 text-xs font-bold">
                                            {vital.nilai}
                                            <span className="ml-0.5 text-[9px] font-medium text-[var(--tk-muted)]">{vital.satuan}</span>
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="mt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.skrining.catatan}</p>
                    </section>

                    <section aria-labelledby="review-hasil" className={cn('rounded-[20px] p-4', glass)}>
                        <h2 id="review-hasil" className="text-[11px] font-bold">
                            Review dokter umum
                        </h2>
                        <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{data.reviewUmum.catatan}</p>
                        <p className="mt-2 text-[9px] text-[var(--tk-muted)]">
                            {data.reviewUmum.dokter} · {data.reviewUmum.waktu}
                        </p>
                    </section>

                    <section aria-labelledby="periksa-hasil" className={cn('rounded-[20px] p-4', glass)}>
                        <h2 id="periksa-hasil" className="text-[11px] font-bold">
                            Sebelum menyimpan
                        </h2>
                        <ul className="mt-2.5 grid gap-2">
                            {daftarPeriksa.map((item) => (
                                <li key={item.label} className="flex items-start gap-2 text-[10px] leading-snug">
                                    {item.selesai ? (
                                        <CheckCircle2 className="text-tk-success mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="mt-0.5 size-3.5 shrink-0 rounded-full border border-[var(--tk-glass-border)]"
                                        />
                                    )}
                                    <span className={item.selesai ? 'font-semibold' : 'text-[var(--tk-muted)]'}>{item.label}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Link
                        href={`/spesialis/konsultasi/${data.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                    >
                        <ChevronRight className="size-3.5 rotate-180" aria-hidden="true" />
                        Ruang konsultasi
                    </Link>
                </aside>
            </div>
        </SpesialisAppLayout>
    );
}
