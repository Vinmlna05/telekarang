<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SkriningController extends Controller
{
    public function __invoke(int $konsultasi): Response
    {
        $pasien = [
            1 => [
                'id' => 1,
                'nama' => 'Siti Rahmawati',
                'usia' => 34,
                'jenisKelamin' => 'P',
                'nik' => '7171010190340001',
                'noRm' => 'RM-2026-0142',
                'alamat' => 'Desa Karang Indah',
                'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Hari ini · 10.00–11.00 WITA',
                'status' => 'MENUNGGU_SKRINING',
                'prioritas' => 'normal',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Hari ini, 08.30',
            ],
            2 => [
                'id' => 2,
                'nama' => 'Andi Saputra',
                'usia' => 52,
                'jenisKelamin' => 'L',
                'nik' => '7171010150520002',
                'noRm' => 'RM-2026-0157',
                'alamat' => 'Dusun Tanjung Batu',
                'keluhan' => 'Sesak berat dan nyeri dada sejak pagi.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Hari ini · 10.00–11.00 WITA',
                'status' => 'MENUNGGU_SKRINING',
                'prioritas' => 'merah',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Hari ini, 09.15',
            ],
            3 => [
                'id' => 3,
                'nama' => 'Maria Lestari',
                'usia' => 27,
                'jenisKelamin' => 'P',
                'nik' => '7171010220270003',
                'noRm' => 'RM-2026-0161',
                'alamat' => 'Desa Pulau Karang',
                'keluhan' => 'Gatal dan ruam di lengan sejak seminggu.',
                'spesialisasi' => 'Kulit',
                'dokter' => 'dr. Rina Kartika, Sp.KK',
                'jadwal' => 'Hari ini · 13.00–14.00 WITA',
                'status' => 'SKRINING_SELESAI',
                'prioritas' => 'normal',
                'sumber' => 'Didaftarkan perawat',
                'waktuMasuk' => 'Hari ini, 10.00',
            ],
            4 => [
                'id' => 4,
                'nama' => 'Yohanes Kurniawan',
                'usia' => 61,
                'jenisKelamin' => 'L',
                'nik' => '7171010170610004',
                'noRm' => 'RM-2026-0168',
                'alamat' => 'Dusun Mawar',
                'keluhan' => 'Kontrol hipertensi dan pusing berulang.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Besok · 09.00–10.00 WITA',
                'status' => 'MENUNGGU_SKRINING',
                'prioritas' => 'normal',
                'sumber' => 'Didaftarkan perawat',
                'waktuMasuk' => 'Hari ini, 10.45',
            ],
            5 => [
                'id' => 5,
                'nama' => 'Nur Aisyah',
                'usia' => 7,
                'jenisKelamin' => 'P',
                'nik' => '7171010240070005',
                'noRm' => 'RM-2026-0172',
                'alamat' => 'Desa Karang Indah',
                'keluhan' => 'Demam tinggi sejak dua hari dan sulit makan.',
                'spesialisasi' => 'Anak',
                'dokter' => 'dr. Ayu Lestari, Sp.A',
                'jadwal' => 'Hari ini · 11.00–12.00 WITA',
                'status' => 'SKRINING_SELESAI',
                'prioritas' => 'normal',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Hari ini, 11.10',
            ],
            6 => [
                'id' => 6,
                'nama' => 'Markus Tarigan',
                'usia' => 45,
                'jenisKelamin' => 'L',
                'nik' => '7171010130450006',
                'noRm' => 'RM-2026-0179',
                'alamat' => 'Dusun Tanjung Batu',
                'keluhan' => 'Luka bakar ringan pada tangan kanan.',
                'spesialisasi' => 'Kulit',
                'dokter' => 'dr. Rina Kartika, Sp.KK',
                'jadwal' => 'Besok · 10.00–11.00 WITA',
                'status' => 'MENUNGGU_SKRINING',
                'prioritas' => 'normal',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Hari ini, 11.35',
            ],
            7 => [
                'id' => 7,
                'nama' => 'Dewi Anggraini',
                'usia' => 38,
                'jenisKelamin' => 'P',
                'nik' => '7171010210380007',
                'noRm' => 'RM-2026-0184',
                'alamat' => 'Desa Pulau Karang',
                'keluhan' => 'Nyeri ulu hati dan mual sejak seminggu.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Hari ini · 14.00–15.00 WITA',
                'status' => 'MENUNGGU_SPESIALIS',
                'prioritas' => 'normal',
                'sumber' => 'Didaftarkan perawat',
                'waktuMasuk' => 'Hari ini, 12.20',
            ],
            8 => [
                'id' => 8,
                'nama' => 'Paulus Rumbewas',
                'usia' => 70,
                'jenisKelamin' => 'L',
                'nik' => '7171010100700008',
                'noRm' => 'RM-2026-0190',
                'alamat' => 'Dusun Mawar',
                'keluhan' => 'Sesak memberat dan tidak mampu berbaring.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Hari ini · 10.00–11.00 WITA',
                'status' => 'MENUNGGU_SPESIALIS',
                'prioritas' => 'merah',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Hari ini, 13.05',
            ],
            9 => [
                'id' => 9,
                'nama' => 'Rosalina Wenda',
                'usia' => 31,
                'jenisKelamin' => 'P',
                'nik' => '7171010180310009',
                'noRm' => 'RM-2026-0196',
                'alamat' => 'Desa Karang Indah',
                'keluhan' => 'Nyeri perut kanan bawah sejak kemarin.',
                'spesialisasi' => 'Penyakit Dalam',
                'dokter' => 'dr. Bima Pratama, Sp.PD',
                'jadwal' => 'Kemarin · 15.00–16.00 WITA',
                'status' => 'KEDALUWARSA',
                'prioritas' => 'normal',
                'sumber' => 'Akun pasien',
                'waktuMasuk' => 'Kemarin, 15.00',
            ],
        ];

        $data = $pasien[$konsultasi] ?? $pasien[1];

        $nilaiAwal = [
            'berat' => '',
            'tinggi' => '',
            'suhu' => '',
            'nadi' => '',
            'sistol' => '',
            'diastol' => '',
            'spo2' => '',
            'catatan' => '',
        ];

        if ($konsultasi === 3) {
            $nilaiAwal = [
                'berat' => '58',
                'tinggi' => '160',
                'suhu' => '36.8',
                'nadi' => '84',
                'sistol' => '118',
                'diastol' => '76',
                'spo2' => '98',
                'catatan' => 'Ruam kering di lengan kanan, tidak ada tanda infeksi.',
            ];
        }

        if ($konsultasi === 5) {
            $nilaiAwal = [
                'berat' => '20',
                'tinggi' => '118',
                'suhu' => '38.9',
                'nadi' => '112',
                'sistol' => '100',
                'diastol' => '64',
                'spo2' => '97',
                'catatan' => 'Anak tampak lemas namun sadar dan masih mau minum.',
            ];
        }

        return Inertia::render('perawat/skrining', [
            'konsultasiId' => $konsultasi,
            'pasien' => $data,
            'nilaiAwal' => $nilaiAwal,
        ]);
    }
}
