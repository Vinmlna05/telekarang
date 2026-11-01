<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin user management page', function () {
    $this->get('/admin/pengguna')->assertRedirect(route('login'));
});

test('admins can view users with role summaries', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    User::factory()->create(['name' => 'Perawat Sari', 'role' => 'perawat']);
    User::factory()->create(['name' => 'Pasien Satu', 'role' => 'pasien']);

    $this->actingAs($admin)
        ->get('/admin/pengguna')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pengguna')
            ->has('pengguna', 3)
            ->where('ringkasan.total', 3)
            ->where('ringkasan.staff', 1)
            ->where('ringkasan.pasien', 1)
            ->where('ringkasan.admin', 1)
            ->where('filters.q', '')
            ->where('filters.role', '')
            ->where('pengguna.0.role', 'admin'));
});

test('admins can search and filter users by role', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    User::factory()->create(['name' => 'Perawat Sari', 'email' => 'sari@telekarang.test', 'role' => 'perawat']);
    User::factory()->create(['name' => 'Perawat Dewi', 'email' => 'dewi@telekarang.test', 'role' => 'perawat']);
    User::factory()->create(['name' => 'dr. Budi Santoso', 'email' => 'budi@telekarang.test', 'role' => 'dokter_umum']);

    $this->actingAs($admin)
        ->get('/admin/pengguna?q=Sari&role=perawat')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('pengguna', 1)
            ->where('pengguna.0.email', 'sari@telekarang.test')
            ->where('filters.q', 'Sari')
            ->where('filters.role', 'perawat'));
});

test('an unknown role filter falls back to all users', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin/pengguna?role=tidak-dikenal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.role', '')
            ->has('pengguna', 1));
});

test('admins can register staff accounts', function (string $role) {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/admin/pengguna', [
            'name' => 'Staff Baru',
            'email' => "staff-{$role}@telekarang.test",
            'role' => $role,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertRedirect(route('admin.pengguna'))
        ->assertSessionHas('success');

    $staff = User::query()->where('email', "staff-{$role}@telekarang.test")->firstOrFail();

    expect($staff->role)->toBe($role)
        ->and($staff->email_verified_at)->not->toBeNull()
        ->and(Hash::check('password123', $staff->password))->toBeTrue();
})->with(['perawat', 'dokter_umum', 'spesialis']);

test('admins cannot register non-staff roles', function (string $role) {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/admin/pengguna', [
            'name' => 'Akun Tidak Sah',
            'email' => 'tidak-sah@telekarang.test',
            'role' => $role,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors('role');

    $this->assertDatabaseMissing('users', ['email' => 'tidak-sah@telekarang.test']);
})->with(['pasien', 'admin']);

test('staff registration requires a unique email and matching password', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['email' => 'sudah-ada@telekarang.test']);

    $this->actingAs($admin)
        ->post('/admin/pengguna', [
            'name' => 'Staff Baru',
            'email' => 'sudah-ada@telekarang.test',
            'role' => 'perawat',
            'password' => 'password123',
            'password_confirmation' => 'password-lain',
        ])
        ->assertSessionHasErrors(['email', 'password']);
});

test('admins can change another users role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($admin)
        ->from(route('admin.pengguna'))
        ->patch(route('admin.pengguna.update', $user), ['role' => 'perawat'])
        ->assertRedirect(route('admin.pengguna'))
        ->assertSessionHas('success');

    expect($user->refresh()->role)->toBe('perawat');
});

test('admins cannot change their own role', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->patch(route('admin.pengguna.update', $admin), ['role' => 'pasien'])
        ->assertForbidden();

    expect($admin->refresh()->role)->toBe('admin');
});

test('an invalid role cannot be applied to a user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($admin)
        ->from(route('admin.pengguna'))
        ->patch(route('admin.pengguna.update', $user), ['role' => 'superadmin'])
        ->assertSessionHasErrors('role');

    expect($user->refresh()->role)->toBe('pasien');
});

test('users with other roles cannot manage users', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $target = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)->get('/admin/pengguna')->assertForbidden();
    $this->actingAs($user)->post('/admin/pengguna', [])->assertForbidden();
    $this->actingAs($user)->patch(route('admin.pengguna.update', $target), ['role' => 'admin'])->assertForbidden();

    expect($target->refresh()->role)->toBe('pasien');
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
