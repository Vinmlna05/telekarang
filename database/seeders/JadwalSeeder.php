<?php

namespace Database\Seeders;

use App\Models\Dokter;
use App\Models\Jadwal;
use Illuminate\Database\Seeder;

class JadwalSeeder extends Seeder
{
    /**
     * Seed slot jadwal praktik dokter spesialis (seluruhnya fiktif).
     */
    public function run(): void
    {
        $jadwal = [
            // dr. Ayu Lestari, Sp.A — Senin
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Senin', 'mulai' => '09:30:00', 'selesai' => '10:00:00', 'status' => 'tersedia'],
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Senin', 'mulai' => '10:00:00', 'selesai' => '10:30:00', 'status' => 'tersedia'],
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Senin', 'mulai' => '10:30:00', 'selesai' => '11:00:00', 'status' => 'terisi'],
            // dr. Ayu Lestari, Sp.A — Rabu
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Rabu', 'mulai' => '09:30:00', 'selesai' => '10:00:00', 'status' => 'tersedia'],
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Rabu', 'mulai' => '10:00:00', 'selesai' => '10:30:00', 'status' => 'tersedia'],
            ['email' => 'spesialis@telekarang.test', 'hari' => 'Rabu', 'mulai' => '10:30:00', 'selesai' => '11:00:00', 'status' => 'tersedia'],

            // dr. Hendra Wijaya, Sp.PD — Selasa
            ['email' => 'hendra@telekarang.test', 'hari' => 'Selasa', 'mulai' => '10:00:00', 'selesai' => '10:30:00', 'status' => 'tersedia'],
            ['email' => 'hendra@telekarang.test', 'hari' => 'Selasa', 'mulai' => '11:00:00', 'selesai' => '11:30:00', 'status' => 'terisi'],
            ['email' => 'hendra@telekarang.test', 'hari' => 'Selasa', 'mulai' => '12:30:00', 'selesai' => '13:00:00', 'status' => 'tersedia'],
            // dr. Hendra Wijaya, Sp.PD — Kamis
            ['email' => 'hendra@telekarang.test', 'hari' => 'Kamis', 'mulai' => '10:00:00', 'selesai' => '10:30:00', 'status' => 'tersedia'],
            ['email' => 'hendra@telekarang.test', 'hari' => 'Kamis', 'mulai' => '11:00:00', 'selesai' => '11:30:00', 'status' => 'tersedia'],
            ['email' => 'hendra@telekarang.test', 'hari' => 'Kamis', 'mulai' => '12:30:00', 'selesai' => '13:00:00', 'status' => 'tersedia'],

            // dr. Maya Sari, Sp.KK — Jumat
            ['email' => 'maya@telekarang.test', 'hari' => 'Jumat', 'mulai' => '08:30:00', 'selesai' => '09:00:00', 'status' => 'tersedia'],
            ['email' => 'maya@telekarang.test', 'hari' => 'Jumat', 'mulai' => '09:00:00', 'selesai' => '09:30:00', 'status' => 'tersedia'],
        ];

        $dokterPerEmail = Dokter::query()
            ->whereHas('user', fn ($query) => $query->whereIn('email', array_column($jadwal, 'email')))
            ->with('user')
            ->get()
            ->keyBy(fn (Dokter $dokter) => $dokter->user->email);

        foreach ($jadwal as $slot) {
            $dokter = $dokterPerEmail->get($slot['email']);

            if ($dokter === null) {
                continue;
            }

            Jadwal::query()->updateOrCreate(
                [
                    'dokter_id' => $dokter->id,
                    'hari' => $slot['hari'],
                    'jam_mulai' => $slot['mulai'],
                ],
                [
                    'jam_selesai' => $slot['selesai'],
                    'status' => $slot['status'],
                ],
            );
        }
    }
}
