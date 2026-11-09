import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    BriefcaseMedical,
    CheckCircle2,
    ChevronDown,
    Database,
    LoaderCircle,
    Mail,
    MapPin,
    Pencil,
    Plus,
    Search,
    Stethoscope,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { authInputClass } from '@/components/password-field';
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
import AdminAppLayout from '@/layouts/admin/admin-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

type PeranDokter = 'umum' | 'spesialis';
type StatusDokter = 'aktif' | 'nonaktif';

interface DokterItem {
    id: number;
    user_id: number;
    nama: string;
    email: string | null;
    peran: PeranDokter;
    spesialisasi: string | null;
    faskes: string;
    status: StatusDokter;
}

interface AkunItem {
    id: number;
    name: string;
    email: string;
    role: 'dokter_umum' | 'spesialis';
    tertaut: boolean;
}

interface RingkasanDokter {
    total: number;
    umum: number;
    spesialis: number;
    belumLengkap: number;
}

interface Filters {
    q: string;
    peran: string;
    spesialisasi: string;
}

interface DokterProps {
    dokter: DokterItem[];
    ringkasan: RingkasanDokter;
    akun: AkunItem[];
    filters: Filters;
}

type DokterForm = {
    user_id: string;
    nama: string;
    peran: PeranDokter;
    spesialisasi: string;
    faskes: string;
    status: StatusDokter;
};

const SPESIALISASI = ['Anak', 'Penyakit Dalam', 'Kulit', 'Kandungan', 'Bedah', 'Mata', 'THT', 'Saraf', 'Lainnya'];
const FASKES = ['Puskesmas Pulau Karang', 'RS Rujukan Daratan', 'Klinik Mitra Pesisir'];

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const peranMeta: Record<PeranDokter, { label: string; icon: LucideIcon; badge: string }> = {
    umum: {
        label: 'Dokter umum',
        icon: Stethoscope,
        badge: 'border-transparent bg-tk-info/15 text-tk-info',
    },
    spesialis: {
        label: 'Dokter spesialis',
        icon: BriefcaseMedical,
        badge: 'border-transparent bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
    },
};

const statusMeta: Record<StatusDokter, { label: string; icon: LucideIcon; badge: string }> = {
    aktif: {
        label: 'Aktif',
        icon: CheckCircle2,
        badge: 'border-transparent bg-tk-green-500/15 text-tk-green-500 dark:text-tk-accent',
    },
    nonaktif: {
        label: 'Nonaktif',
        icon: Ban,
        badge: 'border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
    },
};

const initialForm: DokterForm = {
    user_id: '',
    nama: '',
    peran: 'umum',
    spesialisasi: '',
    faskes: FASKES[0],
    status: 'aktif',
};

const formatAngka = new Intl.NumberFormat('id-ID');

function initials(name: string): string {
    const parts = name
        .replace(/^dr\.?\s+/i, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'D';
}

function perluDilengkapi(dokter: DokterItem): boolean {
    return dokter.peran === 'spesialis' && !dokter.spesialisasi;
}

export default function Dokter({ dokter, ringkasan, akun, filters }: DokterProps) {
    const { flash } = usePage<SharedData>().props;
    const [q, setQ] = useState(filters.q);
    const [peran, setPeran] = useState<PeranDokter | ''>(filters.peran === 'umum' || filters.peran === 'spesialis' ? filters.peran : '');
    const [spesialisasi, setSpesialisasi] = useState(filters.spesialisasi);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm<DokterForm>({ ...initialForm });

    useEffect(() => {
        setQ(filters.q);
        setPeran(filters.peran === 'umum' || filters.peran === 'spesialis' ? filters.peran : '');
        setSpesialisasi(filters.spesialisasi);
    }, [filters.q, filters.peran, filters.spesialisasi]);

    const dokterTampil = useMemo(() => {
        const keyword = q.trim().toLowerCase();

        return dokter.filter((item) => {
            const cocokCari =
                keyword === '' ||
                [item.nama, item.email ?? '', item.faskes, item.spesialisasi ?? ''].some((nilai) => nilai.toLowerCase().includes(keyword));
            const cocokPeran = peran === '' || item.peran === peran;
            const cocokSpesialisasi = spesialisasi === '' || item.spesialisasi === spesialisasi;

            return cocokCari && cocokPeran && cocokSpesialisasi;
        });
    }, [dokter, q, peran, spesialisasi]);

    const filterAktif = q !== '' || peran !== '' || spesialisasi !== '';

    const ringkasanCards: { key: keyof RingkasanDokter; label: string; caption: string; icon: LucideIcon; tone: string }[] = [
        {
            key: 'total',
            label: 'Total dokter',
            caption: 'profil terdaftar',
            icon: Users,
            tone: 'bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent',
        },
        {
            key: 'umum',
            label: 'Dokter umum',
            caption: 'bertugas di puskesmas',
            icon: Stethoscope,
            tone: 'bg-tk-info/15 text-tk-info',
        },
        {
            key: 'spesialis',
            label: 'Dokter spesialis',
            caption: 'mitra RS rujukan',
            icon: BriefcaseMedical,
            tone: 'bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
        },
        {
            key: 'belumLengkap',
            label: 'Perlu dilengkapi',
            caption: 'spesialisasi belum diisi',
            icon: AlertTriangle,
            tone: 'bg-tk-warning/15 text-tk-warning',
        },
    ];

    const resetFilter = () => {
        setQ('');
        setPeran('');
        setSpesialisasi('');
    };

    const bukaTambah = () => {
        setEditingId(null);
        form.setData({ ...initialForm });
        form.clearErrors();
        setDialogOpen(true);
    };

    const bukaEdit = (item: DokterItem) => {
        setEditingId(item.id);
        form.setData({
            user_id: String(item.user_id),
            nama: item.nama,
            peran: item.peran,
            spesialisasi: item.spesialisasi ?? '',
            faskes: item.faskes,
            status: item.status,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const ubahAkun = (value: string) => {
        const dipilih = akun.find((item) => String(item.id) === value);

        form.setData((current) => ({
            ...current,
            user_id: value,
            nama: dipilih?.name ?? current.nama,
            peran: dipilih ? (dipilih.role === 'spesialis' ? 'spesialis' : 'umum') : current.peran,
        }));
        form.clearErrors('user_id');
    };

    const ubahPeran = (value: PeranDokter) => {
        form.setData((current) => ({
            ...current,
            peran: value,
            spesialisasi: value === 'umum' ? '' : current.spesialisasi,
        }));
        form.clearErrors();
    };

    const simpan: FormEventHandler = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                setEditingId(null);
                form.reset();
            },
        };

        if (editingId !== null) {
            form.patch(route('admin.dokter.update', editingId), options);
        } else {
            form.post(route('admin.dokter.store'), options);
        }
    };

    const judulDialog = editingId === null ? 'Tambah dokter' : 'Edit data dokter';

    return (
        <AdminAppLayout
            active="master"
            title="Kelola data dokter"
            description="Atur data kredensial dokter: peran, spesialisasi, faskes, dan status aktif. Jadwal praktik tetap dikelola dokter sendiri."
        >
            <Head title="Kelola data dokter" />

            <nav aria-label="Data master" className="mb-5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span
                    aria-current="page"
                    className="bg-tk-accent text-tk-deep inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[12px] font-bold"
                >
                    <Stethoscope className="size-4" aria-hidden="true" />
                    Data dokter
                </span>
                <Link
                    href={route('admin.icd10')}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--tk-glass-border)] px-4 text-[12px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)]"
                >
                    <Database className="size-4" aria-hidden="true" />
                    ICD-10
                </Link>
            </nav>

            {flash?.success && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 text-tk-green-500 dark:text-tk-accent mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash.success}</p>
                </div>
            )}

            {flash?.error && (
                <div
                    role="alert"
                    className="border-tk-danger/35 bg-tk-danger/10 text-tk-danger mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash.error}</p>
                </div>
            )}

            <section aria-labelledby="info-data-dokter" className={cn('mb-5 rounded-[20px] p-4', glass)}>
                <div className="flex items-start gap-3">
                    <span className="bg-tk-info/15 text-tk-info grid size-10 shrink-0 place-items-center rounded-full">
                        <BriefcaseMedical className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h2 id="info-data-dokter" className="text-[13px] font-bold">
                            Admin mengelola data kredensial dokter
                        </h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-[var(--tk-muted)]">
                            Spesialisasi, faskes, dan status aktif diatur di sini karena menentukan penjadwalan dan arah konsultasi. Profil dokter
                            terhubung ke akun staff yang dibuat lebih dulu.
                        </p>
                        <Link
                            href={route('admin.pengguna')}
                            className="text-tk-green-500 dark:text-tk-accent mt-2 inline-flex text-[12px] font-semibold hover:underline"
                        >
                            Kelola akun staf di halaman pengguna
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-label="Ringkasan dokter" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasanCards.map(({ key, label, caption, icon: Icon, tone }) => (
                    <article key={key} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">{label}</p>
                            <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone)}>
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                        </div>
                        <p className="mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]">{formatAngka.format(ringkasan[key])}</p>
                        <p className="mt-2 text-[10px] text-[var(--tk-muted)]">{caption}</p>
                    </article>
                ))}
            </section>

            <Dialog
                open={dialogOpen}
                onOpenChange={(next) => {
                    setDialogOpen(next);

                    if (!next) {
                        form.clearErrors();
                    }
                }}
            >
                <section aria-label="Cari dan kelola dokter" className={cn('mt-5 rounded-[22px] p-4', glass)}>
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
                                placeholder="Cari nama, email, atau faskes..."
                                aria-label="Cari dokter berdasarkan nama, email, atau faskes"
                                className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
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
                                    onClick={bukaTambah}
                                    className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                    Tambah dokter
                                </button>
                            </DialogTrigger>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            aria-pressed={peran === '' && spesialisasi === ''}
                            onClick={resetFilter}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                peran === '' && spesialisasi === ''
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            Semua
                        </button>
                        {(Object.keys(peranMeta) as PeranDokter[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={peran === value}
                                onClick={() => {
                                    setPeran(peran === value ? '' : value);
                                    setSpesialisasi('');
                                }}
                                className={cn(
                                    'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                    peran === value
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {peranMeta[value].label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            aria-pressed={spesialisasi === ''}
                            onClick={() => setSpesialisasi('')}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                spesialisasi === ''
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            Semua spesialisasi
                        </button>
                        {SPESIALISASI.map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={spesialisasi === value}
                                onClick={() => {
                                    setSpesialisasi(spesialisasi === value ? '' : value);
                                    setPeran('spesialis');
                                }}
                                className={cn(
                                    'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                    spesialisasi === value
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </section>

                <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-[24px] border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                {editingId === null ? (
                                    <Plus className="size-4" aria-hidden="true" />
                                ) : (
                                    <Pencil className="size-4" aria-hidden="true" />
                                )}
                            </span>
                            {judulDialog}
                        </DialogTitle>
                        <DialogDescription className="text-[var(--tk-muted)]">
                            Data ini menjadi acuan penjadwalan dan pengarahan konsultasi. Pastikan spesialisasi sesuai kredensial dokter.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpan} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dokter-akun">Akun dokter</Label>
                            <div className="relative">
                                <select
                                    id="dokter-akun"
                                    required
                                    value={form.data.user_id}
                                    onChange={(event) => ubahAkun(event.target.value)}
                                    disabled={form.processing}
                                    className={cn(authInputClass, 'appearance-none pr-10')}
                                >
                                    <option value="">Pilih akun dokter</option>
                                    {akun.map((item) => {
                                        const sudahTertaut = item.tertaut && String(item.id) !== form.data.user_id;

                                        return (
                                            <option key={item.id} value={item.id} disabled={sudahTertaut}>
                                                {item.name} — {item.email}
                                                {sudahTertaut ? ' (sudah tertaut)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="text-[11px] text-[var(--tk-muted)]">
                                Akun login dibuat lebih dulu di{' '}
                                <Link href={route('admin.pengguna')} className="text-tk-green-500 dark:text-tk-accent font-semibold hover:underline">
                                    halaman Kelola pengguna
                                </Link>
                                . Hanya akun dokter yang dapat dipilih.
                            </p>
                            <InputError message={form.errors.user_id} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dokter-nama">Nama lengkap</Label>
                            <Input
                                id="dokter-nama"
                                type="text"
                                required
                                autoComplete="name"
                                value={form.data.nama}
                                onChange={(event) => form.setData('nama', event.target.value)}
                                disabled={form.processing}
                                placeholder="Contoh: dr. Ayu Lestari, Sp.A"
                                className={authInputClass}
                            />
                            <InputError message={form.errors.nama} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="dokter-peran">Peran</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-peran"
                                        required
                                        value={form.data.peran}
                                        onChange={(event) => ubahPeran(event.target.value as PeranDokter)}
                                        disabled={form.processing}
                                        className={cn(authInputClass, 'appearance-none pr-10')}
                                    >
                                        <option value="umum">Dokter umum</option>
                                        <option value="spesialis">Dokter spesialis</option>
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                </div>
                                <InputError message={form.errors.peran} className="text-tk-danger" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dokter-spesialisasi">Spesialisasi</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-spesialisasi"
                                        value={form.data.spesialisasi}
                                        onChange={(event) => form.setData('spesialisasi', event.target.value)}
                                        disabled={form.processing || form.data.peran === 'umum'}
                                        className={cn(authInputClass, 'appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60')}
                                    >
                                        <option value="">{form.data.peran === 'umum' ? 'Tidak diperlukan' : 'Pilih spesialisasi'}</option>
                                        {SPESIALISASI.map((value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                </div>
                                {form.data.peran === 'spesialis' && (
                                    <p className="text-[11px] text-[var(--tk-muted)]">Wajib untuk dokter spesialis.</p>
                                )}
                                <InputError message={form.errors.spesialisasi} className="text-tk-danger" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="dokter-faskes">Faskes</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-faskes"
                                        required
                                        value={form.data.faskes}
                                        onChange={(event) => form.setData('faskes', event.target.value)}
                                        disabled={form.processing}
                                        className={cn(authInputClass, 'appearance-none pr-10')}
                                    >
                                        <option value="">Pilih faskes</option>
                                        {FASKES.map((value) => (
                                            <option key={value} value={value}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                </div>
                                <InputError message={form.errors.faskes} className="text-tk-danger" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dokter-status">Status</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-status"
                                        required
                                        value={form.data.status}
                                        onChange={(event) => form.setData('status', event.target.value as StatusDokter)}
                                        disabled={form.processing}
                                        className={cn(authInputClass, 'appearance-none pr-10')}
                                    >
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                    <ChevronDown
                                        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="text-[11px] text-[var(--tk-muted)]">Nonaktifkan agar dokter tidak muncul di jadwal pasien.</p>
                                <InputError message={form.errors.status} className="text-tk-danger" />
                            </div>
                        </div>

                        <DialogFooter className="mt-1 gap-2">
                            <p className="mr-auto max-w-[26ch] text-[10px] leading-snug text-[var(--tk-muted)]">
                                Perubahan langsung tersimpan ke database.
                            </p>
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold disabled:opacity-50"
                                >
                                    Batal
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white disabled:opacity-60"
                            >
                                {form.processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                                {form.processing ? 'Menyimpan...' : editingId === null ? 'Tambah dokter' : 'Simpan perubahan'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <section aria-labelledby="daftar-dokter" className={cn('mt-5 overflow-hidden rounded-[24px]', glass)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-glass-border)] p-5">
                    <div>
                        <h2 id="daftar-dokter" className="text-[17px] font-bold">
                            Daftar dokter
                        </h2>
                        <p className="mt-0.5 text-[12px] text-[var(--tk-muted)]">
                            {filterAktif ? 'Hasil pencarian dan filter.' : 'Dokter umum puskesmas dan dokter spesialis mitra RS rujukan.'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[11px] font-semibold text-[var(--tk-muted)]">
                        <Stethoscope className="size-3.5" aria-hidden="true" />
                        {formatAngka.format(dokterTampil.length)} dokter
                    </span>
                </div>

                {dokterTampil.length === 0 ? (
                    <div className="grid place-items-center px-6 py-14 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <Search className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-bold">Tidak ada dokter yang cocok</p>
                        <p className="mt-1 max-w-sm text-[12px] text-[var(--tk-muted)]">
                            Coba kata kunci lain atau tampilkan semua dokter untuk melihat seluruh profil.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilter}
                            className="border-tk-green-500/35 text-tk-green-500 dark:text-tk-accent mt-4 min-h-10 rounded-full border px-4 text-[12px] font-semibold"
                        >
                            Tampilkan semua
                        </button>
                    </div>
                ) : (
                    <ul>
                        {dokterTampil.map((item) => {
                            const metaPeran = peranMeta[item.peran];
                            const PeranIcon = metaPeran.icon;
                            const metaStatus = statusMeta[item.status];
                            const StatusIcon = metaStatus.icon;
                            const latar = perluDilengkapi(item);

                            return (
                                <li
                                    key={item.id}
                                    className="grid gap-3 border-b border-[var(--tk-glass-border)] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 lg:px-5"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent border-tk-green-500/20 grid size-11 shrink-0 place-items-center rounded-full border text-[12px] font-bold">
                                            {initials(item.nama)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-bold">{item.nama}</p>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                        metaPeran.badge,
                                                    )}
                                                >
                                                    <PeranIcon className="size-3" aria-hidden="true" />
                                                    {metaPeran.label}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                        metaStatus.badge,
                                                    )}
                                                >
                                                    <StatusIcon className="size-3" aria-hidden="true" />
                                                    {metaStatus.label}
                                                </span>
                                                {latar && (
                                                    <span className="bg-tk-warning/15 text-tk-warning inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                                        <AlertTriangle className="size-3" aria-hidden="true" />
                                                        Perlu dilengkapi
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--tk-muted)]">
                                                <span className="inline-flex items-center gap-1">
                                                    <BriefcaseMedical className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {item.peran === 'spesialis' ? (item.spesialisasi ?? 'Spesialisasi belum diisi') : 'Dokter umum'}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {item.faskes || 'Faskes belum diisi'}
                                                </span>
                                            </p>

                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--tk-muted)]">
                                                <Mail className="size-3 shrink-0" aria-hidden="true" />
                                                {item.email ?? 'Email belum tersedia'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => bukaEdit(item)}
                                            aria-label={`Edit data ${item.nama}`}
                                            className={cn(
                                                'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                                latar
                                                    ? 'border-tk-warning/45 text-tk-warning hover:bg-tk-warning/10'
                                                    : 'hover:border-tk-green-500/45 hover:text-tk-green-500 dark:hover:text-tk-accent border-[var(--tk-glass-border)] text-[var(--tk-text)]',
                                            )}
                                        >
                                            <Pencil className="size-3.5" aria-hidden="true" />
                                            Edit
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </AdminAppLayout>
    );
}
