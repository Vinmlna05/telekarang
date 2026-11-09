<?php

use App\Models\AuditLog;
use App\Models\Pasien;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the account page', function () {
    $this->get('/pasien/akun')->assertRedirect(route('login'));
});

test('patients can view the account page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/akun')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/akun')
            ->where('mustVerifyEmail', false)
            ->where('profil.nama', $pasien->name)
            ->where('profil.nomorRekamMedis', null)
            ->where('profil.statusVerifikasi', 'MENUNGGU_VERIFIKASI')
        );
});

test('patients can complete their profile and create a pending medical record', function () {
    $pasien = User::factory()->create(['role' => 'pasien', 'name' => 'Pasien Mandiri']);

    $this->actingAs($pasien)
        ->from('/pasien/akun')
        ->patch('/pasien/akun/profil', [
            'nik' => '9101010101019999',
            'tgl_lahir' => '1990-01-02',
            'jenis_kelamin' => 'Perempuan',
            'telepon' => '081234567890',
            'alamat' => 'Dusun Baru, Pulau Karang',
            'golongan_darah' => 'O',
            'alergi' => 'Udang.',
            'obat_rutin' => 'Vitamin D.',
            'kontak_darurat_nama' => 'Wali Pasien',
            'kontak_darurat_hubungan' => 'Ibu',
            'kontak_darurat_telepon' => '081234567891',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/pasien/akun')
        ->assertSessionHas('success');

    $profil = Pasien::query()->where('user_id', $pasien->id)->firstOrFail();

    expect($profil->nama)->toBe('Pasien Mandiri');
    expect($profil->nik)->toBe('9101010101019999');
    expect($profil->golongan_darah)->toBe('O');
    expect($profil->kontak_darurat_nama)->toBe('Wali Pasien');
    expect($profil->status_verifikasi)->toBe('MENUNGGU_VERIFIKASI');
    expect($profil->nomorRekamMedis())->toBeNull();

    $this->assertDatabaseHas('audit_log', [
        'user_id' => $pasien->id,
        'aksi' => 'membuat',
        'entitas' => 'pasien',
        'entitas_id' => (string) $profil->id,
    ]);
});

test('updating patient identity resets verification and keeps the medical name', function () {
    $user = User::factory()->create(['role' => 'pasien', 'name' => 'Nama Akun Baru']);
    $profil = Pasien::create([
        'user_id' => $user->id,
        'nama' => 'Nama Rekam Medis',
        'nik' => '9101010101018888',
        'tgl_lahir' => '1988-08-08',
        'jenis_kelamin' => 'Laki-laki',
        'status_verifikasi' => 'TERVERIFIKASI',
    ]);

    $this->actingAs($user)
        ->patch('/pasien/akun/profil', [
            'nik' => '9101010101018888',
            'tgl_lahir' => '1988-08-09',
            'jenis_kelamin' => 'Laki-laki',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/pasien/akun');

    $profil->refresh();

    expect($profil->nama)->toBe('Nama Rekam Medis');
    expect($profil->status_verifikasi)->toBe('MENUNGGU_VERIFIKASI');
    expect($profil->nomorRekamMedis())->toBeNull();
    expect(AuditLog::query()->where('entitas', 'pasien')->where('entitas_id', (string) $profil->id)->exists())->toBeTrue();
});

test('patients cannot claim an existing NIK without staff assistance', function () {
    Pasien::create([
        'nama' => 'Pasien Lama',
        'nik' => '9101010101017777',
    ]);

    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->from('/pasien/akun')
        ->patch('/pasien/akun/profil', [
            'nik' => '9101010101017777',
            'tgl_lahir' => '1995-05-05',
            'jenis_kelamin' => 'Perempuan',
        ])
        ->assertSessionHasErrors('nik')
        ->assertRedirect('/pasien/akun');

    expect(Pasien::query()->where('user_id', $user->id)->exists())->toBeFalse();
    expect(Pasien::query()->where('nik', '9101010101017777')->count())->toBe(1);
});

test('profile data requires a valid emergency contact phone', function () {
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)
        ->from('/pasien/akun')
        ->patch('/pasien/akun/profil', [
            'kontak_darurat_nama' => 'Kontak Darurat',
            'kontak_darurat_hubungan' => 'Tetangga',
            'kontak_darurat_telepon' => 'bukan-nomor',
        ])
        ->assertSessionHasErrors('kontak_darurat_telepon')
        ->assertRedirect('/pasien/akun');
});

test('account name changes do not rename an existing medical record', function () {
    $user = User::factory()->create(['role' => 'pasien', 'name' => 'Nama Awal']);
    $profil = Pasien::create([
        'user_id' => $user->id,
        'nama' => 'Nama Rekam Medis',
    ]);

    $this->actingAs($user)
        ->patch('/pasien/akun', [
            'name' => 'Nama Akun Baru',
            'email' => $user->email,
        ])
        ->assertSessionHasNoErrors();

    expect($user->refresh()->name)->toBe('Nama Akun Baru');
    expect($profil->refresh()->nama)->toBe('Nama Rekam Medis');
});

test('patients can update their account information', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->patch('/pasien/akun', [
            'name' => 'Pasien Baru',
            'email' => 'pasien.baru@example.com',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success')
        ->assertRedirect('/pasien/akun');

    $pasien->refresh();

    expect($pasien->name)->toBe('Pasien Baru');
    expect($pasien->email)->toBe('pasien.baru@example.com');
    expect($pasien->email_verified_at)->toBeNull();
});

test('email verification is preserved when the email address is unchanged', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->patch('/pasien/akun', [
            'name' => 'Nama Diperbarui',
            'email' => $pasien->email,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/pasien/akun');

    expect($pasien->refresh()->email_verified_at)->not->toBeNull();
});

test('account information requires a unique email', function () {
    User::factory()->create(['email' => 'sudah.dipakai@example.com']);
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->from('/pasien/akun')
        ->patch('/pasien/akun', [
            'name' => $pasien->name,
            'email' => 'sudah.dipakai@example.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect('/pasien/akun');
});

test('patients can update their password from the account page', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->from('/pasien/akun')
        ->put('/settings/password', [
            'current_password' => 'password',
            'password' => 'kata-sandi-baru',
            'password_confirmation' => 'kata-sandi-baru',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/pasien/akun');

    expect(Hash::check('kata-sandi-baru', $pasien->refresh()->password))->toBeTrue();
});

test('users with other roles cannot view the account page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/akun')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot update the account page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->patch('/pasien/akun', [
            'name' => 'Nama Baru',
            'email' => 'nama.baru@example.com',
        ])
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);

test('users with other roles cannot update patient profile data', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->patch('/pasien/akun/profil', [
            'nik' => '9101010101016666',
            'jenis_kelamin' => 'Perempuan',
        ])
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);
