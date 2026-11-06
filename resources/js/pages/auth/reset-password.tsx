import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import PasswordField, { authInputClass } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthTelekarangLayout from '@/layouts/auth/auth-telekarang-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthTelekarangLayout
            eyebrow="Pemulihan akun"
            title="Buat password baru untuk akunmu."
            description="Gunakan password yang kuat dan tidak dipakai di layanan lain. Setelah tersimpan, kamu dapat langsung masuk kembali."
            highlights={[
                'Minimal 8 karakter.',
                'Konfirmasi password untuk menghindari salah ketik.',
                'Sesi lain akan tetap aman dengan password baru.',
            ]}
        >
            <Head title="Atur ulang password" />

            <div className="mb-5">
                <p className="text-tk-mint text-[11px] font-semibold tracking-[0.16em] uppercase">Masuk akun</p>
                <h2 className="mt-1 text-xl font-bold">Atur ulang password</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--tk-muted)]">Masukkan password baru untuk akun terdaftar.</p>
            </div>

            <form onSubmit={submit} className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={data.email}
                        readOnly
                        onChange={(e) => setData('email', e.target.value)}
                        className={`${authInputClass} opacity-80`}
                    />
                    <InputError message={errors.email} />
                </div>

                <PasswordField
                    id="password"
                    label="Password baru"
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    error={errors.password}
                    autoComplete="new-password"
                    placeholder="Buat password baru"
                    disabled={processing}
                    tabIndex={1}
                    minLength={8}
                    autoFocus
                    hint="Minimal 8 karakter."
                />

                <PasswordField
                    id="password_confirmation"
                    label="Konfirmasi password"
                    value={data.password_confirmation}
                    onChange={(value) => setData('password_confirmation', value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    placeholder="Ulangi password baru"
                    disabled={processing}
                    tabIndex={2}
                />

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-tk-green-500 hover:bg-tk-green-400 mt-1 h-11 w-full rounded-full text-sm font-bold text-white"
                >
                    {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    Simpan password baru
                </Button>
            </form>
        </AuthTelekarangLayout>
    );
}
