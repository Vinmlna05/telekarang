<?php

namespace App\Http\Controllers\Perawat;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Dokter;
use App\Models\Jadwal;
use App\Models\Konsultasi;
use App\Models\Pesan;
use App\Support\TanggalIndonesia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KonsultasiController extends Controller
{
    /**
     * Status yang mengizinkan perawat memilih dokter spesialis dan slot.
     *
     * @var list<string>
     */
    public const STATUS_PILIH_SPESIALIS = ['MENUNGGU_PEMILIHAN_SPESIALIS', 'DIJADWAL_ULANG'];

    /**
     * Status yang mengizinkan ruang konsultasi dibuka.
     *
     * @var list<string>
     */
    public const STATUS_RUANG = ['MENUNGGU_SPESIALIS', 'DIKONFIRMASI', 'BERLANGSUNG', 'SELESAI'];

    public function __invoke(int $konsultasi): Response
    {
        $data = Konsultasi::query()
            ->with([
                'pasien',
                'skrining.perawat',
                'dokterSpesialis',
                'dokterPengirim',
                'jadwal',
                'hasil.icd10',
                'pembuat',
                'pesan.pengirim',
            ])
            ->whereKey($konsultasi)
            ->firstOrFail();

        $pasien = $data->pasien;
        $skrining = $data->skrining;
        $hasil = $data->hasil;
        $tanggalTampil = $data->tanggal ?? $data->tanggal_skrining;

        return Inertia::render('perawat/konsultasi-detail', [
            'konsultasi' => [
                'id' => $data->id,
                'nomor' => 'KNS-'.($tanggalTampil?->format('Y') ?? now()->format('Y')).'-'.str_pad((string) $data->id, 4, '0', STR_PAD_LEFT),
                'status' => $data->status,
                'keluhan' => $data->keluhan,
                'mode' => $data->mode,
                'tanggal' => TanggalIndonesia::format($data->tanggal ?? $data->tanggal_skrining),
                'tanggalSkrining' => TanggalIndonesia::format($data->tanggal_skrining),
                'dokter' => $data->dokterSpesialis?->nama,
                'spesialisasi' => $data->dokterSpesialis?->spesialisasi,
                'faskes' => $data->dokterSpesialis?->faskes,
                'jadwal' => $this->formatJadwal($data),
                'prioritas' => $data->prioritasKartu(),
                'catatanDokter' => $data->catatan_dokter,
                'keputusanDokter' => $data->keputusan_dokter,
                'alasanStatus' => $data->alasan_status,
                'dikonfirmasiPada' => TanggalIndonesia::waktu($data->dikonfirmasi_pada),
            ],
            'pasien' => [
                'nama' => $pasien?->nama ?? 'Pasien',
                'usia' => $pasien?->tgl_lahir?->age ?? 0,
                'jenisKelamin' => str_starts_with($pasien?->jenis_kelamin ?? '', 'L') ? 'L' : 'P',
                'nik' => $pasien?->nik ?? '-',
                'noRm' => $pasien?->nomorRekamMedis() ?? '-',
                'alamat' => $pasien?->alamat ?? '-',
                'telepon' => $pasien?->telepon ?? '-',
                'sumber' => $data->pembuat?->role === 'pasien' ? 'Akun pasien' : 'Didaftarkan perawat',
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
                'alasanRujuk' => $hasil->alasan_rujuk,
                'biayaRujukan' => $hasil->biaya_rujukan === null ? null : (float) $hasil->biaya_rujukan,
                'waktu' => TanggalIndonesia::waktu($hasil->waktu),
            ],
            'dokterTersedia' => $this->dokterTersedia(),
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
     * Simpan pilihan dokter spesialis dan slot jadwal oleh perawat.
     */
    public function storeSpesialis(Request $request, int $konsultasi): RedirectResponse
    {
        $data = Konsultasi::query()->with('pasien')->whereKey($konsultasi)->firstOrFail();

        if (! in_array($data->status, self::STATUS_PILIH_SPESIALIS, true)) {
            return back()->with('error', 'Permintaan ini belum siap dipilihkan dokter spesialis.');
        }

        $validated = $request->validate([
            'dokter_id' => ['required', 'integer', Rule::exists('dokter', 'id')->where('peran', 'spesialis')->where('status', 'aktif')],
            'jadwal_id' => ['required', 'integer', Rule::exists('jadwal', 'id')->where('status', 'tersedia')],
        ]);

        $dokter = Dokter::query()->whereKey($validated['dokter_id'])->firstOrFail();
        $jadwal = Jadwal::query()
            ->whereKey($validated['jadwal_id'])
            ->where('dokter_id', $dokter->id)
            ->first();

        if ($jadwal === null || $jadwal->status !== 'tersedia') {
            return back()->with('error', 'Slot jadwal tidak tersedia untuk dokter tersebut.');
        }

        if ($data->jadwal_id !== null && $data->jadwal_id !== $jadwal->id) {
            Jadwal::query()->whereKey($data->jadwal_id)->update(['status' => 'tersedia']);
        }

        $data->update([
            'dokter_spesialis_id' => $dokter->id,
            'jadwal_id' => $jadwal->id,
            'tanggal' => $this->tanggalSlot($jadwal),
            'status' => 'MENUNGGU_SPESIALIS',
            'alasan_status' => null,
        ]);

        $jadwal->update(['status' => 'terisi']);

        AuditLog::catat(
            $request->user(),
            'pilih_spesialis',
            'konsultasi',
            (string) $data->id,
            'Perawat memilih '.$dokter->nama.' ('.$jadwal->hari.' '.substr($jadwal->jam_mulai, 0, 5).') untuk '.($data->pasien?->nama ?? 'pasien'),
        );

        return to_route('perawat.konsultasi.detail', $data->id)
            ->with('success', 'Jadwal dikirim ke '.$dokter->nama.'. Menunggu konfirmasi dokter spesialis.');
    }

    /**
     * Kirim pesan pada ruang konsultasi mode teks.
     */
    public function storePesan(Request $request, int $konsultasi): RedirectResponse
    {
        $data = Konsultasi::query()->whereKey($konsultasi)->firstOrFail();

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

    /**
     * Daftar dokter spesialis aktif beserta slot tersedia.
     *
     * @return list<array<string, mixed>>
     */
    private function dokterTersedia(): array
    {
        return Dokter::query()
            ->where('peran', 'spesialis')
            ->where('status', 'aktif')
            ->with(['jadwal' => fn ($query) => $query->orderBy('hari')->orderBy('jam_mulai')])
            ->orderBy('nama')
            ->get()
            ->map(fn (Dokter $dokter) => [
                'id' => $dokter->id,
                'nama' => $dokter->nama,
                'spesialisasi' => $dokter->spesialisasi ?? 'Spesialis',
                'faskes' => $dokter->faskes ?? 'RS Rujukan',
                'jadwal' => $dokter->jadwal->map(fn (Jadwal $jadwal) => [
                    'id' => $jadwal->id,
                    'hari' => $jadwal->hari,
                    'jamMulai' => substr($jadwal->jam_mulai, 0, 5),
                    'jamSelesai' => substr($jadwal->jam_selesai, 0, 5),
                    'status' => $jadwal->status,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    private function formatJadwal(Konsultasi $konsultasi): ?string
    {
        if ($konsultasi->jadwal !== null) {
            return $konsultasi->jadwal->hari.' · '.substr($konsultasi->jadwal->jam_mulai, 0, 5).'–'.substr($konsultasi->jadwal->jam_selesai, 0, 5).' WIT';
        }

        return $konsultasi->tanggal === null
            ? null
            : TanggalIndonesia::format($konsultasi->tanggal).' · '.$konsultasi->tanggal->format('H.i').' WIT';
    }

    /**
     * Tanggal terdekat yang cocok dengan hari slot jadwal.
     */
    private function tanggalSlot(Jadwal $jadwal): Carbon
    {
        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $target = array_search($jadwal->hari, $hari, true);
        $tanggal = Carbon::today();

        if ($target !== false) {
            while ((int) $tanggal->format('w') !== (int) $target) {
                $tanggal->addDay();
            }
        }

        return $tanggal->setTimeFromTimeString(substr($jadwal->jam_mulai, 0, 5));
    }
}
