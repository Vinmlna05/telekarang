import { useEffect, useState } from 'react';

export type ConnectionStatus = 'stabil' | 'lemah' | 'offline';

export interface ConnectionState {
    status: ConnectionStatus;
    alasan: string | null;
}

interface KoneksiNavigator extends Navigator {
    connection?: {
        effectiveType?: string;
        saveData?: boolean;
        addEventListener?: (tipe: string, pendengar: () => void) => void;
        removeEventListener?: (tipe: string, pendengar: () => void) => void;
    };
}

export const alasanKoneksi: Record<ConnectionStatus, string | null> = {
    stabil: null,
    lemah: 'Sinyal lemah terdeteksi. Beralih ke mode teks agar konsultasi tetap berjalan tanpa terputus.',
    offline: 'Perangkat sedang offline. Pesan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.',
};

export function deteksiKoneksi(): ConnectionState {
    if (typeof window === 'undefined') {
        return { status: 'stabil', alasan: null };
    }

    if (!window.navigator.onLine) {
        return { status: 'offline', alasan: alasanKoneksi.offline };
    }

    const koneksi = (window.navigator as KoneksiNavigator).connection;
    const tipe = koneksi?.effectiveType ?? '';

    if (tipe === 'slow-2g' || tipe === '2g' || koneksi?.saveData === true) {
        return { status: 'lemah', alasan: alasanKoneksi.lemah };
    }

    return { status: 'stabil', alasan: null };
}

export function useConnection(): ConnectionState {
    const [koneksi, setKoneksi] = useState<ConnectionState>(() => deteksiKoneksi());

    useEffect(() => {
        const perbarui = () => setKoneksi(deteksiKoneksi());
        const koneksiNavigator = (window.navigator as KoneksiNavigator).connection;

        perbarui();
        window.addEventListener('online', perbarui);
        window.addEventListener('offline', perbarui);
        koneksiNavigator?.addEventListener?.('change', perbarui);

        return () => {
            window.removeEventListener('online', perbarui);
            window.removeEventListener('offline', perbarui);
            koneksiNavigator?.removeEventListener?.('change', perbarui);
        };
    }, []);

    return koneksi;
}
