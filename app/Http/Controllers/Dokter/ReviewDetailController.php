<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Inertia\Inertia;
use Inertia\Response;

class ReviewDetailController extends Controller
{
    /**
     * Detail pasien untuk keputusan dokter umum.
     */
    public function __invoke(int $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with(['pasien', 'skrining.perawat', 'pembuat', 'diputuskanOleh'])
            ->whereKey($konsultasi)
            ->whereIn('status', ['SKRINING_SELESAI', 'MENUNGGU_PEMILIHAN_SPESIALIS', 'MENUNGGU_SPESIALIS', 'DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI', 'DIRUJUK', 'DITANGANI_PUSKESMAS'])
            ->firstOrFail();

        $pasien = $data->pasien;
        $skrining = $data->skrining;
        $tanggalTampil = $data->tanggal ?? $data->tanggal_skrining;

        return Inertia::render('dokter/review-detail', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($tanggalTampil?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'status' => $data->status,
                'keluhan' => $data->keluhan,
                'mode' => $data->mode,
                'tanggalSkrining' => TanggalIndonesia::format($data->tanggal_skrining),
                'keputusanDokter' => $data->keputusan_dokter,
                'catatanDokter' => $data->catatan_dokter,
                'diputuskanPada' => TanggalIndonesia::waktu($data->diputuskan_pada),
                'diputuskanOleh' => $data->diputuskanOleh?->name,
            ],
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'nik' => $pasien?->nik ?? '-',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
                'alamat' => $pasien?->alamat ?? '-',
                'telepon' => $pasien?->telepon ?? '-',
                'sumber' => $data->pembuat?->role === 'pasien' ? 'Akun pasien' : 'Didaftarkan perawat',
            ],
            'skrining' => $skrining === null ? null : [
                'perawat' => $skrining->perawat?->name ?? 'Perawat puskesmas',
                'waktu' => TanggalIndonesia::waktu($skrining->waktu),
                'beratBadan' => (float) $skrining->berat,
                'tinggiBadan' => (float) $skrining->tinggi,
                'sistol' => (int) $skrining->sistol,
                'diastol' => (int) $skrining->diastol,
                'suhu' => (float) $skrining->suhu,
                'nadi' => (int) $skrining->nadi,
                'spo2' => (int) $skrining->spo2,
                'tandaBahaya' => (bool) $skrining->tanda_bahaya,
                'prioritas' => $skrining->tingkatPrioritas(),
                'catatan' => $skrining->catatan ?? '',
            ],
        ]);
    }
}
