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
        Schema::create('contest_sponsors', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('contest_id')->nullable();
                $table->unsignedBigInteger('sponsor_id')->nullable();
                $table->string('banner')->nullable();
                $table->timestamps();

                $table->foreign('contest_id')
                    ->references('id')
                    ->on('contests')
                    ->onDelete('cascade');

                $table->foreign('sponsor_id')
                    ->references('id')
                    ->on('sponsors')
                    ->onDelete('cascade');
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contest_sponsors');
    }
};
