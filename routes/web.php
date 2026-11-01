<?php

use App\Http\Controllers\Admin\BerandaController as AdminBerandaController;
use App\Http\Controllers\Admin\PenggunaController as AdminPenggunaController;
use App\Http\Controllers\Dokter\ReviewController as DokterReviewController;
use App\Http\Controllers\Pasien\AkunController as PasienAkunController;
use App\Http\Controllers\Pasien\BerandaController;
use App\Http\Controllers\Perawat\BerandaController as PerawatBerandaController;
use App\Http\Controllers\Spesialis\BerandaController as SpesialisBerandaController;
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

    Route::get('pasien/akun', [PasienAkunController::class, 'edit'])
        ->middleware('role:pasien')
        ->name('pasien.akun');

    Route::patch('pasien/akun', [PasienAkunController::class, 'update'])
        ->middleware('role:pasien')
        ->name('pasien.akun.update');

    Route::get('perawat', PerawatBerandaController::class)
        ->middleware('role:perawat')
        ->name('perawat.beranda');

    Route::get('dokter', fn () => redirect()->route('dokter.review'))
        ->middleware('role:dokter_umum')
        ->name('dokter.beranda');

    Route::get('dokter/review', DokterReviewController::class)
        ->middleware('role:dokter_umum')
        ->name('dokter.review');

    Route::get('spesialis', SpesialisBerandaController::class)
        ->middleware('role:spesialis')
        ->name('spesialis.beranda');

    Route::get('admin', AdminBerandaController::class)
        ->middleware('role:admin')
        ->name('admin.beranda');

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
