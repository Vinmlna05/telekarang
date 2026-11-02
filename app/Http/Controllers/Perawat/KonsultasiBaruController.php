<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiBaruController extends Controller
{
    public function __invoke(): Response
    {
        $pasien = [
            [
                'id' => 1,
                'nama' => 'Siti Rahmawati',
                'usia' => 34,
                'jenisKelamin' => 'P',
                'nik' => '7171010190340001',
                'noRm' => 'RM-2026-0142',
                'alamat' => 'Desa Karang Indah',
                'telepon' => '+62 812-0000-1001',
                'punyaAkun' => true,
            ],
            [
                'id' => 2,
                'nama' => 'Andi Saputra',
                'usia' => 52,
                'jenisKelamin' => 'L',
                'nik' => '7171010150520002',
                'noRm' => 'RM-2026-0157',
                'alamat' => 'Dusun Tanjung Batu',
                'telepon' => '+62 812-0000-1002',
                'punyaAkun' => true,
            ],
            [
                'id' => 3,
                'nama' => 'Maria Lestari',
                'usia' => 27,
                'jenisKelamin' => 'P',
                'nik' => '7171010220270003',
                'noRm' => 'RM-2026-0161',
                'alamat' => 'Desa Pulau Karang',
                'telepon' => '+62 812-0000-1003',
                'punyaAkun' => false,
            ],
            [
                'id' => 4,
                'nama' => 'Yohanes Kurniawan',
                'usia' => 61,
                'jenisKelamin' => 'L',
                'nik' => '7171010170610004',
                'noRm' => 'RM-2026-0168',
                'alamat' => 'Dusun Mawar',
                'telepon' => '+62 812-0000-1004',
                'punyaAkun' => false,
            ],
            [
                'id' => 5,
                'nama' => 'Nur Aisyah',
                'usia' => 7,
                'jenisKelamin' => 'P',
                'nik' => '7171010240070005',
                'noRm' => 'RM-2026-0172',
                'alamat' => 'Desa Karang Indah',
                'telepon' => '+62 812-0000-1005',
                'punyaAkun' => true,
            ],
            [
                'id' => 6,
                'nama' => 'Markus Tarigan',
                'usia' => 45,
                'jenisKelamin' => 'L',
                'nik' => '7171010130450006',
                'noRm' => 'RM-2026-0179',
                'alamat' => 'Dusun Tanjung Batu',
                'telepon' => '+62 812-0000-1006',
                'punyaAkun' => true,
            ],
            [
                'id' => 7,
                'nama' => 'Dewi Anggraini',
                'usia' => 38,
                'jenisKelamin' => 'P',
                'nik' => '7171010210380007',
                'noRm' => 'RM-2026-0184',
                'alamat' => 'Desa Pulau Karang',
                'telepon' => '+62 812-0000-1007',
                'punyaAkun' => false,
            ],
            [
                'id' => 10,
                'nama' => 'Yuliana Fenetiruma',
                'usia' => 24,
                'jenisKelamin' => 'P',
                'nik' => '7171010260240010',
                'noRm' => 'RM-2026-0203',
                'alamat' => 'Dusun Mawar',
                'telepon' => '+62 812-0000-1010',
                'punyaAkun' => false,
            ],
        ];

        return Inertia::render('perawat/konsultasi-baru', [
            'pasien' => $pasien,
        ]);
    }
}
