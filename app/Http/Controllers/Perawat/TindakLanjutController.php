<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class TindakLanjutController extends Controller
{
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('perawat/tindak-lanjut', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
