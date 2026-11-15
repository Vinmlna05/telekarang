<?php

use App\Models\Konsultasi;
use App\Models\User;

function konsultasiSiapReview(): Konsultasi
{
    $perawat = User::factory()->create(['role' => 'perawat']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'SKRINING_SELESAI']);
    skriningUji($konsultasi, $perawat);

    return $konsultasi;
}

test('guests cannot submit a doctor decision', function () {
    $konsultasi = konsultasiSiapReview();

    $this->post("/dokter/review/{$konsultasi->id}/keputusan", [
        'keputusan' => Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
    ])->assertRedirect(route('login'));
});

test('a doctor can forward a screened request to specialist selection', function () {
    $dokterUser = User::factory()->create(['role' => 'dokter_umum']);
    dokterUji($dokterUser, 'umum', ['nama' => 'dr. Bima Pratama']);
    $konsultasi = konsultasiSiapReview();

    $this->actingAs($dokterUser)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
        ])
        ->assertRedirect(route('dokter.review'))
        ->assertSessionHas('success');

    $konsultasi->refresh();

    expect($konsultasi->status)->toBe('MENUNGGU_PEMILIHAN_SPESIALIS')
        ->and($konsultasi->keputusan_dokter)->toBe(Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS)
        ->and($konsultasi->diputuskan_oleh)->toBe($dokterUser->id)
        ->and($konsultasi->dokter_pengirim_id)->not->toBeNull();
});

test('a doctor can mark a patient as directly referred with a note', function () {
    $dokterUser = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiSiapReview();

    $this->actingAs($dokterUser)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => Konsultasi::KEPUTUSAN_RUJUK,
            'catatan' => 'Sesak berat dan saturasi rendah, perlu oksigen di RS.',
        ])
        ->assertRedirect(route('dokter.review'));

    expect($konsultasi->refresh()->status)->toBe('DIRUJUK');
});

test('referred and treated decisions require a note', function (string $keputusan) {
    $dokterUser = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiSiapReview();

    $this->actingAs($dokterUser)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => $keputusan,
        ])
        ->assertSessionHasErrors('catatan');

    expect($konsultasi->refresh()->status)->toBe('SKRINING_SELESAI');
})->with([Konsultasi::KEPUTUSAN_RUJUK, Konsultasi::KEPUTUSAN_TANGANI_PUSKESMAS]);

test('a doctor can treat a patient at the puskesmas', function () {
    $dokterUser = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiSiapReview();

    $this->actingAs($dokterUser)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => Konsultasi::KEPUTUSAN_TANGANI_PUSKESMAS,
            'catatan' => 'Cukup rehidrasi oral dan kontrol tiga hari lagi.',
        ])
        ->assertRedirect(route('dokter.review'));

    expect($konsultasi->refresh()->status)->toBe('DITANGANI_PUSKESMAS');
});

test('a decision is rejected when screening is incomplete', function () {
    $dokterUser = User::factory()->create(['role' => 'dokter_umum']);
    $konsultasi = konsultasiUji(pasienUji(), ['status' => 'MENUNGGU_SKRINING']);

    $this->actingAs($dokterUser)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
        ])
        ->assertSessionHas('error');

    expect($konsultasi->refresh()->status)->toBe('MENUNGGU_SKRINING');
});

test('users with other roles cannot submit a doctor decision', function (string $role) {
    $konsultasi = konsultasiSiapReview();
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post("/dokter/review/{$konsultasi->id}/keputusan", [
            'keputusan' => Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS,
        ])
        ->assertForbidden();
})->with(['pasien', 'perawat', 'spesialis', 'admin']);
