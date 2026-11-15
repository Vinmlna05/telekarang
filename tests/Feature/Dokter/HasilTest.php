<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the consultation result page', function () {
    $this->get('/dokter/hasil/1')->assertRedirect(route('login'));
});

test('general practitioners can view a consultation result page', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Yusuf Maulana']);
    $konsultasi = konsultasiUji($pasien, ['status' => 'SELESAI', 'mode' => 'video']);
    skriningUji($konsultasi, $perawat);
    icdUji(['kode' => 'A09', 'nama_diagnosis' => 'Diare akut']);
    hasilUji($konsultasi, [
        'icd10_kode' => 'A09',
        'saran' => 'Rehidrasi oral dan pantau tanda dehidrasi.',
        'keputusan_rujuk' => false,
    ]);

    $this->actingAs($dokter)
        ->get("/dokter/hasil/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/hasil')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.status', 'SELESAI')
            ->where('pasien.nama', 'Yusuf Maulana')
            ->where('hasil.icd10Kode', 'A09')
            ->where('hasil.icd10Nama', 'Diare akut')
            ->where('hasil.keputusanRujuk', false));
});

test('a referral without specialist result shows an empty result', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'DIRUJUK', 'catatan_dokter' => 'Perlu evaluasi di RS']);

    $this->actingAs($dokter)
        ->get("/dokter/hasil/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/hasil')
            ->where('konsultasi.status', 'DIRUJUK')
            ->where('hasil', null));
});

test('the consultation result route requires a numeric consultation id', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/hasil/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation result page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/dokter/hasil/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
