<?php

use App\Models\Pesan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests cannot send a consultation message', function () {
    $this->post('/perawat/konsultasi/1/pesan', ['isi' => 'Halo'])->assertRedirect(route('login'));
});

test('nurses can send a message and start the consultation', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'DIKONFIRMASI']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/pesan", [
            'isi' => 'Selamat pagi, dokter. Pasien sudah siap.',
        ])
        ->assertRedirect();

    expect($konsultasi->refresh()->status)->toBe('BERLANGSUNG');

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->konsultasi_id)->toBe($konsultasi->id)
        ->and($pesan->pengirim_id)->toBe($perawat->id)
        ->and($pesan->isi)->toBe('Selamat pagi, dokter. Pasien sudah siap.')
        ->and($pesan->status_kirim)->toBe('terkirim');
});

test('nurses can attach a photo to a message', function () {
    Storage::fake('public');

    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'BERLANGSUNG']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/pesan", [
            'lampiran_foto' => UploadedFile::fake()->image('luka.jpg', 640, 480),
        ])
        ->assertRedirect();

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->lampiran_foto)->not->toBeNull();
    Storage::disk('public')->assertExists($pesan->lampiran_foto);
});

test('an empty message is rejected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'BERLANGSUNG']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/pesan", [])
        ->assertSessionHas('error');

    expect(Pesan::query()->count())->toBe(0);
});

test('messages cannot be sent before the consultation room opens', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'MENUNGGU_SPESIALIS']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/pesan", ['isi' => 'Halo dokter'])
        ->assertSessionHas('error');

    expect(Pesan::query()->count())->toBe(0);
});

test('users with other roles cannot send a consultation message', function (string $role) {
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'BERLANGSUNG']);
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post("/perawat/konsultasi/{$konsultasi->id}/pesan", ['isi' => 'Halo dokter'])
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
