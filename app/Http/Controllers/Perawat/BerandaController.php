<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Status konsultasi yang masuk antrean skrining perawat.
     *
     * @var list<string>
     */
    private const STATUS_ANTREAN = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_SPESIALIS',
    ];

    /**
     * Dasbor perawat: antrean skrining dan tindak lanjut hari ini.
     */
    public function __invoke(): Response
    {
        $daftarAntrean = Konsultasi::query()
            ->with(['pasien', 'skrining'])
            ->whereIn('status', self::STATUS_ANTREAN)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        $antreanHariIni = Konsultasi::query()
            ->whereIn('status', self::STATUS_ANTREAN)
            ->whereDate('created_at', Carbon::today())
            ->count();

        $antrean = $daftarAntrean
            ->map(fn (Konsultasi $konsultasi) => [
                'id' => $konsultasi->id,
                'nama' => $konsultasi->pasien?->nama ?? 'Pasien',
                'usia' => $konsultasi->pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($konsultasi->pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'waktu' => $this->formatWaktu($konsultasi->created_at),
                'keluhan' => $konsultasi->keluhan,
                'status' => $konsultasi->status,
                'prioritas' => $konsultasi->prioritasKartu(),
            ])
            ->values()
            ->all();

        return Inertia::render('perawat/beranda', [
            'ringkasan' => [
                'rujukanTerhindarkan' => 38,
                'totalRujukan' => 95,
                'persentase' => 40,
                'antreanHariIni' => $antreanHariIni,
                'menungguTindakLanjut' => 2,
            ],
            'antrean' => $antrean,
            'tindakLanjut' => [
                [
                    'id' => 8,
                    'nama' => 'Yohanes Kurniawan',
                    'diagnosisKode' => 'I10',
                    'diagnosisNama' => 'Hipertensi esensial',
                    'keputusanRujuk' => false,
                    'tanggal' => 'Hari ini, 07.45',
                    'dokter' => 'dr. Bima Pratama, Sp.PD',
                ],
                [
                    'id' => 9,
                    'nama' => 'Nur Aisyah',
                    'diagnosisKode' => 'J06.9',
                    'diagnosisNama' => 'ISPA akut',
                    'keputusanRujuk' => true,
                    'tanggal' => 'Hari ini, 08.10',
                    'dokter' => 'dr. Ayu Lestari, Sp.A',
                ],
            ],
        ]);
    }

    /**
     * Waktu antrean ringkas untuk kartu dasbor.
     */
    private function formatWaktu(Carbon $waktu): string
    {
        if ($waktu->isToday()) {
            return 'Hari ini, '.$waktu->format('H.i');
        }

        if ($waktu->isYesterday()) {
            return 'Kemarin, '.$waktu->format('H.i');
        }

        return $waktu->format('d/m/Y H.i');
    }
}
