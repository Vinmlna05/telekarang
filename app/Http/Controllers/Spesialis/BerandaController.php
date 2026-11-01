<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Dasbor dokter spesialis: permintaan, jadwal, dan konsultasi aktif.
     */
    public function __invoke(): Response
    {
        return Inertia::render('spesialis/beranda', [
            'ringkasan' => [
                'permintaanBaru' => 3,
                'jadwalHariIni' => 4,
                'selesaiBulanIni' => 12,
                'video' => 7,
                'teks' => 5,
            ],
            'permintaan' => [
                [
                    'id' => 4,
                    'nama' => 'Nur Aisyah',
                    'usia' => 8,
                    'jadwal' => 'Hari ini, 10.00',
                    'keluhan' => 'Demam tinggi dan sesak sejak dua hari.',
                    'prioritas' => 'kuning',
                    'status' => 'MENUNGGU_SPESIALIS',
                    'diminta' => '2 jam lalu',
                ],
                [
                    'id' => 6,
                    'nama' => 'Rudi Hartono',
                    'usia' => 45,
                    'jadwal' => 'Besok, 09.00',
                    'keluhan' => 'Nyeri ulu hati berulang setelah makan.',
                    'prioritas' => 'normal',
                    'status' => 'MENUNGGU_SPESIALIS',
                    'diminta' => '4 jam lalu',
                ],
                [
                    'id' => 7,
                    'nama' => 'Maria Lestari',
                    'usia' => 27,
                    'jadwal' => 'Besok, 13.30',
                    'keluhan' => 'Ruam meluas di kedua lengan.',
                    'prioritas' => 'normal',
                    'status' => 'MENUNGGU_SPESIALIS',
                    'diminta' => '5 jam lalu',
                ],
            ],
            'jadwal' => [
                ['id' => 1, 'jam' => '10.00', 'nama' => 'Siti Rahmawati', 'status' => 'terisi', 'mode' => 'teks'],
                ['id' => 2, 'jam' => '11.30', 'nama' => null, 'status' => 'tersedia', 'mode' => null],
                ['id' => 3, 'jam' => '13.30', 'nama' => 'Andi Saputra', 'status' => 'terisi', 'mode' => 'video'],
                ['id' => 4, 'jam' => '15.00', 'nama' => null, 'status' => 'tersedia', 'mode' => null],
            ],
            'berlangsung' => [
                [
                    'id' => 7,
                    'nama' => 'Maria Lestari',
                    'mode' => 'teks',
                    'mulai' => '09.05',
                    'pesanTerakhir' => 'Dokter, foto ruam sudah saya kirim.',
                    'pesanBaru' => 2,
                ],
            ],
        ]);
    }
}
