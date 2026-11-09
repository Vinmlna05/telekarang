<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient history page', function () {
    $this->get('/pasien/riwayat')->assertRedirect(route('login'));
});

test('patients see their own completed consultations with results', function () {
    $pasienUser = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $pasienUser->name,
        'nik' => '9101010101010001',
    ]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    Icd10::query()->create([
        'kode' => 'J06.9',
        'nama_diagnosis' => 'Infeksi saluran napas atas akut',
    ]);

    Icd10::query()->create([
        'kode' => 'J18.9',
        'nama_diagnosis' => 'Pneumonia, tidak dijelaskan',
    ]);

    $terbaru = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'video',
        'status' => 'SELESAI',
        'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
        'tanggal' => Carbon::parse('2026-10-08 09:30:00'),
    ]);

    HasilKonsultasi::query()->create([
        'konsultasi_id' => $terbaru->id,
        'icd10_kode' => 'J06.9',
        'saran' => 'Istirahat cukup dan banyak minum.',
        'keputusan_rujuk' => false,
        'waktu' => Carbon::parse('2026-10-08 10:00:00'),
    ]);

    $lebihLama = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Sesak napas dan demam tinggi.',
        'tanggal' => Carbon::parse('2026-09-21 10:00:00'),
    ]);

    HasilKonsultasi::query()->create([
        'konsultasi_id' => $lebihLama->id,
        'icd10_kode' => 'J18.9',
        'saran' => 'Perlu evaluasi di RS rujukan.',
        'keputusan_rujuk' => true,
        'alasan_rujuk' => 'Tanda distres napas.',
        'biaya_rujukan' => 1250000,
        'waktu' => Carbon::parse('2026-09-21 10:30:00'),
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Nyeri ulu hati.',
        'tanggal' => Carbon::parse('2026-10-10 08:00:00'),
    ]);

    $pasienLain = Pasien::query()->create([
        'nama' => 'Pasien Lain',
        'nik' => '9101010101010002',
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $pasienLain->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Keluhan pasien lain.',
        'tanggal' => Carbon::parse('2026-10-12 08:00:00'),
    ]);

    $this->actingAs($pasienUser)
        ->get('/pasien/riwayat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/riwayat')
            ->has('riwayat', 2)
            ->where('riwayat.0.id', $terbaru->id)
            ->where('riwayat.0.dokter', 'dr. Ayu Lestari, Sp.A')
            ->where('riwayat.0.spesialisasi', 'Anak')
            ->where('riwayat.0.faskes', 'RS Rujukan Daratan')
            ->where('riwayat.0.tanggalSingkat', '08 Okt 2026')
            ->where('riwayat.0.mode', 'video')
            ->where('riwayat.0.status', 'SELESAI')
            ->where('riwayat.0.hasil.icd10Kode', 'J06.9')
            ->where('riwayat.0.hasil.icd10Nama', 'Infeksi saluran napas atas akut')
            ->where('riwayat.0.hasil.keputusanRujuk', false)
            ->where('riwayat.1.id', $lebihLama->id)
            ->where('riwayat.1.tanggalSingkat', '21 Sep 2026')
            ->where('riwayat.1.hasil.icd10Kode', 'J18.9')
            ->where('riwayat.1.hasil.keputusanRujuk', true));
});

test('patients without a linked patient profile see an empty history', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/riwayat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/riwayat')
            ->has('riwayat', 0));
});

test('users with other roles cannot view patient history', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/riwayat')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
