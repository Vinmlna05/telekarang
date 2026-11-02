<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient directory', function () {
    $this->get('/perawat/pasien')->assertRedirect(route('login'));
});

test('nurses can view the patient directory', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/pasien')
            ->where('ringkasan.total', 10)
            ->where('ringkasan.punyaAkun', 6)
            ->where('ringkasan.tanpaAkun', 4)
            ->has('pasien', 10)
            ->where('pasien.0.nama', 'Siti Rahmawati')
            ->where('pasien.2.punyaAkun', false));
});

test('users with other roles cannot view the patient directory', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/pasien')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
