<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist schedule page', function () {
    $this->get('/spesialis/jadwal')->assertRedirect(route('login'));
});

test('specialists can view the schedule page', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($spesialis)
        ->get('/spesialis/jadwal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('spesialis/jadwal'));
});

test('users with other roles cannot view the specialist schedule page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/jadwal')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
