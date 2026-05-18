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
        Schema::create('contest_fees', function (Blueprint $table) {
            $table->id();
            $table->string('payment_method')->default('cash')->nullable()->comment('cash,card, online');
            $table->string('transaction_id')->nullable();
            $table->string('status')->default('pending')->nullable()->comment('pending, completed, failed');
            $table->decimal('amount', 8, 2);
            $table->unsignedBigInteger('contest_id')->nullable();
            $table->unsignedBigInteger('sponsor_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contest_fees');
    }
};
