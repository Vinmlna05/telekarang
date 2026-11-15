<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class TanggalSkrining
{
    /**
     * Jumlah hari ke depan yang boleh dipilih pasien.
     */
    public const BATAS_HARI = 14;

    /**
     * Daftar tanggal skrining yang dapat dipilih (H+0 s/d H+14, hari kerja).
     *
     * @return list<array{value: string, label: string, singkat: string}>
     */
    public static function daftar(?Carbon $mulai = null): array
    {
        $mulai = ($mulai ?? Carbon::today())->copy()->startOfDay();
        $hasil = [];

        for ($i = 0; $i <= self::BATAS_HARI; $i++) {
            $tanggal = $mulai->copy()->addDays($i);

            if ($tanggal->isWeekend()) {
                continue;
            }

            $hasil[] = [
                'value' => $tanggal->toDateString(),
                'label' => TanggalIndonesia::format($tanggal),
                'singkat' => TanggalIndonesia::singkat($tanggal),
            ];
        }

        return $hasil;
    }

    /**
     * Tanggal terakhir yang boleh dipilih.
     */
    public static function batasAkhir(): Carbon
    {
        return Carbon::today()->addDays(self::BATAS_HARI)->endOfDay();
    }

    /**
     * Apakah tanggal berada pada rentang dan hari kerja yang diizinkan.
     */
    public static function valid(Carbon $tanggal): bool
    {
        return ! $tanggal->isWeekend()
            && $tanggal->startOfDay()->greaterThanOrEqualTo(Carbon::today())
            && $tanggal->startOfDay()->lessThanOrEqualTo(self::batasAkhir()->startOfDay());
    }
}
