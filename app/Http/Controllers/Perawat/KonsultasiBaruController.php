<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\TanggalIndonesia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiBaruController extends Controller
{
    /**
     * Form permintaan konsultasi atas nama pasien (termasuk pasien tanpa akun).
     */
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
            'permintaanTerkirim' => $this->permintaanTerkirim($request->integer('konsultasi')),
        ]);
    }

    /**
     * Simpan permintaan konsultasi baru ke antrean skrining.
     */
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
            'keluhan' => ['required', 'string', 'min:10', 'max:2000'],
            'durasi' => ['nullable', 'string', 'max:50'],
            'persetujuan' => ['accepted'],
        ], [
            'pasien.required' => 'Pilih pasien terlebih dahulu.',
            'keluhan.required' => 'Keluhan utama wajib diisi.',
            'keluhan.min' => 'Keluhan utama minimal 10 karakter.',
            'persetujuan.accepted' => 'Persetujuan pasien wajib dicentang.',
        ]);

        $keluhan = trim($data['keluhan']);

        if (! empty($data['durasi'])) {
            $keluhan .= ' (dialami '.$data['durasi'].')';
        }

        $konsultasi = Konsultasi::query()->create([
            'pasien_id' => $data['pasien'],
            'dibuat_oleh' => $request->user()->id,
            'mode' => 'teks',
            'status' => 'MENUNGGU_SKRINING',
            'keluhan' => $keluhan,
            'tanggal' => null,
            'kedaluwarsa_pada' => Carbon::today()->endOfDay()->addDays(3),
        ]);

        return to_route('perawat.konsultasi.baru', ['konsultasi' => $konsultasi->id])
            ->with('success', 'Permintaan konsultasi tercatat dan masuk antrean skrining.');
    }

    /**
     * Data ringkas untuk panel "Permintaan terkirim".
     *
     * @return array<string, mixed>|null
     */
    private function permintaanTerkirim(int $konsultasiId): ?array
    {
        if ($konsultasiId < 1) {
            return null;
        }

        $konsultasi = Konsultasi::query()
            ->with('pasien')
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
            'keluhan' => $konsultasi->keluhan,
            'status' => $konsultasi->status,
            'kedaluwarsa' => $konsultasi->kedaluwarsa_pada !== null
                ? TanggalIndonesia::waktu($konsultasi->kedaluwarsa_pada)
                : null,
            'dibuat' => TanggalIndonesia::waktu($konsultasi->created_at),
        ];
    }
}
