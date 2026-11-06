import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { authInputClass } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthTelekarangLayout from '@/layouts/auth/auth-telekarang-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthTelekarangLayout
            eyebrow="Pemulihan akun"
            title="Lupa password? Kami bantu pulihkan akses akunmu."
            description="Masukkan email yang terdaftar. Kami akan mengirim tautan untuk membuat password baru. Akun pasien, perawat, dokter, dan admin memakai alur yang sama."
            highlights={[
                'Tautan pemulihan berlaku terbatas.',
                'Data medis tidak berubah saat password direset.',
                'Hubungi admin puskesmas bila email tidak lagi aktif.',
            ]}
        >
            <Head title="Lupa password" />

            <div className="mb-5">
                <p className="text-tk-mint text-[11px] font-semibold tracking-[0.16em] uppercase">Masuk akun</p>
                <h2 className="mt-1 text-xl font-bold">Pulihkan akses akun</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--tk-muted)]">Kami akan mengirim tautan reset ke email terdaftar.</p>
            </div>

            {status && <div className="bg-tk-success/10 text-tk-success mb-4 rounded-xl px-3 py-2 text-center text-xs font-semibold">{status}</div>}

            <form onSubmit={submit} className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="email">Alamat email</Label>
                    <div className="relative">
                        <Mail
                            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--tk-muted)]"
                            aria-hidden="true"
                        />
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@contoh.test"
                            className={`${authInputClass} pl-10`}
                        />
                    </div>

                    <InputError message={errors.email} />
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="bg-tk-green-500 hover:bg-tk-green-400 h-11 w-full rounded-full text-sm font-bold text-white"
                >
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Kirim tautan reset
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--tk-muted)]">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <Link href={route('login')} className="font-semibold text-[var(--tk-text)] underline-offset-4 hover:underline">
                    Kembali ke halaman masuk
                </Link>
            </div>
        </AuthTelekarangLayout>
    );
}
