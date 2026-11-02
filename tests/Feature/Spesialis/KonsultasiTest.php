<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist consultation room', function () {
    $this->get('/spesialis/konsultasi/7')->assertRedirect(route('login'));
});

test('specialists can open the consultation room', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/konsultasi/7')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/konsultasi-detail')
            ->where('konsultasiId', 7));
});

test('users with other roles cannot open the specialist consultation room', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/konsultasi/7')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);

test('the consultation room requires a numeric consultation id', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/konsultasi/abc')
        ->assertNotFound();
});
