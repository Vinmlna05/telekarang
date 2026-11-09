import { CheckCircle2, Ship, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

type KonteksBanner = 'pasien' | 'perawat' | 'dokter';

interface KeputusanRujukBannerProps {
    keputusanRujuk: boolean;
    alasanRujuk?: string | null;
    biayaRujukan?: number | null;
    ringkasan?: string | null;
    konteks?: KonteksBanner;
    className?: string;
}

const formatRupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const judul: Record<KonteksBanner, { rujuk: string; tidakRujuk: string }> = {
    pasien: {
        rujuk: 'Anda perlu dirujuk ke rumah sakit',
        tidakRujuk: 'Anda tidak perlu dirujuk',
    },
    perawat: {
        rujuk: 'Pasien perlu dirujuk',
        tidakRujuk: 'Rujukan terhindarkan',
    },
    dokter: {
        rujuk: 'Keputusan: rujuk',
        tidakRujuk: 'Keputusan: tidak dirujuk',
    },
};

const penjelasan: Record<KonteksBanner, { rujuk: string; tidakRujuk: string }> = {
    pasien: {
        rujuk: 'Dokter spesialis menyarankan pemeriksaan lanjutan di RS. Perawat akan membantu proses keberangkatan.',
        tidakRujuk: 'Konsultasi spesialis cukup ditindaklanjuti di Puskesmas Pulau Karang. Tidak perlu naik kapal ke daratan.',
    },
    perawat: {
        rujuk: 'Siapkan surat rujukan, transportasi, dan catat biaya rujukan pada halaman tindak lanjut.',
        tidakRujuk: 'Tindak lanjuti di puskesmas dan berikan obat sesuai resep. Kasus ini dihitung sebagai rujukan terhindarkan.',
    },
    dokter: {
        rujuk: 'Pasien membutuhkan fasilitas lanjutan di RS rujukan.',
        tidakRujuk: 'Pasien dapat ditangani di puskesmas. Tidak perlu dirujuk.',
    },
};

export default function KeputusanRujukBanner({
    keputusanRujuk,
    alasanRujuk,
    biayaRujukan,
    ringkasan,
    konteks = 'pasien',
    className,
}: KeputusanRujukBannerProps) {
    const perluRujuk = keputusanRujuk;
    const Ikon = perluRujuk ? TriangleAlert : CheckCircle2;

    return (
        <section
            className={cn(
                'rounded-[24px] border p-4',
                perluRujuk ? 'border-tk-danger/35 bg-tk-danger/10' : 'border-tk-green-400/35 bg-tk-green-500/12',
                className,
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        perluRujuk ? 'bg-tk-danger/15 text-tk-danger' : 'bg-tk-green-400/15 text-tk-green-400',
                    )}
                >
                    <Ikon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--tk-muted)] uppercase">Keputusan dokter spesialis</p>
                    <h2 className={cn('mt-0.5 text-base font-semibold', perluRujuk ? 'text-tk-danger' : 'text-tk-green-400')}>
                        {judul[konteks][perluRujuk ? 'rujuk' : 'tidakRujuk']}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-[var(--tk-text)]/85">
                        {ringkasan || penjelasan[konteks][perluRujuk ? 'rujuk' : 'tidakRujuk']}
                    </p>

                    {perluRujuk && alasanRujuk ? (
                        <p className="border-tk-danger/25 mt-2 rounded-2xl border bg-[var(--tk-page-alt)] px-3 py-2 text-[11px] leading-relaxed text-[var(--tk-text)]">
                            <span className="font-semibold">Alasan rujuk:</span> {alasanRujuk}
                        </p>
                    ) : null}

                    {perluRujuk && biayaRujukan !== null && biayaRujukan !== undefined ? (
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[var(--tk-muted)]">
                            <Ship className="size-3.5" />
                            Estimasi biaya rujukan: {formatRupiah.format(biayaRujukan)}
                        </p>
                    ) : null}

                    {!perluRujuk ? (
                        <p className="text-tk-green-400 mt-2 flex items-center gap-1.5 text-[11px] font-medium">
                            <CheckCircle2 className="size-3.5" />
                            Satu perjalanan kapal (±3 jam) berhasil dihindari.
                        </p>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
