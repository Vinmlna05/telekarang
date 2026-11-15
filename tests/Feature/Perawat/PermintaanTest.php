<?php

use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function buatPermintaan(array $attributes = []): Konsultasi
{
    $pasienUser = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $attributes['nama'] ?? 'Aisyah Rahmawati',
        'nik' => $attributes['nik'] ?? '9101010101010001',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
    ]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $konsultasi = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dibuat_oleh' => $pasienUser->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => $attributes['status'] ?? 'MENUNGGU_SKRINING',
        'keluhan' => $attributes['keluhan'] ?? 'Demam dan batuk berdahak sejak tiga hari.',
        'tanggal' => $attributes['tanggal'] ?? now(),
    ]);

    $waktuMasuk = $attributes['created_at'] ?? $attributes['tanggal'] ?? now();
    $konsultasi->forceFill(['created_at' => $waktuMasuk, 'updated_at' => $waktuMasuk])->save();

    return $konsultasi;
}

test('guests are redirected from the nurse request list', function () {
    $this->get('/perawat/permintaan')->assertRedirect(route('login'));
});

test('nurses see incoming requests from the database', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $merah = buatPermintaan([
        'keluhan' => 'Sesak berat dan nyeri dada sejak pagi.',
        'tanggal' => now()->subMinutes(5),
    ]);

    buatPermintaan([
        'nik' => '9101010101010002',
        'status' => 'MENUNGGU_SKRINING',
        'tanggal' => now()->subMinutes(4),
    ]);

    $selesai = buatPermintaan([
        'nik' => '9101010101010003',
        'status' => 'SKRINING_SELESAI',
        'tanggal' => now()->subMinutes(3),
    ]);

    Skrining::query()->create([
        'konsultasi_id' => $selesai->id,
        'perawat_id' => $perawat->id,
        'berat' => 50,
        'tinggi' => 150,
        'sistol' => 120,
        'diastol' => 80,
        'suhu' => 39.9,
        'nadi' => 90,
        'spo2' => 91,
        'tanda_bahaya' => true,
        'prioritas' => 'sedang',
        'catatan' => 'Pasien tampak lemas.',
        'waktu' => now(),
    ]);

    buatPermintaan([
        'nik' => '9101010101010004',
        'status' => 'MENUNGGU_SPESIALIS',
        'tanggal' => now()->subMinutes(2),
    ]);

    buatPermintaan([
        'nik' => '9101010101010005',
        'status' => 'KEDALUWARSA',
        'tanggal' => now()->subMinutes(1),
    ]);

    $this->actingAs($perawat)
        ->get('/perawat/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/permintaan')
            ->where('ringkasan.total', 5)
            ->where('ringkasan.menungguSkrining', 2)
            ->where('ringkasan.skriningSelesai', 1)
            ->where('ringkasan.menungguSpesialis', 1)
            ->where('ringkasan.kedaluwarsa', 1)
            ->where('ringkasan.prioritasDarurat', 1)
            ->has('permintaan', 5)
            ->where('permintaan.0.status', 'KEDALUWARSA')
            ->where('permintaan.0.sumber', 'Akun pasien')
            ->where('permintaan.2.id', $selesai->id)
            ->where('permintaan.2.prioritas', 'sedang')
            ->where('permintaan.4.id', $merah->id)
            ->where('permintaan.4.prioritas', 'darurat'));
});

test('users with other roles cannot view the nurse request list', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/permintaan')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
