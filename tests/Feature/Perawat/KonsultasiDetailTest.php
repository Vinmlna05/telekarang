<?php

use App\Models\Pesan;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the consultation detail page', function () {
    $this->get('/perawat/konsultasi/1')->assertRedirect(route('login'));
});

test('nurses can view a consultation detail page', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Aisyah Rahmawati']);
    $konsultasi = konsultasiUji($pasien, ['status' => 'MENUNGGU_PEMILIHAN_SPESIALIS']);
    skriningUji($konsultasi, $perawat, ['spo2' => 96]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($dokterUser, 'spesialis', ['nama' => 'dr. Ayu Lestari, Sp.A']);
    jadwalUji($dokter, ['hari' => 'Senin', 'jam_mulai' => '09:00:00']);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-detail')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.status', 'MENUNGGU_PEMILIHAN_SPESIALIS')
            ->where('pasien.nama', 'Aisyah Rahmawati')
            ->where('skrining.spo2', 96)
            ->has('pesan', 0)
            ->where('dokterTersedia.0.id', $dokter->id)
            ->where('dokterTersedia.0.nama', 'dr. Ayu Lestari, Sp.A')
            ->where('dokterTersedia.0.jadwal.0.jamMulai', '09:00'));
});

test('nurses receive the video link sent by the specialist', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Alif']);
    $konsultasi = konsultasiUji($pasien, [
        'status' => 'BERLANGSUNG',
        'mode' => 'video',
        'tautan_video' => 'https://meet.google.com/abc-defg-hij',
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('konsultasi.mode', 'video')
            ->where('konsultasi.tautanVideo', 'https://meet.google.com/abc-defg-hij'));
});

test('an unknown consultation cannot be opened', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/99999')
        ->assertNotFound();
});

test('the new consultation route still wins over the detail route', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('perawat/konsultasi-baru'));
});

test('users with other roles cannot view a consultation detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/konsultasi/1')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);

test('patient messages use the patient record name instead of the account name', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $akunPasien = User::factory()->create(['role' => 'pasien', 'name' => 'Alvin Maulana']);
    $pasien = pasienUji(['nama' => 'Alif'], $akunPasien);
    $konsultasi = konsultasiUji($pasien, ['status' => 'BERLANGSUNG']);

    Pesan::query()->create([
        'konsultasi_id' => $konsultasi->id,
        'pengirim_id' => $akunPasien->id,
        'isi' => 'Dok, saya sudah minum obat.',
        'status_kirim' => 'terkirim',
        'waktu' => now(),
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('pasien.nama', 'Alif')
            ->where('pesan.0.pengirim', 'Alif')
            ->where('pesan.0.isi', 'Dok, saya sudah minum obat.'));
});
