<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the screening form', function () {
    $this->get('/perawat/skrining/1')->assertRedirect(route('login'));
});

test('nurses can view the screening form for a request', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/skrining/1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/skrining')
            ->where('konsultasiId', 1)
            ->where('pasien.nama', 'Siti Rahmawati')
            ->where('pasien.status', 'MENUNGGU_SKRINING')
            ->where('nilaiAwal.berat', '')
            ->where('nilaiAwal.catatan', ''));
});

test('a completed screening is prefilled with previous values', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/skrining/5')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/skrining')
            ->where('pasien.status', 'SKRINING_SELESAI')
            ->where('nilaiAwal.berat', '20')
            ->where('nilaiAwal.suhu', '38.9'));
});

test('the screening route requires a numeric consultation id', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/skrining/tidak-valid')
        ->assertNotFound();
});

test('users with other roles cannot view the screening form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/skrining/1')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
