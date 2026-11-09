<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Siapkan data konsultasi fiktif untuk pengujian dasbor admin.
 *
 * @return array{admin: User}
 */
function siapkanDataDasborAdmin(): array
{
    $admin = User::factory()->create(['role' => 'admin']);
    $umumUser = User::factory()->create(['role' => 'dokter_umum']);
    $anakUser = User::factory()->create(['role' => 'spesialis']);
    $dalamUser = User::factory()->create(['role' => 'spesialis']);

    $umum = Dokter::query()->create([
        'user_id' => $umumUser->id,
        'nama' => 'dr. Umum Uji',
        'peran' => 'umum',
        'spesialisasi' => null,
        'faskes' => 'Puskesmas Pulau Karang',
        'status' => 'aktif',
    ]);

    $anak = Dokter::query()->create([
        'user_id' => $anakUser->id,
        'nama' => 'dr. Anak Uji',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $dalam = Dokter::query()->create([
        'user_id' => $dalamUser->id,
        'nama' => 'dr. Dalam Uji',
        'peran' => 'spesialis',
        'spesialisasi' => 'Penyakit Dalam',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $pasien = Pasien::query()->create(['nama' => 'Pasien Uji']);

    Icd10::query()->create(['kode' => 'J06.9', 'nama_diagnosis' => 'Infeksi saluran napas atas akut', 'pemakaian' => 0]);
    Icd10::query()->create(['kode' => 'I10', 'nama_diagnosis' => 'Hipertensi esensial', 'pemakaian' => 0]);

    $data = [
        ['tanggal' => now()->subHours(3), 'dokter' => $anak, 'mode' => 'video', 'icd10' => 'J06.9', 'rujuk' => false],
        ['tanggal' => now()->subHours(1), 'dokter' => $dalam, 'mode' => 'teks', 'icd10' => 'I10', 'rujuk' => true],
        ['tanggal' => now()->subDays(10), 'dokter' => $anak, 'mode' => 'video', 'icd10' => 'J06.9', 'rujuk' => false],
        ['tanggal' => now()->subDays(40), 'dokter' => $dalam, 'mode' => 'teks', 'icd10' => 'I10', 'rujuk' => true],
    ];

    foreach ($data as $item) {
        $konsultasi = Konsultasi::query()->create([
            'pasien_id' => $pasien->id,
            'dibuat_oleh' => $admin->id,
            'dokter_pengirim_id' => $umum->id,
            'dokter_spesialis_id' => $item['dokter']->id,
            'mode' => $item['mode'],
            'status' => 'SELESAI',
            'keluhan' => 'Keluhan uji dasbor.',
            'tanggal' => $item['tanggal'],
            'dikonfirmasi_pada' => $item['tanggal']->copy()->addHours(2),
        ]);

        HasilKonsultasi::query()->create([
            'konsultasi_id' => $konsultasi->id,
            'icd10_kode' => $item['icd10'],
            'saran' => 'Saran uji dasbor.',
            'keputusan_rujuk' => $item['rujuk'],
            'alasan_rujuk' => $item['rujuk'] ? 'Alasan uji.' : null,
            'biaya_rujukan' => $item['rujuk'] ? 1000000 : null,
            'waktu' => $item['tanggal']->copy()->addHours(3),
        ]);
    }

    return ['admin' => $admin];
}

test('guests are redirected from the admin beranda', function () {
    $this->get('/admin')->assertRedirect(route('login'));
});

test('admins can view statistics for the current month by default', function () {
    ['admin' => $admin] = siapkanDataDasborAdmin();

    $this->actingAs($admin)
        ->get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/beranda')
            ->where('periode', 'bulan')
            ->where('ringkasan.totalKonsultasi', 3)
            ->where('ringkasan.rujukanTerhindarkan', 2)
            ->where('ringkasan.rujukanDilakukan', 1)
            ->where('ringkasan.persentase', 67)
            ->where('ringkasan.biayaHemat', 1700000)
            ->where('ringkasan.jamHemat', 12)
            ->where('ringkasan.rataWaktuTunggu', 2)
            ->where('ringkasan.video', 2)
            ->where('ringkasan.teks', 1)
            ->has('tren', 30)
            ->has('diagnosis', 2)
            ->where('diagnosis.0.kode', 'J06.9')
            ->where('diagnosis.0.jumlah', 2)
            ->has('spesialisasi', 2)
            ->where('spesialisasi.0.nama', 'Anak')
            ->where('spesialisasi.0.jumlah', 2));
});

test('admins can filter statistics by week', function () {
    ['admin' => $admin] = siapkanDataDasborAdmin();

    $this->actingAs($admin)
        ->get('/admin?periode=minggu')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'minggu')
            ->where('ringkasan.totalKonsultasi', 2)
            ->where('ringkasan.rujukanTerhindarkan', 1)
            ->where('ringkasan.rujukanDilakukan', 1)
            ->where('ringkasan.persentase', 50)
            ->has('tren', 7));
});

test('admins can filter statistics by year', function () {
    ['admin' => $admin] = siapkanDataDasborAdmin();

    $this->actingAs($admin)
        ->get('/admin?periode=tahun')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'tahun')
            ->where('ringkasan.totalKonsultasi', 4)
            ->where('ringkasan.rujukanTerhindarkan', 2)
            ->where('ringkasan.rujukanDilakukan', 2)
            ->where('ringkasan.persentase', 50)
            ->has('tren', 12));
});

test('an unknown period falls back to the current month', function () {
    ['admin' => $admin] = siapkanDataDasborAdmin();

    $this->actingAs($admin)
        ->get('/admin?periode=harian')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periode', 'bulan')
            ->where('ringkasan.totalKonsultasi', 3));
});

test('users with other roles cannot view the admin beranda', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/admin')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
