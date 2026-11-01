<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient profile page', function () {
    $this->get('/pasien/profil')->assertRedirect(route('login'));
});

test('patients can view their profile page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/profil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pasien/profil'));
});

test('users with other roles cannot view the patient profile page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/profil')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
