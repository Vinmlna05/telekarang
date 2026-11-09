<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skrining', function (Blueprint $table) {
            $table->id();
            $table->foreignId('konsultasi_id')->unique()->constrained('konsultasi')->cascadeOnDelete();
            $table->foreignId('perawat_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('berat', 5, 2);
            $table->decimal('tinggi', 5, 2);
            $table->unsignedSmallInteger('sistol');
            $table->unsignedSmallInteger('diastol');
            $table->decimal('suhu', 4, 1);
            $table->unsignedSmallInteger('nadi');
            $table->unsignedSmallInteger('spo2');
            $table->boolean('tanda_bahaya')->default(false);
            $table->text('catatan')->nullable();
            $table->timestamp('waktu')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skrining');
    }
};
