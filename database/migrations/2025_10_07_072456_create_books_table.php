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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->nullable();
            $table->string('view')->nullable();
            $table->string('photo');
            $table->longText('description');
            $table->string('original_pdf');
            $table->string('compressed_pdf');
            $table->integer('page_count');
            $table->json('viewer_ips')->nullable();
            $table->unsignedBigInteger('lang_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
