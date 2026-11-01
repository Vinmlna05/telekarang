<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the doctor review list', function () {
    $this->get('/dokter/review')->assertRedirect(route('login'));
});

test('general practitioners can view the screening review list', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/review')
            ->where('ringkasan.menungguReview', 4)
            ->where('ringkasan.triaseMerah', 1)
            ->has('skrining', 4)
            ->where('skrining.0.prioritas', 'merah')
            ->where('skrining.0.status', 'SKRINING_SELESAI'));
});

test('the doctor landing page redirects to the review list', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($dokter)
        ->get('/dokter')
        ->assertRedirect(route('dokter.review'));
});

test('users with other roles cannot view the doctor review list', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/dokter/review')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
