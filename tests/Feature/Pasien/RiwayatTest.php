<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient history page', function () {
    $this->get('/pasien/riwayat')->assertRedirect(route('login'));
});

test('patients can view their consultation history', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/riwayat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pasien/riwayat'));
});

test('users with other roles cannot view the patient history page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/riwayat')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
