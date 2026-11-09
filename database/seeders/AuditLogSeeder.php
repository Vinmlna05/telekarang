<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Database\Seeder;

class AuditLogSeeder extends Seeder
{
    /**
     * Seed riwayat aktivitas fiktif untuk halaman log.
     */
    public function run(): void
    {
        $admin = User::query()->where('role', 'admin')->orderBy('id')->first();
        $perawat = User::query()->where('email', 'perawat@telekarang.test')->first();
        $dokterUmum = User::query()->where('email', 'dokter@telekarang.test')->first();
        $spesialis = User::query()->where('email', 'spesialis@telekarang.test')->first();

        $pasien = Pasien::query()->orderBy('id')->first();
        $dokter = Dokter::query()->orderBy('id')->first();
        $icd10 = Icd10::query()->orderBy('kode')->first();
        $konsultasi = Konsultasi::query()->orderBy('id')->first();

        if ($admin === null) {
            return;
        }

        $entries = [
            [
                'user' => $admin,
                'aksi' => 'login',
                'entitas' => 'sesi',
                'entitas_id' => null,
                'keterangan' => 'Masuk ke sistem.',
                'waktu' => now()->startOfDay()->subDays(2)->setTime(7, 55),
            ],
            [
                'user' => $admin,
                'aksi' => 'membuat',
                'entitas' => 'pengguna',
                'entitas_id' => $perawat?->id,
                'keterangan' => $perawat === null ? null : "Membuat akun {$perawat->name} sebagai Perawat.",
                'waktu' => now()->startOfDay()->subDays(2)->setTime(8, 10),
            ],
            [
                'user' => $admin,
                'aksi' => 'membuat',
                'entitas' => 'dokter',
                'entitas_id' => $dokter?->id,
                'keterangan' => $dokter === null ? null : "Menambahkan profil dokter {$dokter->nama}.",
                'waktu' => now()->startOfDay()->subDays(2)->setTime(8, 30),
            ],
            [
                'user' => $admin,
                'aksi' => 'membuat',
                'entitas' => 'icd10',
                'entitas_id' => $icd10?->kode,
                'keterangan' => $icd10 === null ? null : "Menambahkan kode ICD-10 {$icd10->kode} ({$icd10->nama_diagnosis}).",
                'waktu' => now()->startOfDay()->subDays(1)->setTime(9, 5),
            ],
            [
                'user' => $admin,
                'aksi' => 'mengubah',
                'entitas' => 'icd10',
                'entitas_id' => $icd10?->kode,
                'keterangan' => $icd10 === null ? null : "Memperbarui nama diagnosis {$icd10->kode}.",
                'waktu' => now()->startOfDay()->subDays(1)->setTime(9, 20),
            ],
            [
                'user' => $perawat,
                'aksi' => 'membuat',
                'entitas' => 'pasien',
                'entitas_id' => $pasien?->id,
                'keterangan' => $pasien === null ? null : "Mendaftarkan pasien {$pasien->nama}.",
                'waktu' => now()->startOfDay()->subDays(1)->setTime(10, 0),
            ],
            [
                'user' => $dokterUmum,
                'aksi' => 'mengirim',
                'entitas' => 'konsultasi',
                'entitas_id' => $konsultasi?->id,
                'keterangan' => 'Meneruskan permintaan konsultasi ke dokter spesialis.',
                'waktu' => now()->startOfDay()->subHours(6),
            ],
            [
                'user' => $spesialis,
                'aksi' => 'menyelesaikan',
                'entitas' => 'konsultasi',
                'entitas_id' => $konsultasi?->id,
                'keterangan' => 'Mengisi hasil konsultasi dan keputusan rujuk.',
                'waktu' => now()->startOfDay()->subHours(4),
            ],
        ];

        foreach ($entries as $entry) {
            if ($entry['user'] === null) {
                continue;
            }

            AuditLog::query()->updateOrCreate(
                [
                    'waktu' => $entry['waktu'],
                    'aksi' => $entry['aksi'],
                    'entitas' => $entry['entitas'],
                    'entitas_id' => $entry['entitas_id'],
                ],
                [
                    'user_id' => $entry['user']->id,
                    'keterangan' => $entry['keterangan'],
                ],
            );
        }
    }
}
