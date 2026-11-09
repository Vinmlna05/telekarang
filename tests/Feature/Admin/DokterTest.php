<?php

use App\Models\Dokter;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin doctor master page', function () {
    $this->get('/admin/dokter')->assertRedirect(route('login'));
});

test('admins can view doctor master data', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $dokterUser = User::factory()->create(['name' => 'dr. Budi Santoso', 'role' => 'dokter_umum']);
    $spesialisUser = User::factory()->create(['name' => 'dr. Ayu Lestari', 'role' => 'spesialis']);

    Dokter::query()->create([
        'user_id' => $dokterUser->id,
        'nama' => $dokterUser->name,
        'peran' => 'umum',
        'spesialisasi' => null,
        'faskes' => 'Puskesmas Pulau Karang',
        'status' => 'aktif',
    ]);

    Dokter::query()->create([
        'user_id' => $spesialisUser->id,
        'nama' => $spesialisUser->name,
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $this->actingAs($admin)
        ->get('/admin/dokter')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dokter')
            ->has('dokter', 2)
            ->where('ringkasan.total', 2)
            ->where('ringkasan.umum', 1)
            ->where('ringkasan.spesialis', 1)
            ->where('ringkasan.belumLengkap', 0)
            ->has('akun', 2)
            ->where('dokter.0.peran', 'umum')
            ->where('dokter.0.email', $dokterUser->email));
});

test('admin doctor filters search by name and role', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $umum = User::factory()->create(['name' => 'dr. Budi Santoso', 'role' => 'dokter_umum']);
    $spesialis = User::factory()->create(['name' => 'dr. Ayu Lestari', 'role' => 'spesialis']);

    foreach ([[$umum, 'umum', null], [$spesialis, 'spesialis', 'Anak']] as [$user, $peran, $spesialisasi]) {
        Dokter::query()->create([
            'user_id' => $user->id,
            'nama' => $user->name,
            'peran' => $peran,
            'spesialisasi' => $spesialisasi,
            'faskes' => 'Puskesmas Pulau Karang',
            'status' => 'aktif',
        ]);
    }

    $this->actingAs($admin)
        ->get('/admin/dokter?q=Ayu&peran=spesialis')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('dokter', 1)
            ->where('dokter.0.nama', 'dr. Ayu Lestari')
            ->where('filters.q', 'Ayu')
            ->where('filters.peran', 'spesialis'));
});

test('admins can add a doctor profile linked to a doctor account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['name' => 'dr. Baru', 'role' => 'dokter_umum']);

    $this->actingAs($admin)
        ->post(route('admin.dokter.store'), [
            'user_id' => $user->id,
            'nama' => 'dr. Baru',
            'peran' => 'umum',
            'spesialisasi' => '',
            'faskes' => 'Puskesmas Pulau Karang',
            'status' => 'aktif',
        ])
        ->assertRedirect(route('admin.dokter'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dokter', [
        'user_id' => $user->id,
        'nama' => 'dr. Baru',
        'peran' => 'umum',
        'spesialisasi' => null,
        'status' => 'aktif',
    ]);
});

test('a doctor profile can only be linked to a doctor account', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $perawat = User::factory()->create(['role' => 'perawat']);

    $this->actingAs($admin)
        ->post(route('admin.dokter.store'), [
            'user_id' => $perawat->id,
            'nama' => 'dr. Salah Akun',
            'peran' => 'umum',
            'faskes' => 'Puskesmas Pulau Karang',
            'status' => 'aktif',
        ])
        ->assertSessionHasErrors('user_id');

    $this->assertDatabaseMissing('dokter', ['user_id' => $perawat->id]);
});

test('one doctor account cannot have two doctor profiles', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'dokter_umum']);

    Dokter::query()->create([
        'user_id' => $user->id,
        'nama' => $user->name,
        'peran' => 'umum',
        'spesialisasi' => null,
        'faskes' => 'Puskesmas Pulau Karang',
        'status' => 'aktif',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.dokter.store'), [
            'user_id' => $user->id,
            'nama' => $user->name,
            'peran' => 'umum',
            'faskes' => 'Puskesmas Pulau Karang',
            'status' => 'aktif',
        ])
        ->assertSessionHasErrors('user_id');
});

test('specialists must have a specialization', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'spesialis']);

    $this->actingAs($admin)
        ->post(route('admin.dokter.store'), [
            'user_id' => $user->id,
            'nama' => $user->name,
            'peran' => 'spesialis',
            'spesialisasi' => '',
            'faskes' => 'RS Rujukan Daratan',
            'status' => 'aktif',
        ])
        ->assertSessionHasErrors('spesialisasi');

    $this->assertDatabaseMissing('dokter', ['user_id' => $user->id]);
});

test('admins can update a doctor profile', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'spesialis']);

    $dokter = Dokter::query()->create([
        'user_id' => $user->id,
        'nama' => 'dr. Lama',
        'peran' => 'spesialis',
        'spesialisasi' => 'Anak',
        'faskes' => 'RS Rujukan Daratan',
        'status' => 'aktif',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.dokter.update', $dokter), [
            'user_id' => $user->id,
            'nama' => 'dr. Baru',
            'peran' => 'spesialis',
            'spesialisasi' => 'Penyakit Dalam',
            'faskes' => 'RS Rujukan Daratan',
            'status' => 'nonaktif',
        ])
        ->assertRedirect(route('admin.dokter'))
        ->assertSessionHas('success');

    expect($dokter->refresh())
        ->nama->toBe('dr. Baru')
        ->spesialisasi->toBe('Penyakit Dalam')
        ->status->toBe('nonaktif');
});

test('users with other roles cannot manage doctor master data', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $target = User::factory()->create(['role' => 'dokter_umum']);

    $this->actingAs($user)->get('/admin/dokter')->assertForbidden();
    $this->actingAs($user)->post(route('admin.dokter.store'), [])->assertForbidden();

    $dokter = Dokter::query()->create([
        'user_id' => $target->id,
        'nama' => $target->name,
        'peran' => 'umum',
        'spesialisasi' => null,
        'faskes' => 'Puskesmas Pulau Karang',
        'status' => 'aktif',
    ]);

    $this->actingAs($user)
        ->patch(route('admin.dokter.update', $dokter), ['status' => 'nonaktif'])
        ->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
