<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist beranda', function () {
    $this->get('/spesialis')->assertRedirect(route('login'));
});

test('specialists can view the beranda with requests and schedule', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/beranda')
            ->where('ringkasan.permintaanBaru', 3)
            ->where('ringkasan.jadwalHariIni', 4)
            ->has('permintaan', 3)
            ->has('jadwal', 4)
            ->has('berlangsung', 1)
            ->where('berlangsung.0.mode', 'teks'));
});

test('users with other roles cannot view the specialist beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
