<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the new consultation page', function () {
    $this->get('/pasien/konsultasi/baru')->assertRedirect(route('login'));
});

test('patients can view the new consultation page with a preselected schedule', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/konsultasi/baru?dokter=1&jadwal=09.30')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-baru')
            ->where('dokterAwal', 1)
            ->where('jadwalAwal', '09.30'));
});

test('users with other roles cannot view the new consultation page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/baru')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
