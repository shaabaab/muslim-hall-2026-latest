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
        Schema::create('islamic_comments', function (Blueprint $table) {
             $table->id();
            $table->foreignId('islamic_zone_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('islamic_comments')->onDelete('cascade');
            $table->text('comment');
            $table->boolean('is_approved')->default(true);
            $table->softDeletes();
            $table->timestamps();
            
            $table->index(['islamic_zone_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('islamic_comments');
    }
};
