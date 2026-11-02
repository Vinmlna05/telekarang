<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class ReviewDetailController extends Controller
{
    /**
     * Detail pasien untuk keputusan dokter umum: teruskan ke spesialis atau tangani sendiri.
     */
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('dokter/review-detail', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
