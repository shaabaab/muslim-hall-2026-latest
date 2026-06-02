<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exhibitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string(column: 'slug')->nullable();
            $table->text('description')->nullable();
            $table->enum('type', ['product', 'document', 'art', 'photography', 'craft']);
            $table->string('image')->nullable();
            $table->json('gallery')->nullable(); // Multiple images
            $table->string('document_file')->nullable(); // PDF or other documents
            $table->decimal('price', 10, 2)->nullable();
            $table->string('currency')->default('USD');
            $table->boolean('is_available')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->string('dimensions')->nullable(); // for art
            $table->string('material')->nullable(); // for art/products
            $table->integer('views')->default(0);
            $table->json('viewer_ips')->nullable();
            $table->integer('likes_count')->default(0);
            $table->integer('link')->nullable();
            $table->unsignedBigInteger('lang_id')->nullable();
            $table->enum('status', ['draft', 'published', 'sold', 'archived'])->default('published');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();


            $table->unsignedBigInteger('exhibition_board_id')->nullable();
            $table->string('sponsor_image')->nullable();
            $table->enum('approval_status', ['pending', 'approved', 'rejected']) ->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('admin_note')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exhibitions');
    }
};
