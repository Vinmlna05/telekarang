<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Tampilkan beranda pasien beserta status permintaan aktif.
     */
    public function __invoke(): Response
    {
        return Inertia::render('pasien/beranda', [
            'konsultasiAktif' => [
                'id' => 1,
                'status' => 'MENUNGGU_SKRINING',
                'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
                'dokter' => 'dr. Ayu Lestari, Sp.A',
                'spesialisasi' => 'Spesialis Anak',
                'jadwal' => 'Senin, 3 November 2026 · 10.00 WITA',
            ],
            'ringkasan' => [
                'totalKonsultasi' => 3,
                'rujukanTerhindarkan' => 2,
            ],
            'dokter' => [
                [
                    'id' => 101,
                    'nama' => 'dr. Ayu Lestari, Sp.A',
                    'spesialisasi' => 'Anak',
                    'slot' => 'Senin, 10.00',
                    'faskes' => 'RS Umum Kota',
                    'status' => 'tersedia',
                ],
                [
                    'id' => 102,
                    'nama' => 'dr. Bima Pratama, Sp.PD',
                    'spesialisasi' => 'Penyakit Dalam',
                    'slot' => 'Senin, 13.30',
                    'faskes' => 'RS Umum Kota',
                    'status' => 'tersedia',
                ],
                [
                    'id' => 103,
                    'nama' => 'dr. Citra Maharani, Sp.KK',
                    'spesialisasi' => 'Kulit',
                    'slot' => 'Selasa, 09.00',
                    'faskes' => 'RS Umum Kota',
                    'status' => 'tersedia',
                ],
            ],
            'riwayat' => [
                [
                    'id' => 8,
                    'tanggal' => '12 Oktober 2026',
                    'dokter' => 'dr. Bima Pratama, Sp.PD',
                    'diagnosisKode' => 'I10',
                    'diagnosisNama' => 'Hipertensi esensial',
                    'keputusanRujuk' => false,
                ],
            ],
        ]);
    }
}
