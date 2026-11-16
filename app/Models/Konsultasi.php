<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
     * Status sebelum dokter umum memutuskan arah penanganan.
     *
     * @var list<string>
     */
    public const STATUS_BELUM_DIPUTUSKAN = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
    ];

    /**
     * Nilai status konsultasi yang valid.
     *
     * @var list<string>
     */
    public const STATUS = [
        'MENUNGGU_SKRINING',
        'SKRINING_SELESAI',
        'MENUNGGU_PEMILIHAN_SPESIALIS',
        'MENUNGGU_SPESIALIS',
        'DIKONFIRMASI',
        'BERLANGSUNG',
        'SELESAI',
        'DIRUJUK',
        'DITANGANI_PUSKESMAS',
        'DIJADWAL_ULANG',
        'DITOLAK',
        'KEDALUWARSA',
        'DIBATALKAN',
    ];

    /**
     * Status akhir yang tidak lagi berubah.
     *
     * @var list<string>
     */
    public const STATUS_TERMINAL = [
        'SELESAI',
        'DIRUJUK',
        'DITANGANI_PUSKESMAS',
        'DITOLAK',
        'KEDALUWARSA',
        'DIBATALKAN',
    ];

    /**
     * Keputusan dokter umum setelah review skrining.
     */
    public const KEPUTUSAN_KONSULTASI_SPESIALIS = 'KONSULTASI_SPESIALIS';

    public const KEPUTUSAN_RUJUK = 'RUJUK';

    public const KEPUTUSAN_TANGANI_PUSKESMAS = 'TANGANI_PUSKESMAS';

    /**
     * @var list<string>
     */
    public const KEPUTUSAN_DOKTER = [
        self::KEPUTUSAN_KONSULTASI_SPESIALIS,
        self::KEPUTUSAN_RUJUK,
        self::KEPUTUSAN_TANGANI_PUSKESMAS,
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
        'tautan_video',
        'status',
        'keluhan',
        'tanggal_skrining',
        'tanggal',
        'keputusan_dokter',
        'catatan_dokter',
        'alasan_status',
        'diputuskan_oleh',
        'diputuskan_pada',
        'dikonfirmasi_pada',
        'kedaluwarsa_pada',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_skrining' => 'date',
        'tanggal' => 'datetime',
        'diputuskan_pada' => 'datetime',
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
     * Slot jadwal spesialis yang dipilih perawat.
     */
    public function jadwal(): BelongsTo
    {
        return $this->belongsTo(Jadwal::class);
    }

    /**
     * Pengguna yang menetapkan keputusan dokter umum.
     */
    public function diputuskanOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diputuskan_oleh');
    }

    /**
     * Pesan pada ruang konsultasi.
     */
    public function pesan(): HasMany
    {
        return $this->hasMany(Pesan::class)->orderBy('waktu');
    }

    /**
     * Hasil konsultasi.
     */
    public function hasil(): HasOne
    {
        return $this->hasOne(HasilKonsultasi::class);
    }

    /**
     * Data skrining perawat.
     */
    public function skrining(): HasOne
    {
        return $this->hasOne(Skrining::class);
    }

    /**
     * Akun pasien dipakai sebagai lawan bicara spesialis bila ada.
     */
    public function pasienPunyaAkun(): bool
    {
        return $this->pasien !== null && $this->pasien->user_id !== null;
    }

    /**
     * Status akhir yang tidak boleh diubah lagi.
     */
    public function sudahSelesai(): bool
    {
        return in_array($this->status, self::STATUS_TERMINAL, true);
    }

    /**
     * Prioritas kartu: pilihan perawat setelah skrining, atau deteksi keluhan sebelum skrining.
     */
    public function prioritasKartu(): ?string
    {
        $skrining = $this->skrining;

        if ($skrining !== null) {
            if (in_array($skrining->prioritas, Skrining::PRIORITAS, true)) {
                return $skrining->prioritas;
            }

            return $skrining->tanda_bahaya
                ? Skrining::PRIORITAS_DARURAT
                : Skrining::PRIORITAS_SEDANG;
        }

        $keluhan = strtolower($this->keluhan ?? '');

        return str_contains($keluhan, 'sesak berat') || str_contains($keluhan, 'tidak sadar')
            ? Skrining::PRIORITAS_DARURAT
            : null;
    }
}
