<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\TanggalIndonesia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatController extends Controller
{
    /**
     * Status akhir yang ditampilkan sebagai riwayat konsultasi.
     *
     * @var list<string>
     */
    private const STATUS_RIWAYAT = ['SELESAI', 'DIRUJUK', 'DITANGANI_PUSKESMAS'];

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
                ->whereIn('status', self::STATUS_RIWAYAT)
                ->orderByDesc('updated_at')
                ->get()
                ->map(fn (Konsultasi $konsultasi) => [
                    'id' => $konsultasi->id,
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter belum ditentukan',
                    'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Penanganan puskesmas',
                    'faskes' => $konsultasi->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                    'tanggalSingkat' => TanggalIndonesia::singkat($konsultasi->tanggal ?? $konsultasi->tanggal_skrining),
                    'mode' => $konsultasi->mode,
                    'status' => $konsultasi->status,
                    'keluhan' => $konsultasi->keluhan,
                    'hasil' => [
                        'icd10Kode' => $konsultasi->hasil?->icd10_kode ?? '-',
                        'icd10Nama' => $konsultasi->hasil?->icd10?->nama_diagnosis ?? $this->diagnosisFallback($konsultasi),
                        'keputusanRujuk' => $this->keputusanRujuk($konsultasi),
                    ],
                ])
                ->all();
        }

        return Inertia::render('pasien/riwayat', [
            'riwayat' => $riwayat,
        ]);
    }

    private function diagnosisFallback(Konsultasi $konsultasi): string
    {
        return match ($konsultasi->status) {
            'DIRUJUK' => 'Dirujuk langsung ke RS',
            'DITANGANI_PUSKESMAS' => 'Ditangani di Puskesmas Pulau Karang',
            default => 'Belum ada diagnosis',
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
