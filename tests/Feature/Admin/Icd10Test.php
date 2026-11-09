<?php

use App\Models\Icd10;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from the admin icd10 master page', function () {
    $this->get('/admin/icd10')->assertRedirect(route('login'));
});

test('admins can view icd10 master data', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Icd10::query()->create(['kode' => 'J06.9', 'nama_diagnosis' => 'Infeksi saluran napas atas akut', 'pemakaian' => 4]);
    Icd10::query()->create(['kode' => 'O80', 'nama_diagnosis' => 'Persalinan tunggal spontan', 'pemakaian' => 0]);

    $this->actingAs($admin)
        ->get('/admin/icd10')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/icd10')
            ->has('daftar', 2)
            ->where('daftar.0.kode', 'J06.9')
            ->where('daftar.0.nama', 'Infeksi saluran napas atas akut')
            ->where('daftar.0.pemakaian', 4));
});

test('admins can add an icd10 code', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.icd10.store'), [
            'kode' => 'i10',
            'nama' => 'Hipertensi esensial (primer)',
        ])
        ->assertRedirect(route('admin.icd10'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('icd10', [
        'kode' => 'I10',
        'nama_diagnosis' => 'Hipertensi esensial (primer)',
        'pemakaian' => 0,
    ]);
});

test('an icd10 code must use a valid and unique format', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Icd10::query()->create(['kode' => 'A09', 'nama_diagnosis' => 'Diare dan gastroenteritis']);

    $this->actingAs($admin)
        ->post(route('admin.icd10.store'), [
            'kode' => 'A09',
            'nama' => 'Diare dan gastroenteritis',
        ])
        ->assertSessionHasErrors('kode');

    $this->actingAs($admin)
        ->post(route('admin.icd10.store'), [
            'kode' => 'SALAH',
            'nama' => 'Diagnosis Tidak Valid',
        ])
        ->assertSessionHasErrors('kode');
});

test('admins can update an icd10 code', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Icd10::query()->create(['kode' => 'R50.9', 'nama_diagnosis' => 'Demam', 'pemakaian' => 2]);

    $this->actingAs($admin)
        ->patch(route('admin.icd10.update', 'R50.9'), [
            'kode' => 'R50.9',
            'nama' => 'Demam, tidak dijelaskan',
        ])
        ->assertRedirect(route('admin.icd10'))
        ->assertSessionHas('success');

    expect(Icd10::query()->find('R50.9')->nama_diagnosis)->toBe('Demam, tidak dijelaskan');
});

test('admins can delete an unused icd10 code', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Icd10::query()->create(['kode' => 'Z00.0', 'nama_diagnosis' => 'Pemeriksaan kesehatan umum', 'pemakaian' => 0]);

    $this->actingAs($admin)
        ->delete(route('admin.icd10.destroy', 'Z00.0'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('icd10', ['kode' => 'Z00.0']);
});

test('a used icd10 code cannot be deleted', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Icd10::query()->create(['kode' => 'I10', 'nama_diagnosis' => 'Hipertensi esensial', 'pemakaian' => 5]);

    $this->actingAs($admin)
        ->delete(route('admin.icd10.destroy', 'I10'))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('icd10', ['kode' => 'I10']);
});

test('users with other roles cannot manage icd10 master data', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    Icd10::query()->create(['kode' => 'A09', 'nama_diagnosis' => 'Diare dan gastroenteritis']);

    $this->actingAs($user)->get('/admin/icd10')->assertForbidden();
    $this->actingAs($user)->post(route('admin.icd10.store'), [])->assertForbidden();
    $this->actingAs($user)->patch(route('admin.icd10.update', 'A09'), [])->assertForbidden();
    $this->actingAs($user)->delete(route('admin.icd10.destroy', 'A09'))->assertForbidden();

    $this->assertDatabaseHas('icd10', ['kode' => 'A09']);
})->with(['pasien', 'perawat', 'dokter_umum', 'spesialis']);
