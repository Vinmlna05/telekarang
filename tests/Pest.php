<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Buat pasien terverifikasi lengkap dengan akun opsional.
 */
function pasienUji(array $attributes = [], ?User $user = null): Pasien
{
    $user ??= User::factory()->create(['role' => 'pasien']);

    return Pasien::query()->create([
        'user_id' => $user->id,
        'nama' => $attributes['nama'] ?? $user->name,
        'nik' => $attributes['nik'] ?? fake()->unique()->numerify('91##############'),
        'tgl_lahir' => $attributes['tgl_lahir'] ?? '1991-03-14',
        'jenis_kelamin' => $attributes['jenis_kelamin'] ?? 'Perempuan',
        'alamat' => $attributes['alamat'] ?? 'Desa Pulau Karang',
        'telepon' => $attributes['telepon'] ?? '081200000001',
        'status_verifikasi' => $attributes['status_verifikasi'] ?? Pasien::STATUS_TERVERIFIKASI,
        ...$attributes,
    ]);
}

/**
 * Buat profil dokter yang terhubung ke akun pengguna.
 */
function dokterUji(User $user, string $peran = 'spesialis', array $attributes = []): Dokter
{
    return Dokter::query()->create([
        'user_id' => $user->id,
        'nama' => $attributes['nama'] ?? 'dr. Ayu Lestari, Sp.A',
        'peran' => $peran,
        'spesialisasi' => $attributes['spesialisasi'] ?? 'Anak',
        'faskes' => $attributes['faskes'] ?? 'RS Rujukan Daratan',
        'status' => $attributes['status'] ?? 'aktif',
        ...$attributes,
    ]);
}

/**
 * Buat konsultasi dengan status default di antrean skrining.
 */
function konsultasiUji(Pasien $pasien, array $attributes = []): Konsultasi
{
    return Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'mode' => $attributes['mode'] ?? 'teks',
        'status' => $attributes['status'] ?? 'MENUNGGU_SKRINING',
        'keluhan' => $attributes['keluhan'] ?? 'Demam dan batuk berdahak sejak tiga hari.',
        'tanggal_skrining' => $attributes['tanggal_skrining'] ?? now()->toDateString(),
        ...$attributes,
    ]);
}

/**
 * Buat skrining perawat untuk sebuah konsultasi.
 */
function skriningUji(Konsultasi $konsultasi, User $perawat, array $attributes = []): Skrining
{
    return Skrining::query()->create([
        'konsultasi_id' => $konsultasi->id,
        'perawat_id' => $perawat->id,
        'berat' => $attributes['berat'] ?? 58,
        'tinggi' => $attributes['tinggi'] ?? 158,
        'sistol' => $attributes['sistol'] ?? 110,
        'diastol' => $attributes['diastol'] ?? 70,
        'suhu' => $attributes['suhu'] ?? 37.8,
        'nadi' => $attributes['nadi'] ?? 92,
        'spo2' => $attributes['spo2'] ?? 97,
        'tanda_bahaya' => $attributes['tanda_bahaya'] ?? false,
        'prioritas' => $attributes['prioritas'] ?? 'sedang',
        'catatan' => $attributes['catatan'] ?? 'Pasien sadar dan tidak sesak.',
        'waktu' => $attributes['waktu'] ?? now(),
        ...$attributes,
    ]);
}

/**
 * Buat slot jadwal praktik dokter.
 */
function jadwalUji(Dokter $dokter, array $attributes = []): Jadwal
{
    return Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => $attributes['hari'] ?? 'Senin',
        'jam_mulai' => $attributes['jam_mulai'] ?? '09:00:00',
        'jam_selesai' => $attributes['jam_selesai'] ?? '09:30:00',
        'status' => $attributes['status'] ?? 'tersedia',
        ...$attributes,
    ]);
}

/**
 * Buat diagnosis ICD-10 fiktif.
 */
function icdUji(array $attributes = []): Icd10
{
    return Icd10::query()->create([
        'kode' => $attributes['kode'] ?? 'J06.9',
        'nama_diagnosis' => $attributes['nama_diagnosis'] ?? 'ISPA akut',
        ...$attributes,
    ]);
}

/**
 * Buat hasil konsultasi spesialis.
 */
function hasilUji(Konsultasi $konsultasi, array $attributes = []): HasilKonsultasi
{
    return HasilKonsultasi::query()->create([
        'konsultasi_id' => $konsultasi->id,
        'icd10_kode' => $attributes['icd10_kode'] ?? 'J06.9',
        'saran' => $attributes['saran'] ?? 'Istirahat cukup dan banyak minum.',
        'keputusan_rujuk' => $attributes['keputusan_rujuk'] ?? false,
        'alasan_rujuk' => $attributes['alasan_rujuk'] ?? null,
        'biaya_rujukan' => $attributes['biaya_rujukan'] ?? null,
        'waktu' => $attributes['waktu'] ?? now(),
        ...$attributes,
    ]);
}
