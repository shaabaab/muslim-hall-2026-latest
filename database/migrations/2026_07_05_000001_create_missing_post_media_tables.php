<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('post_videos')) {
            Schema::create('post_videos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
                $table->string('video')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('post_pdfs')) {
            Schema::create('post_pdfs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
                $table->string('pdf')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('post_audios')) {
            Schema::create('post_audios', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
                $table->string('audio')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('post_audios');
        Schema::dropIfExists('post_pdfs');
        Schema::dropIfExists('post_videos');
    }
};
