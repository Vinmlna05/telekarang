import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck, UserRound } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import PasswordField, { authInputClass } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthTelekarangLayout from '@/layouts/auth/auth-telekarang-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthTelekarangLayout
            eyebrow="Registrasi pasien"
            title="Buat akun pasien, konsultasi tanpa naik kapal."
            description="Simpan data diri sekali, lalu ajukan konsultasi spesialis dari puskesmas dan pantau hasilnya tanpa perjalanan jauh."
            highlights={[
                'Ajukan permintaan konsultasi dan pilih jadwal spesialis.',
                'Pantau status skrining serta hasil konsultasi milikmu.',
                'Data skrining hanya diisi perawat dan dibaca dokter.',
            ]}
        >
            <Head title="Daftar akun pasien" />

            <div className="mb-6 flex items-start gap-3">
                <span className="bg-tk-accent/[0.16] text-tk-green-500 dark:text-tk-accent grid size-11 shrink-0 place-items-center rounded-2xl">
                    <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-xl font-bold">Daftar akun pasien</h2>
                    <p className="mt-1 text-sm text-[var(--tk-muted)]">
                        Sudah punya akun?{' '}
                        <Link href={route('login')} className="text-tk-teal-700 dark:text-tk-accent font-semibold underline-offset-4 hover:underline">
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="name">Nama lengkap</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        disabled={processing}
                        placeholder="Contoh: Siti Rahmawati"
                        className={authInputClass}
                    />
                    <InputError message={errors.name} className="text-tk-danger" />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        tabIndex={2}
                        autoComplete="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        disabled={processing}
                        placeholder="nama@email.com"
                        className={authInputClass}
                    />
                    <InputError message={errors.email} className="text-tk-danger" />
                </div>

                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    error={errors.password}
                    autoComplete="new-password"
                    placeholder="Buat password"
                    disabled={processing}
                    tabIndex={3}
                    minLength={8}
                    hint="Minimal 8 karakter."
                />

                <PasswordField
                    id="password_confirmation"
                    label="Konfirmasi password"
                    value={data.password_confirmation}
                    onChange={(value) => setData('password_confirmation', value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    placeholder="Ulangi password"
                    disabled={processing}
                    tabIndex={4}
                    minLength={8}
                />

                <Button
                    type="submit"
                    tabIndex={5}
                    disabled={processing}
                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-1 h-12 w-full rounded-full text-[15px] font-semibold"
                >
                    {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    Buat akun pasien
                </Button>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-[var(--tk-muted)]">
                    <ShieldCheck className="text-tk-green-500 dark:text-tk-accent mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Akun ini khusus pasien. Akun perawat, dokter, dan admin dibuat oleh admin puskesmas.
                </p>
            </form>
        </AuthTelekarangLayout>
    );
}
