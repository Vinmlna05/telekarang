<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the consultation detail page', function () {
    $this->get('/perawat/konsultasi/7')->assertRedirect(route('login'));
});

test('nurses can view a consultation detail page', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/7')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-detail')
            ->where('konsultasiId', 7));
});

test('the consultation detail route requires a numeric id', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('perawat/konsultasi-baru'));
});

test('users with other roles cannot view a consultation detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/konsultasi/7')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
