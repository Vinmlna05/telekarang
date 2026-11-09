<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pasien', function (Blueprint $table) {
            $table->string('telepon', 30)->nullable();
            $table->string('golongan_darah', 16)->nullable();
            $table->text('alergi')->nullable();
            $table->text('obat_rutin')->nullable();
            $table->string('kontak_darurat_nama')->nullable();
            $table->string('kontak_darurat_hubungan', 50)->nullable();
            $table->string('kontak_darurat_telepon', 30)->nullable();
            $table->string('status_verifikasi')->default('TERVERIFIKASI')->index();
            $table->foreignId('diverifikasi_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('diverifikasi_pada')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pasien', function (Blueprint $table) {
            $table->dropForeign(['diverifikasi_oleh']);
            $table->dropColumn([
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
            ]);
        });
    }
};
