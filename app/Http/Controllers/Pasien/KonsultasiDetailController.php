<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiDetailController extends Controller
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

    public function __invoke(Request $request, string $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with(['dokterSpesialis', 'hasil.icd10', 'skrining.perawat'])
            ->whereKey((int) $konsultasi)
            ->whereHas('pasien', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $hasil = $data->hasil;
        $skrining = $data->skrining;

        return Inertia::render('pasien/konsultasi-detail', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.$data->tanggal->format('Y').'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'tanggal' => $this->formatTanggal($data->tanggal),
                'tanggalSingkat' => $this->formatTanggalSingkat($data->tanggal),
                'dokter' => $data->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'spesialisasi' => $data->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'faskes' => $data->dokterSpesialis?->faskes ?? 'Puskesmas Pulau Karang',
                'jadwal' => $this->formatTanggal($data->tanggal).' · '.$data->tanggal->format('H.i').' WIT',
                'mode' => $data->mode,
                'status' => $data->status,
                'keluhan' => $data->keluhan,
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
                    'waktu' => $this->formatWaktu($skrining->waktu),
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
                    'waktu' => $this->formatWaktu($hasil->waktu),
                ],
            ],
        ]);
    }

    private function formatTanggal(Carbon $tanggal): string
    {
        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }

    private function formatTanggalSingkat(Carbon $tanggal): string
    {
        return $tanggal->format('d')
            .' '.substr(self::BULAN[(int) $tanggal->format('n')], 0, 3)
            .' '.$tanggal->format('Y');
    }

    private function formatWaktu(Carbon $waktu): string
    {
        return $waktu->format('j')
            .' '.self::BULAN[(int) $waktu->format('n')]
            .' '.$waktu->format('Y')
            .' · '.$waktu->format('H.i').' WIT';
    }
}
