<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Icd10 extends Model
{
    use HasFactory;

    /**
     * Nama tabel domain sesuai skema TeleKarang.
     *
     * @var string
     */
    protected $table = 'icd10';

    /**
     * Primary key berupa kode ICD-10, bukan auto increment.
     *
     * @var string
     */
    protected $primaryKey = 'kode';

    /**
     * Kode ICD-10 bertipe string dan tidak auto increment.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Tipe primary key.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode',
        'nama_diagnosis',
        'pemakaian',
    ];
}
