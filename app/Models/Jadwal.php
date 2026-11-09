<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Jadwal extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'jadwal';

    /**
     * Nilai status slot jadwal yang valid.
     *
     * @var list<string>
     */
    public const STATUS = ['tersedia', 'terisi', 'libur'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'dokter_id',
        'hari',
        'jam_mulai',
        'jam_selesai',
        'status',
    ];

    /**
     * Dokter pemilik jadwal praktik.
     */
    public function dokter(): BelongsTo
    {
        return $this->belongsTo(Dokter::class);
    }
}
