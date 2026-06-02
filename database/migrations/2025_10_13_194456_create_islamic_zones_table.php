<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('islamic_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->nullable();
            $table->text('description')->nullable();
            $table->enum('type', ['quran', 'hadith', 'calendar', 'islamicContent']);
            $table->enum('calendar_type', ['islamic', 'ramadan', 'yearly'])->nullable();
            $table->string('image')->nullable(); 
            $table->text('gallery')->nullable(); 
            $table->string('document_file')->nullable(); 
            $table->text('content_text')->nullable(); 
            $table->string('youtube_url')->nullable();
            $table->string('audio_file')->nullable();
            $table->string('video_file')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->unsignedBigInteger('lang_id')->nullable();
            $table->integer('file_size')->nullable();
            $table->integer('views')->default(0);
            $table->json('viewer_ips')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Indexes
            $table->index(['type', 'status']);
            $table->index(['is_featured', 'status']);
            $table->index('lang_id');
            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('religious_contents');
    }
};