<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the nurse beranda', function () {
    $this->get('/perawat')->assertRedirect(route('login'));
});

test('nurses can view the beranda with todays screening queue', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/beranda')
            ->where('ringkasan.antreanHariIni', 3)
            ->has('antrean', 3)
            ->has('tindakLanjut', 2)
            ->where('antrean.1.prioritas', 'merah'));
});

test('users with other roles cannot view the nurse beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
