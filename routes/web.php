<?php

use App\Http\Controllers\Admin\AkunController as AdminAkunController;
use App\Http\Controllers\Admin\BerandaController as AdminBerandaController;
use App\Http\Controllers\Admin\DokterController as AdminDokterController;
use App\Http\Controllers\Admin\Icd10Controller as AdminIcd10Controller;
use App\Http\Controllers\Admin\LogController as AdminLogController;
use App\Http\Controllers\Admin\PenggunaController as AdminPenggunaController;
use App\Http\Controllers\Dokter\HasilController as DokterHasilController;
use App\Http\Controllers\Dokter\ReviewController as DokterReviewController;
use App\Http\Controllers\Dokter\ReviewDetailController as DokterReviewDetailController;
use App\Http\Controllers\Pasien\AkunController as PasienAkunController;
use App\Http\Controllers\Pasien\BerandaController;
use App\Http\Controllers\Perawat\BerandaController as PerawatBerandaController;
use App\Http\Controllers\Perawat\KonsultasiBaruController as PerawatKonsultasiBaruController;
use App\Http\Controllers\Perawat\KonsultasiController as PerawatKonsultasiController;
use App\Http\Controllers\Perawat\PasienController as PerawatPasienController;
use App\Http\Controllers\Perawat\PermintaanController as PerawatPermintaanController;
use App\Http\Controllers\Perawat\SkriningController as PerawatSkriningController;
use App\Http\Controllers\Perawat\TindakLanjutController as PerawatTindakLanjutController;
use App\Http\Controllers\Spesialis\BerandaController as SpesialisBerandaController;
use App\Http\Controllers\Spesialis\HasilController as SpesialisHasilController;
use App\Http\Controllers\Spesialis\JadwalController as SpesialisJadwalController;
use App\Http\Controllers\Spesialis\KonsultasiController as SpesialisKonsultasiController;
use App\Http\Controllers\Spesialis\PermintaanController as SpesialisPermintaanController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        $homeRoute = Auth::user()->homeRoute();

        if ($homeRoute === 'dashboard') {
            return Inertia::render('dashboard');
        }

        return redirect()->route($homeRoute);
    })->name('dashboard');

    Route::get('pasien', BerandaController::class)
        ->middleware('role:pasien')
        ->name('pasien.beranda');

    Route::get('pasien/jadwal', fn () => Inertia::render('pasien/jadwal'))
        ->middleware('role:pasien')
        ->name('pasien.jadwal');

    Route::get('pasien/konsultasi/baru', fn () => Inertia::render('pasien/konsultasi-baru', [
        'dokterAwal' => request()->integer('dokter') ?: null,
        'jadwalAwal' => request()->string('jadwal')->toString(),
    ]))
        ->middleware('role:pasien')
        ->name('pasien.konsultasi.baru');

    Route::get('pasien/konsultasi/{konsultasi}', fn (string $konsultasi) => Inertia::render('pasien/konsultasi-detail', [
        'konsultasiId' => (int) $konsultasi,
    ]))
        ->whereNumber('konsultasi')
        ->middleware('role:pasien')
        ->name('pasien.konsultasi.detail');

    Route::get('pasien/riwayat', fn () => Inertia::render('pasien/riwayat'))
        ->middleware('role:pasien')
        ->name('pasien.riwayat');

    Route::get('pasien/profil', fn () => Inertia::render('pasien/profil'))
        ->middleware('role:pasien')
        ->name('pasien.profil');

    Route::get('pasien/notifikasi', fn () => Inertia::render('pasien/notifikasi'))
        ->middleware('role:pasien')
        ->name('pasien.notifikasi');

    Route::get('pasien/akun', [PasienAkunController::class, 'edit'])
        ->middleware('role:pasien')
        ->name('pasien.akun');

    Route::patch('pasien/akun', [PasienAkunController::class, 'update'])
        ->middleware('role:pasien')
        ->name('pasien.akun.update');

    Route::get('perawat', PerawatBerandaController::class)
        ->middleware('role:perawat')
        ->name('perawat.beranda');

    Route::get('perawat/permintaan', PerawatPermintaanController::class)
        ->middleware('role:perawat')
        ->name('perawat.permintaan');

    Route::get('perawat/konsultasi/baru', PerawatKonsultasiBaruController::class)
        ->middleware('role:perawat')
        ->name('perawat.konsultasi.baru');

    Route::get('perawat/konsultasi/{konsultasi}', PerawatKonsultasiController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:perawat')
        ->name('perawat.konsultasi.detail');

    Route::get('perawat/tindak-lanjut/{konsultasi}', PerawatTindakLanjutController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:perawat')
        ->name('perawat.tindak-lanjut');

    Route::get('perawat/skrining/{konsultasi}', PerawatSkriningController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:perawat')
        ->name('perawat.skrining');

    Route::get('perawat/pasien', PerawatPasienController::class)
        ->middleware('role:perawat')
        ->name('perawat.pasien');

    Route::get('perawat/notifikasi', fn () => Inertia::render('perawat/notifikasi'))
        ->middleware('role:perawat')
        ->name('perawat.notifikasi');

    Route::get('dokter', fn () => redirect()->route('dokter.review'))
        ->middleware('role:dokter_umum')
        ->name('dokter.beranda');

    Route::get('dokter/review', DokterReviewController::class)
        ->middleware('role:dokter_umum')
        ->name('dokter.review');

    Route::get('dokter/review/{konsultasi}', DokterReviewDetailController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:dokter_umum')
        ->name('dokter.review.detail');

    Route::get('dokter/hasil/{konsultasi}', DokterHasilController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:dokter_umum')
        ->name('dokter.hasil');

    Route::get('spesialis', SpesialisBerandaController::class)
        ->middleware('role:spesialis')
        ->name('spesialis.beranda');

    Route::get('spesialis/jadwal', SpesialisJadwalController::class)
        ->middleware('role:spesialis')
        ->name('spesialis.jadwal');

    Route::get('spesialis/permintaan', SpesialisPermintaanController::class)
        ->middleware('role:spesialis')
        ->name('spesialis.permintaan');

    Route::get('spesialis/konsultasi/{konsultasi}', SpesialisKonsultasiController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:spesialis')
        ->name('spesialis.konsultasi.detail');

    Route::get('spesialis/hasil/{konsultasi}', SpesialisHasilController::class)
        ->whereNumber('konsultasi')
        ->middleware('role:spesialis')
        ->name('spesialis.hasil');

    Route::get('admin', AdminBerandaController::class)
        ->middleware('role:admin')
        ->name('admin.beranda');

    Route::get('admin/dokter', [AdminDokterController::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.dokter');

    Route::post('admin/dokter', [AdminDokterController::class, 'store'])
        ->middleware('role:admin')
        ->name('admin.dokter.store');

    Route::patch('admin/dokter/{dokter}', [AdminDokterController::class, 'update'])
        ->whereNumber('dokter')
        ->middleware('role:admin')
        ->name('admin.dokter.update');

    Route::get('admin/icd10', [AdminIcd10Controller::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.icd10');

    Route::post('admin/icd10', [AdminIcd10Controller::class, 'store'])
        ->middleware('role:admin')
        ->name('admin.icd10.store');

    Route::patch('admin/icd10/{icd10}', [AdminIcd10Controller::class, 'update'])
        ->middleware('role:admin')
        ->name('admin.icd10.update');

    Route::delete('admin/icd10/{icd10}', [AdminIcd10Controller::class, 'destroy'])
        ->middleware('role:admin')
        ->name('admin.icd10.destroy');

    Route::get('admin/log', AdminLogController::class)
        ->middleware('role:admin')
        ->name('admin.log');

    Route::get('admin/profil', fn () => Inertia::render('admin/profil'))
        ->middleware('role:admin')
        ->name('admin.profil');

    Route::get('admin/akun', [AdminAkunController::class, 'edit'])
        ->middleware('role:admin')
        ->name('admin.akun');

    Route::patch('admin/akun', [AdminAkunController::class, 'update'])
        ->middleware('role:admin')
        ->name('admin.akun.update');

    Route::get('admin/pengguna', [AdminPenggunaController::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.pengguna');

    Route::post('admin/pengguna', [AdminPenggunaController::class, 'store'])
        ->middleware('role:admin')
        ->name('admin.pengguna.store');

    Route::patch('admin/pengguna/{user}', [AdminPenggunaController::class, 'update'])
        ->middleware('role:admin')
        ->name('admin.pengguna.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
