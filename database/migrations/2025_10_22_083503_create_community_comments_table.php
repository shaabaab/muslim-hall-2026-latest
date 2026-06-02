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
Schema::create('community_comments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('community_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('parent_id')->nullable()->constrained('community_comments')->onDelete('cascade');
    $table->text('content'); 
    $table->boolean('is_approved')->default(true);
    $table->softDeletes();
    $table->timestamps();
    
    $table->index(['community_id', 'parent_id']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('community_comments');
    }
};
