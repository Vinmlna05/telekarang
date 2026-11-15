<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PermintaanController extends Controller
{
    /**
     * Status konsultasi yang masih perlu dipantau perawat.
     *
     * @var list<string>
     */
    private const STATUS_ANTREAN = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_PEMILIHAN_SPESIALIS',
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
        'KEDALUWARSA',
    ];

    public function __invoke(): Response
    {
        $permintaan = Konsultasi::query()
            ->with(['pasien', 'dokterSpesialis', 'skrining', 'pembuat', 'jadwal'])
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
                'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Belum dipilih',
                'dokter' => $konsultasi->dokterSpesialis?->nama ?? 'Belum dipilih',
                'jadwal' => $this->formatJadwal($konsultasi),
                'tanggalSkrining' => TanggalIndonesia::singkat($konsultasi->tanggal_skrining),
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
                'menungguSpesialis' => $koleksi->where('status', 'MENUNGGU_PEMILIHAN_SPESIALIS')->count()
                    + $koleksi->where('status', 'MENUNGGU_SPESIALIS')->count(),
                'kedaluwarsa' => $koleksi->where('status', 'KEDALUWARSA')->count(),
                'prioritasDarurat' => $koleksi->where('prioritas', 'darurat')->count(),
            ],
            'permintaan' => $permintaan,
        ]);
    }

    private function formatJadwal(Konsultasi $konsultasi): string
    {
        if ($konsultasi->jadwal !== null) {
            return $konsultasi->jadwal->hari.' · '.substr($konsultasi->jadwal->jam_mulai, 0, 5).' WIT';
        }

        if ($konsultasi->tanggal !== null) {
            return TanggalIndonesia::singkat($konsultasi->tanggal).' · '.$konsultasi->tanggal->format('H.i').' WIT';
        }

        return 'Belum dijadwalkan';
    }

    private function formatWaktuMasuk(Carbon $tanggal): string
    {
        if ($tanggal->isToday()) {
            return 'Hari ini, '.$tanggal->format('H.i');
        }

        if ($tanggal->isYesterday()) {
            return 'Kemarin, '.$tanggal->format('H.i');
        }

        return TanggalIndonesia::singkat($tanggal).', '.$tanggal->format('H.i');
    }
}
