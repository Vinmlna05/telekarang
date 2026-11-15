<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the patient beranda', function () {
    $this->get('/pasien')->assertRedirect(route('login'));
});

test('patients can view the beranda with their own consultation data', function () {
    $pasienUser = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $pasienUser->name,
        'nik' => '9101010101010001',
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

    Icd10::query()->create([
        'kode' => 'J06.9',
        'nama_diagnosis' => 'Infeksi saluran napas atas akut',
    ]);

    Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => 'Senin',
        'jam_mulai' => '09:30:00',
        'jam_selesai' => '10:00:00',
        'status' => 'tersedia',
    ]);

    $aktif = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
        'tanggal' => now(),
    ]);

    $selesaiTidakRujuk = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'video',
        'status' => 'SELESAI',
        'keluhan' => 'Batuk pilek berulang.',
        'tanggal' => now()->subDay(),
    ]);

    HasilKonsultasi::query()->create([
        'konsultasi_id' => $selesaiTidakRujuk->id,
        'icd10_kode' => 'J06.9',
        'saran' => 'Istirahat cukup dan banyak minum.',
        'keputusan_rujuk' => false,
        'waktu' => now()->subDay(),
    ]);

    $selesaiRujuk = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Sesak napas berat.',
        'tanggal' => now()->subDays(2),
    ]);

    HasilKonsultasi::query()->create([
        'konsultasi_id' => $selesaiRujuk->id,
        'icd10_kode' => 'J06.9',
        'saran' => 'Perlu evaluasi di RS rujukan.',
        'keputusan_rujuk' => true,
        'alasan_rujuk' => 'Tanda distres napas.',
        'biaya_rujukan' => 1250000,
        'waktu' => now()->subDays(2),
    ]);

    $this->actingAs($pasienUser)
        ->get('/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/beranda')
            ->where('konsultasiAktif.id', $aktif->id)
            ->where('konsultasiAktif.status', 'MENUNGGU_SKRINING')
            ->where('konsultasiAktif.dokter', 'dr. Ayu Lestari, Sp.A')
            ->where('konsultasiAktif.spesialisasi', 'Anak')
            ->where('ringkasan.totalKonsultasi', 2)
            ->where('ringkasan.rujukanTerhindarkan', 1)
            ->has('daftarKonsultasi', 1)
            ->where('daftarKonsultasi.0.id', $aktif->id)
            ->where('daftarKonsultasi.0.dokter', 'dr. Ayu Lestari, Sp.A')
            ->where('daftarKonsultasi.0.spesialisasi', 'Anak')
            ->has('riwayat', 2)
            ->where('riwayat.0.id', $selesaiTidakRujuk->id)
            ->where('riwayat.0.diagnosisKode', 'J06.9')
            ->where('riwayat.0.keputusanRujuk', false));
});

test('patients only see consultations that belong to them', function () {
    $pasienUser = User::factory()->create(['role' => 'pasien']);
    Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $pasienUser->name,
        'nik' => '9101010101010002',
    ]);

    $pasienLain = Pasien::query()->create([
        'nama' => 'Pasien Lain',
        'nik' => '9101010101010003',
    ]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Hendra Wijaya, Sp.PD',
        'peran' => 'spesialis',
        'spesialisasi' => 'Penyakit Dalam',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $pasienLain->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Nyeri ulu hati.',
        'tanggal' => now(),
    ]);

    $this->actingAs($pasienUser)
        ->get('/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/beranda')
            ->where('konsultasiAktif', null)
            ->has('daftarKonsultasi', 0)
            ->where('ringkasan.totalKonsultasi', 0)
            ->where('ringkasan.rujukanTerhindarkan', 0)
            ->has('riwayat', 0));
});

test('the beranda lists every active consultation until it is finished', function () {
    $pasienUser = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $pasienUser->name,
        'nik' => '9101010101010004',
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

    $menunggu = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Demam sejak kemarin.',
        'tanggal' => now()->subHours(2),
    ]);

    $berlangsung = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'video',
        'status' => 'BERLANGSUNG',
        'keluhan' => 'Batuk berdahak.',
        'tanggal' => now()->subHour(),
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'KEDALUWARSA',
        'keluhan' => 'Nyeri perut.',
        'tanggal' => now()->subDay(),
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Kontrol tekanan darah.',
        'tanggal' => now()->subDays(2),
    ]);

    $this->actingAs($pasienUser)
        ->get('/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/beranda')
            ->where('konsultasiAktif.id', $berlangsung->id)
            ->has('daftarKonsultasi', 2)
            ->where('daftarKonsultasi.0.id', $berlangsung->id)
            ->where('daftarKonsultasi.0.mode', 'video')
            ->where('daftarKonsultasi.1.id', $menunggu->id)
            ->where('daftarKonsultasi.1.status', 'MENUNGGU_SKRINING'));
});

test('patients without a linked patient profile see an empty beranda', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/beranda')
            ->where('konsultasiAktif', null)
            ->has('daftarKonsultasi', 0)
            ->where('ringkasan.totalKonsultasi', 0)
            ->where('ringkasan.rujukanTerhindarkan', 0)
            ->has('riwayat', 0));
});

test('users with other roles cannot view the patient beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
