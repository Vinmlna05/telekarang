import { Head, Link, useForm } from '@inertiajs/react';
import { LoaderCircle, LogIn } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import PasswordField, { authInputClass } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthTelekarangLayout from '@/layouts/auth/auth-telekarang-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthTelekarangLayout
            eyebrow="Masuk akun"
            title="Lanjutkan konsultasi tanpa naik kapal."
            description="Masuk untuk memantau jadwal, status skrining, dan hasil konsultasi. Pasien dapat mendaftar sendiri; akun perawat, dokter, dan admin dibuat oleh admin puskesmas."
            highlights={[
                'Lihat jadwal dokter spesialis dan status konsultasi.',
                'Perawat mengisi skrining sebelum permintaan dikirim ke spesialis.',
                'Pasien hanya dapat melihat data konsultasi miliknya sendiri.',
            ]}
        >
            <Head title="Masuk" />

            <div className="mb-6 flex items-start gap-3">
                <span className="bg-tk-accent/[0.16] text-tk-green-500 dark:text-tk-accent grid size-11 shrink-0 place-items-center rounded-2xl">
                    <LogIn className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-xl font-bold">Masuk ke akunmu</h2>
                    <p className="mt-1 text-sm text-[var(--tk-muted)]">
                        Belum punya akun?{' '}
                        <Link
                            href={route('register')}
                            tabIndex={6}
                            className="text-tk-teal-700 dark:text-tk-accent font-semibold underline-offset-4 hover:underline"
                        >
                            Daftar akun pasien
                        </Link>
                    </p>
                </div>
            </div>

            {status && (
                <div className="border-tk-green-500/[0.3] bg-tk-green-500/[0.12] text-tk-teal-700 dark:text-tk-mint mb-5 rounded-xl border px-3.5 py-2.5 text-sm font-medium">
                    {status}
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        required
                        autoFocus
                        tabIndex={1}
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
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    disabled={processing}
                    tabIndex={2}
                    action={
                        canResetPassword ? (
                            <Link
                                href={route('password.request')}
                                tabIndex={5}
                                className="text-tk-teal-700 dark:text-tk-accent text-xs font-semibold underline-offset-4 hover:underline"
                            >
                                Lupa password?
                            </Link>
                        ) : undefined
                    }
                />

                <div className="flex items-center gap-2.5">
                    <Checkbox
                        id="remember"
                        name="remember"
                        tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                        disabled={processing}
                        className="data-[state=checked]:border-tk-accent data-[state=checked]:bg-tk-accent data-[state=checked]:text-tk-deep border-black/20 bg-white dark:border-white/30 dark:bg-white/10"
                    />
                    <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                        Ingat saya
                    </Label>
                </div>

                <Button
                    type="submit"
                    tabIndex={4}
                    disabled={processing}
                    className="bg-tk-accent text-tk-deep hover:bg-tk-mint mt-1 h-12 w-full rounded-full text-[15px] font-semibold"
                >
                    {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                    Masuk
                </Button>
            </form>
        </AuthTelekarangLayout>
    );
}
