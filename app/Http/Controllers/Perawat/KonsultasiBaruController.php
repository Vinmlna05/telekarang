<?php

namespace App\Http\Controllers\Perawat;

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
     * @var list<string>
     */
    private const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public function __invoke(Request $request): Response
    {
        $pasien = Pasien::query()
            ->where('status_verifikasi', Pasien::STATUS_TERVERIFIKASI)
            ->orderBy('nama')
            ->get()
            ->map(fn (Pasien $item): array => [
                'id' => $item->id,
                'nama' => $item->nama,
                'usia' => $item->tgl_lahir?->age,
                'jenisKelamin' => match ($item->jenis_kelamin) {
                    'Laki-laki', 'L' => 'L',
                    'Perempuan', 'P' => 'P',
                    default => '-',
                },
                'nik' => $item->nik ?? '',
                'noRm' => $item->nomorRekamMedis() ?? '',
                'alamat' => $item->alamat ?? '',
                'telepon' => $item->telepon ?? '',
                'punyaAkun' => $item->user_id !== null,
            ])
            ->values();

        $pasienTerpilihId = $request->integer('pasien');
        $pasienTerpilihId = $pasien->contains('id', $pasienTerpilihId) ? $pasienTerpilihId : null;

        return Inertia::render('perawat/konsultasi-baru', [
            'pasien' => $pasien,
            'pasienTerpilihId' => $pasienTerpilihId,
            'dokter' => JadwalDokterPresenter::daftar(),
            'permintaanTerkirim' => $this->permintaanTerkirim($request->integer('konsultasi')),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'pasien' => [
                'required',
                'integer',
                Rule::exists('pasien', 'id')->where(
                    fn ($query) => $query->where('status_verifikasi', Pasien::STATUS_TERVERIFIKASI),
                ),
            ],
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

        $konsultasi = Konsultasi::query()->create([
            'pasien_id' => $data['pasien'],
            'dibuat_oleh' => $request->user()->id,
            'dokter_spesialis_id' => $data['dokter'],
            'jadwal_id' => $jadwal->id,
            'mode' => 'teks',
            'status' => 'MENUNGGU_SKRINING',
            'keluhan' => $keluhan,
            'tanggal' => $tanggal,
            'kedaluwarsa_pada' => $tanggal->copy()->addDays(3),
        ]);

        return to_route('perawat.konsultasi.baru', ['konsultasi' => $konsultasi->id])
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

    /**
     * Data ringkas untuk halaman "Permintaan terkirim".
     *
     * @return array<string, mixed>|null
     */
    private function permintaanTerkirim(int $konsultasiId): ?array
    {
        if ($konsultasiId < 1) {
            return null;
        }

        $konsultasi = Konsultasi::query()
            ->with(['pasien', 'dokterSpesialis'])
            ->whereKey($konsultasiId)
            ->first();

        if ($konsultasi === null) {
            return null;
        }

        $pasien = $konsultasi->pasien;

        return [
            'id' => $konsultasi->id,
            'nomor' => 'KNS-'.$konsultasi->created_at->format('Y').'-'.str_pad((string) $konsultasi->id, 4, '0', STR_PAD_LEFT),
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age,
                'noRm' => $pasien?->nomorRekamMedis() ?? '',
                'punyaAkun' => $pasien?->user_id !== null,
            ],
            'dokter' => [
                'nama' => $konsultasi->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'spesialisasi' => $konsultasi->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'faskes' => $konsultasi->dokterSpesialis?->faskes ?? 'RS Rujukan',
            ],
            'jadwal' => [
                'hari' => self::NAMA_HARI[(int) $konsultasi->tanggal->format('w')],
                'slot' => $konsultasi->tanggal->format('H.i'),
            ],
            'keluhan' => $konsultasi->keluhan,
        ];
    }
}
