<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HasilKonsultasi extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'hasil_konsultasi';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'konsultasi_id',
        'icd10_kode',
        'saran',
        'keputusan_rujuk',
        'alasan_rujuk',
        'biaya_rujukan',
        'waktu',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'keputusan_rujuk' => 'boolean',
        'biaya_rujukan' => 'decimal:2',
        'waktu' => 'datetime',
    ];

    /**
     * Konsultasi yang menghasilkan catatan ini.
     */
    public function konsultasi(): BelongsTo
    {
        return $this->belongsTo(Konsultasi::class);
    }

    /**
     * Kode diagnosis ICD-10.
     */
    public function icd10(): BelongsTo
    {
        return $this->belongsTo(Icd10::class, 'icd10_kode', 'kode');
    }
}
