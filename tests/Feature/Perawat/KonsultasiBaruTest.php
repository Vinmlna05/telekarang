<?php

use App\Models\Konsultasi;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the new consultation form', function () {
    $this->get('/perawat/konsultasi/baru')->assertRedirect(route('login'));
});

test('guests cannot submit a new consultation', function () {
    $this->post('/perawat/konsultasi')->assertRedirect(route('login'));
});

test('nurses can view verified patients on the new consultation form', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $tanpaAkun = pasienUji(['nama' => 'Nur Aini'], null);
    $tanpaAkun->update(['user_id' => null]);

    $akunPasien = User::factory()->create(['role' => 'pasien']);
    $denganAkun = pasienUji(['nama' => 'Aisyah Rahmawati'], $akunPasien);

    pasienUji(['nama' => 'Pasien Belum Verifikasi', 'status_verifikasi' => 'MENUNGGU_VERIFIKASI']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->has('pasien', 2)
            ->where('pasienTerpilihId', null)
            ->where('pasien.0.id', $denganAkun->id)
            ->where('pasien.0.punyaAkun', true)
            ->where('pasien.1.id', $tanpaAkun->id)
            ->where('pasien.1.punyaAkun', false)
            ->where('permintaanTerkirim', null));
});

test('the patient chosen from the patient directory is preselected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Aisyah Rahmawati']);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?pasien={$pasien->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('pasienTerpilihId', $pasien->id)
            ->has('pasien', 1)
            ->where('pasien.0.id', $pasien->id));
});

test('an unverified patient cannot be preselected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['status_verifikasi' => 'MENUNGGU_VERIFIKASI']);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?pasien={$pasien->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('pasienTerpilihId', null)
            ->has('pasien', 0));
});

test('nurses can submit a consultation and continue to screening', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));

    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Aisyah Rahmawati']);

    $response = $this->actingAs($perawat)->post('/perawat/konsultasi', [
        'pasien' => $pasien->id,
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ]);

    $konsultasi = Konsultasi::query()->firstOrFail();

    $response
        ->assertRedirect(route('perawat.konsultasi.baru', ['konsultasi' => $konsultasi->id]))
        ->assertSessionHas('success');

    expect($konsultasi->pasien_id)->toBe($pasien->id)
        ->and($konsultasi->dibuat_oleh)->toBe($perawat->id)
        ->and($konsultasi->dokter_spesialis_id)->toBeNull()
        ->and($konsultasi->jadwal_id)->toBeNull()
        ->and($konsultasi->mode)->toBe('teks')
        ->and($konsultasi->status)->toBe('MENUNGGU_SKRINING')
        ->and($konsultasi->tanggal)->toBeNull()
        ->and($konsultasi->keluhan)->toContain('(dialami 1–3 hari)')
        ->and($konsultasi->kedaluwarsa_pada?->toDateTimeString())->toBe('2026-11-12 23:59:59');

    Carbon::setTestNow();
});

test('a new consultation appears in the nurse queue and beranda immediately', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Nur Aini']);

    $this->actingAs($perawat)->post('/perawat/konsultasi', [
        'pasien' => $pasien->id,
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ]);

    $konsultasi = Konsultasi::query()->firstOrFail();

    $this->actingAs($perawat)
        ->get('/perawat/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('permintaan', 1)
            ->where('permintaan.0.id', $konsultasi->id)
            ->where('permintaan.0.status', 'MENUNGGU_SKRINING'));

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ringkasan.antreanHariIni', 1)
            ->has('antrean', 1)
            ->where('antrean.0.id', $konsultasi->id));
});

test('the sent confirmation shows the consultation and links to its screening', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Aisyah Rahmawati']);
    $konsultasi = konsultasiUji($pasien, [
        'dibuat_oleh' => $perawat->id,
        'keluhan' => 'Demam tinggi sejak tiga hari.',
        'kedaluwarsa_pada' => now()->endOfDay()->addDays(3),
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?konsultasi={$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('permintaanTerkirim.id', $konsultasi->id)
            ->where('permintaanTerkirim.pasien.nama', $pasien->nama)
            ->where('permintaanTerkirim.status', 'MENUNGGU_SKRINING')
            ->where('permintaanTerkirim.keluhan', 'Demam tinggi sejak tiga hari.'));
});

test('a consultation cannot be submitted with incomplete or invalid data', function (array $payload, string $error) {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji();

    $data = array_merge([
        'pasien' => $pasien->id,
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ], $payload);

    $this->actingAs($perawat)
        ->post('/perawat/konsultasi', $data)
        ->assertSessionHasErrors($error);

    expect(Konsultasi::query()->count())->toBe(0);
})->with([
    'keluhan terlalu pendek' => [['keluhan' => 'Demam'], 'keluhan'],
    'persetujuan belum dicentang' => [['persetujuan' => false], 'persetujuan'],
    'pasien tidak dipilih' => [['pasien' => null], 'pasien'],
]);

test('a consultation cannot be submitted for an unverified patient', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['status_verifikasi' => 'MENUNGGU_VERIFIKASI']);

    $this->actingAs($perawat)
        ->post('/perawat/konsultasi', [
            'pasien' => $pasien->id,
            'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
            'durasi' => '1–3 hari',
            'persetujuan' => true,
        ])
        ->assertSessionHasErrors('pasien');

    expect(Konsultasi::query()->count())->toBe(0);
});

test('users with other roles cannot view the new consultation form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/konsultasi/baru')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot submit a consultation', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post('/perawat/konsultasi')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
