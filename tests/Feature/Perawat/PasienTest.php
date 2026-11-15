<?php

use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function dataPendaftaranPasienPerawat(array $overrides = []): array
{
    return array_merge([
        'nama' => 'Pasien Baru',
        'nik' => '9101010101019999',
        'tgl_lahir' => '1990-01-01',
        'jenis_kelamin' => 'P',
        'alamat' => 'Dusun Karang Indah, Pulau Karang',
        'telepon' => '081234567899',
        'punya_akun' => false,
        'email' => '',
        'password' => '',
        'password_confirmation' => '',
    ], $overrides);
}

test('guests are redirected from the patient directory', function () {
    $this->get('/perawat/pasien')->assertRedirect(route('login'));
});

test('nurses can view the patient directory from the database', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $akun = User::factory()->create(['role' => 'pasien', 'email' => 'aisyah@telekarang.test']);

    $denganAkun = Pasien::query()->create([
        'user_id' => $akun->id,
        'nama' => 'Aisyah Rahmawati',
        'nik' => '9101010101010001',
        'tgl_lahir' => '1991-03-14',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Dusun Karang Indah, Pulau Karang',
        'telepon' => '081234567801',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);

    $tanpaAkun = Pasien::query()->create([
        'nama' => 'Nur Aini',
        'nik' => '9101010101010002',
        'tgl_lahir' => '2016-11-21',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Dusun Pulau Seribu, Pulau Karang',
        'telepon' => '081234567802',
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

    Konsultasi::query()->create([
        'pasien_id' => $denganAkun->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Batuk berdahak sejak seminggu.',
        'tanggal' => now(),
    ]);

    Konsultasi::query()->create([
        'pasien_id' => $denganAkun->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'video',
        'status' => 'SELESAI',
        'keluhan' => 'Kontrol ulang.',
        'tanggal' => now()->subDay(),
    ]);

    $menunggu = Pasien::query()->create([
        'nama' => 'Pasien Mandiri',
        'nik' => '9101010101010003',
        'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
    ]);

    $this->actingAs($perawat)
        ->get('/perawat/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/pasien')
            ->where('ringkasan.total', 2)
            ->where('ringkasan.punyaAkun', 1)
            ->where('ringkasan.tanpaAkun', 1)
            ->where('ringkasan.kunjunganBulanIni', 1)
            ->has('pasien', 2)
            ->where('pasien.0.id', $tanpaAkun->id)
            ->where('pasien.0.punyaAkun', false)
            ->where('pasien.0.kunjunganTerakhir', 'Belum ada kunjungan')
            ->where('pasien.1.id', $denganAkun->id)
            ->where('pasien.1.punyaAkun', true)
            ->where('pasien.1.totalKonsultasi', 2)
            ->has('menungguVerifikasi', 1)
            ->where('menungguVerifikasi.0.id', $menunggu->id));
});

test('nurses can register a patient without an account', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->from('/perawat/pasien')
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success')
        ->assertRedirect('/perawat/pasien');

    $pasien = Pasien::query()->where('nik', '9101010101019999')->firstOrFail();

    expect($pasien->nama)->toBe('Pasien Baru');
    expect($pasien->user_id)->toBeNull();
    expect($pasien->jenis_kelamin)->toBe('Perempuan');
    expect($pasien->status_verifikasi)->toBe(Pasien::STATUS_TERVERIFIKASI);
    expect($pasien->diverifikasi_oleh)->toBe($perawat->id);
    expect($pasien->diverifikasi_pada)->not->toBeNull();
    expect($pasien->nomorRekamMedis())->toStartWith('RM-');
    expect(session('success'))->toContain('Nomor rekam medis: RM-');

    $this->assertDatabaseHas('audit_log', [
        'user_id' => $perawat->id,
        'aksi' => 'membuat',
        'entitas' => 'pasien',
        'entitas_id' => (string) $pasien->id,
    ]);
});

test('nurses can register a patient with an account and password', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->from('/perawat/pasien')
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat([
            'punya_akun' => true,
            'email' => 'Pasien.Baru@Telekarang.test',
            'password' => 'Rahasia123',
            'password_confirmation' => 'Rahasia123',
        ]))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success')
        ->assertRedirect('/perawat/pasien');

    $akun = User::query()->where('email', 'pasien.baru@telekarang.test')->firstOrFail();
    $pasien = Pasien::query()->where('nik', '9101010101019999')->firstOrFail();

    expect($akun->name)->toBe('Pasien Baru');
    expect($akun->role)->toBe('pasien');
    expect($akun->password)->not->toBe('Rahasia123');
    expect(Hash::check('Rahasia123', $akun->password))->toBeTrue();

    expect($pasien->user_id)->toBe($akun->id);
    expect($pasien->status_verifikasi)->toBe(Pasien::STATUS_TERVERIFIKASI);

    expect(session('success'))
        ->toContain('pasien.baru@telekarang.test')
        ->not->toContain('Rahasia123');
});

test('password is required when registering a patient with an account', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat([
            'punya_akun' => true,
            'email' => 'pasien.baru@telekarang.test',
        ]))
        ->assertSessionHasErrors([
            'password' => 'Kata sandi wajib diisi jika membuat akun pasien.',
        ]);

    $this->assertDatabaseCount('pasien', 0);
    $this->assertDatabaseCount('users', 1);
});

test('password confirmation must match when registering a patient with an account', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat([
            'punya_akun' => true,
            'email' => 'pasien.baru@telekarang.test',
            'password' => 'Rahasia123',
            'password_confirmation' => 'Rahasia124',
        ]))
        ->assertSessionHasErrors([
            'password' => 'Konfirmasi kata sandi tidak sama.',
        ]);

    $this->assertDatabaseCount('pasien', 0);
});

test('patient registration rejects a duplicate nik', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    Pasien::query()->create([
        'nama' => 'Pasien Lama',
        'nik' => '9101010101019999',
        'status_verifikasi' => Pasien::STATUS_TERVERIFIKASI,
    ]);

    $this->actingAs($perawat)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat())
        ->assertSessionHasErrors([
            'nik' => 'NIK sudah terdaftar.',
        ]);

    $this->assertDatabaseCount('pasien', 1);
});

test('patient registration rejects a duplicate account email', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    User::factory()->create(['email' => 'sudah.dipakai@telekarang.test']);

    $this->actingAs($perawat)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat([
            'punya_akun' => true,
            'email' => 'sudah.dipakai@telekarang.test',
            'password' => 'Rahasia123',
            'password_confirmation' => 'Rahasia123',
        ]))
        ->assertSessionHasErrors([
            'email' => 'Email sudah dipakai akun lain.',
        ]);

    $this->assertDatabaseCount('pasien', 0);
});

test('patient registration validates identity data', function (array $overrides, string $field) {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat($overrides))
        ->assertSessionHasErrors($field);

    $this->assertDatabaseCount('pasien', 0);
})->with([
    'tanggal lahir masa depan' => [['tgl_lahir' => now()->addDay()->toDateString()], 'tgl_lahir'],
    'nomor telepon tidak valid' => [['telepon' => 'bukan-nomor'], 'telepon'],
    'nik bukan 16 digit' => [['nik' => '123'], 'nik'],
]);

test('users with other roles cannot register patients', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post('/perawat/pasien', dataPendaftaranPasienPerawat())
        ->assertForbidden();

    $this->assertDatabaseCount('pasien', 0);
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot view the patient directory', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/perawat/pasien')
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
