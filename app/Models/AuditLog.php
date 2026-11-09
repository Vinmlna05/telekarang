<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'audit_log';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'aksi',
        'entitas',
        'entitas_id',
        'keterangan',
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
     * Pengguna yang melakukan aksi.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Catat satu aktivitas ke audit log.
     */
    public static function catat(
        ?User $user,
        string $aksi,
        string $entitas,
        ?string $entitasId = null,
        ?string $keterangan = null,
    ): self {
        return self::query()->create([
            'user_id' => $user?->id,
            'aksi' => $aksi,
            'entitas' => $entitas,
            'entitas_id' => $entitasId,
            'keterangan' => $keterangan,
            'waktu' => now(),
        ]);
    }
}
