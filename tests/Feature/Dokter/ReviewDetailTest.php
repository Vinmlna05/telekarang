<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the doctor review detail page', function () {
    $this->get('/dokter/review/1')->assertRedirect(route('login'));
});

test('general practitioners can view a patient review detail page', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/review/1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/review-detail')
            ->where('konsultasiId', 1));
});

test('the doctor review detail route requires a numeric consultation id', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/review/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a patient review detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/dokter/review/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
