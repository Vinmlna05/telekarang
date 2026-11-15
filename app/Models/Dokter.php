<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dokter extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'dokter';

    /**
     * Nilai peran dokter yang valid.
     *
     * @var list<string>
     */
    public const PERAN = ['umum', 'spesialis'];

    /**
     * Nilai status dokter yang valid.
     *
     * @var list<string>
     */
    public const STATUS = ['aktif', 'nonaktif'];

    /**
     * Pilihan spesialisasi dokter spesialis.
     *
     * @var list<string>
     */
    public const SPESIALISASI = ['Anak', 'Penyakit Dalam', 'Kulit', 'Kandungan', 'Bedah', 'Mata', 'THT', 'Saraf', 'Lainnya'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nama',
        'peran',
        'spesialisasi',
        'faskes',
        'status',
    ];

    /**
     * Pastikan akun dokter memiliki profil dokter yang sesuai perannya.
     */
    public static function pastikanUntuk(User $user, ?string $spesialisasi = null): ?self
    {
        $peran = match ($user->role) {
            'dokter_umum' => 'umum',
            'spesialis' => 'spesialis',
            default => null,
        };

        if ($peran === null) {
            return null;
        }

        $dokter = self::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'nama' => $user->name,
                'peran' => $peran,
                'spesialisasi' => $peran === 'spesialis' ? $spesialisasi : null,
                'faskes' => $peran === 'spesialis' ? 'RS Rujukan Daratan' : 'Puskesmas Pulau Karang',
                'status' => 'aktif',
            ],
        );

        $perubahan = [];

        if ($dokter->peran !== $peran) {
            $perubahan['peran'] = $peran;
            $perubahan['spesialisasi'] = $peran === 'spesialis'
                ? ($dokter->spesialisasi ?: $spesialisasi)
                : null;
        } elseif ($peran === 'spesialis' && blank($dokter->spesialisasi) && filled($spesialisasi)) {
            $perubahan['spesialisasi'] = $spesialisasi;
        }

        if ($perubahan !== []) {
            $dokter->update($perubahan);
        }

        return $dokter;
    }

    /**
     * Akun pengguna yang terhubung dengan profil dokter.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Slot jadwal praktik dokter.
     */
    public function jadwal(): HasMany
    {
        return $this->hasMany(Jadwal::class);
    }
}
