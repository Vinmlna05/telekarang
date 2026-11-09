<?php

namespace Database\Seeders;

use App\Models\Pasien;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PasienSeeder extends Seeder
{
    /**
     * Seed 10 pasien fiktif, sebagian memiliki akun.
     */
    public function run(): void
    {
        $pasien = [
            [
                'nama' => 'Aisyah Rahmawati',
                'nik' => '9101010101010001',
                'tgl_lahir' => '1991-03-14',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Karang Indah, Pulau Karang',
                'akun' => 'aisyah@telekarang.test',
            ],
            [
                'nama' => 'Salim Abdullah',
                'nik' => '9101010101010002',
                'tgl_lahir' => '1968-08-02',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Dusun Tanjung Batu, Pulau Karang',
                'akun' => 'salim@telekarang.test',
            ],
            [
                'nama' => 'Nur Aini',
                'nik' => '9101010101010003',
                'tgl_lahir' => '2016-11-21',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Karang Indah, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Fatimah Zahra',
                'nik' => '9101010101010004',
                'tgl_lahir' => '1985-06-09',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Pulau Seribu, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Yusuf Maulana',
                'nik' => '9101010101010005',
                'tgl_lahir' => '1979-01-30',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Dusun Tanjung Batu, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Halimah Sadiah',
                'nik' => '9101010101010006',
                'tgl_lahir' => '1957-12-05',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Karang Indah, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Rahman Hidayat',
                'nik' => '9101010101010007',
                'tgl_lahir' => '1996-09-17',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Dusun Pulau Seribu, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Aminah',
                'nik' => '9101010101010008',
                'tgl_lahir' => '1972-04-11',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Tanjung Batu, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Ibrahim Saleh',
                'nik' => '9101010101010009',
                'tgl_lahir' => '2008-02-26',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Dusun Karang Indah, Pulau Karang',
                'akun' => null,
            ],
            [
                'nama' => 'Siti Khadijah',
                'nik' => '9101010101010010',
                'tgl_lahir' => '1989-10-08',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Pulau Seribu, Pulau Karang',
                'akun' => null,
            ],
        ];

        foreach ($pasien as $data) {
            $userId = null;

            if ($data['akun'] !== null) {
                $user = User::query()->firstOrCreate(
                    ['email' => $data['akun']],
                    [
                        'name' => $data['nama'],
                        'role' => 'pasien',
                        'password' => Hash::make('password'),
                        'email_verified_at' => now(),
                    ],
                );

                $userId = $user->id;
            }

            Pasien::query()->updateOrCreate(
                ['nik' => $data['nik']],
                [
                    'user_id' => $userId,
                    'nama' => $data['nama'],
                    'tgl_lahir' => $data['tgl_lahir'],
                    'jenis_kelamin' => $data['jenis_kelamin'],
                    'alamat' => $data['alamat'],
                ],
            );
        }
    }
}
