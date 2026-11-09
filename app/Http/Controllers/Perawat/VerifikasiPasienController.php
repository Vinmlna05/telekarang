<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Pasien;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifikasiPasienController extends Controller
{
    public function __invoke(Request $request, Pasien $pasien): RedirectResponse
    {
        if ($pasien->status_verifikasi === Pasien::STATUS_TERVERIFIKASI) {
            return back()->with('success', 'Identitas pasien sudah terverifikasi.');
        }

        $pasien->forceFill([
            'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
            'diverifikasi_oleh' => $request->user()->id,
            'diverifikasi_pada' => now(),
        ])->save();

        AuditLog::catat(
            $request->user(),
            'memverifikasi',
            'pasien',
            (string) $pasien->id,
            'Memverifikasi identitas pasien dan menerbitkan nomor rekam medis.',
        );

        return back()->with('success', "Identitas {$pasien->nama} berhasil diverifikasi.");
    }
}
