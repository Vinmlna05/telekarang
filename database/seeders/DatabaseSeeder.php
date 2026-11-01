<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        User::factory()->create([
            'name' => 'Perawat Sari',
            'email' => 'perawat@telekarang.test',
            'role' => 'perawat',
        ]);

        User::factory()->create([
            'name' => 'dr. Budi Santoso',
            'email' => 'dokter@telekarang.test',
            'role' => 'dokter_umum',
        ]);

        User::factory()->create([
            'name' => 'dr. Ayu Lestari, Sp.A',
            'email' => 'spesialis@telekarang.test',
            'role' => 'spesialis',
        ]);

        User::factory()->create([
            'name' => 'Reiki Admin',
            'email' => 'reiki@gmail.com',
            'password' => '12345678',
            'role' => 'admin',
        ]);
    }
}
