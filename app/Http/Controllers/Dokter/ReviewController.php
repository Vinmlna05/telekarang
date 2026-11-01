<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Daftar skrining perawat yang menunggu review dokter umum.
     */
    public function __invoke(): Response
    {
        return Inertia::render('dokter/review', [
            'ringkasan' => [
                'menungguReview' => 4,
                'triaseMerah' => 1,
                'dikirimKeSpesialis' => 6,
                'ditanganiDiPuskesmas' => 9,
            ],
            'skrining' => [
                [
                    'id' => 2,
                    'nama' => 'Andi Saputra',
                    'usia' => 52,
                    'jenisKelamin' => 'L',
                    'waktu' => '09.20',
                    'keluhan' => 'Sesak berat dan nyeri dada sejak pagi.',
                    'tensi' => '190/120',
                    'suhu' => 38.2,
                    'nadi' => 128,
                    'spo2' => 91,
                    'prioritas' => 'merah',
                    'status' => 'SKRINING_SELESAI',
                    'perawat' => 'Perawat Sari',
                ],
                [
                    'id' => 1,
                    'nama' => 'Siti Rahmawati',
                    'usia' => 34,
                    'jenisKelamin' => 'P',
                    'waktu' => '08.45',
                    'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
                    'tensi' => '120/80',
                    'suhu' => 38.9,
                    'nadi' => 102,
                    'spo2' => 98,
                    'prioritas' => 'kuning',
                    'status' => 'SKRINING_SELESAI',
                    'perawat' => 'Perawat Sari',
                ],
                [
                    'id' => 5,
                    'nama' => 'Yohanes Kurniawan',
                    'usia' => 61,
                    'jenisKelamin' => 'L',
                    'waktu' => '08.10',
                    'keluhan' => 'Pusing berulang dan tengkuk terasa kaku.',
                    'tensi' => '170/100',
                    'suhu' => 36.5,
                    'nadi' => 90,
                    'spo2' => 95,
                    'prioritas' => 'kuning',
                    'status' => 'SKRINING_SELESAI',
                    'perawat' => 'Perawat Nia',
                ],
                [
                    'id' => 3,
                    'nama' => 'Maria Lestari',
                    'usia' => 27,
                    'jenisKelamin' => 'P',
                    'waktu' => '07.55',
                    'keluhan' => 'Gatal dan ruam di lengan sejak seminggu.',
                    'tensi' => '110/70',
                    'suhu' => 36.8,
                    'nadi' => 82,
                    'spo2' => 99,
                    'prioritas' => 'normal',
                    'status' => 'SKRINING_SELESAI',
                    'perawat' => 'Perawat Nia',
                ],
            ],
        ]);
    }
}
