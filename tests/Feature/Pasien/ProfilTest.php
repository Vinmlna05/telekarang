<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));
});

afterEach(function () {
    Carbon::setTestNow();
});

test('guests are redirected from the patient profile page', function () {
    $this->get('/pasien/profil')->assertRedirect(route('login'));
});

test('patients can view their profile page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);
    $profil = Pasien::create([
        'user_id' => $pasien->id,
        'nama' => 'Aisyah Karim',
        'nik' => '9101000000000001',
        'tgl_lahir' => '2015-03-12',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Pulau Karang',
        'telepon' => '081234567800',
        'golongan_darah' => 'O',
        'alergi' => 'Debu.',
        'kontak_darurat_nama' => 'Wali Aisyah',
        'kontak_darurat_hubungan' => 'Ibu',
        'kontak_darurat_telepon' => '081234567801',
    ]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Kabupaten',
    ]);

    $icd = Icd10::create(['kode' => 'J06.9', 'nama_diagnosis' => 'ISPA akut']);

    $dirujuk = Konsultasi::create([
        'pasien_id' => $profil->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'video',
        'status' => 'SELESAI',
        'keluhan' => 'Demam tinggi',
        'tanggal' => '2026-10-08 10:00:00',
    ]);
    HasilKonsultasi::create([
        'konsultasi_id' => $dirujuk->id,
        'icd10_kode' => $icd->kode,
        'saran' => 'Rujuk untuk observasi.',
        'keputusan_rujuk' => true,
        'alasan_rujuk' => 'Butuh observasi.',
        'waktu' => '2026-10-08 11:00:00',
    ]);

    $terhindarkan = Konsultasi::create([
        'pasien_id' => $profil->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Batuk pilek',
        'tanggal' => '2026-11-05 09:00:00',
    ]);
    HasilKonsultasi::create([
        'konsultasi_id' => $terhindarkan->id,
        'icd10_kode' => $icd->kode,
        'saran' => 'Cukup rawat jalan.',
        'keputusan_rujuk' => false,
        'waktu' => '2026-11-05 10:00:00',
    ]);

    Skrining::create([
        'konsultasi_id' => $terhindarkan->id,
        'perawat_id' => User::factory()->create(['role' => 'perawat'])->id,
        'berat' => 32,
        'tinggi' => 138,
        'sistol' => 110,
        'diastol' => 70,
        'suhu' => 37.5,
        'nadi' => 90,
        'spo2' => 98,
        'tanda_bahaya' => false,
        'catatan' => 'Kondisi stabil.',
        'waktu' => '2026-11-05 08:30:00',
    ]);

    Konsultasi::create([
        'pasien_id' => $profil->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Belum selesai',
        'tanggal' => '2026-11-09 07:00:00',
    ]);

    $this->actingAs($pasien)
        ->get('/pasien/profil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/profil')
            ->where('profil.nama', 'Aisyah Karim')
            ->where('profil.nik', '9101000000000001')
            ->where('profil.nomorRekamMedis', 'RM-2026-'.str_pad((string) $profil->id, 4, '0', STR_PAD_LEFT))
            ->where('profil.terdaftarSejak', 'Senin, 9 November 2026')
            ->where('profil.telepon', '081234567800')
            ->where('profil.golonganDarah', 'O')
            ->where('profil.alergi', 'Debu.')
            ->where('profil.kontakDarurat.nama', 'Wali Aisyah')
            ->where('profil.kontakDarurat.teleponHref', 'tel:081234567801')
            ->where('profil.statusVerifikasi', 'TERVERIFIKASI')
            ->where('ringkasan.totalKonsultasi', 2)
            ->where('ringkasan.rujukanTerhindarkan', 1)
            ->where('ringkasan.dirujuk', 1)
            ->where('konsultasiTerakhir.diagnosisNama', 'ISPA akut')
            ->where('konsultasiTerakhir.dokter', 'dr. Ayu Lestari, Sp.A')
            ->where('profil.skriningTerakhir.spo2', 98)
            ->where('profil.skriningTerakhir.tekananDarah', '110/70'));
});

test('patients without a linked profile still see an empty profile', function () {
    $pasien = User::factory()->create(['role' => 'pasien', 'name' => 'Tanpa Profil']);

    $this->actingAs($pasien)
        ->get('/pasien/profil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/profil')
            ->where('profil.nama', 'Tanpa Profil')
            ->where('profil.nomorRekamMedis', null)
            ->where('profil.statusVerifikasi', 'MENUNGGU_VERIFIKASI')
            ->where('profil.skriningTerakhir', null)
            ->where('konsultasiTerakhir', null)
            ->where('ringkasan.totalKonsultasi', 0));
});

test('patients cannot see another patient profile data', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);
    Pasien::create([
        'user_id' => User::factory()->create(['role' => 'pasien'])->id,
        'nama' => 'Pasien Lain',
        'nik' => '9101000000000002',
    ]);

    $this->actingAs($pasien)
        ->get('/pasien/profil')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('profil.nama', $pasien->name)
            ->where('profil.nik', null));
});

test('users with other roles cannot view the patient profile page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/profil')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
