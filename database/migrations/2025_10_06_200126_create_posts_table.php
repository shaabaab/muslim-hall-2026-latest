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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('audio')->nullable();
            $table->string('slug')->unique();
            $table->text('content')->nullable();
            $table->string('status')->default(1);
            $table->string('permission')->default('pending');
            $table->unsignedBigInteger('viewer_count')->default(0);

            // Media fields
            $table->string('image')->nullable();
            $table->string('video')->nullable();
            $table->string('video_url')->nullable();
            $table->string('pdf')->nullable();
            $table->json('viewer_ips')->nullable();

            $table->string('thumbnail')->nullable();
            $table->string('sponsor')->nullable();
            $table->longText('pdf_content')->nullable();


            // Foreign keys
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable();
            $table->unsignedBigInteger('lang_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('set null');
            $table->foreign('section_id')
                ->references('id')
                ->on('sections')
                ->onDelete('set null');


            $table->text('hidden_reason')->nullable();
            $table->timestamp('hidden_at')->nullable();
            $table->foreignId('hidden_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
