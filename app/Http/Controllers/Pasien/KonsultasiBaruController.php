<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Support\JadwalDokterPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiBaruController extends Controller
{
    /**
     * Tampilkan form permintaan konsultasi dengan jadwal dokter dari data master.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('pasien/konsultasi-baru', [
            'dokter' => JadwalDokterPresenter::daftar(),
            'dokterAwal' => $request->integer('dokter') ?: null,
            'jadwalAwal' => $request->string('jadwal')->toString(),
        ]);
    }
}
