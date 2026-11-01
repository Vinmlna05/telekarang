import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    History,
    Info,
    KeyRound,
    Loader2,
    Lock,
    LogOut,
    Mail,
    Monitor,
    Moon,
    ShieldCheck,
    Sun,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import PasswordField from '@/components/password-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppearance, type Appearance } from '@/hooks/use-appearance';
import PasienAppLayout from '@/layouts/pasien/pasien-app-layout';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

const glass = 'border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] backdrop-blur-[16px]';
const bannerGradient = 'bg-[linear-gradient(135deg,#1F6F57_0%,#4FBF8F_60%,#7CC77F_100%)]';
const inputClass =
    'focus-visible:ring-tk-accent h-11 rounded-xl border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3.5 text-sm text-[var(--tk-text)] placeholder:text-[var(--tk-muted)]';
const primaryButton =
    'bg-tk-green-500 hover:bg-tk-green-400 focus-visible:ring-tk-accent inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tk-page)] disabled:pointer-events-none disabled:opacity-60';

const themeOptions: Array<{ value: Appearance; label: string; description: string; icon: LucideIcon }> = [
    {
        value: 'light',
        label: 'Terang',
        description: 'Selalu gunakan mode terang',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Gelap',
        description: 'Tampilan redup untuk malam',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'Ikuti perangkat',
        description: 'Sesuai pengaturan ponsel',
        icon: Monitor,
    },
];

const aksesCepat = [
    {
        label: 'Profil pasien',
        description: 'Lihat identitas dan ringkasan kesehatan',
        href: '/pasien/profil',
        icon: UserRound,
    },
    {
        label: 'Riwayat konsultasi',
        description: 'Buka hasil dan diagnosis sebelumnya',
        href: '/pasien/riwayat',
        icon: History,
    },
    {
        label: 'Jadwal dokter',
        description: 'Cari slot spesialis yang tersedia',
        href: '/pasien/jadwal',
        icon: CalendarDays,
    },
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

function formatTanggal(value: string): string {
    const tanggal = new Date(value);

    if (Number.isNaN(tanggal.getTime())) {
        return value;
    }

    return tanggal.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-10 shrink-0 place-items-center rounded-full">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
                <h2 className="text-[15px] font-bold">{title}</h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">{description}</p>
            </div>
        </div>
    );
}

export default function AkunPasien({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string | null }) {
    const { auth, flash } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const emailTerverifikasi = auth.user.email_verified_at !== null;

    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful: profilTersimpan,
    } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const {
        data: passwordData,
        setData: setPasswordData,
        put,
        errors: passwordErrors,
        reset: resetPassword,
        processing: memprosesPassword,
        recentlySuccessful: passwordTersimpan,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const simpanProfil: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('pasien.akun.update'), { preserveScroll: true });
    };

    const simpanPassword: FormEventHandler = (event) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => resetPassword(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    resetPassword('password', 'password_confirmation');
                }

                if (formErrors.current_password) {
                    resetPassword('current_password');
                }
            },
        });
    };

    return (
        <PasienAppLayout
            active="profil"
            title="Kelola akun"
            description="Perbarui data masuk, kata sandi, dan preferensi tampilan akun TeleKarang Anda."
        >
            <Head title="Kelola akun" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.9fr)]">
                <div className="grid min-w-0 content-start gap-5">
                    <section className={cn('relative overflow-hidden rounded-[28px] p-5 md:p-6', bannerGradient)} aria-labelledby="ringkasan-akun">
                        <div className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-white/20 blur-2xl" aria-hidden="true" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-3.5">
                                <span className="text-tk-mint grid size-16 shrink-0 place-items-center rounded-[22px] border-4 border-white/15 bg-[linear-gradient(135deg,#0F4A40_0%,#2E8B6A_55%,#9FE3B5_100%)] text-lg font-extrabold shadow-[0_10px_30px_rgba(4,16,14,0.18)]">
                                    {inisial(auth.user.name)}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-semibold tracking-[0.18em] text-white/70 uppercase">Akun pasien</p>
                                    <h1
                                        id="ringkasan-akun"
                                        className="mt-1 truncate text-xl font-extrabold tracking-[-0.03em] text-white sm:text-2xl"
                                    >
                                        {auth.user.name}
                                    </h1>
                                    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-white/80">
                                        <Mail className="size-3 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{auth.user.email}</span>
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/pasien/profil"
                                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-white/30 bg-white/10 px-4 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:self-auto"
                            >
                                <ArrowLeft className="size-3.5" aria-hidden="true" />
                                Kembali ke profil
                            </Link>
                        </div>

                        <div className="relative mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-white">
                                {emailTerverifikasi ? (
                                    <CheckCircle2 className="size-3" aria-hidden="true" />
                                ) : (
                                    <AlertTriangle className="size-3" aria-hidden="true" />
                                )}
                                {emailTerverifikasi ? 'Email terverifikasi' : 'Email belum terverifikasi'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-white">
                                <ShieldCheck className="size-3" aria-hidden="true" />
                                Akun terlindungi
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-white">
                                <CalendarDays className="size-3" aria-hidden="true" />
                                Terdaftar {formatTanggal(auth.user.created_at)}
                            </span>
                        </div>
                    </section>

                    {flash?.success && (
                        <div
                            role="status"
                            className="text-tk-green-500 dark:text-tk-accent border-tk-accent/35 bg-tk-accent/10 flex items-start gap-2 rounded-2xl border p-3.5 text-[11px] font-semibold"
                        >
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {flash.success}
                        </div>
                    )}

                    <section id="informasi-akun" aria-labelledby="judul-informasi-akun" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-informasi-akun">
                            <SectionHeader
                                icon={UserRound}
                                title="Informasi akun"
                                description="Nama dan email ini dipakai untuk masuk serta menerima informasi jadwal konsultasi."
                            />
                        </div>

                        <form onSubmit={simpanProfil} className="mt-5 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-[11px] font-semibold">
                                        Nama lengkap
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        required
                                        autoComplete="name"
                                        placeholder="Masukkan nama lengkap"
                                        className={inputClass}
                                    />
                                    <InputError message={errors.name} className="text-tk-danger text-[11px]" />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-[11px] font-semibold">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData('email', event.target.value)}
                                        required
                                        autoComplete="username"
                                        placeholder="nama@email.com"
                                        className={inputClass}
                                    />
                                    <InputError message={errors.email} className="text-tk-danger text-[11px]" />
                                </div>
                            </div>

                            <div className="flex items-start gap-2 rounded-2xl bg-[var(--tk-page-alt)] p-3.5 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                                <p>
                                    Jika email diubah, status verifikasi email akan direset. Data medis seperti NIK, alamat, dan nomor rekam medis
                                    tetap hanya dapat diperbarui oleh petugas puskesmas.
                                </p>
                            </div>

                            {mustVerifyEmail && !emailTerverifikasi && (
                                <div className="border-tk-warning/30 bg-tk-warning/10 rounded-2xl border p-3.5">
                                    <p className="text-[10px] leading-relaxed text-[var(--tk-text)]">
                                        Email Anda belum terverifikasi.{' '}
                                        <Link
                                            href={route('verification.send')}
                                            method="post"
                                            as="button"
                                            className="text-tk-green-500 dark:text-tk-accent font-semibold underline underline-offset-2"
                                        >
                                            Kirim ulang tautan verifikasi
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <p className="text-tk-green-500 dark:text-tk-accent mt-1.5 text-[10px] font-semibold">
                                            Tautan verifikasi baru telah dikirim ke email Anda.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3">
                                <button type="submit" disabled={processing} className={primaryButton}>
                                    {processing ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <CheckCircle2 className="size-4" aria-hidden="true" />
                                    )}
                                    {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                                </button>

                                {profilTersimpan && (
                                    <span className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Tersimpan</span>
                                )}
                            </div>
                        </form>
                    </section>

                    <section id="kata-sandi" aria-labelledby="judul-kata-sandi" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-kata-sandi">
                            <SectionHeader
                                icon={KeyRound}
                                title="Kata sandi"
                                description="Gunakan kata sandi yang kuat dan tidak dipakai di layanan lain."
                            />
                        </div>

                        <form onSubmit={simpanPassword} className="mt-5 space-y-4">
                            <PasswordField
                                id="current_password"
                                label="Kata sandi saat ini"
                                value={passwordData.current_password}
                                onChange={(value) => setPasswordData('current_password', value)}
                                error={passwordErrors.current_password}
                                autoComplete="current-password"
                                placeholder="Masukkan kata sandi saat ini"
                                disabled={memprosesPassword}
                                tabIndex={1}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <PasswordField
                                    id="password"
                                    label="Kata sandi baru"
                                    value={passwordData.password}
                                    onChange={(value) => setPasswordData('password', value)}
                                    error={passwordErrors.password}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    disabled={memprosesPassword}
                                    tabIndex={2}
                                    minLength={8}
                                    hint="Gunakan kombinasi huruf dan angka."
                                />

                                <PasswordField
                                    id="password_confirmation"
                                    label="Ulangi kata sandi baru"
                                    value={passwordData.password_confirmation}
                                    onChange={(value) => setPasswordData('password_confirmation', value)}
                                    error={passwordErrors.password_confirmation}
                                    autoComplete="new-password"
                                    placeholder="Ulangi kata sandi baru"
                                    disabled={memprosesPassword}
                                    tabIndex={3}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button type="submit" disabled={memprosesPassword} className={primaryButton}>
                                    {memprosesPassword ? (
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <ShieldCheck className="size-4" aria-hidden="true" />
                                    )}
                                    {memprosesPassword ? 'Memperbarui...' : 'Perbarui kata sandi'}
                                </button>

                                {passwordTersimpan && (
                                    <span className="text-tk-green-500 dark:text-tk-accent text-[10px] font-semibold">Kata sandi diperbarui</span>
                                )}
                            </div>
                        </form>
                    </section>

                    <section id="tampilan" aria-labelledby="judul-tampilan" className={cn('rounded-[24px] p-5 md:p-6', glass)}>
                        <div id="judul-tampilan">
                            <SectionHeader
                                icon={Monitor}
                                title="Preferensi tampilan"
                                description="Pilih tema yang paling nyaman digunakan, terutama saat sinyal sedang lemah."
                            />
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {themeOptions.map(({ value, label, description, icon: Icon }) => {
                                const aktif = appearance === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => updateAppearance(value)}
                                        aria-pressed={aktif}
                                        className={cn(
                                            'rounded-2xl border p-3.5 text-left transition-colors',
                                            aktif
                                                ? 'border-tk-accent bg-tk-accent/10'
                                                : 'border-[var(--tk-glass-border)] hover:bg-[var(--tk-page-alt)]',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'grid size-8 place-items-center rounded-full',
                                                aktif ? 'bg-tk-accent text-tk-deep' : 'bg-[var(--tk-page-alt)] text-[var(--tk-muted)]',
                                            )}
                                        >
                                            <Icon className="size-4" aria-hidden="true" />
                                        </span>
                                        <span className="mt-2 block text-[11px] font-bold">{label}</span>
                                        <span className="mt-0.5 block text-[9px] leading-relaxed text-[var(--tk-muted)]">{description}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <p className="mt-3 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                            Preferensi tema disimpan pada perangkat ini dan tidak mengubah data akun Anda.
                        </p>
                    </section>
                </div>

                <aside className="grid content-start gap-5 lg:sticky lg:top-6 lg:self-start">
                    <section aria-labelledby="status-akun" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="status-akun" className="text-[15px] font-bold">
                            Status akun
                        </h2>

                        <dl className="mt-4 space-y-2.5">
                            <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                    <UserRound className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Peran</dt>
                                    <dd className="mt-0.5 text-[11px] font-bold">Pasien</dd>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                    {emailTerverifikasi ? (
                                        <CheckCircle2 className="size-4" aria-hidden="true" />
                                    ) : (
                                        <AlertTriangle className="size-4" aria-hidden="true" />
                                    )}
                                </span>
                                <div>
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Email</dt>
                                    <dd className="mt-0.5 text-[11px] font-bold">{emailTerverifikasi ? 'Terverifikasi' : 'Belum terverifikasi'}</dd>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Kata sandi</dt>
                                    <dd className="mt-0.5 text-[11px] font-bold">Aktif dan terlindungi</dd>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 rounded-2xl bg-[var(--tk-page-alt)] p-3">
                                <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                    <CalendarDays className="size-4" aria-hidden="true" />
                                </span>
                                <div>
                                    <dt className="text-[9px] font-semibold tracking-[0.08em] text-[var(--tk-muted)] uppercase">Terdaftar sejak</dt>
                                    <dd className="mt-0.5 text-[11px] font-bold">{formatTanggal(auth.user.created_at)}</dd>
                                </div>
                            </div>
                        </dl>
                    </section>

                    <section aria-labelledby="akses-cepat-akun" className={cn('rounded-[24px] p-5', glass)}>
                        <h2 id="akses-cepat-akun" className="text-[15px] font-bold">
                            Akses cepat
                        </h2>

                        <div className="mt-3 grid gap-1">
                            {aksesCepat.map(({ label, description, href, icon: Icon }) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--tk-page-alt)]"
                                >
                                    <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] grid size-8 shrink-0 place-items-center rounded-full">
                                        <Icon className="size-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[10px] font-bold">{label}</span>
                                        <span className="block truncate text-[9px] text-[var(--tk-muted)]">{description}</span>
                                    </span>
                                    <ChevronRight className="size-3.5 shrink-0 text-[var(--tk-muted)]" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="privasi-akun" className={cn('rounded-[24px] p-4', glass)}>
                        <div className="flex items-start gap-3">
                            <span className="bg-tk-warning/15 text-tk-warning grid size-9 shrink-0 place-items-center rounded-full">
                                <Lock className="size-4" aria-hidden="true" />
                            </span>
                            <div>
                                <h2 id="privasi-akun" className="text-[11px] font-bold">
                                    Data medis Anda
                                </h2>
                                <p className="mt-1 text-[10px] leading-relaxed text-[var(--tk-muted)]">
                                    Perubahan identitas medis dan penghapusan akun harus melalui petugas Puskesmas Pulau Karang agar rekam medis tetap
                                    terjaga.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className={cn('rounded-[24px] p-4', glass)} aria-label="Sesi akun">
                        <p className="text-[10px] leading-relaxed text-[var(--tk-muted)]">
                            Keluar jika perangkat ini dipakai bersama. Anda perlu masuk kembali untuk membuka hasil konsultasi.
                        </p>

                        <Link
                            method="post"
                            href={route('logout')}
                            as="button"
                            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-red-300/40 bg-red-500/10 px-4 text-[10px] font-semibold text-red-500 transition-colors hover:bg-red-500/15"
                        >
                            <LogOut className="size-3.5" aria-hidden="true" />
                            Keluar dari akun
                        </Link>
                    </section>

                    <p className="px-1 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Semua data pada halaman ini adalah data fiktif untuk prototipe TeleKarang.
                    </p>
                </aside>
            </div>
        </PasienAppLayout>
    );
}
