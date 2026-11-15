<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PermintaanController extends Controller
{
    /**
     * Status konsultasi yang ditampilkan pada antrean perawat.
     *
     * @var list<string>
     */
    private const STATUS_ANTREAN = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_SPESIALIS',
        'KEDALUWARSA',
    ];

    /**
     * @var list<string>
     */
    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * @var list<string>
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

    public function __invoke(): Response
    {
        $permintaan = Konsultasi::query()
            ->with(['pasien', 'dokterSpesialis', 'skrining', 'pembuat'])
            ->whereIn('status', self::STATUS_ANTREAN)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Konsultasi $konsultasi) => [
                'id' => $konsultasi->id,
                'nama' => $konsultasi->pasien?->nama ?? 'Pasien',
                'usia' => $konsultasi->pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($konsultasi->pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'nik' => $konsultasi->pasien?->nik ?? '-',
                'waktuMasuk' => $this->formatWaktuMasuk($konsultasi->created_at),
                'keluhan' => $konsultasi->keluhan,
                'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'jadwal' => $this->formatTanggal($konsultasi->tanggal).' · '.$konsultasi->tanggal->format('H.i').' WIT',
                'status' => $konsultasi->status,
                'prioritas' => $konsultasi->prioritasKartu(),
                'sumber' => $konsultasi->pembuat?->role === 'pasien' ? 'Akun pasien' : 'Didaftarkan perawat',
            ])
            ->values()
            ->all();

        $koleksi = collect($permintaan);

        return Inertia::render('perawat/permintaan', [
            'ringkasan' => [
                'total' => $koleksi->count(),
                'menungguSkrining' => $koleksi->where('status', 'MENUNGGU_SKRINING')->count(),
                'skriningSelesai' => $koleksi->where('status', 'SKRINING_SELESAI')->count(),
                'menungguSpesialis' => $koleksi->where('status', 'MENUNGGU_SPESIALIS')->count(),
                'kedaluwarsa' => $koleksi->where('status', 'KEDALUWARSA')->count(),
                'prioritasDarurat' => $koleksi->where('prioritas', 'darurat')->count(),
            ],
            'permintaan' => $permintaan,
        ]);
    }

    private function formatWaktuMasuk(Carbon $tanggal): string
    {
        if ($tanggal->isToday()) {
            return 'Hari ini, '.$tanggal->format('H.i');
        }

        if ($tanggal->isYesterday()) {
            return 'Kemarin, '.$tanggal->format('H.i');
        }

        return $tanggal->format('d').' '.substr(self::BULAN[(int) $tanggal->format('n')], 0, 3).' '.$tanggal->format('Y').', '.$tanggal->format('H.i');
    }

    private function formatTanggal(Carbon $tanggal): string
    {
        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }
}
