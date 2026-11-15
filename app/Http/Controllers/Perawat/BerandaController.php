<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Status konsultasi yang masih berjalan di tangan perawat.
     *
     * @var list<string>
     */
    private const STATUS_ANTREAN = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_PEMILIHAN_SPESIALIS',
        'MENUNGGU_SPESIALIS',
        'DIJADWAL_ULANG',
        'DIKONFIRMASI',
        'BERLANGSUNG',
    ];

    /**
     * Status konsultasi yang sudah selesai ditindaklanjuti.
     *
     * @var list<string>
     */
    private const STATUS_SELESAI = ['SELESAI', 'DIRUJUK', 'DITANGANI_PUSKESMAS'];

    /**
     * Dasbor perawat: antrean skrining dan tindak lanjut hasil konsultasi.
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

        $totalSelesai = Konsultasi::query()->whereIn('status', self::STATUS_SELESAI)->count();

        $rujukanTerhindarkan = Konsultasi::query()
            ->where(fn ($query) => $query
                ->where('status', 'DITANGANI_PUSKESMAS')
                ->orWhereHas('hasil', fn ($hasil) => $hasil->where('keputusan_rujuk', false)))
            ->count();

        $totalRujukan = Konsultasi::query()
            ->where(fn ($query) => $query
                ->where('status', 'DIRUJUK')
                ->orWhereHas('hasil', fn ($hasil) => $hasil->where('keputusan_rujuk', true)))
            ->count();

        $persentase = $totalSelesai > 0
            ? (int) round($rujukanTerhindarkan / $totalSelesai * 100)
            : 0;

        $tindakLanjut = Konsultasi::query()
            ->with(['pasien', 'hasil', 'dokterSpesialis'])
            ->whereIn('status', self::STATUS_SELESAI)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->limit(3)
            ->get()
            ->map(function (Konsultasi $konsultasi): array {
                $hasil = $konsultasi->hasil;

                return [
                    'id' => $konsultasi->id,
                    'nama' => $konsultasi->pasien?->nama ?? 'Pasien',
                    'diagnosisKode' => $hasil?->icd10?->kode ?? ($hasil?->icd10_kode ?? '-'),
                    'diagnosisNama' => $hasil?->icd10?->nama_diagnosis ?? ($hasil !== null ? 'Diagnosis tercatat' : 'Rujuk langsung'),
                    'keputusanRujuk' => $konsultasi->status === 'DIRUJUK' || $hasil?->keputusan_rujuk === true,
                    'tanggal' => TanggalIndonesia::waktu($konsultasi->updated_at),
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter umum',
                ];
            })
            ->values()
            ->all();

        return Inertia::render('perawat/beranda', [
            'ringkasan' => [
                'rujukanTerhindarkan' => $rujukanTerhindarkan,
                'totalRujukan' => $totalRujukan,
                'persentase' => $persentase,
                'antreanHariIni' => $antreanHariIni,
                'menungguTindakLanjut' => $totalSelesai,
            ],
            'antrean' => $antrean,
            'tindakLanjut' => $tindakLanjut,
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
