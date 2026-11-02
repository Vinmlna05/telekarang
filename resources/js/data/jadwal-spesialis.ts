export type HariPraktik = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
export type ModeJadwal = 'video' | 'teks' | 'keduanya';
export type StatusBlokJadwal = 'aktif' | 'libur';

export interface BlokJadwal {
    id: number;
    hari: HariPraktik;
    jamMulai: string;
    jamSelesai: string;
    kuota: number;
    terisi: number;
    mode: ModeJadwal;
    status: StatusBlokJadwal;
}

export const hariPraktik: HariPraktik[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const labelModeJadwal: Record<ModeJadwal, string> = {
    video: 'Video',
    teks: 'Teks',
    keduanya: 'Video & teks',
};

export const jadwalSpesialisAwal: BlokJadwal[] = [
    {
        id: 1,
        hari: 'Senin',
        jamMulai: '09:00',
        jamSelesai: '12:00',
        kuota: 6,
        terisi: 4,
        mode: 'keduanya',
        status: 'aktif',
    },
    {
        id: 2,
        hari: 'Senin',
        jamMulai: '13:00',
        jamSelesai: '15:00',
        kuota: 4,
        terisi: 1,
        mode: 'video',
        status: 'aktif',
    },
    {
        id: 3,
        hari: 'Selasa',
        jamMulai: '10:00',
        jamSelesai: '13:00',
        kuota: 6,
        terisi: 2,
        mode: 'teks',
        status: 'aktif',
    },
    {
        id: 4,
        hari: 'Rabu',
        jamMulai: '09:00',
        jamSelesai: '12:00',
        kuota: 6,
        terisi: 5,
        mode: 'video',
        status: 'aktif',
    },
    {
        id: 5,
        hari: 'Kamis',
        jamMulai: '13:00',
        jamSelesai: '16:00',
        kuota: 6,
        terisi: 0,
        mode: 'keduanya',
        status: 'aktif',
    },
    {
        id: 6,
        hari: 'Jumat',
        jamMulai: '08:00',
        jamSelesai: '11:00',
        kuota: 6,
        terisi: 0,
        mode: 'teks',
        status: 'libur',
    },
    {
        id: 7,
        hari: 'Sabtu',
        jamMulai: '09:00',
        jamSelesai: '11:00',
        kuota: 4,
        terisi: 0,
        mode: 'video',
        status: 'libur',
    },
];
