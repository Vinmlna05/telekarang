import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Info,
    Lock,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    Stethoscope,
    UserPlus,
    UserRound,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { FormEventHandler, useMemo, useState } from 'react';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PerawatAppLayout from '@/layouts/perawat/perawat-app-layout';
import { cn } from '@/lib/utils';

type FilterAkun = 'SEMUA' | 'AKUN' | 'TANPA_AKUN';
type JenisKelamin = 'L' | 'P';

interface PasienItem {
    id: number;
    nama: string;
    usia: number;
    jenisKelamin: string;
    nik: string;
    noRm: string;
    tglLahir: string;
    alamat: string;
    telepon: string;
    punyaAkun: boolean;
    email: string | null;
    kunjunganTerakhir: string;
    totalKonsultasi: number;
    terdaftarPada: string;
}

interface Ringkasan {
    total: number;
    punyaAkun: number;
    tanpaAkun: number;
    kunjunganBulanIni: number;
}

interface PasienPerawatProps {
    pasien: PasienItem[];
    ringkasan: Ringkasan;
}

interface FormPasien {
    nama: string;
    nik: string;
    tglLahir: string;
    jenisKelamin: JenisKelamin;
    alamat: string;
    telepon: string;
    punyaAkun: boolean;
    email: string;
}

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const textareaClass =
    'focus-visible:ring-tk-accent mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 py-3 text-xs leading-relaxed text-[var(--tk-text)] placeholder:text-[var(--tk-muted)] focus:ring-2 focus:outline-hidden';
const primaryButton =
    'bg-tk-green-500 hover:bg-tk-green-400 focus-visible:ring-tk-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tk-page)] disabled:pointer-events-none disabled:opacity-60';

const formAwal: FormPasien = {
    nama: '',
    nik: '',
    tglLahir: '',
    jenisKelamin: 'P',
    alamat: '',
    telepon: '',
    punyaAkun: false,
    email: '',
};

const langkahPendaftaran = [
    { label: 'Cari data', description: 'Periksa nama atau NIK agar tidak terjadi data ganda.' },
    { label: 'Daftarkan pasien', description: 'Lengkapi identitas dasar dan tentukan perlu akun atau tidak.' },
    { label: 'Ajukan konsultasi', description: 'Buat permintaan atas nama pasien lalu lanjut ke skrining.' },
];

function inisial(nama: string): string {
    return (
        nama
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

function hitungUsia(tglLahir: string): number {
    const lahir = new Date(tglLahir);

    if (Number.isNaN(lahir.getTime())) {
        return 0;
    }

    const hariIni = new Date();
    let usia = hariIni.getFullYear() - lahir.getFullYear();
    const selisihBulan = hariIni.getMonth() - lahir.getMonth();

    if (selisihBulan < 0 || (selisihBulan === 0 && hariIni.getDate() < lahir.getDate())) {
        usia--;
    }

    return Math.max(usia, 0);
}

function validasiForm(form: FormPasien, daftar: PasienItem[]): Record<string, string> {
    const errors: Record<string, string> = {};

    if (form.nama.trim().length < 3) {
        errors.nama = 'Nama minimal 3 karakter.';
    }

    if (!/^\d{16}$/.test(form.nik.trim())) {
        errors.nik = 'NIK harus 16 digit angka.';
    } else if (daftar.some((item) => item.nik === form.nik.trim())) {
        errors.nik = 'NIK sudah terdaftar.';
    }

    if (form.tglLahir === '') {
        errors.tglLahir = 'Tanggal lahir wajib diisi.';
    } else if (new Date(form.tglLahir) > new Date()) {
        errors.tglLahir = 'Tanggal lahir tidak valid.';
    }

    if (form.alamat.trim().length < 5) {
        errors.alamat = 'Alamat minimal 5 karakter.';
    }

    if (!/^[+0-9\s-]{9,20}$/.test(form.telepon.trim())) {
        errors.telepon = 'Nomor telepon tidak valid.';
    }

    if (form.punyaAkun) {
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
            errors.email = 'Email tidak valid.';
        } else if (daftar.some((item) => item.email !== null && item.email.toLowerCase() === form.email.trim().toLowerCase())) {
            errors.email = 'Email sudah dipakai akun lain.';
        }
    }

    return errors;
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p role="alert" className="text-tk-danger text-[10px] font-semibold">
            {message}
        </p>
    );
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-9 shrink-0 place-items-center rounded-full">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
            </div>
        </div>
    );
}

export default function PasienPerawat({ pasien, ringkasan }: PasienPerawatProps) {
    const [daftar, setDaftar] = useState<PasienItem[]>(pasien);
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState<FilterAkun>('SEMUA');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<FormPasien>(formAwal);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [berhasil, setBerhasil] = useState<string | null>(null);

    const ringkasanAktif = useMemo(
        () => ({
            total: daftar.length,
            punyaAkun: daftar.filter((item) => item.punyaAkun).length,
            tanpaAkun: daftar.filter((item) => !item.punyaAkun).length,
            kunjunganBulanIni: ringkasan.kunjunganBulanIni,
        }),
        [daftar, ringkasan.kunjunganBulanIni],
    );

    const hasil = useMemo(() => {
        const kataKunci = q.trim().toLowerCase();

        return daftar.filter((item) => {
            const cocokFilter = filter === 'SEMUA' || (filter === 'AKUN' ? item.punyaAkun : !item.punyaAkun);
            const cocokKataKunci =
                kataKunci === '' ||
                [item.nama, item.nik, item.telepon, item.alamat, item.noRm, item.email ?? ''].some((nilai) =>
                    nilai.toLowerCase().includes(kataKunci),
                );

            return cocokFilter && cocokKataKunci;
        });
    }, [daftar, filter, q]);

    const filterAktif = q.trim() !== '' || filter !== 'SEMUA';

    const ubahForm = <K extends keyof FormPasien>(key: K, value: FormPasien[K]) => {
        setForm((previous) => ({ ...previous, [key]: value }));
        setFormErrors((previous) => {
            const next = { ...previous };
            delete next[key];

            return next;
        });
    };

    const resetFilter = () => {
        setQ('');
        setFilter('SEMUA');
    };

    const simpanPasien: FormEventHandler = (event) => {
        event.preventDefault();

        const errors = validasiForm(form, daftar);

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);

            return;
        }

        const idBaru = Math.max(0, ...daftar.map((item) => item.id)) + 1;
        const nomorRm = `RM-2026-${String(300 + daftar.length).padStart(4, '0')}`;

        const baru: PasienItem = {
            id: idBaru,
            nama: form.nama.trim(),
            usia: hitungUsia(form.tglLahir),
            jenisKelamin: form.jenisKelamin,
            nik: form.nik.trim(),
            noRm: nomorRm,
            tglLahir: form.tglLahir,
            alamat: form.alamat.trim(),
            telepon: form.telepon.trim(),
            punyaAkun: form.punyaAkun,
            email: form.punyaAkun ? form.email.trim() : null,
            kunjunganTerakhir: 'Belum ada kunjungan',
            totalKonsultasi: 0,
            terdaftarPada: 'Hari ini',
        };

        setDaftar((previous) => [baru, ...previous]);
        setBerhasil(`${baru.nama} berhasil didaftarkan${baru.punyaAkun ? ' dengan akun pasien' : ' tanpa akun'}.`);
        setDialogOpen(false);
        setForm(formAwal);
        setFormErrors({});
        setQ('');
        setFilter('SEMUA');
    };

    const kartuRingkasan = [
        { label: 'Total pasien', value: ringkasanAktif.total, caption: 'terdaftar di puskesmas', icon: Users },
        { label: 'Punya akun', value: ringkasanAktif.punyaAkun, caption: 'bisa masuk mandiri', icon: UserRound },
        { label: 'Tanpa akun', value: ringkasanAktif.tanpaAkun, caption: 'dilayani lewat perawat', icon: UserPlus },
        { label: 'Kunjungan bulan ini', value: ringkasanAktif.kunjunganBulanIni, caption: 'pasien datang ke puskesmas', icon: CalendarDays },
    ];

    return (
        <PerawatAppLayout
            active="pasien"
            title="Pendaftaran & pencarian pasien"
            description="Cari data pasien, daftarkan pasien baru, dan siapkan permintaan konsultasi atas nama mereka."
        >
            <Head title="Pasien" />

            {berhasil && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3"
                >
                    <CheckCircle2 className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p className="flex-1 text-[11px] leading-relaxed font-semibold">{berhasil}</p>
                    <button
                        type="button"
                        onClick={() => setBerhasil(null)}
                        aria-label="Tutup pemberitahuan"
                        className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-page-alt)] hover:text-[var(--tk-text)]"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            )}

            <Dialog
                open={dialogOpen}
                onOpenChange={(next) => {
                    setDialogOpen(next);

                    if (!next) {
                        setFormErrors({});
                    }
                }}
            >
                <section aria-label="Ringkasan pasien" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {kartuRingkasan.map(({ label, value, caption, icon: Icon }) => (
                        <article key={label} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[11px] font-semibold text-[var(--tk-muted)]">{label}</p>
                                <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                            </div>
                            <p className="mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]">{value}</p>
                            <p className="mt-2 text-[10px] text-[var(--tk-muted)]">{caption}</p>
                        </article>
                    ))}
                </section>

                <section aria-label="Cari dan daftarkan pasien" className={cn('mt-5 rounded-[22px] p-4', glass)}>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative w-full xl:max-w-[420px]">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                type="search"
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Cari nama, NIK, atau nomor RM..."
                                aria-label="Cari pasien berdasarkan nama, NIK, nomor RM, atau telepon"
                                className={cn(inputClass, 'rounded-full pl-10')}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {filterAktif && (
                                <button
                                    type="button"
                                    onClick={resetFilter}
                                    className="min-h-11 rounded-full px-3 text-[12px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                                >
                                    Reset
                                </button>
                            )}

                            <DialogTrigger asChild>
                                <button
                                    type="button"
                                    className="bg-tk-green-500 hover:bg-tk-green-400 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[12px] font-bold text-white transition-colors"
                                >
                                    <UserPlus className="size-4" aria-hidden="true" />
                                    Daftarkan pasien
                                </button>
                            </DialogTrigger>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[
                            { key: 'SEMUA' as FilterAkun, label: 'Semua' },
                            { key: 'AKUN' as FilterAkun, label: 'Punya akun' },
                            { key: 'TANPA_AKUN' as FilterAkun, label: 'Tanpa akun' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={filter === key}
                                onClick={() => setFilter(key)}
                                className={cn(
                                    'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                    filter === key
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.9fr)]">
                    <section aria-labelledby="daftar-pasien">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h2 id="daftar-pasien" className="text-[17px] font-bold">
                                    Daftar pasien
                                </h2>
                                <p className="mt-0.5 text-[11px] text-[var(--tk-muted)]">
                                    {filterAktif ? 'Hasil pencarian dan filter akun.' : 'Semua pasien yang terdaftar di puskesmas.'}
                                </p>
                            </div>
                            <p role="status" aria-live="polite" className="text-[11px] text-[var(--tk-muted)]">
                                {hasil.length} dari {daftar.length} pasien
                            </p>
                        </div>

                        {hasil.length === 0 ? (
                            <div className={cn('grid place-items-center gap-2 rounded-[24px] px-5 py-12 text-center', glass)}>
                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-12 place-items-center rounded-full">
                                    <Users className="size-6" aria-hidden="true" />
                                </span>
                                <p className="mt-1 text-sm font-bold">Pasien tidak ditemukan</p>
                                <p className="max-w-[40ch] text-[11px] leading-relaxed text-[var(--tk-muted)]">
                                    Periksa ejaan nama atau NIK, atau daftarkan pasien baru bila belum pernah datang.
                                </p>
                                <div className="mt-2 flex flex-wrap justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={resetFilter}
                                        className="inline-flex min-h-10 items-center rounded-full border border-[var(--tk-glass-border)] px-4 text-[11px] font-semibold transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        Tampilkan semua
                                    </button>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[11px] font-semibold transition-colors"
                                        >
                                            <UserPlus className="size-3.5" aria-hidden="true" />
                                            Daftarkan pasien
                                        </button>
                                    </DialogTrigger>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {hasil.map((item) => (
                                    <article key={item.id} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-10 shrink-0 place-items-center rounded-full font-bold">
                                                    {inisial(item.nama)}
                                                </span>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-sm font-bold">{item.nama}</p>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                                                item.punyaAkun
                                                                    ? 'bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent'
                                                                    : 'bg-tk-warning/15 text-tk-warning',
                                                            )}
                                                        >
                                                            {item.punyaAkun ? (
                                                                <ShieldCheck className="size-3" aria-hidden="true" />
                                                            ) : (
                                                                <UserPlus className="size-3" aria-hidden="true" />
                                                            )}
                                                            {item.punyaAkun ? 'Punya akun' : 'Tanpa akun'}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-[11px] text-[var(--tk-muted)]">
                                                        {item.usia} tahun · {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · NIK{' '}
                                                        {maskNik(item.nik)}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                        {item.noRm} · {item.email ?? 'Didaftarkan oleh perawat'}
                                                    </p>

                                                    <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-[var(--tk-muted)] sm:flex-row sm:flex-wrap sm:gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="size-3 shrink-0" aria-hidden="true" />
                                                            {item.telepon}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="size-3 shrink-0" aria-hidden="true" />
                                                            {item.alamat}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/perawat/konsultasi/baru?pasien=${item.id}`}
                                                className="bg-tk-accent text-tk-deep hover:bg-tk-mint inline-flex min-h-9 shrink-0 items-center justify-center gap-1 self-start rounded-full px-4 text-xs font-semibold transition-colors sm:self-auto"
                                            >
                                                <ClipboardList className="size-3.5" aria-hidden="true" />
                                                Buat konsultasi
                                            </Link>
                                        </div>

                                        <dl className="mt-3 grid gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3 sm:grid-cols-3">
                                            <div>
                                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    Kunjungan terakhir
                                                </dt>
                                                <dd className="mt-0.5 text-[11px] font-semibold">{item.kunjunganTerakhir}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    Total konsultasi
                                                </dt>
                                                <dd className="mt-0.5 text-[11px] font-semibold">{item.totalKonsultasi}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">
                                                    Terdaftar pada
                                                </dt>
                                                <dd className="mt-0.5 text-[11px] font-semibold">{item.terdaftarPada}</dd>
                                            </div>
                                        </dl>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="grid content-start gap-5">
                        <section aria-labelledby="panduan-pendaftaran" className={cn('rounded-[24px] p-5', glass)}>
                            <SectionHeader
                                icon={UserPlus}
                                title="Cara mendaftarkan pasien"
                                description="Pastikan identitas pasien belum pernah terdaftar agar rekam medis tidak ganda."
                            />

                            <ol className="mt-4 grid gap-2.5">
                                {langkahPendaftaran.map((langkah, index) => (
                                    <li key={langkah.label} className="flex items-start gap-2.5">
                                        <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-bold">{langkah.label}</p>
                                            <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{langkah.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section aria-labelledby="pasien-tanpa-akun" className={cn('rounded-[24px] p-5', glass)}>
                            <div className="flex items-start gap-3">
                                <span className="text-tk-warning bg-tk-warning/15 grid size-9 shrink-0 place-items-center rounded-full">
                                    <Info className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <h2 id="pasien-tanpa-akun" className="text-[15px] font-bold">
                                        Pasien tanpa akun
                                    </h2>
                                    <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                        Pasien tetap bisa dilayani tanpa membuat akun. Perawat mendaftarkan data, membuat permintaan, lalu melanjutkan
                                        skrining pada hari yang sama.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section aria-labelledby="privasi-pasien" className={cn('flex items-start gap-3 rounded-[20px] p-4', glass)}>
                            <span className="bg-tk-green-500/[0.12] text-tk-green-500 dark:bg-tk-accent/[0.12] dark:text-tk-accent grid size-9 shrink-0 place-items-center rounded-full">
                                <Lock className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="privasi-pasien" className="text-[11px] font-bold">
                                    Data fiktif & terbatas
                                </h2>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    NIK dan nomor telepon hanya dipakai untuk identifikasi layanan. Semua data pada prototipe ini adalah fiktif.
                                </p>
                            </div>
                        </section>

                        <section aria-labelledby="aksi-cepat-pasien" className={cn('rounded-[24px] p-5', glass)}>
                            <h2 id="aksi-cepat-pasien" className="text-[15px] font-bold">
                                Aksi cepat
                            </h2>

                            <div className="mt-3 grid gap-1">
                                {[
                                    { label: 'Permintaan masuk', href: '/perawat/permintaan', icon: ClipboardList },
                                    { label: 'Jadwal dokter', href: '/perawat/jadwal', icon: CalendarDays },
                                    { label: 'Ajukan konsultasi baru', href: '/perawat/konsultasi/baru', icon: Stethoscope },
                                ].map(({ label, href, icon: Icon }) => (
                                    <Link
                                        key={label}
                                        href={href}
                                        className="flex min-h-12 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                    >
                                        <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                            <Icon className="size-3.5" aria-hidden="true" />
                                        </span>
                                        <span className="min-w-0 flex-1 text-[11px] font-semibold">{label}</span>
                                        <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            Semua data pada halaman ini adalah data fiktif untuk prototipe TeleKarang.
                        </p>
                    </aside>
                </div>

                <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-[24px] border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                <UserPlus className="size-4" aria-hidden="true" />
                            </span>
                            Daftarkan pasien
                        </DialogTitle>
                        <DialogDescription className="text-[var(--tk-muted)]">
                            Lengkapi identitas dasar pasien. Akun pasien bersifat opsional dan bisa dibuatkan sekalian.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanPasien} noValidate className="grid gap-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="pasien-nama" className="text-[11px] font-semibold">
                                    Nama lengkap <span className="text-tk-danger">*</span>
                                </Label>
                                <Input
                                    id="pasien-nama"
                                    type="text"
                                    required
                                    autoFocus
                                    autoComplete="name"
                                    value={form.nama}
                                    onChange={(event) => ubahForm('nama', event.target.value)}
                                    placeholder="Contoh: Siti Rahmawati"
                                    className={inputClass}
                                />
                                <FieldError message={formErrors.nama} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pasien-nik" className="text-[11px] font-semibold">
                                    NIK <span className="text-tk-danger">*</span>
                                </Label>
                                <Input
                                    id="pasien-nik"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={16}
                                    value={form.nik}
                                    onChange={(event) => ubahForm('nik', event.target.value.replace(/\D/g, ''))}
                                    placeholder="16 digit NIK"
                                    className={inputClass}
                                />
                                <FieldError message={formErrors.nik} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pasien-lahir" className="text-[11px] font-semibold">
                                    Tanggal lahir <span className="text-tk-danger">*</span>
                                </Label>
                                <Input
                                    id="pasien-lahir"
                                    type="date"
                                    required
                                    max={new Date().toISOString().slice(0, 10)}
                                    value={form.tglLahir}
                                    onChange={(event) => ubahForm('tglLahir', event.target.value)}
                                    className={inputClass}
                                />
                                <FieldError message={formErrors.tglLahir} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pasien-jk" className="text-[11px] font-semibold">
                                    Jenis kelamin <span className="text-tk-danger">*</span>
                                </Label>
                                <div className="relative">
                                    <select
                                        id="pasien-jk"
                                        value={form.jenisKelamin}
                                        onChange={(event) => ubahForm('jenisKelamin', event.target.value as JenisKelamin)}
                                        className={cn(inputClass, 'w-full appearance-none pr-10')}
                                    >
                                        <option value="P">Perempuan</option>
                                        <option value="L">Laki-laki</option>
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="pasien-telepon" className="text-[11px] font-semibold">
                                    Nomor telepon <span className="text-tk-danger">*</span>
                                </Label>
                                <Input
                                    id="pasien-telepon"
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                    value={form.telepon}
                                    onChange={(event) => ubahForm('telepon', event.target.value)}
                                    placeholder="+62 812-0000-0000"
                                    className={inputClass}
                                />
                                <FieldError message={formErrors.telepon} />
                            </div>

                            <div className="grid gap-2 sm:row-span-2">
                                <Label htmlFor="pasien-alamat" className="text-[11px] font-semibold">
                                    Alamat <span className="text-tk-danger">*</span>
                                </Label>
                                <textarea
                                    id="pasien-alamat"
                                    rows={3}
                                    value={form.alamat}
                                    onChange={(event) => ubahForm('alamat', event.target.value)}
                                    placeholder="Desa/dusun, RT/RW, dan penanda lokasi"
                                    className={textareaClass}
                                />
                                <FieldError message={formErrors.alamat} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <p className="text-[11px] font-semibold">Akun pasien</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    {
                                        value: false,
                                        label: 'Tanpa akun',
                                        description: 'Didaftarkan dan dilayani lewat perawat',
                                        icon: Users,
                                    },
                                    {
                                        value: true,
                                        label: 'Dengan akun',
                                        description: 'Pasien bisa masuk dan memantau status',
                                        icon: UserRound,
                                    },
                                ].map(({ value, label, description, icon: Icon }) => {
                                    const aktif = form.punyaAkun === value;

                                    return (
                                        <button
                                            key={label}
                                            type="button"
                                            aria-pressed={aktif}
                                            onClick={() => ubahForm('punyaAkun', value)}
                                            className={cn(
                                                'flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-colors',
                                                aktif
                                                    ? 'border-tk-accent bg-tk-accent/10'
                                                    : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'grid size-8 shrink-0 place-items-center rounded-full',
                                                    aktif ? 'bg-tk-accent text-tk-deep' : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                                )}
                                            >
                                                <Icon className="size-4" aria-hidden="true" />
                                            </span>
                                            <span>
                                                <span className="block text-[11px] font-bold">{label}</span>
                                                <span className="mt-0.5 block text-[9px] leading-relaxed text-[var(--tk-muted)]">{description}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {form.punyaAkun && (
                            <div className="grid gap-2">
                                <Label htmlFor="pasien-email" className="text-[11px] font-semibold">
                                    Email akun <span className="text-tk-danger">*</span>
                                </Label>
                                <Input
                                    id="pasien-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={(event) => ubahForm('email', event.target.value)}
                                    placeholder="nama@telekarang.test"
                                    className={inputClass}
                                />
                                <FieldError message={formErrors.email} />
                                <p className="text-[9px] leading-relaxed text-[var(--tk-muted)]">
                                    Kata sandi awal akan dibuat otomatis dan dapat diubah pasien dari halaman akun.
                                </p>
                            </div>
                        )}

                        <DialogFooter className="mt-1 gap-2">
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold"
                                >
                                    Batal
                                </button>
                            </DialogClose>
                            <button type="submit" className={primaryButton}>
                                <UserPlus className="size-4" aria-hidden="true" />
                                Simpan & daftarkan
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PerawatAppLayout>
    );
}
