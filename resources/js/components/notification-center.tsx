import { Bell, CalendarClock, CheckCheck, ClipboardCheck, FileText, X, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Notifikasi {
    id: number;
    judul: string;
    isi: string;
    waktu: string;
    dibaca: boolean;
    ikon: LucideIcon;
}

const notifikasiAwal: Notifikasi[] = [
    {
        id: 1,
        judul: 'Jadwal konsultasi dikonfirmasi',
        isi: 'Dokter spesialis mengonfirmasi slot konsultasi. Periksa detail jadwal terbaru.',
        waktu: '10 menit lalu',
        dibaca: false,
        ikon: CalendarClock,
    },
    {
        id: 2,
        judul: 'Skrining perlu dilengkapi',
        isi: 'Satu permintaan menunggu data skrining sebelum dapat dikirim ke dokter spesialis.',
        waktu: '1 jam lalu',
        dibaca: false,
        ikon: ClipboardCheck,
    },
    {
        id: 3,
        judul: 'Hasil konsultasi tersedia',
        isi: 'Diagnosis ICD-10, saran, dan keputusan rujukan sudah dicatat pada rekam medis.',
        waktu: 'Kemarin',
        dibaca: true,
        ikon: FileText,
    },
];

export default function NotificationCenter({ className }: { className?: string }) {
    const [terbuka, setTerbuka] = useState(false);
    const [notifikasi, setNotifikasi] = useState<Notifikasi[]>(notifikasiAwal);
    const wadah = useRef<HTMLDivElement>(null);

    const belumDibaca = notifikasi.filter((item) => !item.dibaca).length;

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

    function tandaiSemuaDibaca() {
        setNotifikasi((previous) => previous.map((item) => ({ ...item, dibaca: true })));
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

                    <ul className="max-h-[330px] overflow-y-auto">
                        {notifikasi.map((item) => {
                            const Ikon = item.ikon;

                            return (
                                <li key={item.id} className="border-b border-[var(--tk-glass-border)] last:border-b-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotifikasi((previous) =>
                                                previous.map((entri) => (entri.id === item.id ? { ...entri, dibaca: true } : entri)),
                                            )
                                        }
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
                                                {!item.dibaca && <span className="bg-tk-accent size-1.5 shrink-0 rounded-full" aria-hidden="true" />}
                                            </span>
                                            <span className="mt-0.5 block text-[10px] leading-relaxed text-[var(--tk-muted)]">{item.isi}</span>
                                            <span className="mt-1 block text-[9px] font-semibold text-[var(--tk-muted)]">{item.waktu}</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <p className="border-t border-[var(--tk-glass-border)] px-4 py-2.5 text-[9px] leading-relaxed text-[var(--tk-muted)]">
                        Notifikasi disimulasikan. Pada produksi, pesan juga dikirim melalui WhatsApp atau SMS.
                    </p>
                </div>
            )}
        </div>
    );
}
