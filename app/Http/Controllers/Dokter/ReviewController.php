<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Skrining;
use App\Support\TanggalIndonesia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    /**
     * Status yang sudah melewati keputusan dokter umum.
     *
     * @var list<string>
     */
    private const STATUS_DIPUTUSKAN = [
        'MENUNGGU_PEMILIHAN_SPESIALIS',
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
        'SELESAI',
        'DIRUJUK',
        'DITANGANI_PUSKESMAS',
    ];

    /**
     * Daftar skrining perawat yang menunggu review dokter umum.
     */
    public function __invoke(Request $request): Response
    {
        $antrean = Konsultasi::query()
            ->with(['pasien', 'skrining.perawat'])
            ->where('status', 'SKRINING_SELESAI')
            ->orderBy('updated_at')
            ->get();

        $diputuskan = Konsultasi::query()
            ->with(['pasien', 'dokterSpesialis', 'hasil.icd10'])
            ->whereIn('status', self::STATUS_DIPUTUSKAN)
            ->orderByDesc('updated_at')
            ->get();

        $skrining = $antrean->map(fn (Konsultasi $konsultasi) => $this->itemAntrean($konsultasi))->all();

        $riwayat = $diputuskan->map(fn (Konsultasi $konsultasi) => [
            'id' => $konsultasi->id,
            'pasien' => [
                'nama' => $konsultasi->pasien?->nama ?? 'Pasien',
                'usia' => $konsultasi->pasien?->tgl_lahir?->age ?? 0,
                'noRm' => $konsultasi->pasien?->nomorRekamMedis() ?? '-',
            ],
            'tanggal' => TanggalIndonesia::format($konsultasi->tanggal ?? $konsultasi->tanggal_skrining),
            'status' => $konsultasi->status,
            'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter umum puskesmas',
            'hasil' => $konsultasi->hasil === null && $konsultasi->status !== 'DIRUJUK' && $konsultasi->status !== 'DITANGANI_PUSKESMAS'
                ? null
                : [
                    'icd10Kode' => $konsultasi->hasil?->icd10_kode ?? '-',
                    'icd10Nama' => $konsultasi->hasil?->icd10?->nama_diagnosis ?? $this->diagnosisFallback($konsultasi),
                    'saran' => $konsultasi->hasil?->saran ?? $konsultasi->catatan_dokter ?? '-',
                    'keputusanRujuk' => $this->keputusanRujuk($konsultasi),
                    'waktu' => TanggalIndonesia::waktu($konsultasi->diputuskan_pada ?? $konsultasi->updated_at) ?? '-',
                ],
        ])->all();

        $triaseMerah = $antrean->filter(fn (Konsultasi $konsultasi) => $konsultasi->skrining?->tingkatPrioritas() === 'merah')->count();
        $dikirimKeSpesialis = $diputuskan->filter(
            fn (Konsultasi $konsultasi) => $konsultasi->keputusan_dokter === Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
        )->count();
        $ditanganiDiPuskesmas = $diputuskan->filter(
            fn (Konsultasi $konsultasi) => in_array(
                $konsultasi->status,
                [Konsultasi::KEPUTUSAN_TANGANI_PUSKESMAS, 'DITANGANI_PUSKESMAS'],
                true,
            ),
        )->count();

        return Inertia::render('dokter/review', [
            'ringkasan' => [
                'menungguReview' => $antrean->count(),
                'triaseMerah' => $triaseMerah,
                'dikirimKeSpesialis' => $dikirimKeSpesialis,
                'ditanganiDiPuskesmas' => $ditanganiDiPuskesmas,
            ],
            'skrining' => $skrining,
            'riwayat' => $riwayat,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function itemAntrean(Konsultasi $konsultasi): array
    {
        $skrining = $konsultasi->skrining;

        return [
            'id' => $konsultasi->id,
            'nama' => $konsultasi->pasien?->nama ?? 'Pasien',
            'usia' => $konsultasi->pasien?->tgl_lahir?->age ?? 0,
            'jenisKelamin' => str_starts_with($konsultasi->pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
            'noRm' => $konsultasi->pasien?->nomorRekamMedis() ?? '-',
            'waktu' => $skrining?->waktu?->format('H.i') ?? $konsultasi->updated_at->format('H.i'),
            'keluhan' => $konsultasi->keluhan,
            'tensi' => $this->tensi($skrining),
            'suhu' => (float) ($skrining?->suhu ?? 0),
            'nadi' => (int) ($skrining?->nadi ?? 0),
            'spo2' => (int) ($skrining?->spo2 ?? 0),
            'prioritas' => $skrining?->tingkatPrioritas() ?? 'normal',
            'status' => $konsultasi->status,
            'perawat' => $skrining?->perawat?->name ?? 'Perawat puskesmas',
        ];
    }

    private function tensi(?Skrining $skrining): string
    {
        if ($skrining === null) {
            return '-';
        }

        return $skrining->sistol.'/'.$skrining->diastol;
    }

    private function diagnosisFallback(Konsultasi $konsultasi): string
    {
        return match ($konsultasi->status) {
            'DIRUJUK' => 'Dirujuk langsung ke RS',
            'DITANGANI_PUSKESMAS' => 'Ditangani di Puskesmas Pulau Karang',
            default => 'Menunggu hasil konsultasi spesialis',
        };
    }

    private function keputusanRujuk(Konsultasi $konsultasi): bool
    {
        if ($konsultasi->status === 'DIRUJUK') {
            return true;
        }

        if ($konsultasi->status === 'DITANGANI_PUSKESMAS') {
            return false;
        }

        return (bool) $konsultasi->hasil?->keputusan_rujuk;
    }
}
