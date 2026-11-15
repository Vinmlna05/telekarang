<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pesan;
use App\Support\TanggalIndonesia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiDetailController extends Controller
{
    public function __invoke(Request $request, string $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with(['dokterSpesialis', 'hasil.icd10', 'skrining.perawat', 'pesan.pengirim'])
            ->whereKey((int) $konsultasi)
            ->whereHas('pasien', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $hasil = $data->hasil;
        $skrining = $data->skrining;
        $tanggalTampil = $data->tanggal ?? $data->tanggal_skrining;

        return Inertia::render('pasien/konsultasi-detail', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($tanggalTampil?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'tanggal' => TanggalIndonesia::format($tanggalTampil) ?? 'Belum dijadwalkan',
                'tanggalSingkat' => TanggalIndonesia::singkat($tanggalTampil) ?? '-',
                'tanggalSkrining' => TanggalIndonesia::format($data->tanggal_skrining),
                'dokter' => $data->dokterSpesialis?->nama ?? 'Dokter belum ditentukan',
                'spesialisasi' => $data->dokterSpesialis?->spesialisasi ?? 'Menunggu keputusan dokter umum',
                'faskes' => $data->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                'jadwal' => $this->jadwal($data),
                'mode' => $data->mode,
                'status' => $data->status,
                'keputusanDokter' => $data->keputusan_dokter,
                'catatanDokter' => $data->catatan_dokter,
                'alasanStatus' => $data->alasan_status,
                'keluhan' => $data->keluhan,
                'pesan' => $data->pesan->map(fn (Pesan $pesan) => [
                    'id' => $pesan->id,
                    'pengirim' => $this->peranPengirim($pesan),
                    'isi' => $pesan->isi ?? '',
                    'waktu' => $pesan->waktu?->format('H.i').' WIT',
                    'foto' => $pesan->lampiran_foto,
                    'statusKirim' => strtoupper($pesan->status_kirim),
                ])->all(),
                'skrining' => $skrining === null ? null : [
                    'perawat' => $skrining->perawat?->name ?? 'Perawat Puskesmas',
                    'beratBadan' => (float) $skrining->berat,
                    'tinggiBadan' => (float) $skrining->tinggi,
                    'sistol' => (int) $skrining->sistol,
                    'diastol' => (int) $skrining->diastol,
                    'suhu' => (float) $skrining->suhu,
                    'nadi' => (int) $skrining->nadi,
                    'spo2' => (int) $skrining->spo2,
                    'tandaBahaya' => (bool) $skrining->tanda_bahaya,
                    'catatan' => $skrining->catatan ?? '',
                    'waktu' => TanggalIndonesia::waktu($skrining->waktu),
                ],
                'hasil' => $hasil === null ? null : [
                    'icd10Kode' => $hasil->icd10_kode,
                    'icd10Nama' => $hasil->icd10?->nama_diagnosis ?? 'Belum ada diagnosis',
                    'saran' => $hasil->saran,
                    'keputusanRujuk' => (bool) $hasil->keputusan_rujuk,
                    'alasanRujuk' => $hasil->alasan_rujuk,
                    'biayaRujukan' => $hasil->biaya_rujukan === null ? null : (float) $hasil->biaya_rujukan,
                    'tindakLanjut' => $hasil->keputusan_rujuk
                        ? 'Perawat puskesmas akan membantu proses rujukan dan mencatat biaya perjalanan.'
                        : 'Tindak lanjuti di Puskesmas Pulau Karang sesuai saran dokter dan jadwalkan kontrol bila diperlukan.',
                    'waktu' => TanggalIndonesia::waktu($hasil->waktu),
                ],
            ],
        ]);
    }

    private function jadwal(Konsultasi $konsultasi): string
    {
        if ($konsultasi->tanggal !== null) {
            return TanggalIndonesia::format($konsultasi->tanggal).' · '.$konsultasi->tanggal->format('H.i').' WIT';
        }

        if ($konsultasi->tanggal_skrining !== null) {
            return 'Skrining: '.TanggalIndonesia::format($konsultasi->tanggal_skrining);
        }

        return 'Belum dijadwalkan';
    }

    private function peranPengirim(Pesan $pesan): string
    {
        $peran = $pesan->pengirim?->role;

        return match ($peran) {
            'pasien' => 'pasien',
            'perawat' => 'perawat',
            default => 'spesialis',
        };
    }
}
