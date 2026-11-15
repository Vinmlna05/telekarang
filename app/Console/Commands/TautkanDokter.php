<?php

namespace App\Console\Commands;

use App\Models\Dokter;
use App\Models\User;
use Illuminate\Console\Command;

class TautkanDokter extends Command
{
    /**
     * Nama dan tanda tangan perintah.
     *
     * @var string
     */
    protected $signature = 'telekarang:tautkan-dokter';

    /**
     * Deskripsi perintah.
     *
     * @var string
     */
    protected $description = 'Buat profil dokter untuk akun dokter yang belum memiliki data dokter';

    /**
     * Jalankan perintah.
     */
    public function handle(): int
    {
        $akun = User::query()
            ->whereIn('role', ['dokter_umum', 'spesialis'])
            ->whereDoesntHave('dokter')
            ->get();

        if ($akun->isEmpty()) {
            $this->info('Semua akun dokter sudah memiliki profil dokter.');

            return self::SUCCESS;
        }

        foreach ($akun as $user) {
            Dokter::pastikanUntuk($user);

            $this->line("Profil dokter dibuat untuk {$user->name} ({$user->email}).");
        }

        $this->info("Selesai. {$akun->count()} profil dokter ditautkan.");

        return self::SUCCESS;
    }
}
