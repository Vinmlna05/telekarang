<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\JadwalDokterPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
    ];

    /**
     * @var array<int, string>
     */
    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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
     * Tampilkan beranda pasien sesuai data milik pengguna yang sedang login.
     */
    public function __invoke(Request $request): Response
    {
        $pasien = Pasien::query()
            ->where('user_id', $request->user()->id)
            ->first();

        $konsultasiAktif = null;
        $ringkasan = [
            'totalKonsultasi' => 0,
            'rujukanTerhindarkan' => 0,
        ];
        $riwayat = [];

        if ($pasien !== null) {
            $konsultasiAktif = Konsultasi::query()
                ->with('dokterSpesialis')
                ->where('pasien_id', $pasien->id)
                ->whereIn('status', self::STATUS_AKTIF)
                ->orderByDesc('tanggal')
                ->first();

            $selesai = Konsultasi::query()
                ->where('pasien_id', $pasien->id)
                ->where('status', 'SELESAI');

            $ringkasan['totalKonsultasi'] = (clone $selesai)->count();

            $ringkasan['rujukanTerhindarkan'] = (clone $selesai)
                ->whereHas('hasil', fn ($query) => $query->where('keputusan_rujuk', false))
                ->count();

            $riwayat = Konsultasi::query()
                ->with(['dokterSpesialis', 'hasil.icd10'])
                ->where('pasien_id', $pasien->id)
                ->where('status', 'SELESAI')
                ->whereHas('hasil')
                ->orderByDesc('tanggal')
                ->limit(3)
                ->get()
                ->map(fn (Konsultasi $konsultasi) => [
                    'id' => $konsultasi->id,
                    'tanggal' => $this->formatTanggal($konsultasi->tanggal),
                    'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter spesialis',
                    'diagnosisKode' => $konsultasi->hasil?->icd10_kode ?? '-',
                    'diagnosisNama' => $konsultasi->hasil?->icd10?->nama_diagnosis ?? 'Belum ada diagnosis',
                    'keputusanRujuk' => (bool) $konsultasi->hasil?->keputusan_rujuk,
                ])
                ->all();
        }

        return Inertia::render('pasien/beranda', [
            'konsultasiAktif' => $konsultasiAktif === null ? null : [
                'id' => $konsultasiAktif->id,
                'status' => $konsultasiAktif->status,
                'keluhan' => $konsultasiAktif->keluhan,
                'dokter' => $konsultasiAktif->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'spesialisasi' => $konsultasiAktif->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'jadwal' => $this->formatTanggal($konsultasiAktif->tanggal).' · '.$konsultasiAktif->tanggal->format('H.i').' WIT',
            ],
            'ringkasan' => $ringkasan,
            'dokter' => JadwalDokterPresenter::daftar(),
            'riwayat' => $riwayat,
        ]);
    }

    /**
     * Format tanggal menjadi teks Bahasa Indonesia tanpa bergantung locale aplikasi.
     */
    private function formatTanggal(Carbon $tanggal): string
    {
        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }
}
