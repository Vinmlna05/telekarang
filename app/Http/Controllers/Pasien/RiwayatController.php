<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const BULAN_SINGKAT = [
        1 => 'Jan',
        2 => 'Feb',
        3 => 'Mar',
        4 => 'Apr',
        5 => 'Mei',
        6 => 'Jun',
        7 => 'Jul',
        8 => 'Agu',
        9 => 'Sep',
        10 => 'Okt',
        11 => 'Nov',
        12 => 'Des',
    ];

    /**
     * Tampilkan riwayat konsultasi selesai milik pasien yang sedang login.
     */
    public function __invoke(Request $request): Response
    {
        $pasien = Pasien::query()
            ->where('user_id', $request->user()->id)
            ->first();

        $riwayat = [];

        if ($pasien !== null) {
            $riwayat = Konsultasi::query()
                ->with(['dokterSpesialis', 'hasil.icd10'])
                ->where('pasien_id', $pasien->id)
                ->where('status', 'SELESAI')
                ->whereHas('hasil')
                ->orderByDesc('tanggal')
                ->get()
                ->map(fn (Konsultasi $konsultasi) => [
                    'id' => $konsultasi->id,
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter spesialis',
                    'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                    'faskes' => $konsultasi->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                    'tanggalSingkat' => $this->formatTanggalSingkat($konsultasi->tanggal),
                    'mode' => $konsultasi->mode,
                    'status' => $konsultasi->status,
                    'keluhan' => $konsultasi->keluhan,
                    'hasil' => [
                        'icd10Kode' => $konsultasi->hasil?->icd10_kode ?? '-',
                        'icd10Nama' => $konsultasi->hasil?->icd10?->nama_diagnosis ?? 'Belum ada diagnosis',
                        'keputusanRujuk' => (bool) $konsultasi->hasil?->keputusan_rujuk,
                    ],
                ])
                ->all();
        }

        return Inertia::render('pasien/riwayat', [
            'riwayat' => $riwayat,
        ]);
    }

    private function formatTanggalSingkat(Carbon $tanggal): string
    {
        return $tanggal->format('d')
            .' '.self::BULAN_SINGKAT[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }
}
