<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist request list', function () {
    $this->get('/spesialis/permintaan')->assertRedirect(route('login'));
});

test('specialists only see requests assigned to them', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $perawat = User::factory()->create(['role' => 'perawat']);

    $milikSaya = konsultasiUji(pasienUji(['nama' => 'Nur Aini']), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    skriningUji($milikSaya, $perawat, ['spo2' => 94]);

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokterLain->id,
    ]);

    $this->actingAs($user)
        ->get('/spesialis/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/permintaan')
            ->where('ringkasan.menunggu', 1)
            ->where('ringkasan.dikonfirmasi', 0)
            ->has('permintaan', 1)
            ->where('permintaan.0.id', $milikSaya->id)
            ->where('permintaan.0.nama', 'Nur Aini')
            ->where('permintaan.0.skrining.spo2', 94));
});

test('specialists can confirm a request', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $jadwal = jadwalUji($dokter, ['status' => 'terisi']);
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", [
            'aksi' => 'konfirmasi',
        ])
        ->assertRedirect(route('spesialis.permintaan'))
        ->assertSessionHas('success');

    $konsultasi->refresh();

    expect($konsultasi->status)->toBe('DIKONFIRMASI')
        ->and($konsultasi->dikonfirmasi_pada)->not->toBeNull()
        ->and($konsultasi->jadwal_id)->toBe($jadwal->id);
});

test('a rescheduled request releases its slot and needs a reason', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $jadwal = jadwalUji($dokter, ['status' => 'terisi']);
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
        'tanggal' => now(),
    ]);

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", ['aksi' => 'jadwal_ulang'])
        ->assertSessionHasErrors('alasan');

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", [
            'aksi' => 'jadwal_ulang',
            'alasan' => 'Ada operasi darurat pada jam tersebut.',
        ])
        ->assertRedirect(route('spesialis.permintaan'));

    $konsultasi->refresh();

    expect($konsultasi->status)->toBe('DIJADWAL_ULANG')
        ->and($konsultasi->jadwal_id)->toBeNull()
        ->and($konsultasi->tanggal)->toBeNull()
        ->and($jadwal->refresh()->status)->toBe('tersedia');
});

test('a rejected request releases its slot', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $jadwal = jadwalUji($dokter, ['status' => 'terisi']);
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", [
            'aksi' => 'tolak',
            'alasan' => 'Kasus perlu ditangani subspesialis lain.',
        ])
        ->assertRedirect(route('spesialis.permintaan'));

    expect($konsultasi->refresh()->status)->toBe('DITOLAK')
        ->and($jadwal->refresh()->status)->toBe('tersedia');
});

test('a request that was already processed cannot be processed again', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", ['aksi' => 'konfirmasi'])
        ->assertSessionHas('error');

    expect($konsultasi->refresh()->status)->toBe('DIKONFIRMASI');
});

test('specialists cannot process another doctor request', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokterLain->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/permintaan/{$konsultasi->id}/keputusan", ['aksi' => 'konfirmasi'])
        ->assertNotFound();
});

test('users with other roles cannot view specialist requests', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)->get('/spesialis/permintaan')->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
