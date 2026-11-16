<?php

use App\Models\Dokter;
use App\Models\HasilKonsultasi;
use App\Models\Icd10;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Models\Pesan;
use App\Models\Skrining;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 08:00:00'));
});

afterEach(function () {
    Carbon::setTestNow();
});

function buatKonsultasiPasienDetail(): array
{
    $user = User::factory()->create(['role' => 'pasien']);
    $pasien = Pasien::create([
        'user_id' => $user->id,
        'nama' => 'Salim Hidayat',
        'nik' => '9101000000000003',
    ]);

    $dokterUser = User::factory()->create(['role' => 'spesialis']);
    $dokter = Dokter::create([
        'user_id' => $dokterUser->id,
        'nama' => 'dr. Hendra Wijaya, Sp.PD',
        'peran' => 'spesialis',
        'spesialisasi' => 'Penyakit Dalam',
        'faskes' => 'RS Kabupaten',
    ]);

    $konsultasi = Konsultasi::create([
        'pasien_id' => $pasien->id,
        'dokter_spesialis_id' => $dokter->id,
        'mode' => 'teks',
        'status' => 'SELESAI',
        'keluhan' => 'Nyeri ulu hati',
        'tanggal' => '2026-11-08 10:00:00',
    ]);

    return [$user, $pasien, $dokter, $konsultasi];
}

test('guests are redirected from the consultation detail page', function () {
    $this->get('/pasien/konsultasi/1')->assertRedirect(route('login'));
});

test('patients can view their own consultation detail', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();

    $icd = Icd10::create(['kode' => 'K30', 'nama_diagnosis' => 'Dispepsia']);
    HasilKonsultasi::create([
        'konsultasi_id' => $konsultasi->id,
        'icd10_kode' => $icd->kode,
        'saran' => 'Hindari makanan pedas.',
        'keputusan_rujuk' => false,
        'waktu' => '2026-11-08 11:00:00',
    ]);
    Skrining::create([
        'konsultasi_id' => $konsultasi->id,
        'perawat_id' => User::factory()->create(['role' => 'perawat'])->id,
        'berat' => 60,
        'tinggi' => 165,
        'sistol' => 120,
        'diastol' => 80,
        'suhu' => 36.8,
        'nadi' => 80,
        'spo2' => 99,
        'tanda_bahaya' => false,
        'catatan' => 'Stabil.',
        'waktu' => '2026-11-08 09:30:00',
    ]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-detail')
            ->where('konsultasi.id', $konsultasi->id)
            ->where('konsultasi.nomor', 'KNS-2026-'.str_pad((string) $konsultasi->id, 4, '0', STR_PAD_LEFT))
            ->where('konsultasi.status', 'SELESAI')
            ->where('konsultasi.hasil.icd10Kode', 'K30')
            ->where('konsultasi.hasil.icd10Nama', 'Dispepsia')
            ->where('konsultasi.hasil.keputusanRujuk', false)
            ->where('konsultasi.skrining.spo2', 99)
            ->where('konsultasi.skrining.sistol', 120)
            ->where('konsultasi.skrining.diastol', 80));
});

test('patients can read chat messages sent by staff', function () {
    [$user, , $dokter, $konsultasi] = buatKonsultasiPasienDetail();
    $konsultasi->update(['status' => 'BERLANGSUNG']);

    $perawat = User::factory()->create(['role' => 'perawat']);

    Pesan::create([
        'konsultasi_id' => $konsultasi->id,
        'pengirim_id' => $dokter->user_id,
        'isi' => 'Halo, saya sudah membaca hasil skrining Anda.',
        'status_kirim' => 'terkirim',
        'waktu' => '2026-11-08 09:00:00',
    ]);
    Pesan::create([
        'konsultasi_id' => $konsultasi->id,
        'pengirim_id' => $perawat->id,
        'isi' => 'Dokter akan segera bergabung.',
        'status_kirim' => 'terkirim',
        'waktu' => '2026-11-08 09:05:00',
    ]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('konsultasi.pesan', 2)
            ->where('konsultasi.pesan.0.pengirim', 'spesialis')
            ->where('konsultasi.pesan.0.isi', 'Halo, saya sudah membaca hasil skrining Anda.')
            ->where('konsultasi.pesan.1.pengirim', 'perawat')
            ->where('konsultasi.pesan.1.isi', 'Dokter akan segera bergabung.'));
});

test('consultation detail tolerates empty screening and result', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();
    $konsultasi->update(['status' => 'BERLANGSUNG']);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('konsultasi.status', 'BERLANGSUNG')
            ->where('konsultasi.skrining', null)
            ->where('konsultasi.hasil', null));
});

test('patients cannot view another patient consultation', function () {
    [, , , $konsultasi] = buatKonsultasiPasienDetail();
    $lain = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($lain)
        ->get('/pasien/konsultasi/'.$konsultasi->id)
        ->assertNotFound();
});

test('consultation detail requires a numeric id', function () {
    $pasien = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($pasien)
        ->get('/pasien/konsultasi/tidak-valid')
        ->assertNotFound();
});

test('users with other roles cannot view a consultation detail page', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/1')
        ->assertForbidden();
})->with(['perawat', 'dokter_umum', 'spesialis', 'admin']);

test('patients can open the google meet link shared by the specialist', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();

    $konsultasi->update([
        'mode' => 'video',
        'tautan_video' => 'https://meet.google.com/abc-defg-hij',
    ]);

    $this->actingAs($user)
        ->get('/pasien/konsultasi/'.$konsultasi->id)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pasien/konsultasi-detail')
            ->where('konsultasi.tautanVideo', 'https://meet.google.com/abc-defg-hij'));
});

test('patients can send a text message to the specialist', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();

    $this->actingAs($user)
        ->post("/pasien/konsultasi/{$konsultasi->id}/pesan", [
            'isi' => 'Saya ingin menanyakan dosis obat, dok.',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->pengirim_id)->toBe($user->id)
        ->and($pesan->isi)->toBe('Saya ingin menanyakan dosis obat, dok.');
});

test('patients can send a photo to the specialist', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();

    $this->actingAs($user)
        ->post("/pasien/konsultasi/{$konsultasi->id}/pesan", [
            'isi' => 'Ini foto kondisinya, dok.',
            'lampiran_foto' => UploadedFile::fake()->image('kondisi.jpg'),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $pesan = Pesan::query()->firstOrFail();

    expect($pesan->lampiran_foto)->not->toBeNull();
});

test('patients cannot send messages for another patient consultation', function () {
    [, , , $konsultasi] = buatKonsultasiPasienDetail();
    $lain = User::factory()->create(['role' => 'pasien']);

    $this->actingAs($lain)
        ->post("/pasien/konsultasi/{$konsultasi->id}/pesan", ['isi' => 'Halo'])
        ->assertNotFound();

    expect(Pesan::query()->count())->toBe(0);
});

test('patients cannot send messages before the specialist room is open', function () {
    [$user, , , $konsultasi] = buatKonsultasiPasienDetail();
    $konsultasi->update(['status' => 'MENUNGGU_SKRINING']);

    $this->actingAs($user)
        ->post("/pasien/konsultasi/{$konsultasi->id}/pesan", ['isi' => 'Halo'])
        ->assertSessionHas('error');

    expect(Pesan::query()->count())->toBe(0);
});
