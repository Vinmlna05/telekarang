<?php

namespace App\Support;

use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Illuminate\Support\Carbon;

class ProfilPasienPresenter
{
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
     * Bentuk data profil yang dipakai halaman profil dan kelola akun.
     *
     * @return array<string, mixed>
     */
    public static function untuk(?Pasien $pasien, User $user): array
    {
        $diagnosisTerakhir = null;
        $skriningTerakhir = null;

        if ($pasien !== null) {
            $diagnosisTerakhir = Konsultasi::query()
                ->where('pasien_id', $pasien->id)
                ->where('status', 'SELESAI')
                ->whereHas('hasil')
                ->with('hasil.icd10')
                ->orderByDesc('tanggal')
                ->first()
                ?->hasil
                ?->icd10
                ?->nama_diagnosis;

            $skrining = Skrining::query()
                ->whereHas('konsultasi', fn ($query) => $query->where('pasien_id', $pasien->id))
                ->latest('waktu')
                ->first();

            if ($skrining !== null) {
                $skriningTerakhir = [
                    'tanggal' => self::formatTanggal($skrining->waktu),
                    'beratBadan' => (float) $skrining->berat,
                    'tinggiBadan' => (float) $skrining->tinggi,
                    'tekananDarah' => $skrining->sistol.'/'.$skrining->diastol,
                    'spo2' => (int) $skrining->spo2,
                ];
            }
        }

        $kontakDarurat = null;

        if ($pasien?->kontak_darurat_nama && $pasien->kontak_darurat_telepon) {
            $kontakDarurat = [
                'nama' => $pasien->kontak_darurat_nama,
                'hubungan' => $pasien->kontak_darurat_hubungan ?? 'Kontak darurat',
                'telepon' => $pasien->kontak_darurat_telepon,
                'teleponHref' => 'tel:'.preg_replace('/[^0-9+]/', '', $pasien->kontak_darurat_telepon),
            ];
        }

        return [
            'nama' => $pasien?->nama ?? $user->name,
            'nomorRekamMedis' => $pasien?->nomorRekamMedis(),
            'nik' => $pasien?->nik,
            'tanggalLahir' => $pasien?->tgl_lahir === null ? null : self::formatTanggal($pasien->tgl_lahir),
            'tglLahirInput' => $pasien?->tgl_lahir?->format('Y-m-d'),
            'usia' => $pasien?->tgl_lahir?->age,
            'jenisKelamin' => $pasien?->jenis_kelamin,
            'alamat' => $pasien?->alamat,
            'telepon' => $pasien?->telepon,
            'golonganDarah' => $pasien?->golongan_darah,
            'alergi' => $pasien?->alergi,
            'obatRutin' => $pasien?->obat_rutin,
            'diagnosisTerakhir' => $diagnosisTerakhir,
            'kontakDarurat' => $kontakDarurat,
            'terdaftarSejak' => self::formatTanggal($user->created_at),
            'skriningTerakhir' => $skriningTerakhir,
            'statusVerifikasi' => $pasien?->status_verifikasi ?? 'MENUNGGU_VERIFIKASI',
        ];
    }

    private static function formatTanggal(Carbon $tanggal): string
    {
        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }
}
