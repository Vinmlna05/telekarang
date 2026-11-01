<?php

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
        );
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
