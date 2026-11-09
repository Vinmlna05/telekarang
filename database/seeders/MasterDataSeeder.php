<?php

namespace Database\Seeders;

use App\Models\Dokter;
use App\Models\Icd10;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterDataSeeder extends Seeder
{
    /**
     * Seed data master dokter dan ICD-10 (seluruhnya fiktif).
     */
    public function run(): void
    {
        $dokter = [
            [
                'email' => 'dokter@telekarang.test',
                'nama' => 'dr. Budi Santoso',
                'role' => 'dokter_umum',
                'peran' => 'umum',
                'spesialisasi' => null,
                'faskes' => 'Puskesmas Pulau Karang',
                'status' => 'aktif',
            ],
            [
                'email' => 'spesialis@telekarang.test',
                'nama' => 'dr. Ayu Lestari, Sp.A',
                'role' => 'spesialis',
                'peran' => 'spesialis',
                'spesialisasi' => 'Anak',
                'faskes' => 'RS Rujukan Daratan',
                'status' => 'aktif',
            ],
            [
                'email' => 'hendra@telekarang.test',
                'nama' => 'dr. Hendra Wijaya, Sp.PD',
                'role' => 'spesialis',
                'peran' => 'spesialis',
                'spesialisasi' => 'Penyakit Dalam',
                'faskes' => 'RS Rujukan Daratan',
                'status' => 'aktif',
            ],
            [
                'email' => 'maya@telekarang.test',
                'nama' => 'dr. Maya Sari, Sp.KK',
                'role' => 'spesialis',
                'peran' => 'spesialis',
                'spesialisasi' => 'Kulit',
                'faskes' => 'RS Rujukan Daratan',
                'status' => 'aktif',
            ],
            [
                'email' => 'rina@telekarang.test',
                'nama' => 'dr. Rina Kartika, Sp.OG',
                'role' => 'spesialis',
                'peran' => 'spesialis',
                'spesialisasi' => null,
                'faskes' => 'RS Rujukan Daratan',
                'status' => 'nonaktif',
            ],
            [
                'email' => 'anton@telekarang.test',
                'nama' => 'dr. Anton Prasetyo',
                'role' => 'dokter_umum',
                'peran' => 'umum',
                'spesialisasi' => null,
                'faskes' => 'Puskesmas Pulau Karang',
                'status' => 'nonaktif',
            ],
        ];

        foreach ($dokter as $data) {
            $user = User::query()->firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['nama'],
                    'role' => $data['role'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            Dokter::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nama' => $data['nama'],
                    'peran' => $data['peran'],
                    'spesialisasi' => $data['spesialisasi'],
                    'faskes' => $data['faskes'],
                    'status' => $data['status'],
                ],
            );
        }

        $icd10 = [
            ['kode' => 'A09', 'nama' => 'Diare dan gastroenteritis', 'pemakaian' => 11],
            ['kode' => 'B34.2', 'nama' => 'Infeksi virus corona, tidak dijelaskan', 'pemakaian' => 3],
            ['kode' => 'E11.9', 'nama' => 'Diabetes melitus tipe 2 tanpa komplikasi', 'pemakaian' => 6],
            ['kode' => 'H10.9', 'nama' => 'Konjungtivitis, tidak dijelaskan', 'pemakaian' => 1],
            ['kode' => 'H66.9', 'nama' => 'Otitis media, tidak dijelaskan', 'pemakaian' => 2],
            ['kode' => 'I10', 'nama' => 'Hipertensi esensial (primer)', 'pemakaian' => 18],
            ['kode' => 'I25.9', 'nama' => 'Penyakit jantung iskemik kronik', 'pemakaian' => 4],
            ['kode' => 'J00', 'nama' => 'Nasofaringitis akut (common cold)', 'pemakaian' => 5],
            ['kode' => 'J06.9', 'nama' => 'Infeksi saluran napas atas akut', 'pemakaian' => 15],
            ['kode' => 'J18.9', 'nama' => 'Pneumonia, tidak dijelaskan', 'pemakaian' => 3],
            ['kode' => 'J45.9', 'nama' => 'Asma, tidak dijelaskan', 'pemakaian' => 2],
            ['kode' => 'K02.9', 'nama' => 'Karies gigi, tidak dijelaskan', 'pemakaian' => 1],
            ['kode' => 'K29.7', 'nama' => 'Gastritis, tidak dijelaskan', 'pemakaian' => 7],
            ['kode' => 'L30.9', 'nama' => 'Dermatitis, tidak dijelaskan', 'pemakaian' => 9],
            ['kode' => 'M54.5', 'nama' => 'Nyeri punggung bawah', 'pemakaian' => 4],
            ['kode' => 'N39.0', 'nama' => 'Infeksi saluran kemih, lokasi tidak dijelaskan', 'pemakaian' => 6],
            ['kode' => 'O80', 'nama' => 'Persalinan tunggal spontan', 'pemakaian' => 0],
            ['kode' => 'R05', 'nama' => 'Batuk', 'pemakaian' => 2],
            ['kode' => 'R50.9', 'nama' => 'Demam, tidak dijelaskan', 'pemakaian' => 7],
            ['kode' => 'R51', 'nama' => 'Sakit kepala', 'pemakaian' => 3],
            ['kode' => 'S93.4', 'nama' => 'Terkilir pergelangan kaki', 'pemakaian' => 0],
            ['kode' => 'Z00.0', 'nama' => 'Pemeriksaan kesehatan umum', 'pemakaian' => 0],
        ];

        foreach ($icd10 as $item) {
            Icd10::query()->updateOrCreate(
                ['kode' => $item['kode']],
                [
                    'nama_diagnosis' => $item['nama'],
                    'pemakaian' => $item['pemakaian'],
                ],
            );
        }
    }
}
