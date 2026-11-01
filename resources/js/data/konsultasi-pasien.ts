export type StatusKonsultasi =
    | 'MENUNGGU_SKRINING'
    | 'SKRINING_SELESAI'
    | 'MENUNGGU_SPESIALIS'
    | 'DIKONFIRMASI'
    | 'BERLANGSUNG'
    | 'SELESAI'
    | 'DIJADWAL_ULANG'
    | 'DITOLAK'
    | 'KEDALUWARSA'
    | 'DIBATALKAN';

export type ModeKonsultasi = 'video' | 'teks';
export type PengirimPesan = 'pasien' | 'perawat' | 'spesialis';

export interface SkriningKonsultasi {
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

export interface HasilKonsultasi {
    icd10Kode: string;
    icd10Nama: string;
    saran: string;
    keputusanRujuk: boolean;
    alasanRujuk: string | null;
    biayaRujukan: number | null;
    tindakLanjut: string;
    waktu: string;
}

export interface PesanKonsultasi {
    id: number;
    pengirim: PengirimPesan;
    isi: string;
    waktu: string;
}

export interface KonsultasiPasien {
    id: number;
    nomor: string;
    tanggal: string;
    tanggalSingkat: string;
    dokter: string;
    spesialisasi: string;
    faskes: string;
    jadwal: string;
    mode: ModeKonsultasi;
    status: StatusKonsultasi;
    keluhan: string;
    skrining: SkriningKonsultasi;
    hasil: HasilKonsultasi;
    pesan: PesanKonsultasi[];
}

export const statusKonsultasiLabels: Record<StatusKonsultasi, string> = {
    MENUNGGU_SKRINING: 'Menunggu skrining',
    SKRINING_SELESAI: 'Skrining selesai',
    MENUNGGU_SPESIALIS: 'Menunggu dokter spesialis',
    DIKONFIRMASI: 'Dikonfirmasi',
    BERLANGSUNG: 'Berlangsung',
    SELESAI: 'Selesai',
    DIJADWAL_ULANG: 'Dijadwal ulang',
    DITOLAK: 'Ditolak',
    KEDALUWARSA: 'Kedaluwarsa',
    DIBATALKAN: 'Dibatalkan',
};

export const modeKonsultasiLabels: Record<ModeKonsultasi, string> = {
    video: 'Video + chat',
    teks: 'Teks + foto',
};

export const konsultasiPasien: KonsultasiPasien[] = [
    {
        id: 1,
        nomor: 'KNS-2026-0108',
        tanggal: '8 Oktober 2026',
        tanggalSingkat: '08 Okt 2026',
        dokter: 'dr. Ayu Lestari, Sp.A',
        spesialisasi: 'Anak',
        faskes: 'RSUD Daratan',
        jadwal: 'Rabu, 8 Oktober 2026 · 09.30 WIT',
        mode: 'teks',
        status: 'SELESAI',
        keluhan: 'Demam dan batuk berdahak sejak tiga hari.',
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
            catatan: 'Anak tampak aktif, tidak sesak, dan masih mau makan serta minum. Tidak ada riwayat kejang.',
            waktu: '8 Oktober 2026 · 08.42 WIT',
        },
        hasil: {
            icd10Kode: 'J06.9',
            icd10Nama: 'Infeksi saluran pernapasan akut (ISPA)',
            saran: 'Istirahat cukup, minum air hangat, dan berikan parasetamol sesuai berat badan bila demam. Kompres hangat dapat membantu menurunkan suhu.',
            keputusanRujuk: false,
            alasanRujuk: null,
            biayaRujukan: null,
            tindakLanjut: 'Kontrol ulang ke puskesmas jika demam lebih dari tiga hari, muncul sesak, atau anak tampak lemas.',
            waktu: '8 Oktober 2026 · 10.05 WIT',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Selamat pagi, saya sudah membaca hasil skrining Ananda. Demam 38,1 °C dengan SpO2 97% masih dapat ditangani di puskesmas.',
                waktu: '09.32 WIT',
            },
            {
                id: 2,
                pengirim: 'perawat',
                isi: 'Baik dok, sudah diberikan parasetamol sesuai berat badan. Orang tua diminta menjaga hidrasi.',
                waktu: '09.35 WIT',
            },
            {
                id: 3,
                pengirim: 'spesialis',
                isi: 'Tambahkan kompres hangat dan pantau suhu tiap empat jam. Jika sesak atau demam lebih dari tiga hari, segera kembali.',
                waktu: '09.38 WIT',
            },
            {
                id: 4,
                pengirim: 'pasien',
                isi: 'Terima kasih dok, sudah saya catat.',
                waktu: '09.41 WIT',
            },
        ],
    },
    {
        id: 2,
        nomor: 'KNS-2026-0094',
        tanggal: '21 September 2026',
        tanggalSingkat: '21 Sep 2026',
        dokter: 'dr. Rizky Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        jadwal: 'Senin, 21 September 2026 · 10.00 WIT',
        mode: 'video',
        status: 'SELESAI',
        keluhan: 'Kepala terasa berat dan tekanan darah naik sejak dua hari.',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 68,
            tinggiBadan: 164,
            sistol: 150,
            diastol: 95,
            suhu: 36.8,
            nadi: 88,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Pasien sadar penuh, tidak nyeri dada, dan tidak sesak. Tekanan darah diukur ulang setelah lima menit istirahat.',
            waktu: '21 September 2026 · 09.12 WIT',
        },
        hasil: {
            icd10Kode: 'I10',
            icd10Nama: 'Hipertensi esensial',
            saran: 'Lanjutkan obat antihipertensi yang sudah diberikan, batasi garam, dan catat tekanan darah setiap pagi. Tidak perlu rujukan hari ini.',
            keputusanRujuk: false,
            alasanRujuk: null,
            biayaRujukan: null,
            tindakLanjut: 'Kontrol tekanan darah di puskesmas setiap minggu. Segera rujuk bila sistol ≥ 180 atau muncul nyeri dada.',
            waktu: '21 September 2026 · 10.28 WIT',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Tekanan darah 150/95 tanpa gejala bahaya. Tetap minum obat rutin dan kurangi makanan asin.',
                waktu: '10.03 WIT',
            },
            {
                id: 2,
                pengirim: 'pasien',
                isi: 'Obat dari puskesmas masih tersisa untuk seminggu, dok.',
                waktu: '10.06 WIT',
            },
            {
                id: 3,
                pengirim: 'spesialis',
                isi: 'Baik, nanti perawat menyiapkan resep lanjutan. Bawa catatan tekanan darah saat kontrol.',
                waktu: '10.09 WIT',
            },
        ],
    },
    {
        id: 3,
        nomor: 'KNS-2026-0081',
        tanggal: '14 September 2026',
        tanggalSingkat: '14 Sep 2026',
        dokter: 'dr. Maya Kusuma, Sp.KK',
        spesialisasi: 'Kulit',
        faskes: 'Klinik Sehat Pulau Karang',
        jadwal: 'Senin, 14 September 2026 · 08.30 WIT',
        mode: 'teks',
        status: 'SELESAI',
        keluhan: 'Kemerahan dan nyeri di tungkai kanan yang makin meluas sejak kemarin.',
        skrining: {
            perawat: 'Ns. Rina Marlina',
            beratBadan: 72,
            tinggiBadan: 158,
            sistol: 118,
            diastol: 76,
            suhu: 38.7,
            nadi: 104,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Tampak kemerahan sekitar 8 cm di tungkai kanan, hangat, dan nyeri saat ditekan. Tidak ada luka terbuka.',
            waktu: '14 September 2026 · 08.05 WIT',
        },
        hasil: {
            icd10Kode: 'L03.9',
            icd10Nama: 'Selulitis, tidak spesifik',
            saran: 'Diperlukan antibiotik intravena dan evaluasi perluasan infeksi. Pasien perlu dirujuk ke RSUD Daratan hari ini.',
            keputusanRujuk: true,
            alasanRujuk: 'Kemerahan meluas cepat disertai demam tinggi. Puskesmas tidak memiliki fasilitas rawat inap dan antibiotik intravena.',
            biayaRujukan: 850000,
            tindakLanjut: 'Perawat menyiapkan surat rujukan dan koordinasi ambulans kapal. Pasien didampingi keluarga.',
            waktu: '14 September 2026 · 09.10 WIT',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Kemerahan yang meluas cepat dengan demam perlu dievaluasi di fasilitas rawat inap. Mohon siapkan rujukan hari ini.',
                waktu: '08.44 WIT',
            },
            {
                id: 2,
                pengirim: 'perawat',
                isi: 'Baik dok, surat rujukan dan hasil skrining sedang kami siapkan.',
                waktu: '08.48 WIT',
            },
            {
                id: 3,
                pengirim: 'pasien',
                isi: 'Terima kasih, keluarga sudah menyiapkan keberangkatan.',
                waktu: '08.52 WIT',
            },
        ],
    },
    {
        id: 4,
        nomor: 'KNS-2026-0067',
        tanggal: '2 September 2026',
        tanggalSingkat: '02 Sep 2026',
        dokter: 'dr. Rizky Pratama, Sp.PD',
        spesialisasi: 'Penyakit Dalam',
        faskes: 'RSUD Daratan',
        jadwal: 'Rabu, 2 September 2026 · 11.00 WIT',
        mode: 'teks',
        status: 'SELESAI',
        keluhan: 'Nyeri lambung dan mual setelah makan sejak empat hari.',
        skrining: {
            perawat: 'Ns. Rina Marlina',
            beratBadan: 57,
            tinggiBadan: 160,
            sistol: 112,
            diastol: 72,
            suhu: 36.6,
            nadi: 82,
            spo2: 99,
            tandaBahaya: false,
            catatan: 'Nyeri di ulu hati, tidak menjalar, tidak ada muntah darah atau bab hitam. Pasien sempat terlambat makan.',
            waktu: '2 September 2026 · 10.18 WIT',
        },
        hasil: {
            icd10Kode: 'K29.7',
            icd10Nama: 'Gastritis, tidak spesifik',
            saran: 'Makan dalam porsi kecil tetapi sering, hindari makanan pedas dan kopi. Lanjutkan obat lambung dari puskesmas.',
            keputusanRujuk: false,
            alasanRujuk: null,
            biayaRujukan: null,
            tindakLanjut: 'Kontrol di puskesmas bila nyeri menetap lebih dari satu minggu atau muncul muntah darah.',
            waktu: '2 September 2026 · 11.22 WIT',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Keluhan sesuai gastritis tanpa tanda perdarahan. Cukup terapi oral dan perbaikan pola makan.',
                waktu: '11.08 WIT',
            },
            {
                id: 2,
                pengirim: 'perawat',
                isi: 'Obat sudah diberikan dan jadwal makan sudah dijelaskan.',
                waktu: '11.11 WIT',
            },
        ],
    },
    {
        id: 5,
        nomor: 'KNS-2026-0042',
        tanggal: '18 Agustus 2026',
        tanggalSingkat: '18 Agu 2026',
        dokter: 'dr. Ayu Lestari, Sp.A',
        spesialisasi: 'Anak',
        faskes: 'RSUD Daratan',
        jadwal: 'Selasa, 18 Agustus 2026 · 09.30 WIT',
        mode: 'teks',
        status: 'SELESAI',
        keluhan: 'Buah hati buang air besar cair lebih dari lima kali sejak kemarin.',
        skrining: {
            perawat: 'Ns. Dewi Anggraini',
            beratBadan: 14,
            tinggiBadan: 98,
            sistol: 96,
            diastol: 62,
            suhu: 37.4,
            nadi: 110,
            spo2: 98,
            tandaBahaya: false,
            catatan: 'Anak masih aktif dan mau minum. Turgor kulit baik, mata tidak cekung, dan tidak ada darah pada tinja.',
            waktu: '18 Agustus 2026 · 08.50 WIT',
        },
        hasil: {
            icd10Kode: 'A09',
            icd10Nama: 'Diare dan gastroenteritis',
            saran: 'Berikan oralit setiap kali buang air besar cair, lanjutkan ASI atau makanan biasa, dan zinc sesuai dosis. Tidak perlu antibiotik.',
            keputusanRujuk: false,
            alasanRujuk: null,
            biayaRujukan: null,
            tindakLanjut: 'Kembali segera bila anak lemas, tidak mau minum, mata cekung, atau buang air kecil berkurang.',
            waktu: '18 Agustus 2026 · 09.46 WIT',
        },
        pesan: [
            {
                id: 1,
                pengirim: 'spesialis',
                isi: 'Tidak ada tanda dehidrasi berat. Fokus pada oralit dan zinc, lanjutkan makanan seperti biasa.',
                waktu: '09.36 WIT',
            },
            {
                id: 2,
                pengirim: 'perawat',
                isi: 'Sudah diajarkan cara membuat oralit dan tanda bahaya yang perlu dipantau.',
                waktu: '09.40 WIT',
            },
            {
                id: 3,
                pengirim: 'pasien',
                isi: 'Baik, terima kasih atas penjelasannya.',
                waktu: '09.43 WIT',
            },
        ],
    },
];

export function cariKonsultasi(id: number): KonsultasiPasien {
    return konsultasiPasien.find((item) => item.id === id) ?? konsultasiPasien[0];
}
