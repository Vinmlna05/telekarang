<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the consultation result page', function () {
    $this->get('/dokter/hasil/1')->assertRedirect(route('login'));
});

test('general practitioners can view a consultation result page', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/hasil/1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/hasil')
            ->where('konsultasiId', 1));
});

test('the consultation result route requires a numeric consultation id', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/hasil/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation result page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/dokter/hasil/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
