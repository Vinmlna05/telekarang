<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiController extends Controller
{
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('perawat/konsultasi-detail', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
