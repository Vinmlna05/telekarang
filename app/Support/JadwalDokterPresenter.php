<?php

namespace App\Support;

use App\Models\Dokter;
use App\Models\Jadwal;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class JadwalDokterPresenter
{
    /**
     * Urutan hari praktik yang ditampilkan di antarmuka.
     *
     * @var list<string>
     */
    private const URUTAN_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * Nama hari berdasarkan indeks Carbon (0 = Minggu).
     *
     * @var list<string>
     */
    private const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * Susun daftar dokter spesialis aktif beserta ringkasan jadwal praktiknya.
     *
     * @return list<array<string, mixed>>
     */
    public static function daftar(): array
    {
        return Dokter::query()
            ->with(['jadwal' => fn ($query) => $query->orderBy('jam_mulai')])
            ->where('peran', 'spesialis')
            ->where('status', 'aktif')
            ->whereNotNull('spesialisasi')
            ->whereHas('jadwal')
            ->orderBy('nama')
            ->get()
            ->map(fn (Dokter $dokter) => self::bentuk($dokter))
            ->values()
            ->all();
    }

    /**
     * Ubah satu dokter beserta relasi jadwalnya menjadi bentuk yang dipakai frontend.
     *
     * @return array<string, mixed>
     */
    private static function bentuk(Dokter $dokter): array
    {
        /** @var Collection<int, Jadwal> $jadwal */
        $jadwal = $dokter->jadwal;
        $tersedia = $jadwal->where('status', 'tersedia');
        $terisi = $jadwal->where('status', 'terisi');

        $status = match (true) {
            $tersedia->isNotEmpty() => 'tersedia',
            $terisi->isNotEmpty() => 'terisi',
            default => 'libur',
        };

        $hari = $jadwal
            ->pluck('hari')
            ->unique()
            ->sortBy(fn (string $namaHari) => self::posisiHari($namaHari))
            ->values();

        [$hariTerdekat, $slotTerdekat] = self::slotTerdekat($tersedia);

        if ($hariTerdekat === null) {
            $slotPertama = $jadwal->sortBy('jam_mulai')->first();
            $hariTerdekat = $slotPertama?->hari;
            $slotTerdekat = $slotPertama === null ? null : self::formatJam($slotPertama->jam_mulai);
        }

        $slotHariTerdekat = $hariTerdekat === null
            ? collect()
            : $jadwal->where('hari', $hariTerdekat);

        $slots = $hariTerdekat === null
            ? []
            : $tersedia
                ->where('hari', $hariTerdekat)
                ->sortBy('jam_mulai')
                ->map(fn (Jadwal $slot) => self::formatJam($slot->jam_mulai))
                ->values()
                ->all();

        return [
            'id' => $dokter->id,
            'nama' => $dokter->nama,
            'spesialisasi' => $dokter->spesialisasi,
            'faskes' => $dokter->faskes,
            'hari' => $hari->all(),
            'jam' => self::rentangJam($slotHariTerdekat),
            'hariTerdekat' => $hariTerdekat ?? '',
            'slotTerdekat' => $slotTerdekat ?? '',
            'status' => $status,
            'slots' => $slots,
        ];
    }

    /**
     * Cari hari dan slot tersedia terdekat dari hari ini.
     *
     * @param  Collection<int, Jadwal>  $tersedia
     * @return array{0: ?string, 1: ?string}
     */
    private static function slotTerdekat(Collection $tersedia): array
    {
        if ($tersedia->isEmpty()) {
            return [null, null];
        }

        foreach (self::urutanMulaiHariIni() as $hari) {
            $slot = $tersedia
                ->where('hari', $hari)
                ->sortBy('jam_mulai')
                ->first();

            if ($slot !== null) {
                return [$hari, self::formatJam($slot->jam_mulai)];
            }
        }

        return [null, null];
    }

    /**
     * Urutan hari dimulai dari hari ini, lalu berputar ke awal pekan.
     *
     * @return list<string>
     */
    private static function urutanMulaiHariIni(): array
    {
        $hariIni = self::NAMA_HARI[(int) Carbon::now()->format('w')];
        $posisi = array_search($hariIni, self::URUTAN_HARI, true);

        if ($posisi === false) {
            return self::URUTAN_HARI;
        }

        return array_merge(
            array_slice(self::URUTAN_HARI, $posisi),
            array_slice(self::URUTAN_HARI, 0, $posisi),
        );
    }

    /**
     * Posisi hari pada urutan tampilan; hari di luar urutan diletakkan paling akhir.
     */
    private static function posisiHari(string $hari): int
    {
        $posisi = array_search($hari, self::URUTAN_HARI, true);

        return $posisi === false ? count(self::URUTAN_HARI) : $posisi;
    }

    /**
     * Format rentang jam praktik pada satu hari.
     *
     * @param  Collection<int, Jadwal>  $jadwal
     */
    private static function rentangJam(Collection $jadwal): string
    {
        if ($jadwal->isEmpty()) {
            return '-';
        }

        $mulai = $jadwal->sortBy('jam_mulai')->first()->jam_mulai;
        $selesai = $jadwal->sortByDesc('jam_selesai')->first()->jam_selesai;

        return self::formatJam($mulai).'–'.self::formatJam($selesai).' WIT';
    }

    /**
     * Ubah jam database (HH:MM:SS) menjadi format tampilan (HH.MM).
     */
    private static function formatJam(string $jam): string
    {
        return Carbon::parse($jam)->format('H.i');
    }
}
