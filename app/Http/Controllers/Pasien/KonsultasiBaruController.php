<?php

namespace App\Http\Controllers\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Konsultasi;
use App\Models\Pasien;
use App\Support\TanggalSkrining;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiBaruController extends Controller
{
    /**
     * Tampilkan form permintaan konsultasi dengan pilihan tanggal skrining.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('pasien/konsultasi-baru', [
            'tanggalTersedia' => TanggalSkrining::daftar(),
            'tanggalAwal' => $request->string('tanggal')->toString() ?: null,
        ]);
    }

    /**
     * Simpan permintaan konsultasi baru milik pasien yang sedang login.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tanggal_skrining' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
                'before_or_equal:'.TanggalSkrining::batasAkhir()->toDateString(),
            ],
            'keluhan' => ['required', 'string', 'min:10', 'max:2000'],
            'durasi' => ['nullable', 'string', 'max:50'],
            'persetujuan' => ['accepted'],
        ]);

        $tanggalSkrining = Carbon::createFromFormat('Y-m-d', $data['tanggal_skrining'])->startOfDay();

        if (! TanggalSkrining::valid($tanggalSkrining)) {
            throw ValidationException::withMessages([
                'tanggal_skrining' => 'Tanggal skrining harus hari kerja (Senin–Jumat) dalam 14 hari ke depan.',
            ]);
        }

        $user = $request->user();

        $pasien = Pasien::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'nama' => $user->name,
                'status_verifikasi' => Pasien::STATUS_MENUNGGU_VERIFIKASI,
            ],
        );

        $keluhan = trim($data['keluhan']);

        if (! empty($data['durasi'])) {
            $keluhan .= ' (dialami '.$data['durasi'].')';
        }

        Konsultasi::query()->create([
            'pasien_id' => $pasien->id,
            'dibuat_oleh' => $user->id,
            'mode' => 'teks',
            'status' => 'MENUNGGU_SKRINING',
            'keluhan' => $keluhan,
            'tanggal_skrining' => $tanggalSkrining->toDateString(),
            'kedaluwarsa_pada' => $tanggalSkrining->copy()->endOfDay()->addDays(3),
        ]);

        return to_route('pasien.beranda')
            ->with('success', 'Permintaan konsultasi berhasil dibuat. Datang ke puskesmas pada tanggal skrining yang dipilih.');
    }
}
