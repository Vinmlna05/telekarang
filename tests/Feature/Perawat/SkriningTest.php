<?php

use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Skrining;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function buatKonsultasiSkrining(array $attributes = []): Konsultasi
{
    $pasienUser = User::factory()->create(['role' => 'pasien']);

    $pasien = Pasien::query()->create([
        'user_id' => $pasienUser->id,
        'nama' => $attributes['nama'] ?? 'Siti Rahmawati',
        'nik' => $attributes['nik'] ?? '9101010101010001',
        'tgl_lahir' => '1985-06-02',
        'jenis_kelamin' => 'Perempuan',
        'alamat' => 'Desa Karang, Pulau Karang',
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

    return Konsultasi::query()->create([
        'pasien_id' => $pasien->id,
        'dibuat_oleh' => $pasienUser->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => $attributes['status'] ?? 'MENUNGGU_SKRINING',
        'keluhan' => $attributes['keluhan'] ?? 'Demam dan batuk berdahak sejak tiga hari.',
        'tanggal' => now(),
    ]);
}

function dataSkriningValid(array $overrides = []): array
{
    return array_merge([
        'berat' => 20,
        'tinggi' => 110,
        'suhu' => 38.9,
        'nadi' => 110,
        'sistol' => 110,
        'diastol' => 70,
        'spo2' => 97,
        'prioritas' => 'sedang',
        'keluhan' => 'Demam dan batuk berdahak sejak tiga hari.',
        'catatan' => 'Pasien tampak lemas.',
    ], $overrides);
}

test('guests are redirected from the screening form', function () {
    $this->get('/perawat/skrining/1')->assertRedirect(route('login'));
});

test('nurses can view the screening form for a request', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->get('/perawat/skrining/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/skrining')
            ->where('konsultasiId', $konsultasi->id)
            ->where('pasien.nama', 'Siti Rahmawati')
            ->where('pasien.status', 'MENUNGGU_SKRINING')
            ->where('pasien.spesialisasi', 'Anak')
            ->where('nilaiAwal.berat', '')
            ->where('nilaiAwal.catatan', '')
            ->where('nilaiAwal.prioritas', 'sedang'));
});

test('a completed screening is prefilled with previous values', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining(['status' => 'SKRINING_SELESAI']);

    Skrining::query()->create([
        'konsultasi_id' => $konsultasi->id,
        'perawat_id' => $perawat->id,
        'berat' => 20,
        'tinggi' => 110,
        'sistol' => 110,
        'diastol' => 70,
        'suhu' => 38.9,
        'nadi' => 110,
        'spo2' => 97,
        'tanda_bahaya' => false,
        'prioritas' => 'darurat',
        'catatan' => 'Pasien tampak lemas.',
        'waktu' => now(),
    ]);

    $this->actingAs($perawat)
        ->get('/perawat/skrining/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/skrining')
            ->where('pasien.status', 'SKRINING_SELESAI')
            ->where('nilaiAwal.berat', '20')
            ->where('nilaiAwal.suhu', '38.9')
            ->where('nilaiAwal.prioritas', 'darurat')
            ->where('nilaiAwal.catatan', 'Pasien tampak lemas.'));
});

test('the screening route requires a numeric consultation id', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($perawat)
        ->get('/perawat/skrining/tidak-valid')
        ->assertNotFound();
});

test('nurses can store a screening and it unlocks the specialist gate', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid())
        ->assertRedirect(route('perawat.permintaan'))
        ->assertSessionHas('success');

    $skrining = Skrining::query()->where('konsultasi_id', $konsultasi->id)->firstOrFail();

    expect($skrining->perawat_id)->toBe($perawat->id)
        ->and($skrining->tanda_bahaya)->toBeFalse()
        ->and($skrining->prioritas)->toBe('sedang')
        ->and((float) $skrining->suhu)->toBe(38.9);

    expect($konsultasi->fresh()->status)->toBe('SKRINING_SELESAI');
});

test('nurses can mark a screening as an emergency priority', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid(['prioritas' => 'darurat']))
        ->assertRedirect(route('perawat.permintaan'));

    expect(Skrining::query()->where('konsultasi_id', $konsultasi->id)->firstOrFail()->prioritas)->toBe('darurat');
});

test('priority is required and only accepts supported values', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid(['prioritas' => '']))
        ->assertSessionHasErrors('prioritas');

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid(['prioritas' => 'tinggi']))
        ->assertSessionHasErrors('prioritas');

    $this->assertDatabaseCount('skrining', 0);
});

test('out of range vitals are rejected', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid([
            'suhu' => 50,
            'nadi' => 300,
            'spo2' => 20,
            'sistol' => 300,
        ]))
        ->assertSessionHasErrors(['suhu', 'nadi', 'spo2', 'sistol']);

    $this->assertDatabaseCount('skrining', 0);
    expect($konsultasi->fresh()->status)->toBe('MENUNGGU_SKRINING');
});

test('a low oxygen saturation is flagged as an emergency', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($perawat)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid(['spo2' => 90]))
        ->assertRedirect(route('perawat.permintaan'));

    $skrining = Skrining::query()->where('konsultasi_id', $konsultasi->id)->firstOrFail();

    expect($skrining->tanda_bahaya)->toBeTrue()
        ->and($skrining->prioritas)->toBe('sedang');
});

test('users with other roles cannot view the screening form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($user)
        ->get('/perawat/skrining/'.$konsultasi->id)
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot store a screening', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $konsultasi = buatKonsultasiSkrining();

    $this->actingAs($user)
        ->post('/perawat/skrining/'.$konsultasi->id, dataSkriningValid())
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
