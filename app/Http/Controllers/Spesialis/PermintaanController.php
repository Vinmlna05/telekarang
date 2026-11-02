<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PermintaanController extends Controller
{
    /**
     * Daftar permintaan konsultasi untuk dokter spesialis.
     */
    public function __invoke(): Response
    {
        return Inertia::render('spesialis/permintaan');
    }
}
