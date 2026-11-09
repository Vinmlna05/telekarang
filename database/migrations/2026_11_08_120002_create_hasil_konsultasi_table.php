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
        Schema::create('hasil_konsultasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konsultasi_id')->unique()->constrained('konsultasi')->cascadeOnDelete();
            $table->string('icd10_kode');
            $table->foreign('icd10_kode')->references('kode')->on('icd10')->restrictOnDelete();
            $table->text('saran');
            $table->boolean('keputusan_rujuk');
            $table->text('alasan_rujuk')->nullable();
            $table->decimal('biaya_rujukan', 12, 2)->nullable();
            $table->timestamp('waktu')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_konsultasi');
    }
};
