<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('islamic_zone_videos')) {
            Schema::create('islamic_zone_videos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('islamic_zone_id')->constrained('islamic_zones')->cascadeOnDelete();
                $table->string('video')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('islamic_zone_pdfs')) {
            Schema::create('islamic_zone_pdfs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('islamic_zone_id')->constrained('islamic_zones')->cascadeOnDelete();
                $table->string('pdf')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('islamic_zone_audios')) {
            Schema::create('islamic_zone_audios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('islamic_zone_id')->constrained('islamic_zones')->cascadeOnDelete();
                $table->string('audio')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('islamic_zone_audios');
        Schema::dropIfExists('islamic_zone_pdfs');
        Schema::dropIfExists('islamic_zone_videos');
    }
};
