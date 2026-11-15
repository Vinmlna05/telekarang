<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the follow-up page', function () {
    $this->get('/perawat/tindak-lanjut/1')->assertRedirect(route('login'));
});

test('nurses can view a consultation follow-up page', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Nur Aini']);
    $konsultasi = konsultasiUji($pasien, ['status' => 'SELESAI', 'mode' => 'teks']);
    skriningUji($konsultasi, $perawat, ['spo2' => 91, 'tanda_bahaya' => true, 'prioritas' => 'darurat']);
    icdUji(['kode' => 'J18.9', 'nama_diagnosis' => 'Pneumonia']);
    hasilUji($konsultasi, [
        'icd10_kode' => 'J18.9',
        'saran' => 'Rujuk untuk foto toraks dan oksigen.',
        'keputusan_rujuk' => true,
        'alasan_rujuk' => 'Saturasi rendah dan sesak memberat.',
        'biaya_rujukan' => 850000,
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/tindak-lanjut/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/tindak-lanjut')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.status', 'SELESAI')
            ->where('pasien.nama', 'Nur Aini')
            ->where('skrining.spo2', 91)
            ->where('skrining.prioritas', 'merah')
            ->where('hasil.icd10Kode', 'J18.9')
            ->where('hasil.icd10Nama', 'Pneumonia')
            ->where('hasil.keputusanRujuk', true)
            ->where('hasil.alasanRujuk', 'Saturasi rendah dan sesak memberat.')
            ->where('hasil.biayaRujukan', 850000));
});

test('a consultation without a specialist result shows an empty result', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'DITANGANI_PUSKESMAS']);

    $this->actingAs($perawat)
        ->get("/perawat/tindak-lanjut/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/tindak-lanjut')
            ->where('konsultasi.status', 'DITANGANI_PUSKESMAS')
            ->where('hasil', null));
});

test('the follow-up route requires a numeric consultation id', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/tindak-lanjut/baru')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation follow-up page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/tindak-lanjut/1')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
