<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     * Akun pengguna yang terhubung dengan profil dokter.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
