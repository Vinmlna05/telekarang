<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermintaanController extends Controller
{
    /**
     * Daftar permintaan konsultasi untuk dokter spesialis yang login.
     */
    public function __invoke(Request $request): Response
    {
        $dokter = $this->dokterSaya($request);

        $permintaan = Konsultasi::query()
            ->with(['pasien', 'skrining', 'dokterPengirim', 'jadwal'])
            ->where('dokter_spesialis_id', $dokter->id)
            ->whereIn('status', ['MENUNGGU_SPESIALIS', 'DIKONFIRMASI', 'DIJADWAL_ULANG', 'DITOLAK', 'BERLANGSUNG'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Konsultasi $item) => [
                'id' => $item->id,
                'nama' => $item->pasien?->nama ?? 'Pasien',
                'usia' => $item->pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($item->pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'keluhan' => $item->keluhan,
                'prioritas' => match ($item->prioritasKartu()) {
                    'darurat' => 'merah',
                    'sedang' => 'kuning',
                    default => 'normal',
                },
                'status' => $item->status,
                'mode' => $item->mode,
                'jadwal' => $item->jadwal === null ? null : $item->jadwal->hari.' · '.substr($item->jadwal->jam_mulai, 0, 5),
                'dokterUmum' => $item->dokterPengirim?->nama,
                'diminta' => TanggalIndonesia::waktu($item->updated_at),
                'skrining' => $item->skrining === null ? null : [
                    'sistol' => (int) $item->skrining->sistol,
                    'diastol' => (int) $item->skrining->diastol,
                    'suhu' => (float) $item->skrining->suhu,
                    'nadi' => (int) $item->skrining->nadi,
                    'spo2' => (int) $item->skrining->spo2,
                    'prioritas' => $item->skrining->tingkatPrioritas(),
                    'catatan' => $item->skrining->catatan ?? '',
                ],
            ])
            ->values();

        return Inertia::render('spesialis/permintaan', [
            'ringkasan' => [
                'menunggu' => $permintaan->where('status', 'MENUNGGU_SPESIALIS')->count(),
                'dikonfirmasi' => $permintaan->whereIn('status', ['DIKONFIRMASI', 'BERLANGSUNG'])->count(),
                'dijadwalUlang' => $permintaan->where('status', 'DIJADWAL_ULANG')->count(),
                'ditolak' => $permintaan->where('status', 'DITOLAK')->count(),
            ],
            'permintaan' => $permintaan,
        ]);
    }

    /**
     * Konfirmasi, jadwal ulang, atau tolak permintaan konsultasi.
     */
    public function putuskan(Request $request, int $konsultasi): RedirectResponse
    {
        $dokter = $this->dokterSaya($request);

        $data = Konsultasi::query()
            ->with(['pasien', 'jadwal'])
            ->whereKey($konsultasi)
            ->where('dokter_spesialis_id', $dokter->id)
            ->firstOrFail();

        if ($data->status !== 'MENUNGGU_SPESIALIS') {
            return back()->with('error', 'Permintaan ini sudah diproses sebelumnya.');
        }

        $validated = $request->validate([
            'aksi' => ['required', 'string', Rule::in(['konfirmasi', 'jadwal_ulang', 'tolak'])],
            'alasan' => ['nullable', 'string', 'max:1000', 'required_if:aksi,jadwal_ulang,tolak'],
        ], [
            'alasan.required_if' => 'Tulis alasan untuk jadwal ulang atau penolakan.',
        ]);

        $status = match ($validated['aksi']) {
            'konfirmasi' => 'DIKONFIRMASI',
            'jadwal_ulang' => 'DIJADWAL_ULANG',
            'tolak' => 'DITOLAK',
        };

        $lepasSlot = in_array($status, ['DIJADWAL_ULANG', 'DITOLAK'], true) && $data->jadwal_id !== null;

        if ($lepasSlot) {
            $data->jadwal()->update(['status' => 'tersedia']);
        }

        $data->update([
            'status' => $status,
            'alasan_status' => $validated['alasan'] ?? null,
            'dikonfirmasi_pada' => $status === 'DIKONFIRMASI' ? now() : null,
            'jadwal_id' => $lepasSlot ? null : $data->jadwal_id,
            'tanggal' => $lepasSlot ? null : $data->tanggal,
        ]);

        AuditLog::catat(
            $request->user(),
            'respons_spesialis',
            'konsultasi',
            (string) $data->id,
            'Dokter spesialis memilih '.$validated['aksi'].' untuk '.($data->pasien?->nama ?? 'pasien'),
        );

        $pesan = match ($validated['aksi']) {
            'konfirmasi' => 'Permintaan dikonfirmasi. Ruang konsultasi dibuka.',
            'jadwal_ulang' => 'Permintaan dikembalikan ke perawat untuk memilih jadwal baru.',
            'tolak' => 'Permintaan ditolak dan slot jadwal dilepas.',
        };

        return to_route('spesialis.permintaan')->with('success', $pesan);
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
