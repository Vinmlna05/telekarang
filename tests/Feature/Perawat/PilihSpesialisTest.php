<?php

use App\Models\User;
use Illuminate\Support\Carbon;

function siapkanPemilihanSpesialis(): array
{
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = pasienUji(['nama' => 'Nur Aini']);
    $konsultasi = konsultasiUji($pasien, [
        'status' => 'MENUNGGU_PEMILIHAN_SPESIALIS',
        'keputusan_dokter' => 'KONSULTASI_SPESIALIS',
    ]);
    skriningUji($konsultasi, $perawat);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($dokterUser, 'spesialis', ['nama' => 'dr. Ayu Lestari, Sp.A']);
    $jadwal = jadwalUji($dokter, ['hari' => 'Senin', 'jam_mulai' => '09:00:00']);

    return [$perawat, $konsultasi, $dokter, $jadwal];
}

test('guests cannot assign a specialist', function () {
    [, $konsultasi, $dokter, $jadwal] = siapkanPemilihanSpesialis();

    $this->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
        'dokter_id' => $dokter->id,
        'jadwal_id' => $jadwal->id,
    ])->assertRedirect(route('login'));
});

test('nurses can assign a specialist and a slot to a consultation', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));

    [$perawat, $konsultasi, $dokter, $jadwal] = siapkanPemilihanSpesialis();

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwal->id,
        ])
        ->assertRedirect(route('perawat.konsultasi.detail', $konsultasi->id))
        ->assertSessionHas('success');

    $konsultasi->refresh();

    expect($konsultasi->status)->toBe('MENUNGGU_SPESIALIS')
        ->and($konsultasi->dokter_spesialis_id)->toBe($dokter->id)
        ->and($konsultasi->jadwal_id)->toBe($jadwal->id)
        ->and($konsultasi->tanggal?->toDateTimeString())->toBe('2026-11-09 09:00:00')
        ->and($jadwal->refresh()->status)->toBe('terisi');

    Carbon::setTestNow();
});

test('a slot that is no longer available is rejected', function () {
    [$perawat, $konsultasi, $dokter, $jadwal] = siapkanPemilihanSpesialis();
    $jadwal->update(['status' => 'terisi']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwal->id,
        ])
        ->assertSessionHasErrors('jadwal_id');

    expect($konsultasi->refresh()->status)->toBe('MENUNGGU_PEMILIHAN_SPESIALIS');
});

test('a slot belonging to another doctor is rejected', function () {
    [$perawat, $konsultasi, $dokter] = siapkanPemilihanSpesialis();

    $dokterLainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($dokterLainUser, 'spesialis');
    $jadwalLain = jadwalUji($dokterLain);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwalLain->id,
        ])
        ->assertSessionHas('error');

    expect($konsultasi->refresh()->status)->toBe('MENUNGGU_PEMILIHAN_SPESIALIS');
});

test('specialists cannot be chosen before the doctor forwards the request', function () {
    [$perawat, , $dokter, $jadwal] = siapkanPemilihanSpesialis();
    $belumSiap = konsultasiUji(pasienUji(), ['status' => 'SKRINING_SELESAI']);
    skriningUji($belumSiap, $perawat);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$belumSiap->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwal->id,
        ])
        ->assertSessionHas('error');

    expect($belumSiap->refresh()->status)->toBe('SKRINING_SELESAI');
});

test('reassigning after a reschedule releases the old slot', function () {
    [$perawat, $konsultasi, $dokter, $jadwalLama] = siapkanPemilihanSpesialis();

    $konsultasi->update([
        'status' => 'DIJADWAL_ULANG',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $jadwalLama->id,
    ]);
    $jadwalLama->update(['status' => 'terisi']);

    $jadwalBaru = jadwalUji($dokter, ['hari' => 'Selasa', 'jam_mulai' => '10:00:00']);

    $this->actingAs($perawat)
        ->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwalBaru->id,
        ])
        ->assertRedirect(route('perawat.konsultasi.detail', $konsultasi->id));

    expect($jadwalLama->refresh()->status)->toBe('tersedia')
        ->and($jadwalBaru->refresh()->status)->toBe('terisi')
        ->and($konsultasi->refresh()->jadwal_id)->toBe($jadwalBaru->id);
});

test('users with other roles cannot assign a specialist', function (string $role) {
    [, $konsultasi, $dokter, $jadwal] = siapkanPemilihanSpesialis();
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->post("/perawat/konsultasi/{$konsultasi->id}/spesialis", [
            'dokter_id' => $dokter->id,
            'jadwal_id' => $jadwal->id,
        ])
        ->assertForbidden();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
