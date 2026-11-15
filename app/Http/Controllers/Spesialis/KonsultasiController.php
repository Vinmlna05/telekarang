<?php

namespace App\Http\Controllers\Spesialis;

use App\Http\Controllers\Controller;
use App\Models\Dokter;
use App\Models\Konsultasi;
use App\Models\Pesan;
use App\Support\TanggalIndonesia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiController extends Controller
{
    /**
     * Ruang konsultasi dokter spesialis: simulasi video atau mode teks.
     */
    public function __invoke(Request $request, int $konsultasi): Response
    {
        $dokter = $this->dokterSaya($request);

        $data = Konsultasi::query()
            ->with(['pasien', 'skrining.perawat', 'dokterPengirim', 'jadwal', 'hasil.icd10', 'pesan.pengirim'])
            ->whereKey($konsultasi)
            ->where('dokter_spesialis_id', $dokter->id)
            ->firstOrFail();

        $pasien = $data->pasien;
        $skrining = $data->skrining;
        $hasil = $data->hasil;

        return Inertia::render('spesialis/konsultasi-detail', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($data->tanggal?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'status' => $data->status,
                'keluhan' => $data->keluhan,
                'mode' => $data->mode,
                'jadwal' => $data->jadwal === null ? null : $data->jadwal->hari.' · '.substr($data->jadwal->jam_mulai, 0, 5).' WIT',
                'dokterUmum' => $data->dokterPengirim?->nama,
                'prioritas' => $data->prioritasKartu(),
                'dikonfirmasiPada' => TanggalIndonesia::waktu($data->dikonfirmasi_pada),
            ],
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
                'alamat' => $pasien?->alamat ?? '-',
                'telepon' => $pasien?->telepon ?? '-',
                'punyaAkun' => $data->pasien?->user_id !== null,
            ],
            'skrining' => $skrining === null ? null : [
                'perawat' => $skrining->perawat?->name ?? 'Perawat puskesmas',
                'waktu' => TanggalIndonesia::waktu($skrining->waktu),
                'beratBadan' => (float) $skrining->berat,
                'tinggiBadan' => (float) $skrining->tinggi,
                'sistol' => (int) $skrining->sistol,
                'diastol' => (int) $skrining->diastol,
                'suhu' => (float) $skrining->suhu,
                'nadi' => (int) $skrining->nadi,
                'spo2' => (int) $skrining->spo2,
                'tandaBahaya' => (bool) $skrining->tanda_bahaya,
                'prioritas' => $skrining->tingkatPrioritas(),
                'catatan' => $skrining->catatan ?? '',
            ],
            'hasil' => $hasil === null ? null : [
                'icd10Kode' => $hasil->icd10_kode,
                'icd10Nama' => $hasil->icd10?->nama_diagnosis ?? 'Tanpa diagnosis',
                'saran' => $hasil->saran,
                'keputusanRujuk' => (bool) $hasil->keputusan_rujuk,
                'waktu' => TanggalIndonesia::waktu($hasil->waktu),
            ],
            'pesan' => $data->pesan->map(fn (Pesan $pesan) => [
                'id' => $pesan->id,
                'pengirim' => $pesan->pengirim?->name ?? 'Pengguna',
                'peran' => $pesan->pengirim?->role ?? 'sistem',
                'isi' => $pesan->isi,
                'lampiranFoto' => $pesan->lampiran_foto,
                'statusKirim' => $pesan->status_kirim,
                'waktu' => TanggalIndonesia::waktu($pesan->waktu),
            ])->values()->all(),
        ]);
    }

    /**
     * Kirim pesan dokter spesialis pada ruang konsultasi.
     */
    public function storePesan(Request $request, int $konsultasi): RedirectResponse
    {
        $dokter = $this->dokterSaya($request);

        $data = Konsultasi::query()
            ->whereKey($konsultasi)
            ->where('dokter_spesialis_id', $dokter->id)
            ->firstOrFail();

        if (! in_array($data->status, ['DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'], true)) {
            return back()->with('error', 'Ruang konsultasi belum dibuka.');
        }

        $validated = $request->validate([
            'isi' => ['nullable', 'string', 'max:2000'],
            'lampiran_foto' => ['nullable', 'image', 'max:2048'],
        ]);

        if (blank($validated['isi'] ?? null) && ! $request->hasFile('lampiran_foto')) {
            return back()->with('error', 'Tulis pesan atau lampirkan foto sebelum mengirim.');
        }

        if ($data->status === 'DIKONFIRMASI') {
            $data->update(['status' => 'BERLANGSUNG']);
        }

        $lampiran = $request->file('lampiran_foto')?->store('chat', 'public');

        Pesan::query()->create([
            'konsultasi_id' => $data->id,
            'pengirim_id' => $request->user()->id,
            'isi' => $validated['isi'] ?? null,
            'lampiran_foto' => $lampiran,
            'status_kirim' => 'terkirim',
            'waktu' => Carbon::now(),
        ]);

        return back();
    }

    private function dokterSaya(Request $request): Dokter
    {
        $dokter = Dokter::query()
            ->where('user_id', $request->user()->id)
            ->where('peran', 'spesialis')
            ->first();

        abort_if($dokter === null, 403, 'Profil dokter belum terhubung. Hubungi admin untuk melengkapi data dokter.');

        return $dokter;
    }
}
