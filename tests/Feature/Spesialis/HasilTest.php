<?php

use App\Models\Konsultasi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the specialist result form', function () {
    $this->get('/spesialis/hasil/1')->assertRedirect(route('login'));
});

test('specialists can open the result form with the ICD-10 list', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(['nama' => 'Nur Aini']), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    icdUji(['kode' => 'J06.9', 'nama_diagnosis' => 'ISPA akut']);

    $this->actingAs($user)
        ->get("/spesialis/hasil/{$konsultasi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/hasil')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('pasien.nama', 'Nur Aini')
            ->where('hasil', null)
            ->has('daftarIcd10', 1)
            ->where('daftarIcd10.0.kode', 'J06.9')
            ->where('daftarIcd10.0.nama', 'ISPA akut'));
});

test('specialists cannot open the result form of another doctor', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokterLain->id,
    ]);

    $this->actingAs($user)
        ->get("/spesialis/hasil/{$konsultasi->id}")
        ->assertNotFound();
});

test('specialists can save a result without referral', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'BERLANGSUNG',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    icdUji(['kode' => 'A09', 'nama_diagnosis' => 'Diare akut']);

    $this->actingAs($user)
        ->post("/spesialis/hasil/{$konsultasi->id}", [
            'icd10_kode' => 'A09',
            'saran' => 'Rehidrasi oral dan pantau tanda dehidrasi.',
            'keputusan_rujuk' => false,
        ])
        ->assertRedirect(route('spesialis.hasil', $konsultasi->id))
        ->assertSessionHas('success');

    expect($konsultasi->refresh()->status)->toBe(Konsultasi::STATUS_TERMINAL[0])
        ->and($konsultasi->hasil)->not->toBeNull()
        ->and($konsultasi->hasil->icd10_kode)->toBe('A09')
        ->and($konsultasi->hasil->keputusan_rujuk)->toBeFalse();
});

test('a referral requires a reason and stores the referral cost', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'BERLANGSUNG',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    icdUji(['kode' => 'J18.9', 'nama_diagnosis' => 'Pneumonia']);

    $this->actingAs($user)
        ->post("/spesialis/hasil/{$konsultasi->id}", [
            'icd10_kode' => 'J18.9',
            'saran' => 'Perlu foto toraks dan oksigen di RS.',
            'keputusan_rujuk' => true,
        ])
        ->assertSessionHasErrors('alasan_rujuk');

    $this->actingAs($user)
        ->post("/spesialis/hasil/{$konsultasi->id}", [
            'icd10_kode' => 'J18.9',
            'saran' => 'Perlu foto toraks dan oksigen di RS.',
            'keputusan_rujuk' => true,
            'alasan_rujuk' => 'Sesak memberat dan saturasi rendah.',
            'biaya_rujukan' => 850000,
        ])
        ->assertRedirect(route('spesialis.hasil', $konsultasi->id));

    $hasil = $konsultasi->refresh()->hasil;

    expect($hasil->keputusan_rujuk)->toBeTrue()
        ->and($hasil->alasan_rujuk)->toBe('Sesak memberat dan saturasi rendah.')
        ->and((float) $hasil->biaya_rujukan)->toBe(850000.0);
});

test('results cannot be saved before the consultation is confirmed', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $konsultasi = konsultasiUji(pasienUji(), [
        'status' => 'MENUNGGU_SPESIALIS',
        'dokter_spesialis_id' => $dokter->id,
    ]);
    icdUji(['kode' => 'A09']);

    $this->actingAs($user)
        ->post("/spesialis/hasil/{$konsultasi->id}", [
            'icd10_kode' => 'A09',
            'saran' => 'Rehidrasi oral.',
            'keputusan_rujuk' => false,
        ])
        ->assertSessionHas('error');

    expect($konsultasi->refresh()->hasil)->toBeNull();
});

test('users with other roles cannot open the specialist result form', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/spesialis/hasil/1')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
