<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the consultation detail page', function () {
    $this->get('/pasien/konsultasi/1')->assertRedirect(route('login'));
});

test('patients can view a consultation detail page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/konsultasi/2')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-detail')
            ->where('konsultasiId', 2));
});

test('consultation detail requires a numeric id', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/konsultasi/tidak-valid')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/1')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
