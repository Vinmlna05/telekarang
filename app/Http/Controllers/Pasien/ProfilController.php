<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\ProfilPasienPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProfilController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const BULAN = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Tampilkan profil pasien yang terhubung dengan akun yang sedang login.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $pasien = Pasien::query()
            ->where('user_id', $user->id)
            ->first();

        $ringkasan = [
            'totalKonsultasi' => 0,
            'rujukanTerhindarkan' => 0,
            'dirujuk' => 0,
        ];

        $konsultasiTerakhir = null;

        if ($pasien !== null) {
            $selesai = Konsultasi::query()
                ->where('pasien_id', $pasien->id)
                ->where('status', 'SELESAI')
                ->whereHas('hasil');

            $ringkasan['totalKonsultasi'] = (clone $selesai)->count();
            $ringkasan['rujukanTerhindarkan'] = (clone $selesai)
                ->whereHas('hasil', fn ($query) => $query->where('keputusan_rujuk', false))
                ->count();
            $ringkasan['dirujuk'] = $ringkasan['totalKonsultasi'] - $ringkasan['rujukanTerhindarkan'];

            $terakhir = (clone $selesai)
                ->with(['dokterSpesialis', 'hasil.icd10'])
                ->orderByDesc('tanggal')
                ->first();

            if ($terakhir !== null) {
                $konsultasiTerakhir = [
                    'id' => $terakhir->id,
                    'tanggalSingkat' => $this->formatTanggalSingkat($terakhir->tanggal),
                    'dokter' => $terakhir->dokterSpesialis?->nama ?? 'Dokter spesialis',
                    'diagnosisNama' => $terakhir->hasil?->icd10?->nama_diagnosis ?? 'Belum ada diagnosis',
                ];
            }
        }

        return Inertia::render('pasien/profil', [
            'profil' => ProfilPasienPresenter::untuk($pasien, $user),
            'ringkasan' => $ringkasan,
            'konsultasiTerakhir' => $konsultasiTerakhir,
        ]);
    }

    private function formatTanggalSingkat(Carbon $tanggal): string
    {
        return $tanggal->format('d')
            .' '.substr(self::BULAN[(int) $tanggal->format('n')], 0, 3)
            .' '.$tanggal->format('Y');
    }
}
