<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the new consultation form', function () {
    $this->get('/perawat/konsultasi/baru')->assertRedirect(route('login'));
});

test('nurses can view the new consultation form', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->has('pasien', 8)
            ->where('pasien.0.nama', 'Siti Rahmawati')
            ->where('pasien.2.punyaAkun', false));
});

test('users with other roles cannot view the new consultation form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/konsultasi/baru')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
