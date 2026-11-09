<?php

use App\Models\AuditLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin log page', function () {
    $this->get('/admin/log')->assertRedirect(route('login'));
});

test('admins can view audit log entries from the database', function () {
    $admin = User::factory()->create(['name' => 'Admin Uji', 'role' => 'admin']);
    $perawat = User::factory()->create(['name' => 'Perawat Uji', 'role' => 'perawat']);

    AuditLog::query()->create([
        'user_id' => $perawat->id,
        'aksi' => 'membuat',
        'entitas' => 'pengguna',
        'entitas_id' => '9',
        'keterangan' => 'Membuat akun uji.',
        'waktu' => now()->subMinute(),
    ]);

    AuditLog::query()->create([
        'user_id' => $admin->id,
        'aksi' => 'login',
        'entitas' => 'sesi',
        'entitas_id' => null,
        'keterangan' => 'Masuk ke sistem.',
        'waktu' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/log')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/log')
            ->has('log', 2)
            ->where('log.0.aktor', 'Admin Uji')
            ->where('log.0.peran', 'admin')
            ->where('log.0.aksi', 'login')
            ->where('log.0.entitas', 'sesi')
            ->where('log.0.entitasId', '')
            ->where('log.1.aktor', 'Perawat Uji')
            ->where('log.1.peran', 'perawat')
            ->where('log.1.aksi', 'membuat')
            ->where('log.1.entitas', 'pengguna')
            ->where('log.1.entitasId', '9'));
});

test('admin actions are recorded in the audit log', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.icd10.store'), [
            'kode' => 'B34.2',
            'nama' => 'Infeksi virus corona, tidak dijelaskan',
        ])
        ->assertRedirect(route('admin.icd10'));

    $this->assertDatabaseHas('audit_log', [
        'user_id' => $admin->id,
        'aksi' => 'membuat',
        'entitas' => 'icd10',
        'entitas_id' => 'B34.2',
    ]);
});

test('users with other roles cannot view the admin log page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/admin/log')
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
