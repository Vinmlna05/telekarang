<?php

namespace App\Http\Controllers\Dokter;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\Konsultasi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KeputusanController extends Controller
{
    /**
     * Simpan keputusan dokter umum setelah review skrining.
     */
    public function __invoke(Request $request, int $konsultasi): RedirectResponse
    {
        $data = Konsultasi::query()
            ->with(['pasien', 'skrining'])
            ->whereKey($konsultasi)
            ->firstOrFail();

        if ($data->status !== 'SKRINING_SELESAI' || $data->skrining === null) {
            return back()->with('error', 'Keputusan hanya dapat disimpan setelah skrining lengkap.');
        }

        $validated = $request->validate([
            'keputusan' => ['required', 'string', Rule::in(Konsultasi::KEPUTUSAN_DOKTER)],
            'catatan' => [
                'nullable',
                'string',
                'min:10',
                'max:2000',
                'required_if:keputusan,'.Konsultasi::KEPUTUSAN_RUJUK.','.Konsultasi::KEPUTUSAN_TANGANI_PUSKESMAS,
            ],
        ], [
            'catatan.required_if' => 'Catatan wajib diisi untuk keputusan rujuk atau tangani di puskesmas.',
            'catatan.min' => 'Catatan minimal 10 karakter.',
        ]);

        $status = match ($validated['keputusan']) {
            Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS => 'MENUNGGU_PEMILIHAN_SPESIALIS',
            Konsultasi::KEPUTUSAN_RUJUK => 'DIRUJUK',
            Konsultasi::KEPUTUSAN_TANGANI_PUSKESMAS => 'DITANGANI_PUSKESMAS',
        };

        $dokter = Dokter::query()->where('user_id', $request->user()->id)->first();

        $data->update([
            'status' => $status,
            'keputusan_dokter' => $validated['keputusan'],
            'catatan_dokter' => $validated['catatan'] ?? null,
            'diputuskan_oleh' => $request->user()->id,
            'diputuskan_pada' => now(),
            'dokter_pengirim_id' => $dokter?->id,
            'alasan_status' => null,
        ]);

        AuditLog::catat(
            $request->user(),
            'keputusan_review',
            'konsultasi',
            (string) $data->id,
            'Dokter umum memutuskan '.$validated['keputusan'].' untuk '.($data->pasien?->nama ?? 'pasien'),
        );

        $pesan = match ($validated['keputusan']) {
            Konsultasi::KEPUTUSAN_KONSULTASI_SPESIALIS => 'Keputusan tersimpan. Perawat akan memilih dokter spesialis dan slot jadwal.',
            Konsultasi::KEPUTUSAN_RUJUK => 'Pasien ditandai dirujuk langsung ke RS.',
            default => 'Kasus ditandai ditangani di puskesmas dan masuk hitungan rujukan terhindarkan.',
        };

        return to_route('dokter.review')->with('success', $pesan);
    }
}
