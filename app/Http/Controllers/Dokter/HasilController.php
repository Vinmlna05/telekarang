<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Inertia\Inertia;
use Inertia\Response;

class HasilController extends Controller
{
    /**
     * Hasil konsultasi spesialis dan tindak lanjut untuk dokter umum.
     */
    public function __invoke(int $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with(['pasien', 'skrining.perawat', 'dokterSpesialis', 'hasil.icd10', 'jadwal'])
            ->whereKey($konsultasi)
            ->firstOrFail();

        $pasien = $data->pasien;
        $skrining = $data->skrining;
        $hasil = $data->hasil;

        return Inertia::render('dokter/hasil', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($data->tanggal?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'status' => $data->status,
                'keluhan' => $data->keluhan,
                'mode' => $data->mode,
                'tanggal' => TanggalIndonesia::format($data->tanggal ?? $data->tanggal_skrining),
                'dokter' => $data->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'spesialisasi' => $data->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'faskes' => $data->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                'catatanDokter' => $data->catatan_dokter,
                'keputusanDokter' => $data->keputusan_dokter,
            ],
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
                'alamat' => $pasien?->alamat ?? '-',
                'telepon' => $pasien?->telepon ?? '-',
            ],
            'skrining' => $skrining === null ? null : [
                'perawat' => $skrining->perawat?->name ?? 'Perawat puskesmas',
                'waktu' => TanggalIndonesia::waktu($skrining->waktu),
                'beratBadan' => (float) $skrining->berat,
                'tinggiBadan' => (float) $skrining->tinggi,
                'sistol' => (int) $skrining->sistol,
                'diastol' => (int) $skrining->diastol,
                'suhu' => (float) $skrining->suhu,
                'nadi' => (int) $skrining->nadi,
                'spo2' => (int) $skrining->spo2,
                'tandaBahaya' => (bool) $skrining->tanda_bahaya,
                'prioritas' => $skrining->tingkatPrioritas(),
                'catatan' => $skrining->catatan ?? '',
            ],
            'hasil' => $hasil === null ? null : [
                'icd10Kode' => $hasil->icd10_kode,
                'icd10Nama' => $hasil->icd10?->nama_diagnosis ?? 'Belum ada diagnosis',
                'saran' => $hasil->saran,
                'keputusanRujuk' => (bool) $hasil->keputusan_rujuk,
                'alasanRujuk' => $hasil->alasan_rujuk,
                'biayaRujukan' => $hasil->biaya_rujukan === null ? null : (float) $hasil->biaya_rujukan,
                'waktu' => TanggalIndonesia::waktu($hasil->waktu),
            ],
        ]);
    }
}
