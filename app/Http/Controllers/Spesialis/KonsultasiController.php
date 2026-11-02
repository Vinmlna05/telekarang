<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiController extends Controller
{
    /**
     * Ruang konsultasi dokter spesialis: simulasi video atau mode teks.
     */
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('spesialis/konsultasi-detail', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
