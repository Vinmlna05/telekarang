import { Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

import TelekarangBrand from '@/components/telekarang-brand';
import ThemeToggle from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

interface AuthTelekarangLayoutProps {
    children: React.ReactNode;
    title: string;
    description: string;
    eyebrow?: string;
    highlights?: string[];
}

export default function AuthTelekarangLayout({ children, title, description, eyebrow = 'TeleKarang', highlights = [] }: AuthTelekarangLayoutProps) {
    return (
        <div className="relative min-h-svh overflow-hidden bg-[linear-gradient(160deg,#04100E_0%,#0A2A27_38%,#2E8B6A_100%)] text-white">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(180deg,#000_0%,transparent_78%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-[22%] -right-[12%] aspect-square w-[70%] bg-[radial-gradient(circle,rgba(124,199,127,0.3),transparent_65%)] lg:w-[55%]"
            />

            <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[1120px] flex-col px-5">
                <header className="flex items-center justify-between gap-4 py-5">
                    <Link href={route('home')} aria-label="Kembali ke beranda TeleKarang">
                        <TelekarangBrand />
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggle />
                        <Button
                            asChild
                            variant="ghost"
                            className="h-11 rounded-full border border-white/[0.28] bg-white/[0.08] px-5 text-[15px] font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                        >
                            <Link href={route('login')}>Masuk</Link>
                        </Button>
                    </div>
                </header>

                <main className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-12">
                    <section className="max-w-[52ch]">
                        <p className="text-tk-mint inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase">
                            <span aria-hidden="true" className="bg-tk-accent size-1.5 rounded-full" />
                            {eyebrow}
                        </p>

                        <h1 className="mt-5 text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.06] font-extrabold tracking-[-0.02em]">{title}</h1>
                        <p className="mt-5 text-base text-white/[0.82]">{description}</p>

                        {highlights.length > 0 && (
                            <ul className="mt-8 grid gap-3 text-sm text-white/[0.88]">
                                {highlights.map((highlight) => (
                                    <li key={highlight} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="text-tk-accent mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-10 text-xs text-white/55">
                            Prototipe studi kasus Puskesmas Pulau Karang. Seluruh data pasien dan dokter adalah fiktif.
                        </p>
                    </section>

                    <section className="w-full lg:max-w-[480px] lg:justify-self-end">
                        <div className="rounded-[28px] border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] p-6 text-[var(--tk-text)] shadow-[0_30px_70px_rgba(0,0,0,0.28)] backdrop-blur-[16px] md:p-8">
                            {children}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
