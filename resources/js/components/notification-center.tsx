import { Link, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, FileText, MapPin, Pill, ShieldCheck, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { formatWaktuNotifikasi, labelTipeNotifikasi, urlNotifikasiPeran, type PeranNotifikasi, type TipeNotifikasi } from '@/data/notifikasi';
import { useNotifikasi } from '@/hooks/use-notifikasi';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

const ikonTipe: Record<TipeNotifikasi, LucideIcon> = {
    HASIL_SPESIALIS: FileText,
    RESEP_OBAT: Pill,
    RUJUKAN: MapPin,
    TIDAK_DIRUJUK: ShieldCheck,
    OBAT_DIBERIKAN: CheckCheck,
};

function peranDariRole(role: string | undefined): PeranNotifikasi | null {
    if (role === 'pasien') {
        return 'pasien';
    }

    if (role === 'perawat') {
        return 'perawat';
    }

    if (role === 'dokter_umum') {
        return 'dokter_umum';
    }

    return null;
}

export default function NotificationCenter({ className }: { className?: string }) {
    const { auth } = usePage<SharedData>().props;
    const peran = peranDariRole(auth?.user?.role) ?? 'perawat';
    const { daftar, belumDibaca, tandaiDibaca, tandaiSemuaDibaca } = useNotifikasi(peran);
    const [terbuka, setTerbuka] = useState(false);
    const wadah = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!terbuka) {
            return;
        }

        function tutup(event: MouseEvent) {
            if (wadah.current && !wadah.current.contains(event.target as Node)) {
                setTerbuka(false);
            }
        }

        function tutupEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setTerbuka(false);
            }
        }

        document.addEventListener('mousedown', tutup);
        document.addEventListener('keydown', tutupEscape);

        return () => {
            document.removeEventListener('mousedown', tutup);
            document.removeEventListener('keydown', tutupEscape);
        };
    }, [terbuka]);

    if (!peranDariRole(auth?.user?.role)) {
        return null;
    }

    return (
        <div ref={wadah} className={cn('relative', className)}>
            <button
                type="button"
                onClick={() => setTerbuka((current) => !current)}
                aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi, semua sudah dibaca'}
                aria-expanded={terbuka}
                aria-haspopup="dialog"
                className="relative grid size-10 shrink-0 place-items-center rounded-full border border-white/[0.28] bg-white/[0.08] text-white transition-colors hover:bg-white/[0.16]"
            >
                <Bell className="size-[18px]" aria-hidden="true" />
                {belumDibaca > 0 && (
                    <span className="bg-tk-warning absolute top-2 right-2 grid size-4 place-items-center rounded-full text-[8px] font-bold text-[#04100E]">
                        {belumDibaca}
                    </span>
                )}
            </button>

            {terbuka && (
                <div
                    role="dialog"
                    aria-label="Pusat notifikasi"
                    className="absolute right-0 z-50 mt-2 w-[min(92vw,340px)] overflow-hidden rounded-[22px] border border-[var(--tk-glass-border)] bg-[var(--tk-page)] text-[var(--tk-text)] shadow-[0_24px_60px_rgba(4,16,14,0.35)]"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--tk-glass-border)] px-4 py-3">
                        <div>
                            <p className="text-[13px] font-bold">Notifikasi</p>
                            <p className="text-[10px] text-[var(--tk-muted)]">
                                {belumDibaca > 0 ? `${belumDibaca} belum dibaca` : 'Semua sudah dibaca'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={tandaiSemuaDibaca}
                                disabled={belumDibaca === 0}
                                className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-[var(--tk-muted)] transition-colors hover:text-[var(--tk-text)] disabled:opacity-40"
                            >
                                <CheckCheck className="size-3.5" aria-hidden="true" />
                                Tandai dibaca
                            </button>
                            <button
                                type="button"
                                onClick={() => setTerbuka(false)}
                                aria-label="Tutup pusat notifikasi"
                                className="grid size-8 place-items-center rounded-full text-[var(--tk-muted)] transition-colors hover:bg-[var(--tk-page-alt)] hover:text-[var(--tk-text)]"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    {daftar.length === 0 ? (
                        <p className="px-4 py-8 text-center text-[11px] text-[var(--tk-muted)]">Belum ada notifikasi.</p>
                    ) : (
                        <ul className="max-h-[330px] overflow-y-auto">
                            {daftar.map((item) => {
                                const Ikon = ikonTipe[item.tipe];

                                return (
                                    <li key={item.id} className="border-b border-[var(--tk-glass-border)] last:border-b-0">
                                        <Link
                                            href={item.url}
                                            onClick={() => {
                                                tandaiDibaca(item.id);
                                                setTerbuka(false);
                                            }}
                                            className={cn(
                                                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--tk-page-alt)]',
                                                !item.dibaca && 'bg-tk-accent/[0.06]',
                                            )}
                                        >
                                            <span className="text-tk-green-500 dark:text-tk-accent bg-tk-green-500/[0.12] dark:bg-tk-accent/[0.12] mt-0.5 grid size-8 shrink-0 place-items-center rounded-full">
                                                <Ikon className="size-4" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate text-[11px] font-bold">{item.judul}</span>
                                                    {!item.dibaca && (
                                                        <span className="bg-tk-accent size-1.5 shrink-0 rounded-full" aria-hidden="true" />
                                                    )}
                                                </span>
                                                <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--tk-muted)]">{item.isi}</span>
                                                <span className="mt-1 block text-[9px] font-semibold text-[var(--tk-muted)]">
                                                    {labelTipeNotifikasi[item.tipe]} · {formatWaktuNotifikasi(item.waktu)}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="border-t border-[var(--tk-glass-border)] px-4 py-2.5">
                        <Link
                            href={urlNotifikasiPeran(peran)}
                            onClick={() => setTerbuka(false)}
                            className="text-tk-green-500 dark:text-tk-accent text-[10px] font-bold hover:underline"
                        >
                            Lihat semua notifikasi
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
