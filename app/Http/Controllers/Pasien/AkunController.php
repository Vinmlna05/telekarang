<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pasien\ProfilUpdateRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\AuditLog;
use App\Models\Pasien;
use App\Support\ProfilPasienPresenter;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AkunController extends Controller
{
    /**
     * Tampilkan halaman kelola akun pasien.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $pasien = Pasien::query()
            ->where('user_id', $user->id)
            ->first();

        return Inertia::render('pasien/akun', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profil' => ProfilPasienPresenter::untuk($pasien, $user),
        ]);
    }

    /**
     * Perbarui nama dan email akun pasien.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('pasien.akun')->with('success', 'Data akun berhasil diperbarui.');
    }

    /**
     * Perbarui data identitas dan profil pasien.
     */
    public function updateProfil(ProfilUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $pasien = Pasien::query()->firstOrNew(['user_id' => $user->id]);
        $baru = ! $pasien->exists;

        if ($baru) {
            $pasien->nama = $user->name;
            $pasien->status_verifikasi = 'MENUNGGU_VERIFIKASI';
        }

        $pasien->fill($request->validated());

        $identitasBerubah = ! $baru && $pasien->isDirty(['nik', 'tgl_lahir', 'jenis_kelamin']);

        if ($identitasBerubah) {
            $pasien->status_verifikasi = 'MENUNGGU_VERIFIKASI';
            $pasien->diverifikasi_oleh = null;
            $pasien->diverifikasi_pada = null;
        }

        $pasien->save();

        AuditLog::catat(
            $user,
            $baru ? 'membuat' : 'mengubah',
            'pasien',
            (string) $pasien->id,
            'Memperbarui data profil pasien dari halaman akun.',
        );

        $pesan = $pasien->status_verifikasi === 'TERVERIFIKASI'
            ? 'Data profil berhasil diperbarui.'
            : 'Data profil tersimpan dan menunggu verifikasi petugas puskesmas.';

        return to_route('pasien.akun')->with('success', $pesan);
    }
}
