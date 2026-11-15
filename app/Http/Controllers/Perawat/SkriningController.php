<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Skrining;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SkriningController extends Controller
{
    /**
     * @var list<string>
     */
    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * @var list<string>
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

    public function __invoke(int $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with(['pasien', 'dokterSpesialis', 'skrining', 'pembuat'])
            ->whereKey($konsultasi)
            ->firstOrFail();

        $skrining = $data->skrining;
        $pasien = $data->pasien;

        $nilaiAwal = $skrining === null
            ? [
                'berat' => '',
                'tinggi' => '',
                'suhu' => '',
                'nadi' => '',
                'sistol' => '',
                'diastol' => '',
                'spo2' => '',
                'catatan' => '',
                'prioritas' => Skrining::PRIORITAS_SEDANG,
            ]
            : [
                'berat' => $this->formatAngka($skrining->berat),
                'tinggi' => $this->formatAngka($skrining->tinggi),
                'suhu' => $this->formatAngka($skrining->suhu),
                'nadi' => $this->formatAngka($skrining->nadi),
                'sistol' => $this->formatAngka($skrining->sistol),
                'diastol' => $this->formatAngka($skrining->diastol),
                'spo2' => $this->formatAngka($skrining->spo2),
                'catatan' => $skrining->catatan ?? '',
                'prioritas' => in_array($skrining->prioritas, Skrining::PRIORITAS, true)
                    ? $skrining->prioritas
                    : ($skrining->tanda_bahaya ? Skrining::PRIORITAS_DARURAT : Skrining::PRIORITAS_SEDANG),
            ];

        return Inertia::render('perawat/skrining', [
            'konsultasiId' => $data->id,
            'pasien' => [
                'id' => $data->id,
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'nik' => $pasien?->nik ?? '-',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
                'alamat' => $pasien?->alamat ?? '-',
                'keluhan' => $data->keluhan,
                'spesialisasi' => $data->dokterSpesialis?->spesialisasi ?? 'Spesialis',
                'dokter' => $data->dokterSpesialis?->nama ?? 'Dokter spesialis',
                'jadwal' => $this->formatTanggal($data->tanggal).' · '.$data->tanggal->format('H.i').' WIT',
                'status' => $data->status,
                'prioritas' => $data->prioritasKartu(),
                'sumber' => $data->pembuat?->role === 'pasien' ? 'Akun pasien' : 'Didaftarkan perawat',
                'waktuMasuk' => $this->formatWaktuMasuk($data->tanggal),
            ],
            'nilaiAwal' => $nilaiAwal,
        ]);
    }

    /**
     * Simpan skrining perawat dan buka gerbang permintaan ke dokter umum.
     */
    public function store(Request $request, int $konsultasi): RedirectResponse
    {
        $data = Konsultasi::query()->whereKey($konsultasi)->firstOrFail();

        $validated = $request->validate([
            'berat' => ['required', 'numeric', 'min:2', 'max:250'],
            'tinggi' => ['required', 'numeric', 'min:30', 'max:250'],
            'suhu' => ['required', 'numeric', 'min:30', 'max:45'],
            'nadi' => ['required', 'integer', 'min:30', 'max:220'],
            'sistol' => ['required', 'integer', 'min:50', 'max:260'],
            'diastol' => ['required', 'integer', 'min:30', 'max:150'],
            'spo2' => ['required', 'integer', 'min:50', 'max:100'],
            'prioritas' => ['required', 'string', Rule::in(Skrining::PRIORITAS)],
            'keluhan' => ['nullable', 'string', 'max:2000'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);

        $keluhan = trim($validated['keluhan'] ?? '') ?: $data->keluhan;

        Skrining::query()->updateOrCreate(
            ['konsultasi_id' => $data->id],
            [
                'perawat_id' => $request->user()->id,
                'berat' => $validated['berat'],
                'tinggi' => $validated['tinggi'],
                'sistol' => $validated['sistol'],
                'diastol' => $validated['diastol'],
                'suhu' => $validated['suhu'],
                'nadi' => $validated['nadi'],
                'spo2' => $validated['spo2'],
                'tanda_bahaya' => $this->tandaBahaya($validated, $keluhan),
                'prioritas' => $validated['prioritas'],
                'catatan' => $validated['catatan'] ?? null,
                'waktu' => Carbon::now(),
            ],
        );

        $data->update([
            'keluhan' => $keluhan,
            'status' => 'SKRINING_SELESAI',
        ]);

        return to_route('perawat.permintaan')
            ->with('success', 'Skrining '.($data->pasien?->nama ?? 'pasien').' tersimpan dan siap direview dokter umum.');
    }

    /**
     * @param  array<string, mixed>  $vital
     */
    private function tandaBahaya(array $vital, string $keluhan): bool
    {
        $keluhan = strtolower($keluhan);

        return (int) $vital['spo2'] < 92
            || (int) $vital['sistol'] >= 180
            || (int) $vital['diastol'] >= 120
            || (float) $vital['suhu'] >= 40
            || (int) $vital['nadi'] > 130
            || (int) $vital['nadi'] < 40
            || str_contains($keluhan, 'sesak berat')
            || str_contains($keluhan, 'tidak sadar');
    }

    private function formatAngka(mixed $nilai): string
    {
        if ($nilai === null) {
            return '';
        }

        $teks = (string) $nilai;

        if (str_contains($teks, '.')) {
            $teks = rtrim(rtrim($teks, '0'), '.');
        }

        return $teks === '' ? '0' : $teks;
    }

    private function formatWaktuMasuk(Carbon $tanggal): string
    {
        if ($tanggal->isToday()) {
            return 'Hari ini, '.$tanggal->format('H.i');
        }

        if ($tanggal->isYesterday()) {
            return 'Kemarin, '.$tanggal->format('H.i');
        }

        return $tanggal->format('d').' '.substr(self::BULAN[(int) $tanggal->format('n')], 0, 3).' '.$tanggal->format('Y').', '.$tanggal->format('H.i');
    }

    private function formatTanggal(Carbon $tanggal): string
    {
        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }
}
