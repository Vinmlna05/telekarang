<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class HasilController extends Controller
{
    /**
     * Form hasil konsultasi dokter spesialis: ICD-10, saran, dan keputusan rujuk.
     */
    public function __invoke(int $konsultasi): Response
    {
        return Inertia::render('spesialis/hasil', [
            'konsultasiId' => $konsultasi,
        ]);
    }
}
