<?php

namespace Database\Seeders;

use App\Models\Konsultasi;
use App\Models\Skrining;
use App\Models\User;
use Illuminate\Database\Seeder;

class SkriningSeeder extends Seeder
{
    public function run(): void
    {
        $perawat = User::query()->where('email', 'perawat@telekarang.test')->first();

        $data = [
            'Aisyah Rahmawati' => [
                'berat' => 58,
                'tinggi' => 158,
                'sistol' => 110,
                'diastol' => 70,
                'suhu' => 37.8,
                'nadi' => 92,
                'spo2' => 97,
                'tanda_bahaya' => false,
                'catatan' => 'Pasien sadar, tidak sesak, dan masih mau makan serta minum.',
            ],
            'Salim Abdullah' => [
                'berat' => 68,
                'tinggi' => 164,
                'sistol' => 150,
                'diastol' => 95,
                'suhu' => 36.8,
                'nadi' => 88,
                'spo2' => 98,
                'tanda_bahaya' => false,
                'catatan' => 'Tekanan darah diukur ulang setelah lima menit istirahat. Tidak ada nyeri dada.',
            ],
            'Nur Aini' => [
                'berat' => 20,
                'tinggi' => 112,
                'sistol' => 100,
                'diastol' => 64,
                'suhu' => 38.9,
                'nadi' => 118,
                'spo2' => 91,
                'tanda_bahaya' => true,
                'catatan' => 'Anak tampak lemas dan sesak. Saturasi oksigen rendah, perlu evaluasi segera.',
            ],
            'Fatimah Zahra' => [
                'berat' => 55,
                'tinggi' => 155,
                'sistol' => 118,
                'diastol' => 76,
                'suhu' => 36.9,
                'nadi' => 84,
                'spo2' => 98,
                'tanda_bahaya' => false,
                'catatan' => 'Ruam kering di lipatan lengan, tidak ada tanda infeksi berat.',
            ],
            'Yusuf Maulana' => [
                'berat' => 70,
                'tinggi' => 168,
                'sistol' => 112,
                'diastol' => 72,
                'suhu' => 37.6,
                'nadi' => 96,
                'spo2' => 98,
                'tanda_bahaya' => false,
                'catatan' => 'Pasien masih aktif, turgor kulit baik, dan tidak ada darah pada tinja.',
            ],
            'Halimah Sadiah' => [
                'berat' => 60,
                'tinggi' => 152,
                'sistol' => 130,
                'diastol' => 80,
                'suhu' => 38.4,
                'nadi' => 100,
                'spo2' => 97,
                'tanda_bahaya' => false,
                'catatan' => 'Demam naik turun, pasien sadar dan tidak ada tanda dehidrasi.',
            ],
            'Rahman Hidayat' => [
                'berat' => 75,
                'tinggi' => 170,
                'sistol' => 120,
                'diastol' => 78,
                'suhu' => 38.2,
                'nadi' => 102,
                'spo2' => 97,
                'tanda_bahaya' => false,
                'catatan' => 'Luka kaki tampak kotor dengan sedikit nanah, belum ada tanda syok.',
            ],
        ];

        foreach ($data as $nama => $nilai) {
            $konsultasi = Konsultasi::query()
                ->whereHas('pasien', fn ($query) => $query->where('nama', $nama))
                ->firstOrFail();

            Skrining::query()->updateOrCreate(
                ['konsultasi_id' => $konsultasi->id],
                [
                    ...$nilai,
                    'perawat_id' => $perawat?->id,
                    'waktu' => (clone $konsultasi->tanggal)->addMinutes(30),
                ],
            );
        }
    }
}
