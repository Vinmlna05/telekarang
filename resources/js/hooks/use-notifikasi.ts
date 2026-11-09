import { useCallback, useEffect, useState } from 'react';

import { bacaNotifikasi, tandaiNotifikasiDibaca, tandaiSemuaNotifikasiDibaca, type NotifikasiItem, type PeranNotifikasi } from '@/data/notifikasi';

export function useNotifikasi(peran: PeranNotifikasi) {
    const [daftar, setDaftar] = useState<NotifikasiItem[]>([]);
    const [siap, setSiap] = useState(false);

    const muat = useCallback(() => {
        setDaftar(bacaNotifikasi(peran));
        setSiap(true);
    }, [peran]);

    useEffect(() => {
        muat();

        function tangkapPerubahan(event: Event) {
            const detail = (event as CustomEvent<{ peran?: PeranNotifikasi }>).detail;

            if (!detail || !detail.peran || detail.peran === peran) {
                muat();
            }
        }

        function tangkapPenyimpanan(event: StorageEvent) {
            if (!event.key || event.key === `telekarang:notifikasi:${peran}`) {
                muat();
            }
        }

        window.addEventListener('telekarang:notifikasi-changed', tangkapPerubahan);
        window.addEventListener('storage', tangkapPenyimpanan);

        return () => {
            window.removeEventListener('telekarang:notifikasi-changed', tangkapPerubahan);
            window.removeEventListener('storage', tangkapPenyimpanan);
        };
    }, [muat, peran]);

    const tandaiDibaca = useCallback(
        (id: string) => {
            tandaiNotifikasiDibaca(peran, id);
            muat();
        },
        [muat, peran],
    );

    const tandaiSemuaDibaca = useCallback(() => {
        tandaiSemuaNotifikasiDibaca(peran);
        muat();
    }, [muat, peran]);

    return {
        daftar,
        siap,
        belumDibaca: daftar.filter((item) => !item.dibaca).length,
        tandaiDibaca,
        tandaiSemuaDibaca,
        muat,
    };
}
