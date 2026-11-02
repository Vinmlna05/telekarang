<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the follow-up page', function () {
    $this->get('/perawat/tindak-lanjut/1')->assertRedirect(route('login'));
});

test('nurses can view a consultation follow-up page', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/tindak-lanjut/1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/tindak-lanjut')
            ->where('konsultasiId', 1));
});

test('the follow-up route requires a numeric consultation id', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/tindak-lanjut/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation follow-up page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/tindak-lanjut/1')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
