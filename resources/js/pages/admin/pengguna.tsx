import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    BriefcaseMedical,
    CheckCircle2,
    ChevronDown,
    HeartPulse,
    LoaderCircle,
    Search,
    ShieldCheck,
    Stethoscope,
    UserPlus,
    UserRound,
    Users,
    UsersRound,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import PasswordField, { authInputClass } from '@/components/password-field';
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

type Peran = 'pasien' | 'perawat' | 'dokter_umum' | 'spesialis' | 'admin';
type StaffRole = 'perawat' | 'dokter_umum' | 'spesialis';

interface PenggunaItem {
    id: number;
    name: string;
    email: string;
    role: Peran;
    created_at: string;
}

interface RingkasanPengguna {
    total: number;
    staff: number;
    pasien: number;
    admin: number;
}

interface PenggunaProps {
    pengguna: PenggunaItem[];
    ringkasan: RingkasanPengguna;
    filters: {
        q: string;
        role: string;
    };
}

type StaffForm = {
    name: string;
    email: string;
    role: StaffRole;
    password: string;
    password_confirmation: string;
};

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';

const roleMeta: Record<Peran, { label: string; description: string; icon: LucideIcon; badge: string }> = {
    pasien: {
        label: 'Pasien',
        description: 'Melihat jadwal, mengajukan konsultasi, dan membaca hasil miliknya.',
        icon: UserRound,
        badge: 'border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
    },
    perawat: {
        label: 'Perawat',
        description: 'Mendaftarkan pasien, mengisi skrining, dan menindaklanjuti hasil konsultasi.',
        icon: HeartPulse,
        badge: 'border-transparent bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent',
    },
    dokter_umum: {
        label: 'Dokter umum',
        description: 'Mereview skrining dan memutuskan penerusan ke dokter spesialis.',
        icon: Stethoscope,
        badge: 'border-transparent bg-tk-info/15 text-tk-info',
    },
    spesialis: {
        label: 'Dokter spesialis',
        description: 'Mengelola jadwal praktik, konsultasi, dan hasil diagnosis ICD-10.',
        icon: BriefcaseMedical,
        badge: 'border-transparent bg-tk-mint/20 text-tk-teal-700 dark:text-tk-mint',
    },
    admin: {
        label: 'Admin',
        description: 'Mengelola pengguna, data master, dan memantau dasbor layanan.',
        icon: ShieldCheck,
        badge: 'border-transparent bg-tk-warning/15 text-tk-warning',
    },
};

const staffRoles: StaffRole[] = ['perawat', 'dokter_umum', 'spesialis'];
const formatAngka = new Intl.NumberFormat('id-ID');
const formatTanggal = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const ringkasanCards = [
    { key: 'total', label: 'Total pengguna', caption: 'seluruh akun terdaftar', icon: UsersRound },
    { key: 'staff', label: 'Staff medis', caption: 'perawat dan dokter', icon: Stethoscope },
    { key: 'pasien', label: 'Pasien', caption: 'akun pasien aktif', icon: UserRound },
    { key: 'admin', label: 'Admin', caption: 'pengelola sistem', icon: ShieldCheck },
] as const;

function initials(name: string): string {
    const parts = name
        .replace(/^dr\.?\s+/i, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'T';
}

export default function Pengguna({ pengguna, ringkasan, filters }: PenggunaProps) {
    const { auth, flash } = usePage<SharedData>().props;
    const [q, setQ] = useState(filters.q);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const form = useForm<StaffForm>({
        name: '',
        email: '',
        role: 'perawat',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        setQ(filters.q);
    }, [filters.q]);

    const cari: FormEventHandler = (event) => {
        event.preventDefault();

        router.get(route('admin.pengguna'), { q, role: filters.role }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const pilihPeran = (role: Peran | '') => {
        router.get(route('admin.pengguna'), { q, role }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const resetFilter = () => {
        setQ('');

        router.get(route('admin.pengguna'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const ubahPeran = (user: PenggunaItem, role: string) => {
        setProcessingId(user.id);

        router.patch(
            route('admin.pengguna.update', user.id),
            { role },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const simpanStaff: FormEventHandler = (event) => {
        event.preventDefault();

        form.post(route('admin.pengguna.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setDialogOpen(false);
            },
        });
    };

    const filterAktif = filters.q !== '' || filters.role !== '';

    return (
        <AdminAppLayout
            active="pengguna"
            title="Kelola pengguna dan peran"
            description="Daftarkan akun staff, atur hak akses, dan pantau siapa saja yang terhubung ke layanan TeleKarang."
        >
            <Head title="Kelola pengguna dan peran" />

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

            <section aria-label="Ringkasan pengguna" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {ringkasanCards.map(({ key, label, caption, icon: Icon }) => (
                    <article key={key} className={cn('rounded-[20px] p-4 lg:p-5', glass)}>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-[var(--tk-muted)]">{label}</p>
                            <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent grid size-8 shrink-0 place-items-center rounded-full">
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
                <section aria-label="Cari dan daftarkan pengguna" className={cn('mt-5 rounded-[22px] p-4', glass)}>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <form onSubmit={cari} className="flex w-full gap-2 xl:max-w-[420px]">
                            <div className="relative min-w-0 flex-1">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                                <Input
                                    type="search"
                                    value={q}
                                    onChange={(event) => setQ(event.target.value)}
                                    placeholder="Cari nama atau email..."
                                    aria-label="Cari pengguna berdasarkan nama atau email"
                                    className="focus-visible:ring-tk-accent h-11 rounded-full border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] pl-10 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]"
                                />
                            </div>
                            <button
                                type="submit"
                                className="hover:border-tk-green-500/45 hover:text-tk-green-500 dark:hover:text-tk-accent min-h-11 shrink-0 rounded-full border border-[var(--tk-glass-border)] px-4 text-[12px] font-semibold transition-colors"
                            >
                                Cari
                            </button>
                        </form>

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
                                    className="bg-tk-teal-700 dark:bg-tk-accent dark:text-tk-deep inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
                                >
                                    <UserPlus className="size-4" aria-hidden="true" />
                                    Registrasi staff
                                </button>
                            </DialogTrigger>
                        </div>
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            aria-pressed={filters.role === ''}
                            onClick={() => pilihPeran('')}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                filters.role === ''
                                    ? 'bg-tk-accent text-tk-deep border-transparent'
                                    : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                            )}
                        >
                            Semua
                        </button>
                        {(Object.keys(roleMeta) as Peran[]).map((role) => (
                            <button
                                key={role}
                                type="button"
                                aria-pressed={filters.role === role}
                                onClick={() => pilihPeran(role)}
                                className={cn(
                                    'min-h-9 shrink-0 rounded-full border px-3.5 text-[11px] font-semibold transition-colors',
                                    filters.role === role
                                        ? 'bg-tk-accent text-tk-deep border-transparent'
                                        : 'border-[var(--tk-glass-border)] text-[var(--tk-muted)] hover:text-[var(--tk-text)]',
                                )}
                            >
                                {roleMeta[role].label}
                            </button>
                        ))}
                    </div>
                </section>

                <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-[24px] border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <span className="bg-tk-accent/15 text-tk-green-500 dark:text-tk-accent grid size-9 place-items-center rounded-full">
                                <UserPlus className="size-4" aria-hidden="true" />
                            </span>
                            Registrasi staff
                        </DialogTitle>
                        <DialogDescription className="text-[var(--tk-muted)]">
                            Buat akun untuk perawat, dokter umum, atau dokter spesialis. Password awal dapat dibagikan ke staff dan diubah dari
                            halaman profil.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={simpanStaff} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="staff-name">Nama lengkap</Label>
                            <Input
                                id="staff-name"
                                type="text"
                                required
                                autoFocus
                                autoComplete="name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                disabled={form.processing}
                                placeholder="Contoh: dr. Ayu Lestari, Sp.A"
                                className={authInputClass}
                            />
                            <InputError message={form.errors.name} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="staff-email">Email</Label>
                            <Input
                                id="staff-email"
                                type="email"
                                required
                                autoComplete="email"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                                disabled={form.processing}
                                placeholder="nama@telekarang.test"
                                className={authInputClass}
                            />
                            <InputError message={form.errors.email} className="text-tk-danger" />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="staff-role">Peran staff</Label>
                            <div className="relative">
                                <select
                                    id="staff-role"
                                    required
                                    value={form.data.role}
                                    onChange={(event) => form.setData('role', event.target.value as StaffRole)}
                                    disabled={form.processing}
                                    className={cn(authInputClass, 'appearance-none pr-10')}
                                >
                                    {staffRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {roleMeta[role].label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                                    aria-hidden="true"
                                />
                            </div>
                            <p className="bg-tk-accent/[0.08] text-tk-green-500 dark:text-tk-accent rounded-xl px-3 py-2 text-[11px] leading-relaxed">
                                {roleMeta[form.data.role].description}
                            </p>
                            <InputError message={form.errors.role} className="text-tk-danger" />
                        </div>

                        <PasswordField
                            id="staff-password"
                            label="Password awal"
                            value={form.data.password}
                            onChange={(value) => form.setData('password', value)}
                            error={form.errors.password}
                            autoComplete="new-password"
                            placeholder="Minimal 8 karakter"
                            disabled={form.processing}
                            tabIndex={4}
                            minLength={8}
                            hint="Staff dapat mengubah password melalui halaman profil setelah masuk."
                        />

                        <PasswordField
                            id="staff-password-confirmation"
                            label="Konfirmasi password"
                            value={form.data.password_confirmation}
                            onChange={(value) => form.setData('password_confirmation', value)}
                            error={form.errors.password_confirmation}
                            autoComplete="new-password"
                            placeholder="Ulangi password awal"
                            disabled={form.processing}
                            tabIndex={5}
                        />

                        <DialogFooter className="mt-1 gap-2">
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
                                {form.processing ? 'Menyimpan...' : 'Buat akun staff'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <section aria-labelledby="daftar-pengguna" className={cn('mt-5 overflow-hidden rounded-[24px]', glass)}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-glass-border)] p-5">
                    <div>
                        <h2 id="daftar-pengguna" className="text-[17px] font-bold">
                            Daftar pengguna
                        </h2>
                        <p className="mt-0.5 text-[12px] text-[var(--tk-muted)]">
                            {filterAktif ? 'Hasil pencarian dan filter peran.' : 'Semua akun yang terdaftar di TeleKarang.'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tk-page-alt)] px-3 py-1.5 text-[11px] font-semibold text-[var(--tk-muted)]">
                        <Users className="size-3.5" aria-hidden="true" />
                        {formatAngka.format(pengguna.length)} akun
                    </span>
                </div>

                {pengguna.length === 0 ? (
                    <div className="grid place-items-center px-6 py-14 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-[var(--tk-page-alt)] text-[var(--tk-muted)]">
                            <UsersRound className="size-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-bold">Tidak ada pengguna yang cocok</p>
                        <p className="mt-1 max-w-sm text-[12px] text-[var(--tk-muted)]">
                            Coba kata kunci lain atau tampilkan semua peran untuk melihat seluruh akun.
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
                        {pengguna.map((user) => {
                            const meta = roleMeta[user.role];
                            const RoleIcon = meta.icon;
                            const isSelf = user.id === auth.user.id;
                            const isProcessing = processingId === user.id;

                            return (
                                <li
                                    key={user.id}
                                    className="grid gap-3 border-b border-[var(--tk-glass-border)] p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-4 lg:px-5"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="bg-tk-teal-700/[0.08] text-tk-teal-700 dark:bg-tk-accent/10 dark:text-tk-accent border-tk-green-500/20 grid size-11 shrink-0 place-items-center rounded-full border text-[12px] font-bold">
                                            {initials(user.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-bold">{user.name}</p>
                                                {isSelf && (
                                                    <span className="bg-tk-warning/15 text-tk-warning rounded-full px-2 py-0.5 text-[10px] font-bold">
                                                        Akun Anda
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-[12px] text-[var(--tk-muted)]">{user.email}</p>
                                            <p className="mt-0.5 text-[10px] text-[var(--tk-muted)]">
                                                Bergabung {formatTanggal.format(new Date(user.created_at))}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold',
                                                meta.badge,
                                            )}
                                        >
                                            <RoleIcon className="size-3" aria-hidden="true" />
                                            {meta.label}
                                        </span>

                                        {isSelf ? (
                                            <span className="rounded-full bg-[var(--tk-page-alt)] px-3 py-2 text-[10px] font-semibold text-[var(--tk-muted)]">
                                                Peran terkunci
                                            </span>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    value={user.role}
                                                    onChange={(event) => ubahPeran(user, event.target.value)}
                                                    disabled={isProcessing}
                                                    aria-label={`Ubah peran ${user.name}`}
                                                    className="focus-visible:ring-tk-accent min-h-10 appearance-none rounded-full border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] py-2 pr-9 pl-3 text-[11px] font-semibold text-[var(--tk-text)] disabled:opacity-60"
                                                >
                                                    {(Object.keys(roleMeta) as Peran[]).map((role) => (
                                                        <option key={role} value={role}>
                                                            {roleMeta[role].label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {isProcessing ? (
                                                    <LoaderCircle
                                                        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 animate-spin text-[var(--tk-muted)]"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <ChevronDown
                                                        className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-[var(--tk-muted)]"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>
                                        )}
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
