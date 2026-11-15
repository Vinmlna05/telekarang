<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Dasbor dokter spesialis: permintaan, jadwal, dan konsultasi aktif.
     */
    public function __invoke(Request $request): Response
    {
        $dokter = $this->dokterSaya($request);
        $hariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][(int) Carbon::now()->format('w')];

        $aktif = Konsultasi::query()
            ->with(['pasien', 'jadwal', 'pesan' => fn ($query) => $query->latest('waktu')->limit(1)])
            ->where('dokter_spesialis_id', $dokter->id)
            ->get();

        $bulanIni = $aktif
            ->where('status', 'SELESAI')
            ->filter(fn (Konsultasi $item) => $item->updated_at !== null && $item->updated_at->isSameMonth(now()));

        $permintaan = $aktif
            ->where('status', 'MENUNGGU_SPESIALIS')
            ->sortByDesc('updated_at')
            ->take(3)
            ->map(fn (Konsultasi $item) => [
                'id' => $item->id,
                'nama' => $item->pasien?->nama ?? 'Pasien',
                'usia' => $item->pasien?->tgl_lahir?->age ?? 0,
                'jadwal' => $item->jadwal === null ? 'Belum dijadwalkan' : $item->jadwal->hari.' · '.substr($item->jadwal->jam_mulai, 0, 5),
                'keluhan' => $item->keluhan,
                'prioritas' => match ($item->prioritasKartu()) {
                    'darurat' => 'merah',
                    'sedang' => 'kuning',
                    default => 'normal',
                },
                'status' => $item->status,
                'diminta' => TanggalIndonesia::waktu($item->updated_at),
            ])
            ->values()
            ->all();

        $jadwalHariIni = $dokter->jadwal()
            ->where('hari', $hariIni)
            ->orderBy('jam_mulai')
            ->get();

        $konsultasiSlot = $aktif
            ->whereIn('status', ['DIKONFIRMASI', 'BERLANGSUNG'])
            ->keyBy('jadwal_id');

        $jadwal = $jadwalHariIni->map(fn ($slot) => [
            'id' => $slot->id,
            'jam' => substr($slot->jam_mulai, 0, 5),
            'nama' => $konsultasiSlot->get($slot->id)?->pasien?->nama,
            'status' => $slot->status,
            'mode' => $konsultasiSlot->get($slot->id)?->mode,
        ])->values()->all();

        $berlangsung = $aktif
            ->where('status', 'BERLANGSUNG')
            ->map(function (Konsultasi $item) {
                $terakhir = $item->pesan->first();

                return [
                    'id' => $item->id,
                    'nama' => $item->pasien?->nama ?? 'Pasien',
                    'mode' => $item->mode,
                    'mulai' => TanggalIndonesia::waktu($item->dikonfirmasi_pada),
                    'pesanTerakhir' => $terakhir?->isi ?? 'Belum ada pesan',
                    'pesanBaru' => 0,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('spesialis/beranda', [
            'ringkasan' => [
                'permintaanBaru' => $aktif->where('status', 'MENUNGGU_SPESIALIS')->count(),
                'jadwalHariIni' => $jadwalHariIni->count(),
                'selesaiBulanIni' => $bulanIni->count(),
                'video' => $bulanIni->where('mode', 'video')->count(),
                'teks' => $bulanIni->where('mode', 'teks')->count(),
            ],
            'permintaan' => $permintaan,
            'jadwal' => $jadwal,
            'berlangsung' => $berlangsung,
        ]);
    }

    private function dokterSaya(Request $request): Dokter
    {
        $dokter = Dokter::query()
            ->where('user_id', $request->user()->id)
            ->where('peran', 'spesialis')
            ->first();

        abort_if($dokter === null, 403, 'Profil dokter belum terhubung. Hubungi admin untuk melengkapi data dokter.');

        return $dokter;
    }
}
