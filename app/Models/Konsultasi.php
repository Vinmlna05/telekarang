<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Konsultasi extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'konsultasi';

    /**
     * Nilai mode konsultasi yang valid.
     *
     * @var list<string>
     */
    public const MODE = ['video', 'teks'];

    /**
     * Nilai status konsultasi yang valid.
     *
     * @var list<string>
     */
    public const STATUS = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
        'SELESAI',
        'DIJADWAL_ULANG',
        'DITOLAK',
        'KEDALUWARSA',
        'DIBATALKAN',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pasien_id',
        'dibuat_oleh',
        'dokter_pengirim_id',
        'dokter_spesialis_id',
        'jadwal_id',
        'mode',
        'status',
        'keluhan',
        'tanggal',
        'dikonfirmasi_pada',
        'kedaluwarsa_pada',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal' => 'datetime',
        'dikonfirmasi_pada' => 'datetime',
        'kedaluwarsa_pada' => 'datetime',
    ];

    /**
     * Pasien yang berkonsultasi.
     */
    public function pasien(): BelongsTo
    {
        return $this->belongsTo(Pasien::class);
    }

    /**
     * Pengguna yang membuat permintaan konsultasi.
     */
    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    /**
     * Dokter umum pengirim.
     */
    public function dokterPengirim(): BelongsTo
    {
        return $this->belongsTo(Dokter::class, 'dokter_pengirim_id');
    }

    /**
     * Dokter spesialis yang menangani konsultasi.
     */
    public function dokterSpesialis(): BelongsTo
    {
        return $this->belongsTo(Dokter::class, 'dokter_spesialis_id');
    }

    /**
     * Hasil konsultasi.
     */
    public function hasil(): HasOne
    {
        return $this->hasOne(HasilKonsultasi::class);
    }
}
