<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin account page', function () {
    $this->get('/admin/akun')->assertRedirect(route('login'));
});

test('admins can view the admin account page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin/akun')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/akun')
            ->where('mustVerifyEmail', false)
        );
});

test('admins can update their account information', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patch('/admin/akun', [
            'name' => 'Admin Baru',
            'email' => 'admin.baru@telekarang.test',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success')
        ->assertRedirect('/admin/akun');

    $admin->refresh();

    expect($admin->name)->toBe('Admin Baru')
        ->and($admin->email)->toBe('admin.baru@telekarang.test')
        ->and($admin->email_verified_at)->toBeNull();
});

test('email verification is preserved when an admin keeps the same email', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patch('/admin/akun', [
            'name' => 'Nama Diperbarui',
            'email' => $admin->email,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/admin/akun');

    expect($admin->refresh()->email_verified_at)->not->toBeNull();
});

test('admin account information requires a unique email', function () {
    User::factory()->create(['email' => 'sudah.dipakai@example.com']);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->from('/admin/akun')
        ->patch('/admin/akun', [
            'name' => $admin->name,
            'email' => 'sudah.dipakai@example.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect('/admin/akun');
});

test('admins can update their password from the account page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->from('/admin/akun')
        ->put('/settings/password', [
            'current_password' => 'password',
            'password' => 'kata-sandi-baru',
            'password_confirmation' => 'kata-sandi-baru',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/admin/akun');

    expect(Hash::check('kata-sandi-baru', $admin->refresh()->password))->toBeTrue();
});

test('users with other roles cannot view the admin account page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/admin/akun')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);

test('users with other roles cannot update the admin account page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->patch('/admin/akun', [
            'name' => 'Nama Baru',
            'email' => 'nama.baru@example.com',
        ])
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
