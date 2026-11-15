<?php

use App\Models\Dokter;
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
            'spesialisasi' => $role === 'spesialis' ? 'Anak' : null,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertRedirect(route('admin.pengguna'))
        ->assertSessionHas('success');

    $staff = User::query()->where('email', "staff-{$role}@telekarang.test")->firstOrFail();

    expect($staff->role)->toBe($role)
        ->and($staff->email_verified_at)->not->toBeNull()
        ->and(Hash::check('password123', $staff->password))->toBeTrue();

    if ($role === 'perawat') {
        expect($staff->dokter)->toBeNull();

        return;
    }

    $dokter = Dokter::query()->where('user_id', $staff->id)->firstOrFail();

    expect($dokter->peran)->toBe($role === 'spesialis' ? 'spesialis' : 'umum')
        ->and($dokter->status)->toBe('aktif');

    if ($role === 'spesialis') {
        expect($dokter->spesialisasi)->toBe('Anak')
            ->and($dokter->faskes)->toBe('RS Rujukan Daratan');

        $this->actingAs($staff)->get('/spesialis')->assertOk();
    }
})->with(['perawat', 'dokter_umum', 'spesialis']);

test('specialist staff registration requires a specialization', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/admin/pengguna', [
            'name' => 'Spesialis Tanpa Spesialisasi',
            'email' => 'spesialis-baru@telekarang.test',
            'role' => 'spesialis',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors('spesialisasi');

    $this->assertDatabaseMissing('users', ['email' => 'spesialis-baru@telekarang.test']);
});

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

test('changing a user role to specialist creates a doctor profile', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['name' => 'dr. Ayu Lestari', 'role' => 'pasien']);

    $this->actingAs($admin)
        ->from(route('admin.pengguna'))
        ->patch(route('admin.pengguna.update', $user), ['role' => 'spesialis'])
        ->assertRedirect(route('admin.pengguna'))
        ->assertSessionHas('success');

    $user->refresh();
    $dokter = $user->dokter;

    expect($user->role)->toBe('spesialis')
        ->and($dokter)->not->toBeNull()
        ->and($dokter->peran)->toBe('spesialis')
        ->and($dokter->nama)->toBe('dr. Ayu Lestari')
        ->and($dokter->spesialisasi)->toBeNull()
        ->and($dokter->status)->toBe('aktif');

    $this->actingAs($user)->get('/spesialis')->assertOk();
});

test('changing a user role to general practitioner creates a doctor profile', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['name' => 'dr. Budi', 'role' => 'perawat']);

    $this->actingAs($admin)
        ->from(route('admin.pengguna'))
        ->patch(route('admin.pengguna.update', $user), ['role' => 'dokter_umum'])
        ->assertRedirect(route('admin.pengguna'));

    $dokter = $user->refresh()->dokter;

    expect($dokter)->not->toBeNull()
        ->and($dokter->peran)->toBe('umum')
        ->and($dokter->spesialisasi)->toBeNull()
        ->and($dokter->faskes)->toBe('Puskesmas Pulau Karang');
});

test('the backfill command links doctor accounts without a profile', function () {
    $spesialis = User::factory()->create(['role' => 'spesialis']);
    $dokterUmum = User::factory()->create(['role' => 'dokter_umum']);
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->artisan('telekarang:tautkan-dokter')->assertSuccessful();

    expect($spesialis->refresh()->dokter?->peran)->toBe('spesialis')
        ->and($dokterUmum->refresh()->dokter?->peran)->toBe('umum')
        ->and($perawat->refresh()->dokter)->toBeNull();
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

test('admins can delete a registered user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['name' => 'Akun Sementara', 'role' => 'perawat']);

    $this->actingAs($admin)
        ->delete(route('admin.pengguna.destroy', $user))
        ->assertRedirect(route('admin.pengguna'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', ['id' => $user->id]);

    $this->assertDatabaseHas('audit_log', [
        'user_id' => $admin->id,
        'aksi' => 'menghapus',
        'entitas' => 'pengguna',
        'entitas_id' => (string) $user->id,
    ]);
});

test('admins cannot delete their own account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->delete(route('admin.pengguna.destroy', $admin))
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});

test('users with other roles cannot manage users', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $target = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($user)->get('/admin/pengguna')->assertForbidden();
    $this->actingAs($user)->post('/admin/pengguna', [])->assertForbidden();
    $this->actingAs($user)->patch(route('admin.pengguna.update', $target), ['role' => 'admin'])->assertForbidden();
    $this->actingAs($user)->delete(route('admin.pengguna.destroy', $target))->assertForbidden();

    expect($target->refresh()->role)->toBe('pasien');
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
