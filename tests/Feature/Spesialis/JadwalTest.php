<?php

use App\Models\Jadwal;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the practice schedule page', function () {
    $this->get('/spesialis/jadwal')->assertRedirect(route('login'));
});

test('specialists only see their own practice schedule', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $slot = jadwalUji($dokter, ['hari' => 'Senin', 'jam_mulai' => '09:00:00']);

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $dokterLain = dokterUji($lainUser, 'spesialis');
    jadwalUji($dokterLain, ['hari' => 'Selasa']);

    $this->actingAs($user)
        ->get('/spesialis/jadwal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('spesialis/jadwal')
            ->where('ringkasan.total', 1)
            ->where('ringkasan.tersedia', 1)
            ->has('jadwal', 1)
            ->where('jadwal.0.id', $slot->id)
            ->where('jadwal.0.hari', 'Senin')
            ->where('jadwal.0.jamMulai', '09:00')
            ->has('pilihanHari', 7));
});

test('specialists can add a practice slot', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');

    $this->actingAs($user)
        ->post('/spesialis/jadwal', [
            'hari' => 'Rabu',
            'jam_mulai' => '13:00',
            'jam_selesai' => '14:00',
            'status' => 'tersedia',
        ])
        ->assertSessionHas('success');

    $slot = Jadwal::query()->firstOrFail();

    expect($slot->dokter_id)->toBe($dokter->id)
        ->and($slot->hari)->toBe('Rabu')
        ->and($slot->jam_mulai)->toBe('13:00')
        ->and($slot->status)->toBe('tersedia');
});

test('a practice slot requires a valid time range', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $this->actingAs($user)
        ->post('/spesialis/jadwal', [
            'hari' => 'Rabu',
            'jam_mulai' => '14:00',
            'jam_selesai' => '13:00',
        ])
        ->assertSessionHasErrors('jam_selesai');

    expect(Jadwal::query()->count())->toBe(0);
});

test('specialists can update their own slot', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $slot = jadwalUji($dokter);

    $this->actingAs($user)
        ->patch("/spesialis/jadwal/{$slot->id}", [
            'hari' => 'Kamis',
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
            'status' => 'libur',
        ])
        ->assertSessionHas('success');

    expect($slot->refresh()->hari)->toBe('Kamis')
        ->and($slot->status)->toBe('libur');
});

test('specialists cannot update a slot owned by another doctor', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    dokterUji($user, 'spesialis');

    $lainUser = User::factory()->create(['role' => 'spesialis']);
    $slotLain = jadwalUji(dokterUji($lainUser, 'spesialis'));

    $this->actingAs($user)
        ->patch("/spesialis/jadwal/{$slotLain->id}", [
            'hari' => 'Kamis',
            'jam_mulai' => '10:00',
            'jam_selesai' => '11:00',
        ])
        ->assertNotFound();
});

test('a slot used by an active consultation cannot be removed', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $slot = jadwalUji($dokter, ['status' => 'terisi']);

    konsultasiUji(pasienUji(), [
        'status' => 'DIKONFIRMASI',
        'dokter_spesialis_id' => $dokter->id,
        'jadwal_id' => $slot->id,
    ]);

    $this->actingAs($user)
        ->delete("/spesialis/jadwal/{$slot->id}")
        ->assertSessionHas('error');

    expect(Jadwal::query()->whereKey($slot->id)->exists())->toBeTrue();
});

test('an unused slot can be removed', function () {
    $user = User::factory()->create(['role' => 'spesialis']);
    $dokter = dokterUji($user, 'spesialis');
    $slot = jadwalUji($dokter);

    $this->actingAs($user)
        ->delete("/spesialis/jadwal/{$slot->id}")
        ->assertSessionHas('success');

    expect(Jadwal::query()->whereKey($slot->id)->exists())->toBeFalse();
});

test('users with other roles cannot manage practice schedules', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)->get('/spesialis/jadwal')->assertForbidden();
})->with(['pasien', 'perawat', 'dokter_umum', 'admin']);
