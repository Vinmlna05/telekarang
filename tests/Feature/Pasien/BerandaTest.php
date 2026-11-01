<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient beranda', function () {
    $this->get('/pasien')->assertRedirect(route('login'));
});

test('patients can view the beranda with active consultation data', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/beranda')
            ->where('konsultasiAktif.status', 'MENUNGGU_SKRINING')
            ->has('dokter', 3)
            ->has('riwayat', 1)
            ->where('ringkasan.rujukanTerhindarkan', 2));
});

test('users with other roles cannot view the patient beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
