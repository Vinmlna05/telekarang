<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist request list', function () {
    $this->get('/spesialis/permintaan')->assertRedirect(route('login'));
});

test('specialists can view the request list', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('spesialis/permintaan'));
});

test('users with other roles cannot view the specialist request list', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/permintaan')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
