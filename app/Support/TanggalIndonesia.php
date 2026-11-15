<?php

namespace App\Support;

use Illuminate\Support\Carbon;

class TanggalIndonesia
{
    /**
     * @var array<int, string>
     */
    private const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    /**
     * @var array<int, string>
     */
    private const BULAN = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    public static function format(?Carbon $tanggal): ?string
    {
        if ($tanggal === null) {
            return null;
        }

        return self::HARI[(int) $tanggal->format('w')]
            .', '.$tanggal->format('j')
            .' '.self::BULAN[(int) $tanggal->format('n')]
            .' '.$tanggal->format('Y');
    }

    public static function singkat(?Carbon $tanggal): ?string
    {
        if ($tanggal === null) {
            return null;
        }

        return $tanggal->format('d')
            .' '.substr(self::BULAN[(int) $tanggal->format('n')], 0, 3)
            .' '.$tanggal->format('Y');
    }

    public static function waktu(?Carbon $waktu): ?string
    {
        if ($waktu === null) {
            return null;
        }

        return $waktu->format('j')
            .' '.self::BULAN[(int) $waktu->format('n')]
            .' '.$waktu->format('Y')
            .' · '.$waktu->format('H.i').' WIT';
    }
}
