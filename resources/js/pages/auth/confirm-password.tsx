import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Lock } from 'lucide-react';
import { FormEventHandler } from 'react';

import PasswordField from '@/components/password-field';
import { Button } from '@/components/ui/button';
import AuthTelekarangLayout from '@/layouts/auth/auth-telekarang-layout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthTelekarangLayout
            eyebrow="Keamanan akun"
            title="Konfirmasi password sebelum melanjutkan."
            description="Area ini berisi data medis. Masukkan password akunmu untuk memastikan hanya kamu yang mengakses."
            highlights={['Berlaku untuk sesi ini saja.', 'Tidak ada data yang diubah.', 'Keluar dari perangkat bersama setelah selesai.']}
        >
            <Head title="Konfirmasi password" />

            <div className="mb-5">
                <p className="text-tk-mint text-[11px] font-semibold tracking-[0.16em] uppercase">Masuk akun</p>
                <h2 className="mt-1 text-xl font-bold">Konfirmasi password</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--tk-muted)]">Demi keamanan, konfirmasi ulang sebelum melanjutkan.</p>
            </div>

            <form onSubmit={submit} className="grid gap-5">
                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    onChange={(value) => setData('password', value)}
                    error={errors.password}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    disabled={processing}
                    tabIndex={1}
                    autoFocus
                />

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-tk-green-500 hover:bg-tk-green-400 h-11 w-full rounded-full text-sm font-bold text-white"
                >
                    {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                    Konfirmasi dan lanjutkan
                </Button>
            </form>
        </AuthTelekarangLayout>
    );
}
