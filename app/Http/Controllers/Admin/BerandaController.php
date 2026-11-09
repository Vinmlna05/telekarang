<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HasilKonsultasi;
use App\Models\Konsultasi;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Estimasi biaya kapal sekali jalan (rupiah) untuk menghitung penghematan.
     */
    private const BIAYA_PERJALANAN = 850000;

    /**
     * Estimasi waktu tempuh kapal sekali jalan (jam).
     */
    private const JAM_PERJALANAN = 6;

    /**
     * Dasbor statistik admin: konsultasi, rujukan terhindarkan, dan penghematan.
     */
    public function __invoke(Request $request): Response
    {
        $periode = $request->string('periode')->toString();

        if (! in_array($periode, ['minggu', 'bulan', 'tahun'], true)) {
            $periode = 'bulan';
        }

        [$mulai, $selesai] = $this->rentang($periode);

        $konsultasi = Konsultasi::query()
            ->whereBetween('tanggal', [$mulai, $selesai])
            ->get(['tanggal', 'dikonfirmasi_pada', 'mode']);

        $hasil = HasilKonsultasi::query()
            ->whereHas('konsultasi', fn ($query) => $query->whereBetween('tanggal', [$mulai, $selesai]));

        $totalKonsultasi = $konsultasi->count();
        $rujukanTerhindarkan = (clone $hasil)->where('keputusan_rujuk', false)->count();
        $rujukanDilakukan = (clone $hasil)->where('keputusan_rujuk', true)->count();

        return Inertia::render('admin/beranda', [
            'periode' => $periode,
            'ringkasan' => [
                'totalKonsultasi' => $totalKonsultasi,
                'rujukanTerhindarkan' => $rujukanTerhindarkan,
                'rujukanDilakukan' => $rujukanDilakukan,
                'persentase' => $totalKonsultasi > 0
                    ? (int) round($rujukanTerhindarkan / $totalKonsultasi * 100)
                    : 0,
                'biayaHemat' => $rujukanTerhindarkan * self::BIAYA_PERJALANAN,
                'jamHemat' => $rujukanTerhindarkan * self::JAM_PERJALANAN,
                'rataWaktuTunggu' => $this->rataWaktuTunggu($konsultasi),
                'video' => $konsultasi->where('mode', 'video')->count(),
                'teks' => $konsultasi->where('mode', 'teks')->count(),
            ],
            'tren' => $this->tren($periode, $konsultasi->pluck('tanggal')),
            'diagnosis' => $this->diagnosis($mulai, $selesai),
            'spesialisasi' => $this->spesialisasi($mulai, $selesai),
        ]);
    }

    /**
     * Rentang tanggal untuk periode yang dipilih.
     *
     * @return array{0: CarbonInterface, 1: CarbonInterface}
     */
    private function rentang(string $periode): array
    {
        return match ($periode) {
            'minggu' => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            'tahun' => [now()->subMonths(11)->startOfMonth(), now()->endOfDay()],
            default => [now()->subDays(29)->startOfDay(), now()->endOfDay()],
        };
    }

    /**
     * Rata-rata waktu tunggu (jam) sejak permintaan sampai dikonfirmasi.
     *
     * @param  Collection<int, Konsultasi>  $konsultasi
     */
    private function rataWaktuTunggu(Collection $konsultasi): float
    {
        $menit = $konsultasi
            ->filter(fn (Konsultasi $item) => $item->dikonfirmasi_pada !== null)
            ->map(fn (Konsultasi $item) => max(
                0,
                ($item->dikonfirmasi_pada->getTimestamp() - $item->tanggal->getTimestamp()) / 60,
            ));

        return $menit->isEmpty() ? 0.0 : round($menit->average() / 60, 1);
    }

    /**
     * Tren jumlah konsultasi sesuai periode.
     *
     * @param  Collection<int, CarbonInterface>  $tanggal
     * @return list<array{label: string, konsultasi: int}>
     */
    private function tren(string $periode, Collection $tanggal): array
    {
        if ($periode === 'minggu') {
            return collect(range(6, 0))
                ->map(function (int $mundur) use ($tanggal) {
                    $hari = now()->subDays($mundur)->startOfDay();

                    return [
                        'label' => $hari->locale('id')->isoFormat('ddd'),
                        'konsultasi' => $tanggal->filter(fn ($item) => $item->isSameDay($hari))->count(),
                    ];
                })
                ->values()
                ->all();
        }

        if ($periode === 'tahun') {
            return collect(range(11, 0))
                ->map(function (int $mundur) use ($tanggal) {
                    $bulan = now()->startOfMonth()->subMonths($mundur);

                    return [
                        'label' => $bulan->locale('id')->isoFormat('MMM'),
                        'konsultasi' => $tanggal->filter(fn ($item) => $item->isSameMonth($bulan))->count(),
                    ];
                })
                ->values()
                ->all();
        }

        return collect(range(29, 0))
            ->map(function (int $mundur) use ($tanggal) {
                $hari = now()->subDays($mundur)->startOfDay();

                return [
                    'label' => $hari->format('j'),
                    'konsultasi' => $tanggal->filter(fn ($item) => $item->isSameDay($hari))->count(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Diagnosis ICD-10 terbanyak pada periode.
     *
     * @return list<array{kode: string, nama: string, jumlah: int}>
     */
    private function diagnosis(CarbonInterface $mulai, CarbonInterface $selesai): array
    {
        return HasilKonsultasi::query()
            ->join('konsultasi', 'konsultasi.id', '=', 'hasil_konsultasi.konsultasi_id')
            ->join('icd10', 'icd10.kode', '=', 'hasil_konsultasi.icd10_kode')
            ->whereBetween('konsultasi.tanggal', [$mulai, $selesai])
            ->selectRaw('hasil_konsultasi.icd10_kode as kode, icd10.nama_diagnosis as nama, count(*) as jumlah')
            ->groupBy('hasil_konsultasi.icd10_kode', 'icd10.nama_diagnosis')
            ->orderByDesc('jumlah')
            ->limit(5)
            ->get()
            ->map(fn ($baris) => [
                'kode' => (string) $baris->kode,
                'nama' => (string) $baris->nama,
                'jumlah' => (int) $baris->jumlah,
            ])
            ->all();
    }

    /**
     * Distribusi konsultasi per spesialisasi.
     *
     * @return list<array{nama: string, jumlah: int}>
     */
    private function spesialisasi(CarbonInterface $mulai, CarbonInterface $selesai): array
    {
        return Konsultasi::query()
            ->join('dokter', 'dokter.id', '=', 'konsultasi.dokter_spesialis_id')
            ->whereBetween('konsultasi.tanggal', [$mulai, $selesai])
            ->selectRaw("coalesce(nullif(dokter.spesialisasi, ''), 'Lainnya') as nama, count(*) as jumlah")
            ->groupByRaw("coalesce(nullif(dokter.spesialisasi, ''), 'Lainnya')")
            ->orderByDesc('jumlah')
            ->get()
            ->map(fn ($baris) => [
                'nama' => (string) $baris->nama,
                'jumlah' => (int) $baris->jumlah,
            ])
            ->all();
    }
}
