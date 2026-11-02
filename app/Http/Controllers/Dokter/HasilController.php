<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class HasilController extends Controller
{
    /**
     * Hasil konsultasi spesialis dan tindak lanjut untuk dokter umum.
     */
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('dokter/hasil', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
