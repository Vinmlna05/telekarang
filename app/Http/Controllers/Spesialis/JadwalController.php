<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JadwalController extends Controller
{
    /**
     * @var list<string>
     */
    private const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    /**
     * Kelola jadwal praktik dokter spesialis.
     */
    public function __invoke(Request $request): Response
    {
        $dokter = $this->dokterSaya($request);

        $jadwal = $dokter->jadwal()
            ->withCount(['konsultasi as konsultasi_aktif' => fn ($query) => $query->whereNotIn('status', Konsultasi::STATUS_TERMINAL)])
            ->get()
            ->sortBy(fn (Jadwal $slot) => array_search($slot->hari, self::HARI, true) * 10000 + (int) str_replace(':', '', $slot->jam_mulai))
            ->map(fn (Jadwal $slot) => [
                'id' => $slot->id,
                'hari' => $slot->hari,
                'jamMulai' => substr($slot->jam_mulai, 0, 5),
                'jamSelesai' => substr($slot->jam_selesai, 0, 5),
                'status' => $slot->status,
                'konsultasiAktif' => (int) $slot->konsultasi_aktif,
            ])
            ->values()
            ->all();

        return Inertia::render('spesialis/jadwal', [
            'ringkasan' => [
                'total' => count($jadwal),
                'tersedia' => collect($jadwal)->where('status', 'tersedia')->count(),
                'terisi' => collect($jadwal)->where('status', 'terisi')->count(),
                'libur' => collect($jadwal)->where('status', 'libur')->count(),
            ],
            'jadwal' => $jadwal,
            'pilihanHari' => self::HARI,
        ]);
    }

    /**
     * Tambah slot jadwal praktik.
     */
    public function store(Request $request): RedirectResponse
    {
        $dokter = $this->dokterSaya($request);
        $validated = $this->validasi($request);

        $dokter->jadwal()->create([
            'hari' => $validated['hari'],
            'jam_mulai' => $validated['jam_mulai'],
            'jam_selesai' => $validated['jam_selesai'],
            'status' => $validated['status'] ?? 'tersedia',
        ]);

        return back()->with('success', 'Slot jadwal ditambahkan.');
    }

    /**
     * Perbarui slot jadwal.
     */
    public function update(Request $request, int $jadwal): RedirectResponse
    {
        $slot = $this->milikSaya($request, $jadwal);
        $validated = $this->validasi($request);

        if ($validated['status'] === 'libur' && $slot->status === 'terisi') {
            return back()->with('error', 'Slot sedang terisi konsultasi aktif dan tidak bisa diliburkan.');
        }

        $slot->update([
            'hari' => $validated['hari'],
            'jam_mulai' => $validated['jam_mulai'],
            'jam_selesai' => $validated['jam_selesai'],
            'status' => $validated['status'] ?? $slot->status,
        ]);

        return back()->with('success', 'Slot jadwal diperbarui.');
    }

    /**
     * Hapus slot jadwal yang belum dipakai konsultasi aktif.
     */
    public function destroy(Request $request, int $jadwal): RedirectResponse
    {
        $slot = $this->milikSaya($request, $jadwal);

        $dipakai = Konsultasi::query()
            ->where('jadwal_id', $slot->id)
            ->whereNotIn('status', Konsultasi::STATUS_TERMINAL)
            ->exists();

        if ($dipakai) {
            return back()->with('error', 'Slot masih dipakai konsultasi aktif dan tidak bisa dihapus.');
        }

        $slot->delete();

        return back()->with('success', 'Slot jadwal dihapus.');
    }

    /**
     * @return array{hari: string, jam_mulai: string, jam_selesai: string, status?: string}
     */
    private function validasi(Request $request): array
    {
        return $request->validate([
            'hari' => ['required', 'string', Rule::in(self::HARI)],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'jam_selesai' => ['required', 'date_format:H:i', 'after:jam_mulai'],
            'status' => ['nullable', 'string', Rule::in(Jadwal::STATUS)],
        ], [
            'jam_selesai.after' => 'Jam selesai harus setelah jam mulai.',
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

    private function milikSaya(Request $request, int $jadwal): Jadwal
    {
        return $this->dokterSaya($request)
            ->jadwal()
            ->whereKey($jadwal)
            ->firstOrFail();
    }
}
