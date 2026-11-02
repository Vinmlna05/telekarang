export type ModeRuang = 'video' | 'teks';
export type PengirimRuang = 'pasien' | 'perawat' | 'spesialis';
export type StatusRuang = 'DIKONFIRMASI' | 'BERLANGSUNG';

export interface PesanRuang {
    id: number;
    pengirim: PengirimRuang;
    isi: string;
    waktu: string;
    foto?: string | null;
    statusKirim?: 'TERKIRIM' | 'MENUNGGU';
}

export interface SkriningRuang {
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
}

export interface ReviewUmumRuang {
    dokter: string;
    catatan: string;
    waktu: string;
}

export interface KonsultasiRuang {
    id: number;
    nomor: string;
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: 'L' | 'P';
        nik: string;
        noRm: string;
        alamat: string;
        telepon: string;
    };
    keluhan: string;
    durasiKeluhan: string;
    spesialisasi: string;
    faskes: string;
    dokterPengirim: string;
    jadwal: string;
    prioritas: 'merah' | 'kuning' | 'normal';
    mode: ModeRuang;
    status: StatusRuang;
    tautanVideo: string | null;
    skrining: SkriningRuang;
    reviewUmum: ReviewUmumRuang;
    pesan: PesanRuang[];
}

export const labelPengirimRuang: Record<PengirimRuang, string> = {
    pasien: 'Pasien',
    perawat: 'Perawat pendamping',
    spesialis: 'Anda',
};

export const konsultasiSpesialis: KonsultasiRuang[] = [
    {
        id: 4,
        nomor: 'KNS-2026-0133',
        pasien: {
            nama: 'Nur Aisyah',
            usia: 8,
            jenisKelamin: 'P',
            nik: '7171014508180003',
            noRm: 'RM-2026-0191',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1014',
        },
        keluhan: 'Demam tinggi dan sesak sejak dua hari.',
        durasiKeluhan: '1–3 hari',
        spesialisasi: 'Anak',
        faskes: 'RSUD Daratan',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        jadwal: 'Hari ini · 10.00–11.00 WITA',
        prioritas: 'kuning',
        mode: 'video',
        status: 'DIKONFIRMASI',
        tautanVideo: 'https://meet.jit.si/telekarang-kns-0133',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 18,
            tinggiBadan: 112,
            sistol: 108,
            diastol: 68,
            suhu: 39.2,
            nadi: 118,
            spo2: 95,
            tandaBahaya: false,
            catatan: 'Anak tampak lemas, napas cepat saat menangis. Belum ada kejang dan masih mau minum.',
            waktu: 'Hari ini · 08.20 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            catatan: 'Demam hari ke-2 dengan napas cepat. Perlu evaluasi spesialis anak untuk menyingkirkan pneumonia.',
            waktu: 'Hari ini · 08.35 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Selamat pagi Dokter, pasien sudah bersama saya di ruang konsultasi puskesmas.',
                waktu: '09.58',
            },
            {
                id: 2,
                pengirim: 'spesialis',
                isi: 'Selamat pagi. Mohon siapkan data suhu terakhir dan apakah anak masih mau minum.',
                waktu: '10.01',
            },
            {
                id: 3,
                pengirim: 'perawat',
                isi: 'Suhu terakhir 39,2 °C. Anak masih mau minum air putih, tetapi makan berkurang.',
                waktu: '10.03',
            },
        ],
    },
    {
        id: 6,
        nomor: 'KNS-2026-0134',
        pasien: {
            nama: 'Rudi Hartono',
            usia: 45,
            jenisKelamin: 'L',
            nik: '7171011207810005',
            noRm: 'RM-2026-0177',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1006',
        },
        keluhan: 'Nyeri ulu hati berulang setelah makan.',
        durasiKeluhan: '4–7 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        jadwal: 'Besok · 09.00–10.00 WITA',
        prioritas: 'normal',
        mode: 'teks',
        status: 'DIKONFIRMASI',
        tautanVideo: null,
        skrining: {
            perawat: 'Ns. Rina Marlina',
            beratBadan: 71,
            tinggiBadan: 168,
            sistol: 128,
            diastol: 82,
            suhu: 36.8,
            nadi: 84,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Nyeri terbakar di ulu hati, memberat setelah makan. Tidak ada muntah darah atau BAB hitam.',
            waktu: 'Hari ini · 09.10 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            catatan: 'Dugaan dyspepsia tanpa tanda bahaya. Mohon evaluasi terapi dan kebutuhan pemeriksaan H. pylori.',
            waktu: 'Hari ini · 09.25 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Dokter, pasien sudah kami daftarkan pada mode teks karena sinyal di dusun sedang lemah.',
                waktu: 'Kemarin · 16.20',
            },
            {
                id: 2,
                pengirim: 'spesialis',
                isi: 'Baik, mode teks tidak masalah. Mohon sampaikan apakah nyeri menjalar ke punggung atau dada.',
                waktu: 'Kemarin · 16.24',
            },
        ],
    },
    {
        id: 7,
        nomor: 'KNS-2026-0136',
        pasien: {
            nama: 'Maria Lestari',
            usia: 27,
            jenisKelamin: 'P',
            nik: '7171010207990002',
            noRm: 'RM-2026-0184',
            alamat: 'Dusun Karang Barat',
            telepon: '+62 812-0000-1007',
        },
        keluhan: 'Ruam meluas di kedua lengan.',
        durasiKeluhan: '1–3 hari',
        spesialisasi: 'Kulit',
        faskes: 'RSUD Daratan',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        jadwal: 'Hari ini · 09.00–10.00 WITA',
        prioritas: 'normal',
        mode: 'teks',
        status: 'BERLANGSUNG',
        tautanVideo: null,
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 52,
            tinggiBadan: 158,
            sistol: 118,
            diastol: 76,
            suhu: 38.7,
            nadi: 104,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Ruam kemerahan dan hangat di kedua lengan, tidak melepuh. Tidak ada sesak atau bengkak wajah.',
            waktu: 'Hari ini · 07.45 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            catatan: 'Ruam dengan demam ringan, belum ada tanda kegawatan. Perlu evaluasi penyebab alergi atau infeksi kulit.',
            waktu: 'Hari ini · 08.02 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Dokter, pasien sudah siap. Ruam di kedua lengan terasa gatal dan hangat.',
                waktu: '09.05',
            },
            {
                id: 2,
                pengirim: 'spesialis',
                isi: 'Baik, mohon kirim foto area ruam dengan pencahayaan cukup, lalu sebutkan sejak kapan muncul.',
                waktu: '09.08',
            },
            {
                id: 3,
                pengirim: 'pasien',
                isi: 'Muncul tiga hari lalu, awalnya di lengan kiri lalu menyebar.',
                waktu: '09.11',
            },
        ],
    },
    {
        id: 11,
        nomor: 'KNS-2026-0130',
        pasien: {
            nama: 'Andi Saputra',
            usia: 34,
            jenisKelamin: 'L',
            nik: '7171011506920008',
            noRm: 'RM-2026-0169',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1011',
        },
        keluhan: 'Nyeri sendi lutut kanan sejak seminggu.',
        durasiKeluhan: '4–7 hari',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        dokterPengirim: 'dr. Samuel Karet, M.K.M.',
        jadwal: 'Hari ini · 13.30–14.30 WITA',
        prioritas: 'normal',
        mode: 'video',
        status: 'DIKONFIRMASI',
        tautanVideo: 'https://meet.jit.si/telekarang-kns-0130',
        skrining: {
            perawat: 'Ns. Rina Marlina',
            beratBadan: 78,
            tinggiBadan: 172,
            sistol: 124,
            diastol: 80,
            suhu: 36.6,
            nadi: 88,
            spo2: 99,
            tandaBahaya: false,
            catatan: 'Lutut kanan bengkak ringan, nyeri saat menekuk. Tidak ada riwayat trauma berat.',
            waktu: 'Hari ini · 10.05 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            catatan: 'Nyeri sendi kronis ringan tanpa tanda infeksi sistemik. Mohon evaluasi kemungkinan osteoarthritis awal.',
            waktu: 'Hari ini · 10.20 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Dokter, ruang video sudah kami siapkan untuk sesi pukul 13.30.',
                waktu: '13.22',
            },
        ],
    },
];

export function cariKonsultasiRuang(id: number): KonsultasiRuang {
    return konsultasiSpesialis.find((item) => item.id === id) ?? konsultasiSpesialis[0];
}
