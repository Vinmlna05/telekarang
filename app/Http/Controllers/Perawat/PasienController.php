<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Perawat\StorePasienRequest;
use App\Models\AuditLog;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PasienController extends Controller
{
    public function __invoke(): Response
    {
        $pasien = Pasien::query()
            ->with('user')
            ->withCount('konsultasi')
            ->withMax('konsultasi', 'tanggal')
            ->where('status_verifikasi', Pasien::STATUS_TERVERIFIKASI)
            ->latest('created_at')
            ->latest('id')
            ->get();

        $daftarPasien = $pasien
            ->map(fn (Pasien $item): array => [
                'id' => $item->id,
                'nama' => $item->nama,
                'usia' => $item->tgl_lahir?->age,
                'jenisKelamin' => match ($item->jenis_kelamin) {
                    'Laki-laki', 'L' => 'L',
                    'Perempuan', 'P' => 'P',
                    default => '-',
                },
                'nik' => $item->nik,
                'noRm' => $item->nomorRekamMedis(),
                'alamat' => $item->alamat,
                'telepon' => $item->telepon,
                'punyaAkun' => $item->user_id !== null,
                'email' => $item->user?->email,
                'kunjunganTerakhir' => $this->formatKunjunganTerakhir($item->konsultasi_max_tanggal),
                'totalKonsultasi' => $item->konsultasi_count,
                'terdaftarPada' => $item->created_at->format('d/m/Y'),
            ])
            ->values();

        $menungguVerifikasi = Pasien::query()
            ->with('user')
            ->where('status_verifikasi', Pasien::STATUS_MENUNGGU_VERIFIKASI)
            ->latest('created_at')
            ->latest('id')
            ->get()
            ->map(fn (Pasien $item): array => [
                'id' => $item->id,
                'nama' => $item->nama,
                'nik' => $item->nik,
                'telepon' => $item->telepon,
                'alamat' => $item->alamat,
                'email' => $item->user?->email,
                'terdaftarPada' => $item->created_at->format('d/m/Y'),
            ])
            ->values();

        return Inertia::render('perawat/pasien', [
            'pasien' => $daftarPasien,
            'ringkasan' => [
                'total' => $pasien->count(),
                'punyaAkun' => $pasien->whereNotNull('user_id')->count(),
                'tanpaAkun' => $pasien->whereNull('user_id')->count(),
                'kunjunganBulanIni' => Konsultasi::query()
                    ->whereBetween('tanggal', [now()->startOfMonth(), now()->endOfMonth()])
                    ->whereHas('pasien', fn ($query) => $query->where('status_verifikasi', Pasien::STATUS_TERVERIFIKASI))
                    ->distinct()
                    ->count('pasien_id'),
            ],
            'menungguVerifikasi' => $menungguVerifikasi,
        ]);
    }

    public function store(StorePasienRequest $request): RedirectResponse
    {
        $data = $request->validated();

        [$pasien, $akun] = DB::transaction(function () use ($data, $request): array {
            $akun = null;

            if ($data['punya_akun']) {
                $akun = User::query()->create([
                    'name' => $data['nama'],
                    'email' => $data['email'],
                    'role' => 'pasien',
                    'password' => Hash::make($data['password']),
                ]);
            }

            $pasien = Pasien::query()->create([
                'user_id' => $akun?->id,
                'nama' => $data['nama'],
                'nik' => $data['nik'],
                'tgl_lahir' => $data['tgl_lahir'],
                'jenis_kelamin' => $data['jenis_kelamin'] === 'L' ? 'Laki-laki' : 'Perempuan',
                'alamat' => $data['alamat'],
                'telepon' => $data['telepon'],
                'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
                'diverifikasi_oleh' => $request->user()->id,
                'diverifikasi_pada' => now(),
            ]);

            AuditLog::catat(
                $request->user(),
                'membuat',
                'pasien',
                (string) $pasien->id,
                "Mendaftarkan pasien {$pasien->nama} dari halaman pasien.",
            );

            return [$pasien, $akun];
        });

        $pesan = "Pasien {$pasien->nama} berhasil didaftarkan. Nomor rekam medis: {$pasien->nomorRekamMedis()}.";

        if ($akun !== null) {
            $pesan .= " Akun pasien {$akun->email} berhasil dibuat.";
        }

        return back()->with('success', $pesan);
    }

    private function formatKunjunganTerakhir(?string $tanggal): string
    {
        if ($tanggal === null) {
            return 'Belum ada kunjungan';
        }

        $waktu = Carbon::parse($tanggal);

        if ($waktu->isToday()) {
            return 'Hari ini, '.$waktu->format('H.i');
        }

        if ($waktu->isYesterday()) {
            return 'Kemarin, '.$waktu->format('H.i');
        }

        return $waktu->format('d/m/Y, H.i');
    }
}
