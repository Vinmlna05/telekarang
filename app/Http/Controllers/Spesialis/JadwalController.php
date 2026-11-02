<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    /**
     * Kelola jadwal praktik dokter spesialis.
     */
    public function __invoke(): Response
    {
        return Inertia::render('spesialis/jadwal');
    }
}
