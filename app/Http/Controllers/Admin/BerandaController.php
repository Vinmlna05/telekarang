<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    /**
     * Dasbor statistik admin: konsultasi, rujukan terhindarkan, dan penghematan.
     */
    public function __invoke(Request $request): Response
    {
        $periode = $request->string('periode')->toString();

        if (! in_array($periode, ['minggu', 'bulan', 'tahun'], true)) {
            $periode = 'bulan';
        }

        $data = $this->dataPeriode();

        return Inertia::render('admin/beranda', [
            'periode' => $periode,
            ...$data[$periode],
        ]);
    }

    /**
     * Data demo fiktif per periode. Angka konsisten agar dapat didemokan.
     *
     * @return array<string, array<string, mixed>>
     */
    private function dataPeriode(): array
    {
        return [
            'minggu' => [
                'ringkasan' => [
                    'totalKonsultasi' => 24,
                    'rujukanTerhindarkan' => 10,
                    'rujukanDilakukan' => 3,
                    'persentase' => 42,
                    'biayaHemat' => 8500000,
                    'jamHemat' => 60,
                    'rataWaktuTunggu' => 2.1,
                    'video' => 14,
                    'teks' => 10,
                ],
                'tren' => [
                    ['label' => 'Sen', 'konsultasi' => 4],
                    ['label' => 'Sel', 'konsultasi' => 3],
                    ['label' => 'Rab', 'konsultasi' => 5],
                    ['label' => 'Kam', 'konsultasi' => 2],
                    ['label' => 'Jum', 'konsultasi' => 4],
                    ['label' => 'Sab', 'konsultasi' => 3],
                    ['label' => 'Min', 'konsultasi' => 3],
                ],
                'diagnosis' => [
                    ['kode' => 'I10', 'nama' => 'Hipertensi esensial', 'jumlah' => 5],
                    ['kode' => 'J06.9', 'nama' => 'ISPA akut', 'jumlah' => 4],
                    ['kode' => 'A09', 'nama' => 'Diare dan gastroenteritis', 'jumlah' => 3],
                    ['kode' => 'L30.9', 'nama' => 'Dermatitis', 'jumlah' => 2],
                    ['kode' => 'R50.9', 'nama' => 'Demam tidak spesifik', 'jumlah' => 2],
                ],
                'spesialisasi' => [
                    ['nama' => 'Anak', 'jumlah' => 8],
                    ['nama' => 'Penyakit Dalam', 'jumlah' => 7],
                    ['nama' => 'Kulit', 'jumlah' => 4],
                    ['nama' => 'Kandungan', 'jumlah' => 3],
                    ['nama' => 'Lainnya', 'jumlah' => 2],
                ],
            ],
            'bulan' => [
                'ringkasan' => [
                    'totalKonsultasi' => 95,
                    'rujukanTerhindarkan' => 38,
                    'rujukanDilakukan' => 12,
                    'persentase' => 40,
                    'biayaHemat' => 32300000,
                    'jamHemat' => 228,
                    'rataWaktuTunggu' => 2.4,
                    'video' => 54,
                    'teks' => 41,
                ],
                'tren' => [
                    ['label' => 'Minggu 1', 'konsultasi' => 21],
                    ['label' => 'Minggu 2', 'konsultasi' => 24],
                    ['label' => 'Minggu 3', 'konsultasi' => 26],
                    ['label' => 'Minggu 4', 'konsultasi' => 24],
                ],
                'diagnosis' => [
                    ['kode' => 'I10', 'nama' => 'Hipertensi esensial', 'jumlah' => 18],
                    ['kode' => 'J06.9', 'nama' => 'ISPA akut', 'jumlah' => 15],
                    ['kode' => 'A09', 'nama' => 'Diare dan gastroenteritis', 'jumlah' => 11],
                    ['kode' => 'L30.9', 'nama' => 'Dermatitis', 'jumlah' => 9],
                    ['kode' => 'R50.9', 'nama' => 'Demam tidak spesifik', 'jumlah' => 7],
                ],
                'spesialisasi' => [
                    ['nama' => 'Anak', 'jumlah' => 30],
                    ['nama' => 'Penyakit Dalam', 'jumlah' => 28],
                    ['nama' => 'Kulit', 'jumlah' => 17],
                    ['nama' => 'Kandungan', 'jumlah' => 12],
                    ['nama' => 'Lainnya', 'jumlah' => 8],
                ],
            ],
            'tahun' => [
                'ringkasan' => [
                    'totalKonsultasi' => 1024,
                    'rujukanTerhindarkan' => 402,
                    'rujukanDilakukan' => 118,
                    'persentase' => 39,
                    'biayaHemat' => 341700000,
                    'jamHemat' => 2412,
                    'rataWaktuTunggu' => 2.6,
                    'video' => 590,
                    'teks' => 434,
                ],
                'tren' => [
                    ['label' => 'Jan', 'konsultasi' => 78],
                    ['label' => 'Feb', 'konsultasi' => 82],
                    ['label' => 'Mar', 'konsultasi' => 88],
                    ['label' => 'Apr', 'konsultasi' => 90],
                    ['label' => 'Mei', 'konsultasi' => 85],
                    ['label' => 'Jun', 'konsultasi' => 92],
                    ['label' => 'Jul', 'konsultasi' => 80],
                    ['label' => 'Agu', 'konsultasi' => 84],
                    ['label' => 'Sep', 'konsultasi' => 86],
                    ['label' => 'Okt', 'konsultasi' => 88],
                    ['label' => 'Nov', 'konsultasi' => 90],
                    ['label' => 'Des', 'konsultasi' => 81],
                ],
                'diagnosis' => [
                    ['kode' => 'I10', 'nama' => 'Hipertensi esensial', 'jumlah' => 196],
                    ['kode' => 'J06.9', 'nama' => 'ISPA akut', 'jumlah' => 164],
                    ['kode' => 'A09', 'nama' => 'Diare dan gastroenteritis', 'jumlah' => 121],
                    ['kode' => 'L30.9', 'nama' => 'Dermatitis', 'jumlah' => 98],
                    ['kode' => 'R50.9', 'nama' => 'Demam tidak spesifik', 'jumlah' => 76],
                ],
                'spesialisasi' => [
                    ['nama' => 'Anak', 'jumlah' => 324],
                    ['nama' => 'Penyakit Dalam', 'jumlah' => 302],
                    ['nama' => 'Kulit', 'jumlah' => 184],
                    ['nama' => 'Kandungan', 'jumlah' => 129],
                    ['nama' => 'Lainnya', 'jumlah' => 85],
                ],
            ],
        ];
    }
}
