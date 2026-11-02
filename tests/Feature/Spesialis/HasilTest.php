<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist results form', function () {
    $this->get('/spesialis/hasil/7')->assertRedirect(route('login'));
});

test('specialists can open the results form', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/hasil/7')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/hasil')
            ->where('konsultasiId', 7));
});

test('users with other roles cannot open the specialist results form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/hasil/7')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);

test('the results form requires a numeric consultation id', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/hasil/abc')
        ->assertNotFound();
});
