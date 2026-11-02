import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    Info,
    MapPin,
    Search,
    Send,
    ShieldCheck,
    Stethoscope,
    UserPlus,
    UserRound,
    Users,
    Wifi,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { jadwalDokter, spesialisasiFilters, type Spesialisasi, type StatusJadwal } from '@/data/jadwal-dokter';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

interface PasienRingkas {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    nik: string;
    noRm: string;
    alamat: string;
    telepon: string;
    punyaAkun: boolean;
}

interface KonsultasiBaruPerawatProps {
    pasien: PasienRingkas[];
}

type FilterPasien = 'SEMUA' | 'TANPA_AKUN' | 'PUNYA_AKUN';
type FormErrors = Partial<Record<'pasien' | 'dokter' | 'slot' | 'keluhan' | 'persetujuan', string>>;

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-32 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const nomorPermintaan = 'KNS-2026-0143';

const durasiKeluhan = ['Kurang dari 1 hari', '1–3 hari', '4–7 hari', 'Lebih dari 1 minggu'];

const langkahSetelahKirim = [
    'Permintaan masuk dengan status Menunggu skrining.',
    'Lengkapi tanda vital dan keluhan utama pada form skrining.',
    'Dokter umum mereview hasil sebelum diteruskan ke spesialis.',
    'Spesialis mengonfirmasi jadwal dan konsultasi dapat dimulai.',
];

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

function maskNik(nik: string): string {
    if (nik.length < 8) {
        return nik;
    }

    return `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;
}

function SectionHeading({ step, title, description }: { step: number; title: string; description: string }) {
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

function InfoRow({ icon: Icon, label, value, caption }: { icon: LucideIcon; label: string; value: string; caption?: string }) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                <Icon className="size-3" aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 text-[11px] font-bold">{value}</dd>
            {caption && <dd className="mt-0.5 text-[10px] text-[var(--tk-muted)]">{caption}</dd>}
        </div>
    );
}

export default function KonsultasiBaruPerawat({ pasien }: KonsultasiBaruPerawatProps) {
    const [q, setQ] = useState('');
    const [filterPasien, setFilterPasien] = useState<FilterPasien>('TANPA_AKUN');
    const [pasienId, setPasienId] = useState<number | null>(null);
    const [filterSpesialisasi, setFilterSpesialisasi] = useState<Spesialisasi | 'Semua'>('Semua');
    const [dokterId, setDokterId] = useState<number | null>(null);
    const [slot, setSlot] = useState('');
    const [keluhan, setKeluhan] = useState('');
    const [durasi, setDurasi] = useState(durasiKeluhan[1]);
    const [setuju, setSetuju] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [berhasil, setBerhasil] = useState(false);

    const jumlahTanpaAkun = useMemo(() => pasien.filter((item) => !item.punyaAkun).length, [pasien]);

    const pasienTersaring = useMemo(() => {
        const kataKunci = q.trim().toLowerCase();

        return pasien.filter((item) => {
            const cocokFilter =
                filterPasien === 'SEMUA' || (filterPasien === 'TANPA_AKUN' && !item.punyaAkun) || (filterPasien === 'PUNYA_AKUN' && item.punyaAkun);
            const cocokKataKunci =
                kataKunci === '' || [item.nama, item.nik, item.noRm, item.alamat].some((nilai) => nilai.toLowerCase().includes(kataKunci));

            return cocokFilter && cocokKataKunci;
        });
    }, [pasien, q, filterPasien]);

    const pasienTerpilih = pasienId ? (pasien.find((item) => item.id === pasienId) ?? null) : null;
    const dokterTerpilih = dokterId ? (jadwalDokter.find((item) => item.id === dokterId) ?? null) : null;
    const dokterTersaring =
        filterSpesialisasi === 'Semua' ? jadwalDokter : jadwalDokter.filter((dokter) => dokter.spesialisasi === filterSpesialisasi);
    const jumlahDokterTersedia = dokterTersaring.filter((dokter) => dokter.status === 'tersedia').length;

    useEffect(() => {
        if (berhasil) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [berhasil]);

    function pilihPasien(id: number) {
        setPasienId(id);
        setErrors((previous) => ({ ...previous, pasien: undefined }));
    }

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

        if (!pasienTerpilih) {
            nextErrors.pasien = 'Pilih pasien yang akan diajukan konsultasi.';
        }

        if (!dokterTerpilih) {
            nextErrors.dokter = 'Pilih dokter spesialis terlebih dahulu.';
        } else if (!slot) {
            nextErrors.slot = 'Pilih salah satu slot jadwal yang tersedia.';
        }

        if (keluhan.trim().length < 10) {
            nextErrors.keluhan = 'Tulis keluhan minimal 10 karakter agar skrining lebih akurat.';
        }

        if (!setuju) {
            nextErrors.persetujuan = 'Konfirmasi persetujuan pasien sebelum mengirim permintaan.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setBerhasil(true);
    }

    function buatPermintaanLagi() {
        setBerhasil(false);
        setQ('');
        setFilterPasien('TANPA_AKUN');
        setPasienId(null);
        setFilterSpesialisasi('Semua');
        setDokterId(null);
        setSlot('');
        setKeluhan('');
        setDurasi(durasiKeluhan[1]);
        setSetuju(false);
        setErrors({});
    }

    if (berhasil && pasienTerpilih && dokterTerpilih && slot) {
        return (
            <PerawatAppLayout
                active="antrean"
                title="Permintaan terkirim"
                description="Permintaan konsultasi pasien sudah masuk antrean skrining perawat."
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
                                <h1 className="text-tk-deep mt-1 text-2xl leading-tight font-extrabold">Konsultasi berhasil diajukan</h1>
                                <p className="text-tk-deep/75 mx-auto mt-2 max-w-md text-xs leading-relaxed">
                                    Nomor <span className="font-bold">{nomorPermintaan}</span> atas nama{' '}
                                    <span className="font-bold">{pasienTerpilih.nama}</span> sudah masuk antrean.
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
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Pasien</dt>
                                    <dd className="mt-1 font-bold">{pasienTerpilih.nama}</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">
                                        {pasienTerpilih.usia} tahun · {pasienTerpilih.noRm}
                                    </dd>
                                </div>
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
                                <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.1em] text-[var(--tk-muted)] uppercase">Sumber</dt>
                                    <dd className="mt-1 font-bold">Didaftarkan perawat</dd>
                                    <dd className="text-[11px] text-[var(--tk-muted)]">
                                        {pasienTerpilih.punyaAkun ? 'Pasien memiliki akun' : 'Pasien tanpa akun'}
                                    </dd>
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

                            <div className="bg-tk-warning/10 mt-5 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <AlertCircle className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                Permintaan belum bisa dikirim ke spesialis sebelum skrining lengkap dan lolos review dokter umum.
                            </div>

                            <div className="mt-5 grid gap-2 sm:flex">
                                <Link
                                    href={`/perawat/skrining/${pasienTerpilih.id}`}
                                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
                                >
                                    Lanjut isi skrining
                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                </Link>
                                <Link
                                    href="/perawat/permintaan"
                                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Kembali ke antrean
                                </Link>
                                <button
                                    type="button"
                                    onClick={buatPermintaanLagi}
                                    className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                >
                                    Ajukan lagi
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </PerawatAppLayout>
        );
    }

    return (
        <PerawatAppLayout
            active="antrean"
            title="Ajukan konsultasi pasien"
            description="Daftarkan permintaan atas nama pasien, termasuk pasien tanpa akun, lalu lanjutkan ke skrining pada hari yang sama."
        >
            <Head title="Ajukan konsultasi" />

            <div className="mb-4">
                <Link
                    href="/perawat/permintaan"
                    className="inline-flex min-h-9 items-center gap-1.5 text-[11px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                    Kembali ke daftar permintaan
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
                <form id="form-konsultasi-baru" onSubmit={kirimPermintaan} noValidate className="grid min-w-0 content-start gap-5">
                    <section aria-labelledby="langkah-pasien" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <SectionHeading
                                step={1}
                                title="Pilih pasien"
                                description={`Cari pasien terdaftar. Saat ini ada ${jumlahTanpaAkun} pasien tanpa akun yang bisa dilayani perawat.`}
                            />
                            <Link
                                href="/perawat/pasien"
                                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--tk-glass-border)] px-3.5 text-[10px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                            >
                                <UserPlus className="size-3.5" aria-hidden="true" />
                                Pasien baru
                            </Link>
                        </div>

                        <div className="relative mt-5">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Cari nama, NIK, no. RM, atau alamat..."
                                aria-label="Cari pasien berdasarkan nama, NIK, nomor rekam medis, atau alamat"
                                className={inputClass}
                            />
                        </div>

                        <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {[
                                { key: 'TANPA_AKUN' as const, label: 'Tanpa akun' },
                                { key: 'SEMUA' as const, label: 'Semua pasien' },
                                { key: 'PUNYA_AKUN' as const, label: 'Punya akun' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    aria-pressed={filterPasien === item.key}
                                    onClick={() => setFilterPasien(item.key)}
                                    className={cn(
                                        'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                        filterPasien === item.key
                                            ? 'bg-tk-accent text-tk-deep border-transparent'
                                            : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <fieldset className="mt-3">
                            <legend className="sr-only">Daftar pasien</legend>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Hasil pencarian</p>
                                <span aria-live="polite" className="text-[10px] text-[var(--tk-muted)]">
                                    {pasienTersaring.length} pasien
                                </span>
                            </div>

                            {pasienTersaring.length === 0 ? (
                                <div className="mt-2 rounded-2xl border border-dashed border-[var(--tk-glass-border)] px-5 py-8 text-center">
                                    <span className="grid size-11 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                                        <Users className="size-5" aria-hidden="true" />
                                    </span>
                                    <p className="mt-3 text-xs font-bold">Pasien tidak ditemukan</p>
                                    <p className="mx-auto mt-1 max-w-xs text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Ubah kata kunci atau filter, atau daftarkan pasien baru terlebih dahulu.
                                    </p>
                                    <Link
                                        href="/perawat/pasien"
                                        className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[10px] font-bold"
                                    >
                                        <UserPlus className="size-3.5" aria-hidden="true" />
                                        Daftarkan pasien
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-2 grid max-h-[340px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                                    {pasienTersaring.map((item) => {
                                        const terpilih = item.id === pasienId;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                aria-pressed={terpilih}
                                                onClick={() => pilihPasien(item.id)}
                                                className={cn(
                                                    'rounded-[18px] border p-3.5 text-left transition-all',
                                                    terpilih
                                                        ? 'border-tk-accent bg-tk-accent/[0.08] ring-tk-accent/30 ring-2'
                                                        : 'hover:border-tk-accent/50 border-[var(--tk-glass-border)]',
                                                )}
                                            >
                                                <div className="flex items-start gap-2.5">
                                                    <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold">
                                                        {inisial(item.nama)}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-start gap-1.5">
                                                            <p className="min-w-0 flex-1 truncate text-xs font-bold">{item.nama}</p>
                                                            {terpilih && (
                                                                <CheckCircle2
                                                                    className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-3.5 shrink-0"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                            {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {item.noRm}
                                                        </p>
                                                        <p className="mt-0.5 truncate text-[10px] text-[var(--tk-muted)]">NIK {maskNik(item.nik)}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--tk-glass-border)] pt-2">
                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-[9px] font-bold',
                                                            item.punyaAkun ? 'bg-tk-info/15 text-tk-info' : 'bg-tk-warning/15 text-tk-warning',
                                                        )}
                                                    >
                                                        {item.punyaAkun ? 'Punya akun' : 'Tanpa akun'}
                                                    </span>
                                                    <span className="truncate text-[9px] text-[var(--tk-muted)]">{item.alamat}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </fieldset>

                        <InputError message={errors.pasien} className="text-tk-danger mt-3 text-[11px]" />

                        {pasienTerpilih && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <p>
                                    Pasien terpilih: <span className="font-bold text-[var(--tk-text)]">{pasienTerpilih.nama}</span> (
                                    {pasienTerpilih.telepon}).{' '}
                                    {pasienTerpilih.punyaAkun
                                        ? 'Pasien punya akun, tetapi perawat tetap dapat membuat permintaan atas namanya.'
                                        : 'Pasien tanpa akun tetap dapat dilayani; seluruh hasil akan dicatat pada rekam medis puskesmas.'}
                                </p>
                            </div>
                        )}
                    </section>

                    <section aria-labelledby="langkah-dokter" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeading
                            step={2}
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

                        {dokterTerpilih && (
                            <div className="mt-4 rounded-2xl bg-[var(--tk-page-alt)] p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--tk-muted)] uppercase">Pilih slot</p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--tk-glass)] px-2.5 py-1 text-[9px] font-bold text-[var(--tk-muted)]">
                                        <Clock className="size-3" aria-hidden="true" />
                                        WIT
                                    </span>
                                </div>
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
                                <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                    {dokterTerpilih.hariTerdekat} · {slot || 'Pilih slot'} WIT. Jadwal final tetap dikonfirmasi dokter spesialis.
                                </p>
                                <InputError message={errors.slot} className="text-tk-danger mt-2 text-[11px]" />
                            </div>
                        )}
                    </section>

                    <section aria-labelledby="langkah-keluhan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeading
                            step={3}
                            title="Catat keluhan pasien"
                            description="Tulis keluhan utama dan durasinya. Data ini akan tampil pada skrining dan review dokter."
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
                                    className={cn(textareaClass, errors.keluhan && 'border-tk-danger focus:ring-tk-danger/30')}
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
                                Pasien hanya boleh mengubah keluhan subjektifnya. Perawat yang mengisi dan mengubah data skrining.
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="langkah-konfirmasi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <SectionHeading
                            step={4}
                            title="Konfirmasi dan kirim"
                            description="Periksa kembali data. Permintaan akan masuk antrean skrining dengan status Menunggu skrining."
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
                                    Pasien atau pendampingnya sudah menyetujui data keluhan dan hasil skrining dibagikan kepada dokter umum dan dokter
                                    spesialis yang menangani permintaan ini.
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
                                    href="/perawat/permintaan"
                                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--tk-glass-border)] px-5 text-xs font-semibold text-[var(--tk-text)] transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    Batal
                                </Link>
                            </div>

                            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                Setelah dikirim, lanjutkan skrining pada hari yang sama agar permintaan tidak kedaluwarsa dalam 3 hari.
                            </p>
                        </div>
                    </section>
                </form>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="ringkasan-konsultasi" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-center justify-between gap-3">
                            <h2 id="ringkasan-konsultasi" className="text-[15px] font-bold">
                                Ringkasan permintaan
                            </h2>
                            <span className="bg-tk-warning/15 text-tk-warning rounded-full px-2.5 py-1 text-[9px] font-bold">Draf</span>
                        </div>

                        <div className="mt-4 flex items-center gap-3 border-b border-[var(--tk-glass-border)] pb-4">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full text-[11px] font-extrabold">
                                {pasienTerpilih ? inisial(pasienTerpilih.nama) : <UserRound className="size-4" aria-hidden="true" />}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold">{pasienTerpilih ? pasienTerpilih.nama : 'Belum ada pasien dipilih'}</p>
                                <p className="truncate text-[10px] text-[var(--tk-muted)]">
                                    {pasienTerpilih ? `${pasienTerpilih.noRm} · ${pasienTerpilih.usia} tahun` : 'Pilih pada langkah 1'}
                                </p>
                            </div>
                        </div>

                        <dl className="mt-4 grid gap-3">
                            <InfoRow
                                icon={Stethoscope}
                                label="Dokter spesialis"
                                value={dokterTerpilih ? dokterTerpilih.nama : 'Belum dipilih'}
                                caption={dokterTerpilih ? `Spesialis ${dokterTerpilih.spesialisasi}` : undefined}
                            />
                            <InfoRow
                                icon={CalendarDays}
                                label="Jadwal"
                                value={dokterTerpilih && slot ? `${dokterTerpilih.hariTerdekat}, ${slot} WIT` : 'Belum dipilih'}
                            />
                            <InfoRow icon={Clock} label="Durasi keluhan" value={durasi} />
                            <InfoRow icon={UserRound} label="Keluhan" value={keluhan.trim() || 'Belum diisi'} />
                        </dl>

                        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            <Wifi className="text-tk-warning mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            Mode konsultasi ditentukan otomatis saat sesi dimulai. Jika sinyal lemah, konsultasi beralih ke teks dan foto.
                        </div>
                    </section>

                    <section aria-labelledby="alur-pasien-tanpa-akun" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                                <UserRound className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="alur-pasien-tanpa-akun" className="text-[15px] font-bold">
                                    Pasien tanpa akun
                                </h2>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Alur B: perawat mendaftarkan dan mengajukan.</p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Pasien tidak perlu membuat akun. Perawat mendaftarkan identitas, membuat permintaan, lalu langsung melanjutkan skrining
                            pada hari yang sama.
                        </p>
                    </section>

                    <section aria-labelledby="gerbang-skrining" className={cn('rounded-[24px] p-5', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <ShieldCheck className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="gerbang-skrining" className="text-[15px] font-bold">
                                    Skrining wajib
                                </h2>
                                <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">Gerbang sebelum ke dokter spesialis.</p>
                            </div>
                        </div>
                        <p className="mt-3 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Permintaan tidak dapat diteruskan ke spesialis sampai tanda vital, keluhan, dan catatan perawat lengkap serta lolos review
                            dokter umum.
                        </p>
                    </section>

                    <section className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                        <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                        </span>
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Pastikan identitas pasien sudah benar sebelum mengirim. Data pada halaman ini adalah data fiktif untuk prototipe
                            TeleKarang.
                        </p>
                    </section>
                </aside>
            </div>
        </PerawatAppLayout>
    );
}
