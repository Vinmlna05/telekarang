<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the nurse request list', function () {
    $this->get('/perawat/permintaan')->assertRedirect(route('login'));
});

test('nurses can view the incoming request list', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/permintaan')
            ->where('ringkasan.total', 9)
            ->where('ringkasan.menungguSkrining', 4)
            ->where('ringkasan.skriningSelesai', 2)
            ->where('ringkasan.menungguSpesialis', 2)
            ->where('ringkasan.kedaluwarsa', 1)
            ->where('ringkasan.prioritasMerah', 2)
            ->has('permintaan', 9)
            ->where('permintaan.1.prioritas', 'merah')
            ->where('permintaan.8.status', 'KEDALUWARSA'));
});

test('users with other roles cannot view the nurse request list', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/permintaan')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
