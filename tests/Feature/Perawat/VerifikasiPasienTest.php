<?php

use App\Models\AuditLog;
use App\Models\Pasien;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from patient verification', function () {
    $pasien = Pasien::create([
        'nama' => 'Pasien Mandiri',
        'status_verifikasi' => 'MENUNGGU_VERIFIKASI',
    ]);

    $this->patch("/perawat/pasien/{$pasien->id}/verifikasi")->assertRedirect(route('login'));
});

test('nurses can verify a self-registered patient', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $akun = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::create([
        'user_id' => $akun->id,
        'nama' => 'Pasien Mandiri',
        'nik' => '9101010101015555',
        'status_verifikasi' => 'MENUNGGU_VERIFIKASI',
    ]);

    $this->actingAs($perawat)
        ->from('/perawat/pasien')
        ->patch("/perawat/pasien/{$pasien->id}/verifikasi")
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success')
        ->assertRedirect('/perawat/pasien');

    $pasien->refresh();

    expect($pasien->status_verifikasi)->toBe('TERVERIFIKASI');
    expect($pasien->diverifikasi_oleh)->toBe($perawat->id);
    expect($pasien->diverifikasi_pada)->not->toBeNull();
    expect($pasien->nomorRekamMedis())->toStartWith('RM-');

    $this->assertDatabaseHas('audit_log', [
        'user_id' => $perawat->id,
        'aksi' => 'memverifikasi',
        'entitas' => 'pasien',
        'entitas_id' => (string) $pasien->id,
    ]);
});

test('the patient directory lists profiles waiting for verification', function () {
    $perawat = User::factory()->create(['role' => 'perawat']);
    $pasien = Pasien::create([
        'nama' => 'Pasien Baru',
        'nik' => '9101010101014444',
        'status_verifikasi' => 'MENUNGGU_VERIFIKASI',
    ]);

    $this->actingAs($perawat)
        ->get('/perawat/pasien')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('perawat/pasien')
            ->has('menungguVerifikasi', 1)
            ->where('menungguVerifikasi.0.id', $pasien->id)
            ->where('menungguVerifikasi.0.nama', 'Pasien Baru')
            ->where('menungguVerifikasi.0.nik', '9101010101014444'));
});

test('users with other roles cannot verify patients', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $pasien = Pasien::create([
        'nama' => 'Pasien Mandiri',
        'status_verifikasi' => 'MENUNGGU_VERIFIKASI',
    ]);

    $this->actingAs($user)
        ->patch("/perawat/pasien/{$pasien->id}/verifikasi")
        ->assertForbidden();

    expect($pasien->refresh()->status_verifikasi)->toBe('MENUNGGU_VERIFIKASI');
    expect(AuditLog::query()->where('aksi', 'memverifikasi')->exists())->toBeFalse();
})->with(['pasien', 'dokter_umum', 'spesialis', 'admin']);
