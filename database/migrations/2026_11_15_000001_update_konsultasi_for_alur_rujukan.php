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
        Schema::table('konsultasi', function (Blueprint $table) {
            $table->date('tanggal_skrining')->nullable()->after('keluhan');
            $table->string('keputusan_dokter')->nullable()->index()->after('status');
            $table->text('catatan_dokter')->nullable()->after('keputusan_dokter');
            $table->text('alasan_status')->nullable()->after('catatan_dokter');
            $table->foreignId('diputuskan_oleh')->nullable()->constrained('users')->nullOnDelete()->after('alasan_status');
            $table->timestamp('diputuskan_pada')->nullable()->after('diputuskan_oleh');
        });

        Schema::table('konsultasi', function (Blueprint $table) {
            $table->foreign('jadwal_id')->references('id')->on('jadwal')->nullOnDelete();
        });

        Schema::table('konsultasi', function (Blueprint $table) {
            $table->foreignId('dokter_spesialis_id')->nullable()->change();
            $table->timestamp('tanggal')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('konsultasi', function (Blueprint $table) {
            $table->timestamp('tanggal')->nullable(false)->change();
            $table->foreignId('dokter_spesialis_id')->nullable(false)->change();
        });

        Schema::table('konsultasi', function (Blueprint $table) {
            $table->dropForeign(['jadwal_id']);
        });

        Schema::table('konsultasi', function (Blueprint $table) {
            $table->dropConstrainedForeignId('diputuskan_oleh');
            $table->dropColumn([
                'tanggal_skrining',
                'keputusan_dokter',
                'catatan_dokter',
                'alasan_status',
                'diputuskan_pada',
            ]);
        });
    }
};
