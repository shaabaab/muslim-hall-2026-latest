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
Schema::create('community_comment_reactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('community_comment_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->enum('type', ['like', 'love', 'laugh', 'wow', 'sad', 'angry'])->default('like');
    $table->timestamps();
    
    $table->unique(['community_comment_id', 'user_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_comment_reactions');
    }
};
