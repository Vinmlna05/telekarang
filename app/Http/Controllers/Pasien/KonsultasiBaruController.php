<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\JadwalDokterPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiBaruController extends Controller
{
    /**
     * @var array<string, int>
     */
    private const HARI = [
        'Minggu' => 0,
        'Senin' => 1,
        'Selasa' => 2,
        'Rabu' => 3,
        'Kamis' => 4,
        'Jumat' => 5,
        'Sabtu' => 6,
    ];

    /**
     * Tampilkan form permintaan konsultasi dengan jadwal dokter dari data master.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('pasien/konsultasi-baru', [
            'dokter' => JadwalDokterPresenter::daftar(),
            'dokterAwal' => $request->integer('dokter') ?: null,
            'jadwalAwal' => $request->string('jadwal')->toString(),
        ]);
    }

    /**
     * Simpan permintaan konsultasi baru milik pasien yang sedang login.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'dokter' => [
                'required',
                'integer',
                Rule::exists('dokter', 'id')->where(
                    fn ($query) => $query->where('peran', 'spesialis')->where('status', 'aktif'),
                ),
            ],
            'slot' => ['required', 'string', 'regex:/^\d{2}\.\d{2}$/'],
            'hari' => ['required', 'string', Rule::in(array_keys(self::HARI))],
            'keluhan' => ['required', 'string', 'min:10', 'max:2000'],
            'durasi' => ['nullable', 'string', 'max:50'],
            'persetujuan' => ['accepted'],
        ]);

        $user = $request->user();

        $pasien = Pasien::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'nama' => $user->name,
                'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
            ],
        );

        $jam = str_replace('.', ':', $data['slot']).':00';
        $jadwal = Jadwal::query()
            ->where('dokter_id', $data['dokter'])
            ->where('hari', $data['hari'])
            ->where('status', 'tersedia')
            ->where('jam_mulai', $jam)
            ->first();

        if ($jadwal === null) {
            throw ValidationException::withMessages([
                'slot' => 'Slot jadwal yang dipilih tidak tersedia. Pilih slot lain pada jadwal dokter.',
            ]);
        }

        $tanggal = $this->tanggalKonsultasi($jadwal);

        $keluhan = trim($data['keluhan']);

        if (! empty($data['durasi'])) {
            $keluhan .= ' (dialami '.$data['durasi'].')';
        }

        Konsultasi::query()->create([
            'pasien_id' => $pasien->id,
            'dibuat_oleh' => $user->id,
            'dokter_spesialis_id' => $data['dokter'],
            'jadwal_id' => $jadwal->id,
            'mode' => 'teks',
            'status' => 'MENUNGGU_SKRINING',
            'keluhan' => $keluhan,
            'tanggal' => $tanggal,
            'kedaluwarsa_pada' => $tanggal->copy()->addDays(3),
        ]);

        return to_route('pasien.beranda')
            ->with('success', 'Permintaan konsultasi berhasil dibuat dan masuk antrean skrining perawat.');
    }

    /**
     * Tentukan tanggal konsultasi berikutnya berdasarkan slot jadwal dokter.
     */
    private function tanggalKonsultasi(Jadwal $jadwal): Carbon
    {
        $selisih = (self::HARI[$jadwal->hari] - (int) Carbon::now()->format('w') + 7) % 7;
        $tanggal = Carbon::now()->startOfDay()->addDays($selisih)->setTimeFromTimeString($jadwal->jam_mulai);

        if ($selisih === 0 && $tanggal->isPast()) {
            $tanggal->addWeek();
        }

        return $tanggal;
    }
}
