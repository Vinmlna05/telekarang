import type { ModeKonsultasi, PengirimPesan, StatusKonsultasi } from './konsultasi-pasien';

export interface SkriningPerawat {
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

export interface ReviewUmum {
    dokter: string;
    status: 'DISETUJUI' | 'DITANGANI_SENDIRI';
    catatan: string;
    waktu: string;
}

export interface HasilPerawat {
    icd10Kode: string;
    icd10Nama: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    tindakLanjut: string | null;
    waktu: string;
}

export interface PesanPerawat {
    id: number;
    pengirim: PengirimPesan;
    isi: string;
    waktu: string;
    statusKirim?: 'TERKIRIM' | 'MENUNGGU';
}

export interface KonsultasiPerawat {
    id: number;
    nomor: string;
    tanggal: string;
    pasien: {
        nama: string;
        usia: number;
        jenisKelamin: string;
        nik: string;
        noRm: string;
        alamat: string;
        telepon: string;
        sumber: string;
    };
    dokter: string;
    spesialisasi: string;
    faskes: string;
    jadwal: string;
    mode: ModeKonsultasi;
    status: StatusKonsultasi;
    prioritas: 'normal' | 'merah';
    keluhan: string;
    durasiKeluhan: string;
    skrining: SkriningPerawat | null;
    reviewUmum: ReviewUmum | null;
    hasil: HasilPerawat | null;
    pesan: PesanPerawat[];
    kedaluwarsaPada: string | null;
}

export const konsultasiPerawat: KonsultasiPerawat[] = [
    {
        id: 7,
        nomor: 'KNS-2026-0136',
        tanggal: '1 November 2026',
        pasien: {
            nama: 'Dewi Anggraini',
            usia: 38,
            jenisKelamin: 'P',
            nik: '7171010210380007',
            noRm: 'RM-2026-0184',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1007',
            sumber: 'Didaftarkan perawat',
        },
        dokter: 'dr. Bima Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        jadwal: 'Hari ini · 14.00–15.00 WITA',
        mode: 'teks',
        status: 'MENUNGGU_SPESIALIS',
        prioritas: 'normal',
        keluhan: 'Nyeri ulu hati dan mual sejak seminggu.',
        durasiKeluhan: '4–7 hari',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 54,
            tinggiBadan: 158,
            sistol: 124,
            diastol: 78,
            suhu: 36.7,
            nadi: 88,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Nyeri ulu hati terasa terbakar, memberat setelah makan. Tidak ada muntah darah atau BAB hitam.',
            waktu: '1 November 2026 · 12.32 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            status: 'DISETUJUI',
            catatan: 'Tanda vital stabil. Perlu evaluasi dyspepsia oleh spesialis penyakit dalam. Tidak ada indikasi rujukan gawat darurat.',
            waktu: '1 November 2026 · 12.48 WITA',
        },
        hasil: null,
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Selamat siang dok, pasien Ibu Dewi sudah diskrining. Keluhan nyeri ulu hati sejak seminggu, tanda vital stabil. Mohon arahan.',
                waktu: '12.34 WITA',
            },
            {
                id: 2,
                pengirim: 'spesialis',
                isi: 'Selamat siang. Terima kasih, saya sudah membaca hasil skrining. Sinyal di saya sedang lemah, kita lanjutkan lewat teks dan foto ya.',
                waktu: '12.51 WITA',
            },
            {
                id: 3,
                pengirim: 'perawat',
                isi: 'Baik dok. Pasien sudah kami arahkan untuk mengirim foto obat yang sedang diminum.',
                waktu: '12.53 WITA',
            },
        ],
        kedaluwarsaPada: null,
    },
    {
        id: 3,
        nomor: 'KNS-2026-0132',
        tanggal: '1 November 2026',
        pasien: {
            nama: 'Maria Lestari',
            usia: 27,
            jenisKelamin: 'P',
            nik: '7171010220270003',
            noRm: 'RM-2026-0161',
            alamat: 'Desa Pulau Karang',
            telepon: '+62 812-0000-1003',
            sumber: 'Didaftarkan perawat',
        },
        dokter: 'dr. Rina Kartika, Sp.KK',
        spesialisasi: 'Kulit',
        faskes: 'RSUD Daratan',
        jadwal: 'Hari ini · 13.00–14.00 WITA',
        mode: 'teks',
        status: 'SKRINING_SELESAI',
        prioritas: 'normal',
        keluhan: 'Gatal dan ruam di lengan sejak seminggu.',
        durasiKeluhan: '4–7 hari',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 58,
            tinggiBadan: 160,
            sistol: 118,
            diastol: 76,
            suhu: 36.8,
            nadi: 84,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Ruam kering di lengan kanan, tidak ada tanda infeksi.',
            waktu: '1 November 2026 · 10.18 WITA',
        },
        reviewUmum: null,
        hasil: null,
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Skrining sudah lengkap. Menunggu review dokter umum sebelum diteruskan ke dokter spesialis kulit.',
                waktu: '10.19 WITA',
            },
        ],
        kedaluwarsaPada: null,
    },
    {
        id: 1,
        nomor: 'KNS-2026-0108',
        tanggal: '28 Oktober 2026',
        pasien: {
            nama: 'Siti Rahmawati',
            usia: 34,
            jenisKelamin: 'P',
            nik: '7171010190340001',
            noRm: 'RM-2026-0142',
            alamat: 'Desa Karang Indah',
            telepon: '+62 812-0000-1001',
            sumber: 'Akun pasien',
        },
        dokter: 'dr. Ayu Lestari, Sp.A',
        spesialisasi: 'Anak',
        faskes: 'RSUD Daratan',
        jadwal: 'Rabu, 28 Oktober 2026 · 09.30 WITA',
        mode: 'teks',
        status: 'SELESAI',
        prioritas: 'normal',
        keluhan: 'Demam dan batuk berdahak sejak tiga hari.',
        durasiKeluhan: '1–3 hari',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 18,
            tinggiBadan: 112,
            sistol: 110,
            diastol: 70,
            suhu: 38.1,
            nadi: 96,
            spo2: 97,
            tandaBahaya: false,
            catatan: 'Anak tampak aktif, tidak sesak, dan masih mau makan serta minum.',
            waktu: '28 Oktober 2026 · 08.42 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            status: 'DISETUJUI',
            catatan: 'Demam tanpa tanda bahaya. Diteruskan untuk evaluasi ISPA.',
            waktu: '28 Oktober 2026 · 08.58 WITA',
        },
        hasil: {
            icd10Kode: 'J06.9',
            icd10Nama: 'Infeksi saluran pernapasan akut (ISPA)',
            saran: 'Istirahat cukup, minum air hangat, dan berikan parasetamol sesuai berat badan bila demam. Kompres hangat dapat membantu menurunkan suhu.',
            keputusanRujuk: false,
            alasanRujuk: null,
            biayaRujukan: null,
            tindakLanjut: null,
            waktu: '28 Oktober 2026 · 10.05 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Demam 38,1 °C dengan SpO₂ 97% masih dapat ditangani di puskesmas. Lanjutkan parasetamol sesuai berat badan.',
                waktu: '09.32 WITA',
            },
            {
                id: 2,
                pengirim: 'perawat',
                isi: 'Baik dok, sudah diberikan parasetamol dan orang tua diminta menjaga hidrasi.',
                waktu: '09.35 WITA',
            },
            {
                id: 3,
                pengirim: 'spesialis',
                isi: 'Tambahkan kompres hangat dan pantau suhu tiap empat jam. Jika sesak atau demam lebih dari tiga hari, segera kembali.',
                waktu: '09.38 WITA',
            },
        ],
        kedaluwarsaPada: null,
    },
    {
        id: 8,
        nomor: 'KNS-2026-0128',
        tanggal: '30 Oktober 2026',
        pasien: {
            nama: 'Paulus Rumbewas',
            usia: 70,
            jenisKelamin: 'L',
            nik: '7171010100700008',
            noRm: 'RM-2026-0190',
            alamat: 'Dusun Mawar',
            telepon: '+62 812-0000-1008',
            sumber: 'Akun pasien',
        },
        dokter: 'dr. Bima Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        jadwal: 'Jumat, 30 Oktober 2026 · 10.00 WITA',
        mode: 'video',
        status: 'SELESAI',
        prioritas: 'merah',
        keluhan: 'Sesak memberat dan tidak mampu berbaring.',
        durasiKeluhan: '1–3 hari',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 62,
            tinggiBadan: 164,
            sistol: 170,
            diastol: 100,
            suhu: 36.6,
            nadi: 118,
            spo2: 90,
            tandaBahaya: true,
            catatan: 'Pasien sesak saat berbaring, SpO₂ 90% dengan udara ruangan. Segera dikoordinasikan dengan dokter umum.',
            waktu: '30 Oktober 2026 · 09.12 WITA',
        },
        reviewUmum: {
            dokter: 'dr. Samuel Karet, M.K.M.',
            status: 'DISETUJUI',
            catatan: 'Tanda bahaya terdeteksi. Prioritas merah, perlu evaluasi spesialis segera dan persiapan rujukan.',
            waktu: '30 Oktober 2026 · 09.18 WITA',
        },
        hasil: {
            icd10Kode: 'I50.0',
            icd10Nama: 'Gagal jantung kongestif',
            saran: 'Rujuk segera ke RS untuk evaluasi kardiologi, oksigenasi, dan terapi diuretik. Pasien tidak boleh dipulangkan tanpa stabilisasi.',
            keputusanRujuk: true,
            alasanRujuk: 'Sesak memberat dengan SpO₂ 90% dan hipertensi, memerlukan fasilitas rawat inap dan evaluasi kardiologi.',
            biayaRujukan: 1250000,
            tindakLanjut: null,
            waktu: '30 Oktober 2026 · 09.42 WITA',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'perawat',
                isi: 'Dok, pasien sesak dan SpO₂ 90%. Sudah dipasang oksigen nasal 3 liter, tensi 170/100.',
                waktu: '09.20 WITA',
            },
            {
                id: 2,
                pengirim: 'spesialis',
                isi: 'Siapkan rujukan segera. Jaga posisi semifowler, lanjutkan oksigen, dan koordinasikan transportasi kapal.',
                waktu: '09.31 WITA',
            },
        ],
        kedaluwarsaPada: null,
    },
    {
        id: 9,
        nomor: 'KNS-2026-0121',
        tanggal: '31 Oktober 2026',
        pasien: {
            nama: 'Rosalina Wenda',
            usia: 31,
            jenisKelamin: 'P',
            nik: '7171010180310009',
            noRm: 'RM-2026-0196',
            alamat: 'Desa Karang Indah',
            telepon: '+62 812-0000-1009',
            sumber: 'Akun pasien',
        },
        dokter: 'dr. Bima Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        jadwal: '31 Oktober 2026 · 15.00–16.00 WITA',
        mode: 'teks',
        status: 'KEDALUWARSA',
        prioritas: 'normal',
        keluhan: 'Nyeri perut kanan bawah sejak kemarin.',
        durasiKeluhan: '1–3 hari',
        skrining: null,
        reviewUmum: null,
        hasil: null,
        pesan: [],
        kedaluwarsaPada: '3 November 2026 · 15.00 WITA',
    },
];

export function cariKonsultasiPerawat(id: number): KonsultasiPerawat {
    return konsultasiPerawat.find((item) => item.id === id) ?? konsultasiPerawat[0];
}
