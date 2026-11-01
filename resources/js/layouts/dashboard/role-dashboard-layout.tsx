import { Link, usePage } from '@inertiajs/react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import TelekarangBrand from '@/components/telekarang-brand';
import ThemeToggle from '@/components/theme-toggle';
import { dashboardRoles, type DashboardRole } from '@/layouts/dashboard/nav-config';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';

interface RoleDashboardLayoutProps {
    role: DashboardRole;
    active: string;
    title?: string;
    description?: string;
    children: ReactNode;
}

function initials(name: string): string {
    const parts = name
        .replace(/^dr\.?\s+/i, '')
        .trim()
        .split(/\s+/)
        .slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'T';
}

export default function RoleDashboardLayout({ role, active, title, description, children }: RoleDashboardLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const config = dashboardRoles[role];
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const update = () => setOnline(navigator.onLine);

        update();
        window.addEventListener('online', update);
        window.addEventListener('offline', update);

        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);

    const pageTitle = title ?? config.defaultTitle;
    const pageDescription = description ?? config.defaultDescription;

    const connectionPill = (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap',
                online ? 'border-tk-accent/40 bg-tk-accent/15 text-tk-mint' : 'border-tk-danger/50 bg-tk-danger/20 text-white',
            )}
        >
            {online ? <Wifi className="size-3.5" aria-hidden="true" /> : <WifiOff className="size-3.5" aria-hidden="true" />}
            {online ? 'Koneksi stabil' : 'Offline'}
        </span>
    );

    return (
        <div className="flex min-h-screen flex-col bg-[var(--tk-page)] font-sans text-[var(--tk-text)]">
            <header className="relative overflow-hidden rounded-b-[28px] bg-[linear-gradient(160deg,#04100E_0%,#0A2A27_38%,#2E8B6A_100%)] text-white print:hidden">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(180deg,#000_0%,transparent_75%)]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-[20%] -right-[10%] aspect-square w-[55%] bg-[radial-gradient(circle,rgba(124,199,127,0.35),transparent_65%)]"
                />

                <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5">
                    <div className="flex h-20 items-center justify-between gap-4 border-b border-white/[0.12]">
                        <Link href={config.home} aria-label={`TeleKarang, kembali ke ${config.defaultTitle}`} className="text-white">
                            <TelekarangBrand />
                        </Link>

                        <nav
                            aria-label={`Navigasi ${config.label}`}
                            className="hidden items-center gap-1 rounded-full border border-white/[0.14] bg-white/[0.06] p-1 lg:flex"
                        >
                            {config.items.map(({ key, label, href, icon: Icon }) => {
                                const isActive = key === active;

                                return (
                                    <Link
                                        key={key}
                                        href={href}
                                        aria-current={isActive ? 'page' : undefined}
                                        className={cn(
                                            'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors',
                                            isActive ? 'bg-tk-accent text-tk-deep' : 'text-white/70 hover:bg-white/[0.08] hover:text-white',
                                        )}
                                    >
                                        <Icon className="size-4" aria-hidden="true" />
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center gap-2">
                            <span className="hidden md:inline-flex">{connectionPill}</span>
                            <ThemeToggle className="size-10" />
                            <button
                                type="button"
                                aria-label="Notifikasi, belum ada pesan baru"
                                className="relative hidden size-10 shrink-0 place-items-center rounded-full border border-white/[0.28] bg-white/[0.08] transition-colors hover:bg-white/[0.16] sm:grid"
                            >
                                <Bell className="size-[18px]" aria-hidden="true" />
                                <span className="bg-tk-warning absolute top-2.5 right-2.5 size-1.5 rounded-full" aria-hidden="true" />
                            </button>

                            <Link
                                href={config.profile}
                                aria-label={`Buka profil ${config.label}`}
                                className="flex items-center gap-2.5 rounded-full border border-white/[0.22] bg-white/[0.08] py-1 pr-1 pl-1 transition-colors hover:bg-white/[0.14] xl:pr-3"
                            >
                                <span className="border-tk-accent bg-tk-teal-700 grid size-8 shrink-0 place-items-center rounded-full border-2 text-[11px] font-bold">
                                    {initials(auth.user.name)}
                                </span>
                                <span className="hidden text-left leading-tight xl:block">
                                    <span className="block max-w-[16ch] truncate text-[12px] font-bold">{auth.user.name}</span>
                                    <span className="block text-[10px] text-white/55">{config.label}</span>
                                </span>
                            </Link>
                        </div>
                    </div>

                    <nav
                        aria-label={`Navigasi ${config.label} seluler`}
                        className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
                    >
                        {config.items.map(({ key, label, href, icon: Icon }) => {
                            const isActive = key === active;

                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-semibold transition-colors',
                                        isActive
                                            ? 'bg-tk-accent text-tk-deep border-transparent'
                                            : 'border-white/[0.18] bg-white/[0.06] text-white/70',
                                    )}
                                >
                                    <Icon className="size-4" aria-hidden="true" />
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="grid gap-7 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:py-11">
                        <div>
                            <p className="text-tk-mint text-[11px] font-semibold tracking-[0.18em] uppercase">{config.workspace}</p>
                            <h1 className="mt-2 max-w-[20ch] text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.05] font-extrabold tracking-[-0.025em]">
                                {pageTitle}
                            </h1>
                            <p className="mt-3 max-w-[64ch] text-[14px] leading-relaxed text-white/75 md:text-[15px]">{pageDescription}</p>

                            <div className="mt-4 flex flex-wrap items-center gap-2 md:hidden">
                                {connectionPill}
                                <span className="text-[11px] text-white/55">Puskesmas Pulau Karang</span>
                            </div>
                        </div>

                        <aside className="hidden min-w-[260px] items-center gap-3 rounded-[20px] border border-white/[0.16] bg-white/[0.07] p-4 backdrop-blur-[16px] sm:flex">
                            <span className="border-tk-accent bg-tk-teal-700 grid size-11 shrink-0 place-items-center rounded-full border-2 text-sm font-bold">
                                {initials(auth.user.name)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] text-white/55">Masuk sebagai</p>
                                <p className="max-w-[22ch] truncate text-sm font-bold">{auth.user.name}</p>
                                <p className="text-tk-mint mt-0.5 text-[10px] font-semibold">{config.label} · Puskesmas Pulau Karang</p>
                            </div>
                        </aside>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 lg:py-10 print:max-w-none print:py-0">{children}</main>

            <footer className="border-t border-[var(--tk-glass-border)] print:hidden">
                <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-7">
                    <Link href={config.home} aria-label="TeleKarang" className="text-[var(--tk-text)]">
                        <TelekarangBrand />
                    </Link>
                    <p className="max-w-[64ch] text-[12px] text-[var(--tk-muted)]">
                        Prototipe studi kasus Puskesmas Pulau Karang. Seluruh data pasien dan dokter adalah fiktif.
                    </p>
                </div>
            </footer>
        </div>
    );
}
