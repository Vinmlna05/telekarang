<?php

namespace Database\Seeders;

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Database\Seeder;

class KonsultasiSeeder extends Seeder
{
    /**
     * Seed konsultasi fiktif pada berbagai tahap alur, beserta hasilnya.
     */
    public function run(): void
    {
        $perawat = User::query()->where('email', 'perawat@telekarang.test')->first();
        $dokterUmum = $this->dokter('dokter@telekarang.test');
        $spesialisAnak = $this->dokter('spesialis@telekarang.test');
        $spesialisDalam = $this->dokter('hendra@telekarang.test');
        $spesialisKulit = $this->dokter('maya@telekarang.test');

        $data = [
            [
                'pasien' => 'Aisyah Rahmawati',
                'dokter' => $spesialisAnak,
                'hari' => 0,
                'jam' => '09:10',
                'konfirmasi' => 2.0,
                'mode' => 'video',
                'status' => 'SELESAI',
                'keluhan' => 'Demam dan batuk berdahak sejak tiga hari, nafsu makan menurun.',
                'icd10' => 'J06.9',
                'saran' => 'Istirahat cukup, banyak minum, parasetamol sesuai dosis. Kontrol bila demam menetap.',
                'rujuk' => false,
            ],
            [
                'pasien' => 'Salim Abdullah',
                'dokter' => $spesialisDalam,
                'hari' => 0,
                'jam' => '11:20',
                'konfirmasi' => 1.5,
                'mode' => 'teks',
                'status' => 'SELESAI',
                'keluhan' => 'Tekanan darah tinggi berulang, kadang pusing dan tengkuk kaku.',
                'icd10' => 'I10',
                'saran' => 'Lanjutkan amlodipin, diet rendah garam, pantau tensi pagi dan sore.',
                'rujuk' => false,
            ],
            [
                'pasien' => 'Nur Aini',
                'dokter' => $spesialisAnak,
                'hari' => 1,
                'jam' => '08:45',
                'konfirmasi' => 2.0,
                'mode' => 'video',
                'status' => 'SELESAI',
                'keluhan' => 'Sesak napas dan demam tinggi sejak dua hari, tampak lemas.',
                'icd10' => 'J18.9',
                'saran' => 'Perlu evaluasi foto toraks dan terapi antibiotik intravena di RS rujukan.',
                'rujuk' => true,
                'alasan' => 'Kecurigaan pneumonia dengan tanda distres napas.',
                'biaya' => 1250000,
            ],
            [
                'pasien' => 'Fatimah Zahra',
                'dokter' => $spesialisKulit,
                'hari' => 2,
                'jam' => '13:15',
                'konfirmasi' => 1.0,
                'mode' => 'teks',
                'status' => 'SELESAI',
                'keluhan' => 'Gatal dan ruam kemerahan di lipatan lengan sejak seminggu.',
                'icd10' => 'L30.9',
                'saran' => 'Hindari sabun berpewangi, gunakan pelembap dan krim hidrokortison tipis.',
                'rujuk' => false,
            ],
            [
                'pasien' => 'Yusuf Maulana',
                'dokter' => $spesialisDalam,
                'hari' => 3,
                'jam' => '10:05',
                'konfirmasi' => 2.5,
                'mode' => 'video',
                'status' => 'SELESAI',
                'keluhan' => 'Buang air besar cair lebih dari lima kali sehari sejak kemarin.',
                'icd10' => 'A09',
                'saran' => 'Rehidrasi oral, zinc untuk dewasa, pantau tanda dehidrasi.',
                'rujuk' => false,
            ],
            [
                'pasien' => 'Halimah Sadiah',
                'dokter' => $spesialisAnak,
                'hari' => 5,
                'jam' => '15:30',
                'konfirmasi' => 1.5,
                'mode' => 'teks',
                'status' => 'SELESAI',
                'keluhan' => 'Demam naik turun sejak tiga hari tanpa batuk pilek.',
                'icd10' => 'R50.9',
                'saran' => 'Pantau suhu tiap enam jam, beri cairan, kembali bila demam lebih dari lima hari.',
                'rujuk' => false,
            ],
            [
                'pasien' => 'Rahman Hidayat',
                'dokter' => $spesialisKulit,
                'hari' => 10,
                'jam' => '09:00',
                'konfirmasi' => 2.0,
                'mode' => 'video',
                'status' => 'SELESAI',
                'keluhan' => 'Luka lecet di kaki yang membengkak dan mengeluarkan nanah.',
                'icd10' => 'L30.9',
                'saran' => 'Perlu pemeriksaan langsung dan debridemen di fasilitas rujukan.',
                'rujuk' => true,
                'alasan' => 'Infeksi luka dengan selulitis, memerlukan tindakan langsung.',
                'biaya' => 950000,
            ],
            [
                'pasien' => 'Aminah',
                'dokter' => $spesialisDalam,
                'hari' => 20,
                'jam' => '14:00',
                'konfirmasi' => null,
                'mode' => 'teks',
                'status' => 'KEDALUWARSA',
                'keluhan' => 'Nyeri ulu hati berulang, belum sempat datang untuk skrining.',
                'icd10' => null,
                'saran' => null,
                'rujuk' => false,
            ],
            [
                'pasien' => 'Siti Khadijah',
                'dokter' => null,
                'hari' => 0,
                'jam' => '08:00',
                'konfirmasi' => null,
                'mode' => 'teks',
                'status' => 'SKRINING_SELESAI',
                'keluhan' => 'Pusing berputar sejak dua hari, riwayat tekanan darah rendah.',
                'icd10' => null,
                'saran' => null,
                'rujuk' => false,
            ],
            [
                'pasien' => 'Ibrahim Saleh',
                'dokter' => null,
                'hari' => 1,
                'jam' => '16:00',
                'konfirmasi' => null,
                'mode' => 'teks',
                'status' => 'MENUNGGU_SKRINING',
                'keluhan' => 'Nyeri punggung bawah setelah mengangkat barang di dermaga.',
                'icd10' => null,
                'saran' => null,
                'rujuk' => false,
            ],
        ];

        foreach ($data as $item) {
            $pasien = Pasien::query()->where('nama', $item['pasien'])->firstOrFail();
            [$jam, $menit] = explode(':', $item['jam']);
            $tanggal = now()
                ->subDays($item['hari'])
                ->setTime((int) $jam, (int) $menit);

            $sudahSkrining = ! in_array($item['status'], ['MENUNGGU_SKRINING', 'KEDALUWARSA'], true);

            $konsultasi = Konsultasi::query()->updateOrCreate(
                [
                    'pasien_id' => $pasien->id,
                    'keluhan' => $item['keluhan'],
                ],
                [
                    'dibuat_oleh' => $perawat?->id,
                    'dokter_pengirim_id' => $sudahSkrining ? $dokterUmum->id : null,
                    'dokter_spesialis_id' => $item['dokter']?->id,
                    'mode' => $item['mode'],
                    'status' => $item['status'],
                    'tanggal_skrining' => $sudahSkrining ? $tanggal->copy()->startOfDay() : null,
                    'keputusan_dokter' => $item['icd10'] !== null ? 'KONSULTASI_SPESIALIS' : null,
                    'catatan_dokter' => $item['icd10'] !== null
                        ? 'Skrining lengkap. Diteruskan ke dokter spesialis untuk konfirmasi diagnosis dan terapi.'
                        : null,
                    'diputuskan_oleh' => $item['icd10'] !== null ? $dokterUmum->user_id : null,
                    'diputuskan_pada' => $item['icd10'] !== null ? (clone $tanggal)->addHour() : null,
                    'tanggal' => $item['status'] === 'MENUNGGU_SKRINING' ? null : $tanggal,
                    'dikonfirmasi_pada' => $item['konfirmasi'] === null
                        ? null
                        : (clone $tanggal)->addHours($item['konfirmasi']),
                    'kedaluwarsa_pada' => $item['status'] === 'KEDALUWARSA'
                        ? (clone $tanggal)->addDays(3)
                        : ($item['status'] === 'MENUNGGU_SKRINING' ? now()->endOfDay()->addDays(3) : null),
                ],
            );

            if ($item['icd10'] === null) {
                continue;
            }

            HasilKonsultasi::query()->updateOrCreate(
                ['konsultasi_id' => $konsultasi->id],
                [
                    'icd10_kode' => $item['icd10'],
                    'saran' => $item['saran'],
                    'keputusan_rujuk' => $item['rujuk'],
                    'alasan_rujuk' => $item['alasan'] ?? null,
                    'biaya_rujukan' => $item['biaya'] ?? null,
                    'waktu' => (clone $tanggal)->addHours(($item['konfirmasi'] ?? 0) + 0.5),
                ],
            );
        }
    }

    /**
     * Ambil profil dokter berdasarkan email akun.
     */
    private function dokter(string $email): Dokter
    {
        return Dokter::query()
            ->whereHas('user', fn ($query) => $query->where('email', $email))
            ->firstOrFail();
    }
}
