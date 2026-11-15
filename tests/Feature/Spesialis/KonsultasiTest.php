<?php

use App\Models\Pesan;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist consultation room', function () {
    $this->get('/spesialis/konsultasi/1')->assertRedirect(route('login'));
});

test('specialists can open their consultation room', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(['nama' => 'Aisyah Rahmawati']), [
        'status' => 'DIKONFIRMASI',
        'mode' => 'teks',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    skriningUji($konsultasi, $perawat, ['spo2' => 95]);

    $this->actingAs($user)
        ->get("/spesialis/konsultasi/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/konsultasi-detail')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.status', 'DIKONFIRMASI')
            ->where('pasien.nama', 'Aisyah Rahmawati')
            ->where('skrining.spo2', 95)
            ->has('pesan', 0));
});

test('specialists cannot open another doctor consultation room', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokterLain->id,
    ]);

    $this->actingAs($user)
        ->get("/spesialis/konsultasi/{$konsultasi->id}")
        ->assertNotFound();
});

test('sending the first specialist message starts the consultation', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/pesan", [
            'isi' => 'Selamat siang, saya sudah membaca hasil skrining.',
        ])
        ->assertRedirect();

    expect($konsultasi->refresh()->status)->toBe('BERLANGSUNG');

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->pengirim_id)->toBe($user->id)
        ->and($pesan->isi)->toBe('Selamat siang, saya sudah membaca hasil skrining.');
});

test('specialists cannot send a message before confirming the request', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/pesan", ['isi' => 'Halo'])
        ->assertSessionHas('error');

    expect(Pesan::query()->count())->toBe(0);
});

test('users with other roles cannot open the specialist consultation room', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/konsultasi/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
