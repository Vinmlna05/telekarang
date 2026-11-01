<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient schedule page', function () {
    $this->get('/pasien/jadwal')->assertRedirect(route('login'));
});

test('patients can view the specialist schedule page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/jadwal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pasien/jadwal'));
});

test('users with other roles cannot view the patient schedule page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/jadwal')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
