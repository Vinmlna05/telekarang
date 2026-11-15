<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Support\TanggalIndonesia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class HasilController extends Controller
{
    /**
     * Form hasil konsultasi dokter spesialis: ICD-10, saran, dan keputusan rujuk.
     */
    public function __invoke(Request $request, int $konsultasi): Response
    {
        $dokter = $this->dokterSaya($request);

        $data = Konsultasi::query()
            ->with(['pasien', 'skrining.perawat', 'dokterPengirim', 'jadwal', 'hasil.icd10'])
            ->whereKey($konsultasi)
            ->where('dokter_spesialis_id', $dokter->id)
            ->firstOrFail();

        $pasien = $data->pasien;
        $skrining = $data->skrining;
        $hasil = $data->hasil;

        return Inertia::render('spesialis/hasil', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($data->tanggal?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'status' => $data->status,
                'keluhan' => $data->keluhan,
                'mode' => $data->mode,
                'jadwal' => $data->jadwal === null ? null : $data->jadwal->hari.' · '.substr($data->jadwal->jam_mulai, 0, 5).' WIT',
                'dokterUmum' => $data->dokterPengirim?->nama,
                'prioritas' => $data->prioritasKartu(),
            ],
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
            ],
            'skrining' => $skrining === null ? null : [
                'sistol' => (int) $skrining->sistol,
                'diastol' => (int) $skrining->diastol,
                'suhu' => (float) $skrining->suhu,
                'nadi' => (int) $skrining->nadi,
                'spo2' => (int) $skrining->spo2,
                'prioritas' => $skrining->tingkatPrioritas(),
                'catatan' => $skrining->catatan ?? '',
                'waktu' => TanggalIndonesia::waktu($skrining->waktu),
            ],
            'hasil' => $hasil === null ? null : [
                'icd10Kode' => $hasil->icd10_kode,
                'icd10Nama' => $hasil->icd10?->nama_diagnosis,
                'saran' => $hasil->saran,
                'keputusanRujuk' => (bool) $hasil->keputusan_rujuk,
                'alasanRujuk' => $hasil->alasan_rujuk,
                'biayaRujukan' => $hasil->biaya_rujukan === null ? null : (float) $hasil->biaya_rujukan,
                'waktu' => TanggalIndonesia::waktu($hasil->waktu),
            ],
            'daftarIcd10' => Icd10::query()->orderBy('kode')->get(['kode', 'nama_diagnosis'])->map(fn (Icd10 $icd10) => [
                'kode' => $icd10->kode,
                'nama' => $icd10->nama_diagnosis,
            ])->values()->all(),
        ]);
    }

    /**
     * Simpan hasil konsultasi dan tutup konsultasi.
     */
    public function store(Request $request, int $konsultasi): RedirectResponse
    {
        $dokter = $this->dokterSaya($request);

        $data = Konsultasi::query()
            ->with('pasien')
            ->whereKey($konsultasi)
            ->where('dokter_spesialis_id', $dokter->id)
            ->firstOrFail();

        if (! in_array($data->status, ['DIKONFIRMASI', 'BERLANGSUNG'], true)) {
            return back()->with('error', 'Hasil hanya dapat diisi saat konsultasi berlangsung.');
        }

        $validated = $request->validate([
            'icd10_kode' => ['required', 'string', Rule::exists('icd10', 'kode')],
            'saran' => ['required', 'string', 'min:5', 'max:4000'],
            'keputusan_rujuk' => ['required', 'boolean'],
            'alasan_rujuk' => ['nullable', 'string', 'max:2000', 'required_if:keputusan_rujuk,1,true'],
            'biaya_rujukan' => ['nullable', 'numeric', 'min:0', 'max:100000000'],
        ], [
            'alasan_rujuk.required_if' => 'Alasan wajib diisi bila memutuskan rujuk.',
        ]);

        $rujuk = (bool) $validated['keputusan_rujuk'];

        HasilKonsultasi::query()->updateOrCreate(
            ['konsultasi_id' => $data->id],
            [
                'icd10_kode' => $validated['icd10_kode'],
                'saran' => $validated['saran'],
                'keputusan_rujuk' => $rujuk,
                'alasan_rujuk' => $rujuk ? ($validated['alasan_rujuk'] ?? null) : null,
                'biaya_rujukan' => $rujuk ? ($validated['biaya_rujukan'] ?? null) : null,
                'waktu' => Carbon::now(),
            ],
        );

        $data->update([
            'status' => 'SELESAI',
            'mode' => $data->mode,
        ]);

        AuditLog::catat(
            $request->user(),
            'hasil_konsultasi',
            'konsultasi',
            (string) $data->id,
            'Hasil konsultasi '.($data->pasien?->nama ?? 'pasien').' disimpan dengan diagnosis '.$validated['icd10_kode'].($rujuk ? ' (rujuk)' : ' (tidak rujuk)'),
        );

        return to_route('spesialis.hasil', $data->id)
            ->with('success', $rujuk ? 'Hasil tersimpan. Pasien disarankan dirujuk.' : 'Hasil tersimpan. Pasien tidak perlu dirujuk.');
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
