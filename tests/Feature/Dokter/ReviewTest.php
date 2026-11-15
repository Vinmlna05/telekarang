<?php

use App\Models\Konsultasi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the doctor review list', function () {
    $this->get('/dokter/review')->assertRedirect(route('login'));
});

test('general practitioners can view the screening review list', function () {
    $dokter = User::factory()->create(['role' => 'dokter_umum']);
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Nur Aini']);

    $merah = konsultasiUji($pasien, ['status' => 'SKRINING_SELESAI', 'keluhan' => 'Sesak berat sejak pagi.']);
    skriningUji($merah, $perawat, ['spo2' => 90, 'tanda_bahaya' => true, 'prioritas' => 'darurat']);

    $rutin = konsultasiUji($pasien, ['status' => 'SKRINING_SELESAI', 'keluhan' => 'Demam sejak kemarin.']);
    skriningUji($rutin, $perawat);

    $sudahDiputuskan = konsultasiUji($pasien, [
        'status' => 'MENUNGGU_SPESIALIS',
        'keputusan_dokter' => Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
    ]);

    $this->actingAs($dokter)
        ->get('/dokter/review')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dokter/review')
            ->where('ringkasan.menungguReview', 2)
            ->where('ringkasan.triaseMerah', 1)
            ->where('ringkasan.dikirimKeSpesialis', 1)
            ->has('skrining', 2)
            ->where('skrining.0.id', $merah->id)
            ->where('skrining.0.prioritas', 'merah')
            ->where('skrining.0.status', 'SKRINING_SELESAI')
            ->has('riwayat', 1)
            ->where('riwayat.0.id', $sudahDiputuskan->id));
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
