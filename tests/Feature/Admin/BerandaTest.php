<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin beranda', function () {
    $this->get('/admin')->assertRedirect(route('login'));
});

test('admins can view statistics for the current month by default', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/beranda')
            ->where('periode', 'bulan')
            ->where('ringkasan.totalKonsultasi', 95)
            ->where('ringkasan.rujukanTerhindarkan', 38)
            ->where('ringkasan.rujukanDilakukan', 12)
            ->where('ringkasan.persentase', 40)
            ->where('ringkasan.biayaHemat', 32300000)
            ->where('ringkasan.jamHemat', 228)
            ->where('ringkasan.video', 54)
            ->where('ringkasan.teks', 41)
            ->has('tren', 4)
            ->has('diagnosis', 5)
            ->has('spesialisasi', 5)
            ->where('diagnosis.0.kode', 'I10'));
});

test('admins can filter statistics by year', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin?periode=tahun')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'tahun')
            ->where('ringkasan.totalKonsultasi', 1024)
            ->where('ringkasan.rujukanTerhindarkan', 402)
            ->has('tren', 12)
            ->where('tren.0.label', 'Jan'));
});

test('an unknown period falls back to the current month', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin?periode=harian')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'bulan')
            ->where('ringkasan.totalKonsultasi', 95));
});

test('users with other roles cannot view the admin beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
