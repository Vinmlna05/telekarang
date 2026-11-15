<?php

use App\Models\Pesan;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function spesialisUji(): array
{
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis', ['nama' => 'dr. Ayu Lestari, Sp.A']);

    return [$user, $dokter];
}

test('guests are redirected from the specialist dashboard', function () {
    $this->get('/spesialis')->assertRedirect(route('login'));
});

test('specialists can view their dashboard', function () {
    [$user, $dokter] = spesialisUji();
    $perawat = User::factory()->create(['role' => 'perawat']);
    $hariIni = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][(int) now()->format('w')];

    $jadwal = jadwalUji($dokter, ['hari' => $hariIni, 'jam_mulai' => '09:00:00', 'status' => 'tersedia']);

    $menunggu = konsultasiUji(pasienUji(['nama' => 'Nur Aini']), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
    ]);

    $berlangsung = konsultasiUji(pasienUji(['nama' => 'Aisyah Rahmawati']), [
        'status' => 'BERLANGSUNG',
        'mode' => 'teks',
        'dokter_spesialis_id' => $dokter->id,
        'dikonfirmasi_pada' => now(),
    ]);
    Pesan::query()->create([
        'konsultasi_id' => $berlangsung->id,
        'pengirim_id' => $user->id,
        'isi' => 'Bagaimana kondisi pasien sekarang?',
        'status_kirim' => 'terkirim',
        'waktu' => now(),
    ]);

    konsultasiUji(pasienUji(['nama' => 'Yusuf Maulana']), [
        'status' => 'SELESAI',
        'mode' => 'video',
        'dokter_spesialis_id' => $dokter->id,
    ]);

    $this->actingAs($user)
        ->get('/spesialis')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/beranda')
            ->where('ringkasan.permintaanBaru', 1)
            ->where('ringkasan.jadwalHariIni', 1)
            ->where('ringkasan.selesaiBulanIni', 1)
            ->where('ringkasan.video', 1)
            ->has('permintaan', 1)
            ->where('permintaan.0.id', $menunggu->id)
            ->where('permintaan.0.nama', 'Nur Aini')
            ->has('jadwal', 1)
            ->where('jadwal.0.id', $jadwal->id)
            ->has('berlangsung', 1)
            ->where('berlangsung.0.id', $berlangsung->id)
            ->where('berlangsung.0.pesanTerakhir', 'Bagaimana kondisi pasien sekarang?'));
});

test('a specialist account without a doctor profile cannot open the dashboard', function () {
    $user = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($user)->get('/spesialis')->assertForbidden();
});

test('users with other roles cannot view the specialist dashboard', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)->get('/spesialis')->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
