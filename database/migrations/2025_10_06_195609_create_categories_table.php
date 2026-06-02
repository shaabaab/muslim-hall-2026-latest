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
        Schema::create('categories', function (Blueprint $table) {
           $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('img')->nullable();
            $table->text('description')->nullable();
            $table->boolean('status')->default(1); // 1=active, 0=inactive
            $table->unsignedBigInteger('lang_id')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable(); // self relation
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
