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
Schema::create('communities', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('title');
     $table->string('slug')->nullable();
    $table->text('content');
    $table->string('image')->nullable();
    $table->string('category')->nullable();
    $table->json('tags')->nullable(); // Store tags as JSON array
    $table->boolean('is_featured')->default(false);
    $table->enum('status', ['draft', 'published', 'archived'])->default('published');
    $table->integer('views')->default(0);
    $table->string('viewer_ips')->nullable();
    $table->integer('likes_count')->default(0);
    $table->integer('comments_count')->default(0);
    $table->timestamps();
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communities');
    }
};
