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
        Schema::create('islamic_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('islamic_zone_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['like', 'love', 'dislike'])->default('like');
            $table->timestamps();
            
            $table->unique(['islamic_zone_id', 'user_id']);
            $table->index(['islamic_zone_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('islamic_reactions');
    }
};
