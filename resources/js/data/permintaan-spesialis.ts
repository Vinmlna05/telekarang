import type { StatusKonsultasi } from './konsultasi-pasien';

export type PrioritasPermintaan = 'merah' | 'kuning' | 'normal';
export type ModePermintaan = 'video' | 'teks';
export type StatusPermintaan = Extract<StatusKonsultasi, 'MENUNGGU_SPESIALIS' | 'DIKONFIRMASI' | 'DIJADWAL_ULANG' | 'DITOLAK'>;
export type TindakanPermintaan = 'terima' | 'jadwal_ulang' | 'tolak';

export interface RingkasanSkrining {
    sistol: number;
    diastol: number;
    suhu: number;
    nadi: number;
    spo2: number;
    tandaBahaya: boolean;
}

export interface KeputusanPermintaan {
    tindakan: TindakanPermintaan;
    alasan: string | null;
    slotBaru: string | null;
    waktu: string;
}

export interface PermintaanSpesialis {
    id: number;
    nomor: string;
    nama: string;
    usia: number;
    jenisKelamin: 'L' | 'P';
    alamat: string;
    keluhan: string;
    durasiKeluhan: string;
    spesialisasi: string;
    faskes: string;
    dokterPengirim: string;
    prioritas: PrioritasPermintaan;
    mode: ModePermintaan;
    jadwalUsulan: string;
    diminta: string;
    status: StatusPermintaan;
    skrining: RingkasanSkrining;
    catatanSkrining: string;
    keputusan: KeputusanPermintaan | null;
}

export const labelStatusPermintaan: Record<StatusPermintaan, string> = {
    MENUNGGU_SPESIALIS: 'Menunggu konfirmasi',
    DIKONFIRMASI: 'Dikonfirmasi',
    DIJADWAL_ULANG: 'Dijadwal ulang',
    DITOLAK: 'Ditolak',
};

export const prioritasPermintaanLabels: Record<PrioritasPermintaan, string> = {
    merah: 'Prioritas tinggi',
    kuning: 'Perlu perhatian',
    normal: 'Normal',
};

export const permintaanSpesialisAwal: PermintaanSpesialis[] = [
    {
        id: 4,
        nomor: 'KNS-2026-0133',
        nama: 'Nur Aisyah',
        usia: 8,
        jenisKelamin: 'P',
        alamat: 'Desa Pulau Karang',
        keluhan: 'Demam tinggi dan sesak sejak dua hari.',
        durasiKeluhan: '1–3 hari',
        spesialisasi: 'Anak',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'kuning',
        mode: 'video',
        jadwalUsulan: 'Hari ini · 10.00–11.00 WITA',
        diminta: '2 jam lalu',
        status: 'MENUNGGU_SPESIALIS',
        skrining: { sistol: 108, diastol: 68, suhu: 39.2, nadi: 118, spo2: 95, tandaBahaya: false },
        catatanSkrining: 'Anak tampak lemas, napas cepat saat menangis. Belum ada kejang dan masih mau minum.',
        keputusan: null,
    },
    {
        id: 9,
        nomor: 'KNS-2026-0135',
        nama: 'Siti Rahmawati',
        usia: 52,
        jenisKelamin: 'P',
        alamat: 'Dusun Karang Timur',
        keluhan: 'Kepala berat dan pandangan berkunang sejak pagi.',
        durasiKeluhan: '1–3 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'merah',
        mode: 'video',
        jadwalUsulan: 'Hari ini · 11.30–12.30 WITA',
        diminta: '1 jam lalu',
        status: 'MENUNGGU_SPESIALIS',
        skrining: { sistol: 184, diastol: 116, suhu: 36.9, nadi: 96, spo2: 97, tandaBahaya: true },
        catatanSkrining: 'Tekanan darah diukur ulang setelah istirahat lima menit. Pasien sadar penuh, tidak nyeri dada.',
        keputusan: null,
    },
    {
        id: 6,
        nomor: 'KNS-2026-0134',
        nama: 'Rudi Hartono',
        usia: 45,
        jenisKelamin: 'L',
        alamat: 'Desa Pulau Karang',
        keluhan: 'Nyeri ulu hati berulang setelah makan.',
        durasiKeluhan: '4–7 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'normal',
        mode: 'teks',
        jadwalUsulan: 'Besok · 09.00–10.00 WITA',
        diminta: '4 jam lalu',
        status: 'MENUNGGU_SPESIALIS',
        skrining: { sistol: 128, diastol: 82, suhu: 36.8, nadi: 84, spo2: 98, tandaBahaya: false },
        catatanSkrining: 'Nyeri terbakar di ulu hati, memberat setelah makan. Tidak ada muntah darah atau BAB hitam.',
        keputusan: null,
    },
    {
        id: 7,
        nomor: 'KNS-2026-0136',
        nama: 'Maria Lestari',
        usia: 27,
        jenisKelamin: 'P',
        alamat: 'Dusun Karang Barat',
        keluhan: 'Ruam meluas di kedua lengan.',
        durasiKeluhan: '1–3 hari',
        spesialisasi: 'Kulit',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'normal',
        mode: 'teks',
        jadwalUsulan: 'Besok · 13.30–14.30 WITA',
        diminta: '5 jam lalu',
        status: 'MENUNGGU_SPESIALIS',
        skrining: { sistol: 118, diastol: 76, suhu: 38.7, nadi: 104, spo2: 98, tandaBahaya: false },
        catatanSkrining: 'Ruam kemerahan dan hangat di kedua lengan, tidak melepuh. Tidak ada sesak atau bengkak wajah.',
        keputusan: null,
    },
    {
        id: 11,
        nomor: 'KNS-2026-0130',
        nama: 'Andi Saputra',
        usia: 34,
        jenisKelamin: 'L',
        alamat: 'Desa Pulau Karang',
        keluhan: 'Nyeri sendi lutut kanan sejak seminggu.',
        durasiKeluhan: '4–7 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'normal',
        mode: 'video',
        jadwalUsulan: 'Hari ini · 13.30–14.30 WITA',
        diminta: '1 hari lalu',
        status: 'DIKONFIRMASI',
        skrining: { sistol: 124, diastol: 80, suhu: 36.6, nadi: 88, spo2: 99, tandaBahaya: false },
        catatanSkrining: 'Lutut kanan bengkak ringan, nyeri saat menekuk. Tidak ada riwayat trauma berat.',
        keputusan: {
            tindakan: 'terima',
            alasan: 'Jadwal sesuai slot praktik dan data skrining lengkap.',
            slotBaru: 'Hari ini · 13.30–14.30 WITA',
            waktu: 'Hari ini · 08.10 WITA',
        },
    },
    {
        id: 12,
        nomor: 'KNS-2026-0128',
        nama: 'Yohana Mabel',
        usia: 29,
        jenisKelamin: 'P',
        alamat: 'Dusun Karang Timur',
        keluhan: 'Berdebar dan mudah lelah setelah aktivitas ringan.',
        durasiKeluhan: '8–14 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'kuning',
        mode: 'teks',
        jadwalUsulan: 'Besok · 10.00–11.00 WITA',
        diminta: '1 hari lalu',
        status: 'DIJADWAL_ULANG',
        skrining: { sistol: 112, diastol: 74, suhu: 36.7, nadi: 118, spo2: 97, tandaBahaya: false },
        catatanSkrining: 'Nadi cepat dan teratur, tidak nyeri dada. Pasien cemas karena hasil pemeriksaan darah belum lengkap.',
        keputusan: {
            tindakan: 'jadwal_ulang',
            alasan: 'JGJ perlu dilengkapi dan hasil laboratorium darah belum tersedia. Konsultasi dipindahkan ke slot berikutnya agar evaluasi lebih lengkap.',
            slotBaru: 'Kamis · 09.00–10.00 WITA',
            waktu: 'Kemarin · 16.40 WITA',
        },
    },
    {
        id: 14,
        nomor: 'KNS-2026-0124',
        nama: 'Petrus Simbolon',
        usia: 61,
        jenisKelamin: 'L',
        alamat: 'Desa Pulau Karang',
        keluhan: 'Kontrol nyeri lambung dan riwayat maag.',
        durasiKeluhan: '> 14 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'Puskesmas Pulau Karang',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        prioritas: 'normal',
        mode: 'teks',
        jadwalUsulan: 'Besok · 15.00–16.00 WITA',
        diminta: '2 hari lalu',
        status: 'DITOLAK',
        skrining: { sistol: 132, diastol: 84, suhu: 36.5, nadi: 78, spo2: 98, tandaBahaya: false },
        catatanSkrining: 'Keluhan sama seperti konsultasi sebelumnya. Pasien tetap minum obat dari puskesmas secara teratur.',
        keputusan: {
            tindakan: 'tolak',
            alasan: 'Pasien sudah dikonsultasikan untuk keluhan yang sama tiga hari lalu tanpa perubahan skrining. Tindak lanjut obat maag dapat dilakukan dokter umum puskesmas.',
            slotBaru: null,
            waktu: 'Kemarin · 09.15 WITA',
        },
    },
];
