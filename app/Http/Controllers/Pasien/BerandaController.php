<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\TanggalIndonesia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Status konsultasi yang dianggap masih berjalan pada beranda pasien.
     *
     * @var list<string>
     */
    private const STATUS_AKTIF = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_PEMILIHAN_SPESIALIS',
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
        'DIJADWAL_ULANG',
    ];

    /**
     * Status akhir yang ditampilkan pada ringkasan riwayat.
     *
     * @var list<string>
     */
    private const STATUS_RIWAYAT = ['SELESAI', 'DIRUJUK', 'DITANGANI_PUSKESMAS'];

    /**
     * Tampilkan beranda pasien sesuai data milik pengguna yang sedang login.
     */
    public function __invoke(Request $request): Response
    {
        $pasien = Pasien::query()
            ->where('user_id', $request->user()->id)
            ->first();

        $konsultasiAktif = null;
        $daftarKonsultasi = [];
        $ringkasan = [
            'totalKonsultasi' => 0,
            'rujukanTerhindarkan' => 0,
        ];
        $riwayat = [];

        if ($pasien !== null) {
            $daftarKonsultasi = Konsultasi::query()
                ->with(['dokterSpesialis', 'jadwal'])
                ->where('pasien_id', $pasien->id)
                ->whereIn('status', self::STATUS_AKTIF)
                ->orderByDesc('updated_at')
                ->get()
                ->map(fn (Konsultasi $konsultasi) => [
                    'id' => $konsultasi->id,
                    'status' => $konsultasi->status,
                    'keluhan' => $konsultasi->keluhan,
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter belum ditentukan',
                    'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Menunggu keputusan dokter umum',
                    'faskes' => $konsultasi->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                    'mode' => $konsultasi->mode,
                    'jadwal' => $this->jadwal($konsultasi),
                    'tanggalSingkat' => TanggalIndonesia::singkat($konsultasi->tanggal ?? $konsultasi->tanggal_skrining),
                ])
                ->all();

            $konsultasiAktif = $daftarKonsultasi[0] ?? null;

            $selesai = Konsultasi::query()
                ->where('pasien_id', $pasien->id)
                ->whereIn('status', self::STATUS_RIWAYAT);

            $ringkasan['totalKonsultasi'] = (clone $selesai)->count();

            $ringkasan['rujukanTerhindarkan'] = (clone $selesai)
                ->where(function ($query) {
                    $query->where('status', 'DITANGANI_PUSKESMAS')
                        ->orWhere(fn ($sub) => $sub->where('status', 'SELESAI')
                            ->whereHas('hasil', fn ($hasil) => $hasil->where('keputusan_rujuk', false)));
                })
                ->count();

            $riwayat = Konsultasi::query()
                ->with(['dokterSpesialis', 'hasil.icd10'])
                ->where('pasien_id', $pasien->id)
                ->whereIn('status', self::STATUS_RIWAYAT)
                ->orderByDesc('updated_at')
                ->limit(3)
                ->get()
                ->map(fn (Konsultasi $konsultasi) => [
                    'id' => $konsultasi->id,
                    'tanggal' => TanggalIndonesia::format($konsultasi->tanggal ?? $konsultasi->tanggal_skrining),
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter belum ditentukan',
                    'diagnosisKode' => $konsultasi->hasil?->icd10_kode ?? '-',
                    'diagnosisNama' => $konsultasi->hasil?->icd10?->nama_diagnosis ?? $this->diagnosisFallback($konsultasi),
                    'keputusanRujuk' => $this->keputusanRujuk($konsultasi),
                ])
                ->all();
        }

        return Inertia::render('pasien/beranda', [
            'konsultasiAktif' => $konsultasiAktif,
            'daftarKonsultasi' => $daftarKonsultasi,
            'ringkasan' => $ringkasan,
            'riwayat' => $riwayat,
        ]);
    }

    private function jadwal(Konsultasi $konsultasi): string
    {
        if ($konsultasi->tanggal !== null) {
            return TanggalIndonesia::format($konsultasi->tanggal).' · '.$konsultasi->tanggal->format('H.i').' WIT';
        }

        if ($konsultasi->tanggal_skrining !== null) {
            return 'Skrining: '.TanggalIndonesia::format($konsultasi->tanggal_skrining);
        }

        return 'Belum dijadwalkan';
    }

    private function diagnosisFallback(Konsultasi $konsultasi): string
    {
        return match ($konsultasi->status) {
            'DIRUJUK' => 'Dirujuk langsung ke RS tanpa konsultasi spesialis',
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
