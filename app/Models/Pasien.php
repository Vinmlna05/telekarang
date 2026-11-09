<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pasien extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'pasien';

    /**
     * Status verifikasi identitas pasien.
     *
     * @var list<string>
     */
    public const STATUS_MENUNGGU_VERIFIKASI = 'MENUNGGU_VERIFIKASI';

    public const STATUS_TERVERIFIKASI = 'TERVERIFIKASI';

    public const STATUS_VERIFIKASI = [self::STATUS_MENUNGGU_VERIFIKASI, self::STATUS_TERVERIFIKASI];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nama',
        'nik',
        'tgl_lahir',
        'jenis_kelamin',
        'alamat',
        'telepon',
        'golongan_darah',
        'alergi',
        'obat_rutin',
        'kontak_darurat_nama',
        'kontak_darurat_hubungan',
        'kontak_darurat_telepon',
        'status_verifikasi',
        'diverifikasi_oleh',
        'diverifikasi_pada',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tgl_lahir' => 'date',
        'diverifikasi_pada' => 'datetime',
    ];

    /**
     * Akun pengguna pasien (opsional).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Petugas yang memverifikasi identitas pasien.
     */
    public function diverifikasiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }

    /**
     * Daftar konsultasi milik pasien.
     */
    public function konsultasi(): HasMany
    {
        return $this->hasMany(Konsultasi::class);
    }

    /**
     * Nomor rekam medis yang dibuat sistem, bukan input pasien.
     */
    public function nomorRekamMedis(): ?string
    {
        if ($this->status_verifikasi !== 'TERVERIFIKASI') {
            return null;
        }

        return 'RM-'.$this->created_at->format('Y').'-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }
}
