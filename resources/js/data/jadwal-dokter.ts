export type Spesialisasi = 'Anak' | 'Penyakit Dalam' | 'Kulit' | 'Kandungan';
export type StatusJadwal = 'tersedia' | 'terisi' | 'libur';

export interface DokterSpesialis {
    id: number;
    nama: string;
    spesialisasi: Spesialisasi;
    faskes: string;
    hari: string[];
    jam: string;
    hariTerdekat: string;
    slotTerdekat: string;
    status: StatusJadwal;
    slots: string[];
}

export const urutanHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const spesialisasiFilters: Array<Spesialisasi | 'Semua'> = ['Semua', 'Anak', 'Penyakit Dalam', 'Kulit', 'Kandungan'];

export const jadwalDokter: DokterSpesialis[] = [
    {
        id: 1,
        nama: 'dr. Ayu Lestari, Sp.A',
        spesialisasi: 'Anak',
        faskes: 'RSUD Daratan',
        hari: ['Senin', 'Rabu'],
        jam: '09.00–12.00 WIT',
        hariTerdekat: 'Rabu',
        slotTerdekat: '09.30',
        status: 'tersedia',
        slots: ['09.30', '10.00', '10.30'],
    },
    {
        id: 2,
        nama: 'dr. Rizky Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        hari: ['Selasa', 'Kamis'],
        jam: '10.00–13.00 WIT',
        hariTerdekat: 'Selasa',
        slotTerdekat: '10.00',
        status: 'tersedia',
        slots: ['10.00', '11.00', '12.30'],
    },
    {
        id: 3,
        nama: 'dr. Maya Kusuma, Sp.KK',
        spesialisasi: 'Kulit',
        faskes: 'Klinik Sehat Pulau Karang',
        hari: ['Jumat'],
        jam: '08.00–11.00 WIT',
        hariTerdekat: 'Jumat',
        slotTerdekat: '08.30',
        status: 'tersedia',
        slots: ['08.30', '09.00'],
    },
    {
        id: 4,
        nama: 'dr. Nur Aini, Sp.OG',
        spesialisasi: 'Kandungan',
        faskes: 'RSUD Daratan',
        hari: ['Senin', 'Jumat'],
        jam: '13.00–16.00 WIT',
        hariTerdekat: 'Jumat',
        slotTerdekat: '13.30',
        status: 'terisi',
        slots: [],
    },
    {
        id: 5,
        nama: 'dr. Andi Wijaya, Sp.A',
        spesialisasi: 'Anak',
        faskes: 'Puskesmas Pulau Karang',
        hari: ['Sabtu'],
        jam: '09.00–11.00 WIT',
        hariTerdekat: 'Sabtu',
        slotTerdekat: '09.00',
        status: 'libur',
        slots: [],
    },
    {
        id: 6,
        nama: 'dr. Sinta Maharani, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        hari: ['Rabu'],
        jam: '14.00–17.00 WIT',
        hariTerdekat: 'Rabu',
        slotTerdekat: '14.30',
        status: 'tersedia',
        slots: ['14.30', '15.30'],
    },
];
