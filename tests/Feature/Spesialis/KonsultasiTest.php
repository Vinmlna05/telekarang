<?php

use App\Models\Pesan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
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

test('specialists can share a google meet link with the patient', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'mode' => 'video',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/tautan", [
            'tautan_video' => 'https://meet.google.com/abc-defg-hij',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($konsultasi->refresh()->tautan_video)->toBe('https://meet.google.com/abc-defg-hij');
});

test('specialists can only share a valid google meet link', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'mode' => 'video',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/tautan", [
            'tautan_video' => 'https://contoh.test/bukan-google-meet',
        ])
        ->assertSessionHasErrors('tautan_video');

    expect($konsultasi->refresh()->tautan_video)->toBeNull();
});

test('specialists cannot share a video link before confirming the request', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'mode' => 'video',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/tautan", [
            'tautan_video' => 'https://meet.google.com/abc-defg-hij',
        ])
        ->assertSessionHas('error');

    expect($konsultasi->refresh()->tautan_video)->toBeNull();
});

test('specialists cannot share a video link for another doctor consultation', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'mode' => 'video',
        'dokter_spesialis_id' => $dokterLain->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/tautan", [
            'tautan_video' => 'https://meet.google.com/abc-defg-hij',
        ])
        ->assertNotFound();

    expect($konsultasi->refresh()->tautan_video)->toBeNull();
});

test('specialists can send a photo in the consultation room', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'BERLANGSUNG',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->post("/spesialis/konsultasi/{$konsultasi->id}/pesan", [
            'isi' => 'Mohon lihat foto kondisi kulit pasien.',
            'lampiran_foto' => UploadedFile::fake()->image('kulit.jpg'),
        ])
        ->assertRedirect();

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->lampiran_foto)->not->toBeNull()
        ->and($pesan->isi)->toBe('Mohon lihat foto kondisi kulit pasien.');
});
