<?php

use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the nurse beranda', function () {
    $this->get('/perawat')->assertRedirect(route('login'));
});

test('nurses can view the beranda with todays screening queue', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $pasien = Pasien::query()->create([
        'nama' => 'Aisyah Rahmawati',
        'nik' => '9101010101010001',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
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

    $kemarin = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SPESIALIS',
        'keluhan' => 'Batuk berdahak sejak seminggu.',
        'tanggal' => now()->subDay(),
    ]);
    $kemarin->forceFill(['created_at' => now()->subDay()])->save();

    $merah = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Sesak berat dan nyeri dada sejak pagi.',
        'tanggal' => now()->subHour(),
    ]);
    $merah->forceFill(['created_at' => now()->subHour()])->save();

    $rutin = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SKRINING_SELESAI',
        'keluhan' => 'Demam sejak kemarin.',
        'tanggal' => now()->subMinutes(15),
    ]);
    $rutin->forceFill(['created_at' => now()->subMinutes(10)])->save();

    Skrining::query()->create([
        'konsultasi_id' => $rutin->id,
        'perawat_id' => $perawat->id,
        'berat' => 50,
        'tinggi' => 150,
        'sistol' => 120,
        'diastol' => 80,
        'suhu' => 38.5,
        'nadi' => 96,
        'spo2' => 97,
        'tanda_bahaya' => false,
        'prioritas' => 'sedang',
        'catatan' => 'Pasien tampak lemas.',
        'waktu' => now(),
    ]);

    icdUji(['kode' => 'I10', 'nama_diagnosis' => 'Hipertensi esensial']);
    $selesai = konsultasiUji($pasien, ['status' => 'SELESAI', 'dokter_spesialis_id' => $dokter->id]);
    hasilUji($selesai, ['icd10_kode' => 'I10', 'keputusan_rujuk' => false]);

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/beranda')
            ->where('ringkasan.antreanHariIni', 2)
            ->where('ringkasan.rujukanTerhindarkan', 1)
            ->where('ringkasan.totalRujukan', 0)
            ->has('antrean', 3)
            ->has('tindakLanjut', 1)
            ->where('tindakLanjut.0.id', $selesai->id)
            ->where('tindakLanjut.0.diagnosisKode', 'I10')
            ->where('tindakLanjut.0.keputusanRujuk', false)
            ->where('antrean.0.id', $rutin->id)
            ->where('antrean.0.prioritas', 'sedang')
            ->where('antrean.1.id', $merah->id)
            ->where('antrean.1.prioritas', 'darurat')
            ->where('antrean.2.id', $kemarin->id)
            ->where('antrean.2.prioritas', null));
});

test('the nurse priority choice controls the card even when automatic triage flags danger', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::query()->create([
        'nama' => 'Aisyah Rahmawati',
        'nik' => '9101010101010005',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
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

    $manualSedang = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SKRINING_SELESAI',
        'keluhan' => 'Demam sejak kemarin.',
        'tanggal' => now(),
    ]);
    $manualSedang->forceFill(['created_at' => now()->subMinutes(5)])->save();

    $manualDarurat = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SKRINING_SELESAI',
        'keluhan' => 'Batuk berdahak sejak tiga hari.',
        'tanggal' => now(),
    ]);
    $manualDarurat->forceFill(['created_at' => now()->subMinute()])->save();

    Skrining::query()->create([
        'konsultasi_id' => $manualSedang->id,
        'perawat_id' => $perawat->id,
        'berat' => 50,
        'tinggi' => 150,
        'sistol' => 120,
        'diastol' => 80,
        'suhu' => 38.5,
        'nadi' => 96,
        'spo2' => 90,
        'tanda_bahaya' => true,
        'prioritas' => 'sedang',
        'catatan' => 'Saturasi rendah, tetapi perawat memilih prioritas sedang.',
        'waktu' => now(),
    ]);

    Skrining::query()->create([
        'konsultasi_id' => $manualDarurat->id,
        'perawat_id' => $perawat->id,
        'berat' => 50,
        'tinggi' => 150,
        'sistol' => 120,
        'diastol' => 80,
        'suhu' => 36.8,
        'nadi' => 84,
        'spo2' => 98,
        'tanda_bahaya' => false,
        'prioritas' => 'darurat',
        'catatan' => 'Perawat menilai pasien perlu perhatian segera.',
        'waktu' => now(),
    ]);

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ringkasan.antreanHariIni', 2)
            ->has('antrean', 2)
            ->where('antrean.0.id', $manualDarurat->id)
            ->where('antrean.0.prioritas', 'darurat')
            ->where('antrean.1.id', $manualSedang->id)
            ->where('antrean.1.prioritas', 'sedang'));
});

test('a request created today counts even when the doctor schedule is in the future', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::query()->create([
        'nama' => 'Nur Aini',
        'nik' => '9101010101010003',
        'tgl_lahir' => '2016-11-21',
        'jenis_kelamin' => 'Perempuan',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
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

    $konsultasi = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Demam sejak kemarin.',
        'tanggal' => now()->addWeek(),
    ]);

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ringkasan.antreanHariIni', 1)
            ->has('antrean', 1)
            ->where('antrean.0.id', $konsultasi->id));
});

test('users with other roles cannot view the nurse beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
