<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Dasbor perawat: antrean skrining dan tindak lanjut hari ini.
     */
    public function __invoke(): Response
    {
        return Inertia::render('perawat/beranda', [
            'ringkasan' => [
                'rujukanTerhindarkan' => 38,
                'totalRujukan' => 95,
                'persentase' => 40,
                'antreanHariIni' => 3,
                'menungguTindakLanjut' => 2,
            ],
            'antrean' => [
                [
                    'id' => 1,
                    'nama' => 'Siti Rahmawati',
                    'usia' => 34,
                    'jenisKelamin' => 'P',
                    'waktu' => '08.30',
                    'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
                    'status' => 'MENUNGGU_SKRINING',
                    'prioritas' => 'normal',
                ],
                [
                    'id' => 2,
                    'nama' => 'Andi Saputra',
                    'usia' => 52,
                    'jenisKelamin' => 'L',
                    'waktu' => '09.15',
                    'keluhan' => 'Sesak berat dan nyeri dada sejak pagi.',
                    'status' => 'MENUNGGU_SKRINING',
                    'prioritas' => 'merah',
                ],
                [
                    'id' => 3,
                    'nama' => 'Maria Lestari',
                    'usia' => 27,
                    'jenisKelamin' => 'P',
                    'waktu' => '10.00',
                    'keluhan' => 'Gatal dan ruam di lengan sejak seminggu.',
                    'status' => 'SKRINING_SELESAI',
                    'prioritas' => 'normal',
                ],
            ],
            'tindakLanjut' => [
                [
                    'id' => 8,
                    'nama' => 'Yohanes Kurniawan',
                    'diagnosisKode' => 'I10',
                    'diagnosisNama' => 'Hipertensi esensial',
                    'keputusanRujuk' => false,
                    'tanggal' => 'Hari ini, 07.45',
                    'dokter' => 'dr. Bima Pratama, Sp.PD',
                ],
                [
                    'id' => 9,
                    'nama' => 'Nur Aisyah',
                    'diagnosisKode' => 'J06.9',
                    'diagnosisNama' => 'ISPA akut',
                    'keputusanRujuk' => true,
                    'tanggal' => 'Hari ini, 08.10',
                    'dokter' => 'dr. Ayu Lestari, Sp.A',
                ],
            ],
        ]);
    }
}
