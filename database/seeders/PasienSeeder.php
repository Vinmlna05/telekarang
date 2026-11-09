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
                'telepon' => '081234567801',
                'golongan_darah' => 'O',
                'alergi' => 'Debu dan udara dingin.',
                'obat_rutin' => null,
                'kontak_darurat_nama' => 'Siti Khadijah',
                'kontak_darurat_hubungan' => 'Ibu',
                'kontak_darurat_telepon' => '081234567810',
                'akun' => 'aisyah@telekarang.test',
            ],
            [
                'nama' => 'Salim Abdullah',
                'nik' => '9101010101010002',
                'tgl_lahir' => '1968-08-02',
                'jenis_kelamin' => 'Laki-laki',
                'alamat' => 'Dusun Tanjung Batu, Pulau Karang',
                'telepon' => '081234567802',
                'golongan_darah' => 'A',
                'alergi' => 'Penisilin.',
                'obat_rutin' => 'Amlodipine 10 mg setiap pagi.',
                'kontak_darurat_nama' => 'Rahman Hidayat',
                'kontak_darurat_hubungan' => 'Anak',
                'kontak_darurat_telepon' => '081234567807',
                'akun' => 'salim@telekarang.test',
            ],
            [
                'nama' => 'Nur Aini',
                'nik' => '9101010101010003',
                'tgl_lahir' => '2016-11-21',
                'jenis_kelamin' => 'Perempuan',
                'alamat' => 'Dusun Karang Indah, Pulau Karang',
                'telepon' => null,
                'golongan_darah' => 'B',
                'alergi' => null,
                'obat_rutin' => null,
                'kontak_darurat_nama' => 'Fatimah Zahra',
                'kontak_darurat_hubungan' => 'Ibu',
                'kontak_darurat_telepon' => '081234567804',
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
                    'telepon' => $data['telepon'] ?? null,
                    'golongan_darah' => $data['golongan_darah'] ?? null,
                    'alergi' => $data['alergi'] ?? null,
                    'obat_rutin' => $data['obat_rutin'] ?? null,
                    'kontak_darurat_nama' => $data['kontak_darurat_nama'] ?? null,
                    'kontak_darurat_hubungan' => $data['kontak_darurat_hubungan'] ?? null,
                    'kontak_darurat_telepon' => $data['kontak_darurat_telepon'] ?? null,
                    'status_verifikasi' => 'TERVERIFIKASI',
                ],
            );
        }
    }
}
