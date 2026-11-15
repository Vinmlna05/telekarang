<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skrining extends Model
{
    /**
     * @var string
     */
    protected $table = 'skrining';

    /**
     * Nilai prioritas penanganan yang dipilih perawat.
     *
     * @var list<string>
     */
    public const PRIORITAS = ['sedang', 'darurat'];

    public const PRIORITAS_SEDANG = 'sedang';

    public const PRIORITAS_DARURAT = 'darurat';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'konsultasi_id',
        'perawat_id',
        'berat',
        'tinggi',
        'sistol',
        'diastol',
        'suhu',
        'nadi',
        'spo2',
        'tanda_bahaya',
        'prioritas',
        'catatan',
        'waktu',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'berat' => 'decimal:2',
        'tinggi' => 'decimal:2',
        'suhu' => 'decimal:1',
        'tanda_bahaya' => 'boolean',
        'waktu' => 'datetime',
    ];

    public function konsultasi(): BelongsTo
    {
        return $this->belongsTo(Konsultasi::class);
    }

    public function perawat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'perawat_id');
    }
}
