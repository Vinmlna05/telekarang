import { Info, Pill } from 'lucide-react';

import type { Resep } from '@/data/resep';
import { cn } from '@/lib/utils';

interface ResepObatCardProps {
    resep: Resep | null;
    judul?: string;
    selaluTampil?: boolean;
    className?: string;
}

export default function ResepObatCard({ resep, judul = 'Resep obat', selaluTampil = false, className }: ResepObatCardProps) {
    const adaObat = Boolean(resep?.perluObat && resep.items.length > 0);

    if (!adaObat && !selaluTampil) {
        return null;
    }

    return (
        <section className={cn('rounded-[24px] border border-[var(--tk-glass-border)] bg-[var(--tk-glass)] p-4', className)}>
            <div className="flex items-center gap-2.5">
                <span className="bg-tk-green-500/15 text-tk-green-400 flex size-9 items-center justify-center rounded-full">
                    <Pill className="size-4" />
                </span>
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase">Farmasi</p>
                    <h2 className="text-sm font-semibold text-[var(--tk-text)]">{judul}</h2>
                </div>
            </div>

            {adaObat ? (
                <>
                    <ul className="mt-3 space-y-2.5">
                        {resep!.items.map((item, index) => (
                            <li key={item.id} className="rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] p-3">
                                <div className="flex items-start gap-2.5">
                                    <span className="bg-tk-accent/15 text-tk-accent mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-[var(--tk-text)]">{item.namaObat}</p>
                                        <p className="mt-0.5 text-xs text-[var(--tk-muted)]">
                                            {[item.dosis, item.rute, item.frekuensi, item.durasi].filter(Boolean).join(' · ')}
                                        </p>
                                        {item.jumlah ? <p className="mt-1 text-[11px] text-[var(--tk-muted)]">Jumlah: {item.jumlah}</p> : null}
                                        {item.instruksi ? (
                                            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--tk-text)]/80">
                                                <Info className="mt-0.5 size-3 shrink-0" />
                                                <span>{item.instruksi}</span>
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {resep?.catatan ? (
                        <p className="border-tk-warning/30 bg-tk-warning/10 mt-3 rounded-2xl border px-3 py-2 text-[11px] leading-relaxed text-[var(--tk-text)]">
                            Catatan dokter: {resep.catatan}
                        </p>
                    ) : null}
                </>
            ) : (
                <p className="mt-3 rounded-2xl border border-[var(--tk-glass-border)] bg-[var(--tk-page-alt)] px-3 py-3 text-xs leading-relaxed text-[var(--tk-muted)]">
                    Dokter spesialis tidak meresepkan obat tambahan. Lanjutkan tindakan yang sudah diberikan di puskesmas.
                </p>
            )}
        </section>
    );
}
