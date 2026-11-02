import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Ban,
    BriefcaseMedical,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Database,
    Mail,
    MapPin,
    Pencil,
    Plus,
    Search,
    Stethoscope,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type FormEventHandler } from 'react';

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

type PeranDokter = 'umum' | 'spesialis';
type StatusDokter = 'aktif' | 'nonaktif';

interface DokterItem {
    id: number;
    nama: string;
    email: string;
    peran: PeranDokter;
    spesialisasi: string | null;
    faskes: string;
    status: StatusDokter;
    jadwal: number;
    konsultasi: number;
}

interface DokterForm {
    nama: string;
    email: string;
    peran: PeranDokter;
    spesialisasi: string;
    faskes: string;
    status: StatusDokter;
}

type DokterErrors = Partial<Record<keyof DokterForm, string>>;

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
    nama: '',
    email: '',
    peran: 'umum',
    spesialisasi: '',
    faskes: FASKES[0],
    status: 'aktif',
};

const dokterAwal: DokterItem[] = [
    {
        id: 1,
        nama: 'dr. Budi Santoso',
        email: 'dokter@telekarang.test',
        peran: 'umum',
        spesialisasi: null,
        faskes: 'Puskesmas Pulau Karang',
        status: 'aktif',
        jadwal: 5,
        konsultasi: 12,
    },
    {
        id: 2,
        nama: 'dr. Ayu Lestari, Sp.A',
        email: 'spesialis@telekarang.test',
        peran: 'spesialis',
        spesialisasi: 'Anak',
        faskes: 'RS Rujukan Daratan',
        status: 'aktif',
        jadwal: 3,
        konsultasi: 18,
    },
    {
        id: 3,
        nama: 'dr. Hendra Wijaya, Sp.PD',
        email: 'hendra@telekarang.test',
        peran: 'spesialis',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RS Rujukan Daratan',
        status: 'aktif',
        jadwal: 2,
        konsultasi: 9,
    },
    {
        id: 4,
        nama: 'dr. Maya Sari, Sp.KK',
        email: 'maya@telekarang.test',
        peran: 'spesialis',
        spesialisasi: 'Kulit',
        faskes: 'RS Rujukan Daratan',
        status: 'aktif',
        jadwal: 1,
        konsultasi: 4,
    },
    {
        id: 5,
        nama: 'dr. Rina Kartika, Sp.OG',
        email: 'rina@telekarang.test',
        peran: 'spesialis',
        spesialisasi: null,
        faskes: '',
        status: 'nonaktif',
        jadwal: 0,
        konsultasi: 0,
    },
    {
        id: 6,
        nama: 'dr. Anton Prasetyo',
        email: 'anton@telekarang.test',
        peran: 'umum',
        spesialisasi: null,
        faskes: 'Puskesmas Pulau Karang',
        status: 'nonaktif',
        jadwal: 0,
        konsultasi: 2,
    },
];

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
    return dokter.peran === 'spesialis' && (!dokter.spesialisasi || !dokter.faskes);
}

export default function Dokter() {
    const [dokterList, setDokterList] = useState<DokterItem[]>(dokterAwal);
    const [q, setQ] = useState('');
    const [peran, setPeran] = useState<PeranDokter | ''>('');
    const [spesialisasi, setSpesialisasi] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<DokterForm>({ ...initialForm });
    const [errors, setErrors] = useState<DokterErrors>({});
    const [flash, setFlash] = useState<string | null>(null);

    const dokterTampil = useMemo(() => {
        const keyword = q.trim().toLowerCase();

        return dokterList.filter((dokter) => {
            const cocokCari =
                keyword === '' ||
                [dokter.nama, dokter.email, dokter.faskes, dokter.spesialisasi ?? ''].some((nilai) => nilai.toLowerCase().includes(keyword));
            const cocokPeran = peran === '' || dokter.peran === peran;
            const cocokSpesialisasi = spesialisasi === '' || dokter.spesialisasi === spesialisasi;

            return cocokCari && cocokPeran && cocokSpesialisasi;
        });
    }, [dokterList, q, peran, spesialisasi]);

    const ringkasan = useMemo(
        () => ({
            total: dokterList.length,
            umum: dokterList.filter((dokter) => dokter.peran === 'umum').length,
            spesialis: dokterList.filter((dokter) => dokter.peran === 'spesialis').length,
            belumLengkap: dokterList.filter(perluDilengkapi).length,
        }),
        [dokterList],
    );

    const filterAktif = q !== '' || peran !== '' || spesialisasi !== '';

    const ringkasanCards: { key: keyof typeof ringkasan; label: string; caption: string; icon: LucideIcon; tone: string }[] = [
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
        setForm({ ...initialForm });
        setErrors({});
        setDialogOpen(true);
    };

    const bukaEdit = (dokter: DokterItem) => {
        setEditingId(dokter.id);
        setForm({
            nama: dokter.nama,
            email: dokter.email,
            peran: dokter.peran,
            spesialisasi: dokter.spesialisasi ?? '',
            faskes: dokter.faskes,
            status: dokter.status,
        });
        setErrors({});
        setDialogOpen(true);
    };

    const ubahField = (key: keyof DokterForm, value: string) => {
        setForm((current) => {
            const next = { ...current, [key]: value } as DokterForm;

            if (key === 'peran' && value === 'umum') {
                next.spesialisasi = '';
            }

            return next;
        });
        setErrors((current) => ({ ...current, [key]: undefined }));
    };

    const simpan: FormEventHandler = (event) => {
        event.preventDefault();

        const next: DokterErrors = {};
        const email = form.email.trim();
        const nama = form.nama.trim();

        if (nama === '') {
            next.nama = 'Nama dokter wajib diisi.';
        }

        if (email === '') {
            next.email = 'Email akun wajib diisi.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            next.email = 'Format email tidak valid.';
        } else if (dokterList.some((dokter) => dokter.email.toLowerCase() === email.toLowerCase() && dokter.id !== editingId)) {
            next.email = 'Email sudah dipakai dokter lain.';
        }

        if (form.peran === 'spesialis' && form.spesialisasi === '') {
            next.spesialisasi = 'Spesialisasi wajib dipilih untuk dokter spesialis.';
        }

        if (form.faskes === '') {
            next.faskes = 'Faskes wajib dipilih.';
        }

        if (Object.keys(next).length > 0) {
            setErrors(next);

            return;
        }

        const data: Omit<DokterItem, 'id' | 'jadwal' | 'konsultasi'> = {
            nama,
            email,
            peran: form.peran,
            spesialisasi: form.peran === 'spesialis' ? form.spesialisasi : null,
            faskes: form.faskes,
            status: form.status,
        };

        if (editingId !== null) {
            setDokterList((current) => current.map((dokter) => (dokter.id === editingId ? { ...dokter, ...data } : dokter)));
            setFlash(`Data ${nama} berhasil diperbarui.`);
        } else {
            const idBaru = Math.max(0, ...dokterList.map((dokter) => dokter.id)) + 1;

            setDokterList((current) => [{ id: idBaru, ...data, jadwal: 0, konsultasi: 0 }, ...current]);
            setFlash(`Dokter ${nama} berhasil ditambahkan.`);
        }

        setDialogOpen(false);
        setErrors({});
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

            {flash && (
                <div
                    role="status"
                    aria-live="polite"
                    className="border-tk-green-500/35 bg-tk-green-500/10 text-tk-green-500 dark:text-tk-accent mb-5 flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm font-medium"
                >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{flash}</p>
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
                            Spesialisasi, faskes, dan status aktif diatur di sini karena menentukan penjadwalan dan arah konsultasi. Dokter melengkapi
                            kontak sendiri dan mengatur jadwal praktik melalui halaman profilnya.
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
                        setErrors({});
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
                            <Label htmlFor="dokter-nama">Nama lengkap</Label>
                            <Input
                                id="dokter-nama"
                                type="text"
                                required
                                autoFocus
                                autoComplete="name"
                                value={form.nama}
                                onChange={(event) => ubahField('nama', event.target.value)}
                                placeholder="Contoh: dr. Ayu Lestari, Sp.A"
                                className={authInputClass}
                            />
                            <InputError message={errors.nama} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dokter-email">Email akun</Label>
                            <Input
                                id="dokter-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={form.email}
                                onChange={(event) => ubahField('email', event.target.value)}
                                placeholder="nama@telekarang.test"
                                className={authInputClass}
                            />
                            <p className="text-[11px] text-[var(--tk-muted)]">Akun login dibuat lebih dulu di halaman Kelola pengguna.</p>
                            <InputError message={errors.email} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="dokter-peran">Peran</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-peran"
                                        required
                                        value={form.peran}
                                        onChange={(event) => ubahField('peran', event.target.value)}
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
                                <InputError message={errors.peran} className="text-tk-danger" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dokter-spesialisasi">Spesialisasi</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-spesialisasi"
                                        value={form.spesialisasi}
                                        onChange={(event) => ubahField('spesialisasi', event.target.value)}
                                        disabled={form.peran === 'umum'}
                                        className={cn(authInputClass, 'appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60')}
                                    >
                                        <option value="">{form.peran === 'umum' ? 'Tidak diperlukan' : 'Pilih spesialisasi'}</option>
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
                                {form.peran === 'spesialis' && <p className="text-[11px] text-[var(--tk-muted)]">Wajib untuk dokter spesialis.</p>}
                                <InputError message={errors.spesialisasi} className="text-tk-danger" />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="dokter-faskes">Faskes</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-faskes"
                                        required
                                        value={form.faskes}
                                        onChange={(event) => ubahField('faskes', event.target.value)}
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
                                <InputError message={errors.faskes} className="text-tk-danger" />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dokter-status">Status</Label>
                                <div className="relative">
                                    <select
                                        id="dokter-status"
                                        required
                                        value={form.status}
                                        onChange={(event) => ubahField('status', event.target.value)}
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
                                <InputError message={errors.status} className="text-tk-danger" />
                            </div>
                        </div>

                        <DialogFooter className="mt-1 gap-2">
                            <p className="mr-auto max-w-[26ch] text-[10px] leading-snug text-[var(--tk-muted)]">
                                Pratinjau frontend: perubahan hanya tersimpan selama halaman ini dibuka.
                            </p>
                            <DialogClose asChild>
                                <button
                                    type="button"
                                    className="min-h-11 rounded-full border border-[var(--tk-glass-border)] px-5 text-sm font-semibold"
                                >
                                    Batal
                                </button>
                            </DialogClose>
                            <button
                                type="submit"
                                className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white"
                            >
                                {editingId === null ? 'Tambah dokter' : 'Simpan perubahan'}
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
                        {dokterTampil.map((dokter) => {
                            const metaPeran = peranMeta[dokter.peran];
                            const PeranIcon = metaPeran.icon;
                            const metaStatus = statusMeta[dokter.status];
                            const StatusIcon = metaStatus.icon;
                            const latar = perluDilengkapi(dokter);

                            return (
                                <li
                                    key={dokter.id}
                                    className="grid gap-3 border-b border-[var(--tk-glass-border)] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 lg:px-5"
                                >
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent border-tk-green-500/20 grid size-11 shrink-0 place-items-center rounded-full border text-[12px] font-bold">
                                            {initials(dokter.nama)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-bold">{dokter.nama}</p>
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
                                                    {dokter.peran === 'spesialis'
                                                        ? (dokter.spesialisasi ?? 'Spesialisasi belum diisi')
                                                        : 'Dokter umum'}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                                    {dokter.faskes || 'Faskes belum diisi'}
                                                </span>
                                            </p>

                                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--tk-muted)]">
                                                <Mail className="size-3 shrink-0" aria-hidden="true" />
                                                {dokter.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                            <CalendarDays className="size-3.5" aria-hidden="true" />
                                            {formatAngka.format(dokter.jadwal)} jadwal
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[10px] font-semibold text-[var(--tk-muted)]">
                                            <ClipboardList className="size-3.5" aria-hidden="true" />
                                            {formatAngka.format(dokter.konsultasi)} konsultasi
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => bukaEdit(dokter)}
                                            aria-label={`Edit data ${dokter.nama}`}
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
