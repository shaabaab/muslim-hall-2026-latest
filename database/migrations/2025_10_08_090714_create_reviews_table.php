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
     Schema::create('reviews', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('entry_id')->default(0)->nullable();
        $table->unsignedBigInteger('contest_id')->default(0)->nullable();
        $table->unsignedBigInteger('reviewed_by')->default(0);
        $table->text('comments')->nullable();
        $table->unsignedTinyInteger('rating')->nullable()->comment('Rating out of 5');
        $table->enum('decision', ['1', '2'])->nullable()->comment('approved=1, rejected=2');

        // Ensure unique review per entry per reviewer
        $table->unique(['entry_id', 'contest_id', 'reviewed_by']);
        $table->timestamps();
    });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
