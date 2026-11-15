<?php

use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests are redirected from the new consultation page', function () {
    $this->get('/pasien/konsultasi/baru')->assertRedirect(route('login'));
});

test('guests cannot submit a consultation request', function () {
    $this->post('/pasien/konsultasi', [])->assertRedirect(route('login'));
});

test('patients can view the new consultation page with available screening dates', function () {
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-baru')
            ->where('tanggalAwal', null)
            ->has('tanggalTersedia', 11)
            ->where('tanggalTersedia.0.value', '2026-11-09')
            ->where('tanggalTersedia.1.value', '2026-11-10')
            ->where('tanggalTersedia.10.value', '2026-11-23'));
});

test('a screening date from the query string is preselected', function () {
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/baru?tanggal=2026-11-11')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-baru')
            ->where('tanggalAwal', '2026-11-11'));
});

test('patients can store a consultation request and it enters the screening queue', function () {
    $user = User::factory()->create(['role' => 'pasien', 'name' => 'Aisyah Rahmawati']);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'tanggal_skrining' => '2026-11-11',
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'durasi' => '1–3 hari',
            'persetujuan' => true,
        ])
        ->assertRedirect(route('pasien.beranda'))
        ->assertSessionHas('success');

    $pasien = Pasien::query()->where('user_id', $user->id)->firstOrFail();
    $konsultasi = Konsultasi::query()->where('pasien_id', $pasien->id)->firstOrFail();

    expect($konsultasi->status)->toBe('MENUNGGU_SKRINING')
        ->and($konsultasi->mode)->toBe('teks')
        ->and($konsultasi->dibuat_oleh)->toBe($user->id)
        ->and($konsultasi->dokter_spesialis_id)->toBeNull()
        ->and($konsultasi->jadwal_id)->toBeNull()
        ->and($konsultasi->tanggal)->toBeNull()
        ->and($konsultasi->tanggal_skrining?->toDateString())->toBe('2026-11-11')
        ->and($konsultasi->kedaluwarsa_pada?->toDateTimeString())->toBe('2026-11-14 23:59:59')
        ->and($konsultasi->keluhan)->toContain('dialami 1–3 hari');
});

test('a new patient profile is created as awaiting verification', function () {
    $user = User::factory()->create(['role' => 'pasien', 'name' => 'Ibrahim Saleh']);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'tanggal_skrining' => '2026-11-09',
            'keluhan' => 'Nyeri ulu hati sejak semalam.',
            'persetujuan' => true,
        ])
        ->assertRedirect(route('pasien.beranda'));

    $pasien = Pasien::query()->where('user_id', $user->id)->firstOrFail();

    expect($pasien->nama)->toBe('Ibrahim Saleh')
        ->and($pasien->status_verifikasi)->toBe(Pasien::STATUS_MENUNGGU_VERIFIKASI);
});

test('weekend and out-of-range screening dates are rejected', function (string $tanggal) {
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'tanggal_skrining' => $tanggal,
            'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
            'persetujuan' => true,
        ])
        ->assertSessionHasErrors('tanggal_skrining');

    $this->assertDatabaseCount('konsultasi', 0);
})->with([
    'sabtu' => '2026-11-14',
    'minggu' => '2026-11-15',
    'kemarin' => '2026-11-08',
    'lebih dari 14 hari' => '2026-11-24',
]);

test('the consultation request is validated before storage', function () {
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'tanggal_skrining' => '',
            'keluhan' => 'pendek',
            'persetujuan' => false,
        ])
        ->assertSessionHasErrors(['tanggal_skrining', 'keluhan', 'persetujuan']);

    $this->assertDatabaseCount('konsultasi', 0);
});

test('users with other roles cannot create a consultation request', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post('/pasien/konsultasi', [
            'tanggal_skrining' => '2026-11-09',
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
