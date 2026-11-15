<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pesan extends Model
{
    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'pesan';

    /**
     * Status pengiriman pesan.
     *
     * @var list<string>
     */
    public const STATUS_KIRIM = ['menunggu', 'terkirim', 'gagal'];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'konsultasi_id',
        'pengirim_id',
        'isi',
        'lampiran_foto',
        'status_kirim',
        'waktu',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'waktu' => 'datetime',
    ];

    /**
     * Konsultasi tempat pesan dikirim.
     */
    public function konsultasi(): BelongsTo
    {
        return $this->belongsTo(Konsultasi::class);
    }

    /**
     * Pengguna pengirim pesan.
     */
    public function pengirim(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengirim_id');
    }
}
