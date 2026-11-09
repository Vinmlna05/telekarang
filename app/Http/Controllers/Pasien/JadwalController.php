<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Support\JadwalDokterPresenter;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    /**
     * Tampilkan jadwal praktik dokter spesialis dari data master.
     */
    public function __invoke(): Response
    {
        return Inertia::render('pasien/jadwal', [
            'dokter' => JadwalDokterPresenter::daftar(),
        ]);
    }
}
