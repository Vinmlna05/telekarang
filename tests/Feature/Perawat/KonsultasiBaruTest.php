<?php

use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * @return array{0: Dokter, 1: Jadwal}
 */
function buatDokterJadwalKonsultasiBaru(string $hari = 'Senin', string $jamMulai = '09:00:00', string $status = 'tersedia'): array
{
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::query()->create([
        'user_id' => $user->id,
        'nama' => 'dr. Ayu Lestari, Sp.A',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $jadwal = Jadwal::query()->create([
        'dokter_id' => $dokter->id,
        'hari' => $hari,
        'jam_mulai' => $jamMulai,
        'jam_selesai' => '12:00:00',
        'status' => $status,
    ]);

    return [$dokter, $jadwal];
}

function buatPasienTerverifikasiKonsultasiBaru(string $nik = '9101010101010001'): Pasien
{
    return Pasien::query()->create([
        'nama' => 'Aisyah Rahmawati',
        'nik' => $nik,
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Dusun Karang Indah, Pulau Karang',
        'telepon' => '081234567801',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);
}

test('guests are redirected from the new consultation form', function () {
    $this->get('/perawat/konsultasi/baru')->assertRedirect(route('login'));
});

test('guests cannot submit a new consultation', function () {
    $this->post('/perawat/konsultasi')->assertRedirect(route('login'));
});

test('nurses can view verified patients on the new consultation form', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $tanpaAkun = Pasien::query()->create([
        'nama' => 'Nur Aini',
        'nik' => '9101010101010003',
        'tgl_lahir' => '2016-11-21',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Dusun Pulau Seribu, Pulau Karang',
        'telepon' => '081234567802',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);

    $denganAkun = Pasien::query()->create([
        'user_id' => User::factory()->create(['role' => 'pasien'])->id,
        'nama' => 'Aisyah Rahmawati',
        'nik' => '9101010101010001',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Dusun Karang Indah, Pulau Karang',
        'telepon' => '081234567801',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);

    Pasien::query()->create([
        'nama' => 'Pasien Belum Verifikasi',
        'nik' => '9101010101010004',
        'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
    ]);

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->has('pasien', 2)
            ->where('pasienTerpilihId', null)
            ->where('pasien.0.id', $denganAkun->id)
            ->where('pasien.0.punyaAkun', true)
            ->where('pasien.1.id', $tanpaAkun->id)
            ->where('pasien.1.punyaAkun', false));
});

test('the patient chosen from the patient directory is preselected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::query()->create([
        'nama' => 'Aisyah Rahmawati',
        'nik' => '9101010101010001',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?pasien={$pasien->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('pasienTerpilihId', $pasien->id)
            ->has('pasien', 1)
            ->where('pasien.0.id', $pasien->id));
});

test('an unverified patient cannot be preselected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::query()->create([
        'nama' => 'Pasien Belum Verifikasi',
        'nik' => '9101010101010004',
        'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?pasien={$pasien->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('pasienTerpilihId', null)
            ->has('pasien', 0));
});

test('users with other roles cannot view the new consultation form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/konsultasi/baru')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);

test('the form lists doctors and available slots from the database', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    [$dokter] = buatDokterJadwalKonsultasiBaru();

    $this->actingAs($perawat)
        ->get('/perawat/konsultasi/baru')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('dokter.0.id', $dokter->id)
            ->where('dokter.0.nama', 'dr. Ayu Lestari, Sp.A')
            ->where('dokter.0.slots.0', '09.00')
            ->where('permintaanTerkirim', null));
});

test('nurses can submit a consultation and continue to screening', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = buatPasienTerverifikasiKonsultasiBaru();
    [$dokter, $jadwal] = buatDokterJadwalKonsultasiBaru();

    $response = $this->actingAs($perawat)->post('/perawat/konsultasi', [
        'pasien' => $pasien->id,
        'dokter' => $dokter->id,
        'slot' => '09.00',
        'hari' => 'Senin',
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ]);

    $konsultasi = Konsultasi::query()->firstOrFail();

    $response
        ->assertRedirect(route('perawat.konsultasi.baru', ['konsultasi' => $konsultasi->id]))
        ->assertSessionHas('success');

    expect($konsultasi->pasien_id)->toBe($pasien->id)
        ->and($konsultasi->dibuat_oleh)->toBe($perawat->id)
        ->and($konsultasi->dokter_spesialis_id)->toBe($dokter->id)
        ->and($konsultasi->jadwal_id)->toBe($jadwal->id)
        ->and($konsultasi->mode)->toBe('teks')
        ->and($konsultasi->status)->toBe('MENUNGGU_SKRINING')
        ->and($konsultasi->keluhan)->toContain('(dialami 1–3 hari)')
        ->and($konsultasi->kedaluwarsa_pada?->equalTo($konsultasi->tanggal->copy()->addDays(3)))->toBeTrue();
});

test('a new consultation appears in the nurse queue and beranda immediately', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = buatPasienTerverifikasiKonsultasiBaru();
    [$dokter] = buatDokterJadwalKonsultasiBaru();

    $this->actingAs($perawat)->post('/perawat/konsultasi', [
        'pasien' => $pasien->id,
        'dokter' => $dokter->id,
        'slot' => '09.00',
        'hari' => 'Senin',
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ]);

    $konsultasi = Konsultasi::query()->firstOrFail();

    $this->actingAs($perawat)
        ->get('/perawat/permintaan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('permintaan', 1)
            ->where('permintaan.0.id', $konsultasi->id)
            ->where('permintaan.0.status', 'MENUNGGU_SKRINING'));

    $this->actingAs($perawat)
        ->get('/perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ringkasan.antreanHariIni', 1)
            ->has('antrean', 1)
            ->where('antrean.0.id', $konsultasi->id));
});

test('the sent confirmation shows the consultation and links to its screening', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = buatPasienTerverifikasiKonsultasiBaru();
    [$dokter, $jadwal] = buatDokterJadwalKonsultasiBaru();

    $konsultasi = Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dibuat_oleh' => $perawat->id,
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
        'mode' => 'teks',
        'status' => 'MENUNGGU_SKRINING',
        'keluhan' => 'Demam tinggi sejak tiga hari.',
        'tanggal' => now()->next('Monday')->setTime(9, 0),
    ]);

    $this->actingAs($perawat)
        ->get("/perawat/konsultasi/baru?konsultasi={$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/konsultasi-baru')
            ->where('permintaanTerkirim.id', $konsultasi->id)
            ->where('permintaanTerkirim.pasien.nama', $pasien->nama)
            ->where('permintaanTerkirim.dokter.nama', $dokter->nama)
            ->where('permintaanTerkirim.jadwal.hari', 'Senin')
            ->where('permintaanTerkirim.jadwal.slot', '09.00')
            ->where('permintaanTerkirim.keluhan', 'Demam tinggi sejak tiga hari.'));
});

test('a consultation cannot be submitted with incomplete or invalid data', function (array $payload, string $error) {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = buatPasienTerverifikasiKonsultasiBaru();
    [$dokter] = buatDokterJadwalKonsultasiBaru();

    $data = array_merge([
        'pasien' => $pasien->id,
        'dokter' => $dokter->id,
        'slot' => '09.00',
        'hari' => 'Senin',
        'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
        'durasi' => '1–3 hari',
        'persetujuan' => true,
    ], $payload);

    $this->actingAs($perawat)
        ->post('/perawat/konsultasi', $data)
        ->assertSessionHasErrors($error);

    expect(Konsultasi::query()->count())->toBe(0);
})->with([
    'keluhan terlalu pendek' => [['keluhan' => 'Demam'], 'keluhan'],
    'persetujuan belum dicentang' => [['persetujuan' => false], 'persetujuan'],
    'slot tidak tersedia' => [['slot' => '13.00'], 'slot'],
]);

test('a consultation cannot be submitted for an unverified patient', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::query()->create([
        'nama' => 'Pasien Belum Verifikasi',
        'nik' => '9101010101010099',
        'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
    ]);
    [$dokter] = buatDokterJadwalKonsultasiBaru();

    $this->actingAs($perawat)
        ->post('/perawat/konsultasi', [
            'pasien' => $pasien->id,
            'dokter' => $dokter->id,
            'slot' => '09.00',
            'hari' => 'Senin',
            'keluhan' => 'Demam tinggi dan batuk sejak tiga hari.',
            'durasi' => '1–3 hari',
            'persetujuan' => true,
        ])
        ->assertSessionHasErrors('pasien');

    expect(Konsultasi::query()->count())->toBe(0);
});

test('users with other roles cannot submit a consultation', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post('/perawat/konsultasi')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
