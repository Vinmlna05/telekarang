<?php

use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient schedule page', function () {
    $this->get('/pasien/jadwal')->assertRedirect(route('login'));
});

test('patients can view the specialist schedule from master data', function () {
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
    Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '10:00:00',
        'jam_selesai' => '10:30:00',
        'status' => 'tersedia',
    ]);
    Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '10:30:00',
        'jam_selesai' => '11:00:00',
        'status' => 'terisi',
    ]);

    $nonaktifUser = User::factory()->create(['role' => 'spesialis']);
    $nonaktif = Dokter::query()->create([
        'user_id' => $nonaktifUser->id,
        'nama' => 'dr. Nonaktif, Sp.PD',
        'peran' => 'spesialis',
        'spesialisasi' => 'Penyakit Dalam',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'nonaktif',
    ]);

    Jadwal::query()->create([
        'dokter_id' => $nonaktif->id,
        'hari' => 'Selasa',
        'jam_mulai' => '10:00:00',
        'jam_selesai' => '10:30:00',
        'status' => 'tersedia',
    ]);

    $this->actingAs($pasien)
        ->get('/pasien/jadwal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/jadwal')
            ->has('dokter', 1)
            ->where('dokter.0.nama', 'dr. Ayu Lestari, Sp.A')
            ->where('dokter.0.spesialisasi', 'Anak')
            ->where('dokter.0.status', 'tersedia')
            ->where('dokter.0.hari.0', 'Senin')
            ->where('dokter.0.hariTerdekat', 'Senin')
            ->where('dokter.0.slotTerdekat', '09.30')
            ->where('dokter.0.slots', ['09.30', '10.00'])
            ->where('dokter.0.jam', '09.30–11.00 WIT'));

    Carbon::setTestNow();
});

test('doctors without available slots are reported with the right status', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));

    $pasien = User::factory()->create(['role' => 'pasien']);
    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Penuh, Sp.KK',
        'peran' => 'spesialis',
        'spesialisasi' => 'Kulit',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Jumat',
        'jam_mulai' => '08:30:00',
        'jam_selesai' => '09:00:00',
        'status' => 'terisi',
    ]);

    $this->actingAs($pasien)
        ->get('/pasien/jadwal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/jadwal')
            ->where('dokter.0.status', 'terisi')
            ->where('dokter.0.slots', [])
            ->where('dokter.0.slotTerdekat', '08.30'));

    Carbon::setTestNow();
});

test('users with other roles cannot view the patient schedule page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/jadwal')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
