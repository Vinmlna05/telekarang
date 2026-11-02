export type PrioritasReview = 'merah' | 'kuning' | 'normal';
export type KeputusanReview = 'TERUSKAN' | 'TANGANI_SENDIRI';

export interface RiwayatKunjungan {
    tanggal: string;
    keluhan: string;
    tindakan: string;
}

export interface PemeriksaanTambahan {
    label: string;
    nilai: string;
    satuan: string;
}

export interface ReviewDokterDetail {
    id: number;
    nomor: string;
    tanggal: string;
    prioritas: PrioritasReview;
    status: 'SKRINING_SELESAI';
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        nik: string;
        noRm: string;
        alamat: string;
        telepon: string;
        sumber: string;
        pekerjaan: string;
    };
    keluhan: string;
    durasiKeluhan: string;
    tujuan: {
        spesialisasi: string;
        dokter: string;
        faskes: string;
        jadwal: string;
        mode: 'video' | 'teks';
    };
    skrining: {
        perawat: string;
        beratBadan: number;
        tinggiBadan: number;
        sistol: number;
        diastol: number;
        suhu: number;
        nadi: number;
        spo2: number;
        tandaBahaya: boolean;
        catatan: string;
        waktu: string;
    };
    pemeriksaanTambahan: PemeriksaanTambahan[];
    riwayat: RiwayatKunjungan[];
}

export const reviewDokter: ReviewDokterDetail[] = [
    {
        id: 2,
        nomor: 'KNS-2026-0141',
        tanggal: '1 November 2026',
        prioritas: 'merah',
        status: 'SKRINING_SELESAI',
        pasien: {
            nama: 'Andi Saputra',
            usia: 52,
            jenisKelamin: 'L',
            nik: '7171010112740002',
            noRm: 'RM-2026-0152',
            alamat: 'Dusun Melati, Pulau Karang',
            telepon: '+62 812-0000-1012',
            sumber: 'Didaftarkan perawat',
            pekerjaan: 'Nelayan',
        },
        keluhan: 'Sesak berat dan nyeri dada sejak pagi.',
        durasiKeluhan: '< 1 hari',
        tujuan: {
            spesialisasi: 'Penyakit Dalam',
            dokter: 'dr. Bima Pratama, Sp.PD',
            faskes: 'RSUD Daratan',
            jadwal: 'Hari ini · 11.00–12.00 WITA',
            mode: 'video',
        },
        skrining: {
            perawat: 'Perawat Sari',
            beratBadan: 78,
            tinggiBadan: 168,
            sistol: 190,
            diastol: 120,
            suhu: 38.2,
            nadi: 128,
            spo2: 91,
            tandaBahaya: true,
            catatan:
                'Pasien sesak saat berbaring, nyeri dada menjalar ke lengan kiri. SpO₂ 91% dengan udara ruangan. Sudah dipasang oksigen nasal 3 liter, tensi 190/120.',
            waktu: '1 November 2026 · 09.20 WITA',
        },
        pemeriksaanTambahan: [
            { label: 'Gula darah sewaktu', nilai: '182', satuan: 'mg/dL' },
            { label: 'Hemoglobin', nilai: '14,2', satuan: 'g/dL' },
        ],
        riwayat: [
            {
                tanggal: '12 Agustus 2026',
                keluhan: 'Pusing dan tengkuk kaku.',
                tindakan: 'Amlodipine 5 mg, edukasi diet rendah garam.',
            },
            {
                tanggal: '3 Mei 2026',
                keluhan: 'Kontrol hipertensi.',
                tindakan: 'Tekanan darah 160/95, obat dilanjutkan.',
            },
        ],
    },
    {
        id: 1,
        nomor: 'KNS-2026-0138',
        tanggal: '1 November 2026',
        prioritas: 'kuning',
        status: 'SKRINING_SELESAI',
        pasien: {
            nama: 'Siti Rahmawati',
            usia: 34,
            jenisKelamin: 'P',
            nik: '7171010190340001',
            noRm: 'RM-2026-0142',
            alamat: 'Desa Karang Indah',
            telepon: '+62 812-0000-1001',
            sumber: 'Akun pasien',
            pekerjaan: 'Guru SD',
        },
        keluhan: 'Demam dan batuk berdahak sejak tiga hari.',
        durasiKeluhan: '1–3 hari',
        tujuan: {
            spesialisasi: 'Penyakit Dalam',
            dokter: 'dr. Bima Pratama, Sp.PD',
            faskes: 'RSUD Daratan',
            jadwal: 'Hari ini · 10.00–11.00 WITA',
            mode: 'teks',
        },
        skrining: {
            perawat: 'Perawat Sari',
            beratBadan: 58,
            tinggiBadan: 158,
            sistol: 120,
            diastol: 80,
            suhu: 38.9,
            nadi: 102,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Demam naik-turun, batuk berdahak putih. Tidak ada sesak maupun nyeri dada. Masih mau makan dan minum.',
            waktu: '1 November 2026 · 08.45 WITA',
        },
        pemeriksaanTambahan: [{ label: 'Hemoglobin', nilai: '12,8', satuan: 'g/dL' }],
        riwayat: [
            {
                tanggal: '20 Juli 2026',
                keluhan: 'Batuk pilek.',
                tindakan: 'Vitamin C dan istirahat, keluhan membaik.',
            },
        ],
    },
    {
        id: 5,
        nomor: 'KNS-2026-0134',
        tanggal: '1 November 2026',
        prioritas: 'kuning',
        status: 'SKRINING_SELESAI',
        pasien: {
            nama: 'Yohanes Kurniawan',
            usia: 61,
            jenisKelamin: 'L',
            nik: '7171010107650005',
            noRm: 'RM-2026-0173',
            alamat: 'Dusun Mawar, Pulau Karang',
            telepon: '+62 812-0000-1015',
            sumber: 'Didaftarkan perawat',
            pekerjaan: 'Petani',
        },
        keluhan: 'Pusing berulang dan tengkuk terasa kaku.',
        durasiKeluhan: '4–7 hari',
        tujuan: {
            spesialisasi: 'Penyakit Dalam',
            dokter: 'dr. Bima Pratama, Sp.PD',
            faskes: 'RSUD Daratan',
            jadwal: 'Hari ini · 13.00–14.00 WITA',
            mode: 'teks',
        },
        skrining: {
            perawat: 'Perawat Nia',
            beratBadan: 70,
            tinggiBadan: 166,
            sistol: 170,
            diastol: 100,
            suhu: 36.5,
            nadi: 90,
            spo2: 95,
            tandaBahaya: false,
            catatan: 'Pusing berulang sejak seminggu, tengkuk kaku. Tidak ada kelemahan anggota gerak maupun bicara pelo.',
            waktu: '1 November 2026 · 08.10 WITA',
        },
        pemeriksaanTambahan: [{ label: 'Gula darah sewaktu', nilai: '134', satuan: 'mg/dL' }],
        riwayat: [
            {
                tanggal: '15 September 2026',
                keluhan: 'Tekanan darah tinggi.',
                tindakan: 'Captopril 12,5 mg, edukasi aktivitas fisik.',
            },
        ],
    },
    {
        id: 3,
        nomor: 'KNS-2026-0132',
        tanggal: '1 November 2026',
        prioritas: 'normal',
        status: 'SKRINING_SELESAI',
        pasien: {
            nama: 'Maria Lestari',
            usia: 27,
            jenisKelamin: 'P',
            nik: '7171010220270003',
            noRm: 'RM-2026-0161',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1003',
            sumber: 'Akun pasien',
            pekerjaan: 'Penjahit',
        },
        keluhan: 'Gatal dan ruam di lengan sejak seminggu.',
        durasiKeluhan: '4–7 hari',
        tujuan: {
            spesialisasi: 'Kulit',
            dokter: 'dr. Rina Kartika, Sp.KK',
            faskes: 'RSUD Daratan',
            jadwal: 'Hari ini · 14.00–15.00 WITA',
            mode: 'teks',
        },
        skrining: {
            perawat: 'Perawat Nia',
            beratBadan: 58,
            tinggiBadan: 160,
            sistol: 110,
            diastol: 70,
            suhu: 36.8,
            nadi: 82,
            spo2: 99,
            tandaBahaya: false,
            catatan: 'Ruam kering kemerahan di lengan kanan, tidak ada tanda infeksi. Gatal memberat malam hari.',
            waktu: '1 November 2026 · 07.55 WITA',
        },
        pemeriksaanTambahan: [],
        riwayat: [],
    },
];

export function cariReviewDokter(id: number): ReviewDokterDetail {
    return reviewDokter.find((item) => item.id === id) ?? reviewDokter[0];
}
