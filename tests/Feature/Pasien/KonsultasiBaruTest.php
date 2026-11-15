<?php

use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pasien;
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

test('patients can store a new consultation request and it enters the screening queue', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));

    $pasienUser = User::factory()->create(['role' => 'pasien', 'name' => 'Aisyah Rahmawati']);
    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $jadwal = Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '09:30:00',
        'jam_selesai' => '10:00:00',
        'status' => 'tersedia',
    ]);

    $this->actingAs($pasienUser)
        ->post('/pasien/konsultasi', [
            'dokter' => $dokter->id,
            'slot' => '09.30',
            'hari' => 'Senin',
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'durasi' => '1–3 hari',
            'persetujuan' => true,
        ])
        ->assertRedirect(route('pasien.beranda'))
        ->assertSessionHas('success');

    $pasien = Pasien::query()->where('user_id', $pasienUser->id)->firstOrFail();
    $konsultasi = Konsultasi::query()->where('pasien_id', $pasien->id)->firstOrFail();

    expect($konsultasi->status)->toBe('MENUNGGU_SKRINING')
        ->and($konsultasi->dokter_spesialis_id)->toBe($dokter->id)
        ->and($konsultasi->dibuat_oleh)->toBe($pasienUser->id)
        ->and($konsultasi->jadwal_id)->toBe($jadwal->id)
        ->and($konsultasi->tanggal->format('Y-m-d H:i'))->toBe('2026-11-09 09:30')
        ->and($konsultasi->keluhan)->toContain('dialami 1–3 hari');

    Carbon::setTestNow();
});

test('the stored schedule follows the chosen day when the same time repeats on another day', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-15 08:00:00'));

    $pasienUser = User::factory()->create(['role' => 'pasien']);
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
        'hari' => 'Rabu',
        'jam_mulai' => '09:30:00',
        'jam_selesai' => '10:00:00',
        'status' => 'tersedia',
    ]);

    $senin = Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '09:30:00',
        'jam_selesai' => '10:00:00',
        'status' => 'tersedia',
    ]);

    $this->actingAs($pasienUser)
        ->post('/pasien/konsultasi', [
            'dokter' => $dokter->id,
            'slot' => '09.30',
            'hari' => 'Senin',
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'persetujuan' => true,
        ])
        ->assertRedirect(route('pasien.beranda'));

    $konsultasi = Konsultasi::query()->firstOrFail();

    expect($konsultasi->jadwal_id)->toBe($senin->id)
        ->and($konsultasi->tanggal->format('Y-m-d H:i'))->toBe('2026-11-16 09:30');

    Carbon::setTestNow();
});

test('a slot without a matching schedule on the chosen day is rejected', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-15 08:00:00'));

    $pasienUser = User::factory()->create(['role' => 'pasien']);
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

    $this->actingAs($pasienUser)
        ->post('/pasien/konsultasi', [
            'dokter' => $dokter->id,
            'slot' => '09.30',
            'hari' => 'Kamis',
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'persetujuan' => true,
        ])
        ->assertSessionHasErrors('slot');

    $this->assertDatabaseCount('konsultasi', 0);

    Carbon::setTestNow();
});

test('the consultation request is validated before storage', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->post('/pasien/konsultasi', [
            'dokter' => 999,
            'slot' => 'sembarang',
            'hari' => 'Sembarang',
            'keluhan' => 'pendek',
            'persetujuan' => false,
        ])
        ->assertSessionHasErrors(['dokter', 'slot', 'hari', 'keluhan', 'persetujuan']);

    $this->assertDatabaseCount('konsultasi', 0);
});

test('users with other roles cannot create a consultation request', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'dokter' => 1,
            'slot' => '09.30',
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'persetujuan' => true,
        ])
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot view the new consultation page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/baru')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
