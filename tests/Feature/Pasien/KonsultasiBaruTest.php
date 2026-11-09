<?php

use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the new consultation page', function () {
    $this->get('/pasien/konsultasi/baru')->assertRedirect(route('login'));
});

test('patients can view the new consultation page with a preselected schedule', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));

    $pasien = User::factory()->create(['role' => 'pasien']);
    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '09:30:00',
        'jam_selesai' => '10:00:00',
        'status' => 'tersedia',
    ]);

    $this->actingAs($pasien)
        ->get("/pasien/konsultasi/baru?dokter={$dokter->id}&jadwal=09.30")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-baru')
            ->where('dokterAwal', $dokter->id)
            ->where('jadwalAwal', '09.30')
            ->has('dokter', 1)
            ->where('dokter.0.nama', 'dr. Ayu Lestari, Sp.A')
            ->where('dokter.0.slots', ['09.30']));

    Carbon::setTestNow();
});

test('users with other roles cannot view the new consultation page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/baru')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
