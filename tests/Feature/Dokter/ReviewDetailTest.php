<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the doctor review detail page', function () {
    $this->get('/dokter/review/1')->assertRedirect(route('login'));
});

test('general practitioners can view a patient review detail page', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Aisyah Rahmawati']);
    $konsultasi = konsultasiUji($pasien, ['status' => 'SKRINING_SELESAI']);
    skriningUji($konsultasi, $perawat, ['sistol' => 130, 'diastol' => 85]);

    $this->actingAs($dokter)
        ->get("/dokter/review/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/review-detail')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.status', 'SKRINING_SELESAI')
            ->where('pasien.nama', 'Aisyah Rahmawati')
            ->where('skrining.sistol', 130)
            ->where('skrining.diastol', 85));
});

test('requests that have not been screened cannot be reviewed', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'MENUNGGU_SKRINING']);

    $this->actingAs($dokter)
        ->get("/dokter/review/{$konsultasi->id}")
        ->assertNotFound();
});

test('the doctor review detail route requires a numeric consultation id', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/review/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a patient review detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/dokter/review/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
