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
        Schema::create('konsultasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pasien_id')->constrained('pasien')->cascadeOnDelete();
            $table->foreignId('dibuat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('dokter_pengirim_id')->nullable()->constrained('dokter')->nullOnDelete();
            $table->foreignId('dokter_spesialis_id')->constrained('dokter')->cascadeOnDelete();
            $table->unsignedBigInteger('jadwal_id')->nullable();
            $table->string('mode', 10)->default('teks');
            $table->string('status')->default('MENUNGGU_SKRINING')->index();
            $table->text('keluhan');
            $table->timestamp('tanggal')->index();
            $table->timestamp('dikonfirmasi_pada')->nullable();
            $table->timestamp('kedaluwarsa_pada')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('konsultasi');
    }
};
