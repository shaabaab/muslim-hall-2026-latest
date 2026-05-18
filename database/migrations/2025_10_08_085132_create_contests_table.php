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
        Schema::create('contests', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('status')
                ->default(1)
                ->comment('1: Upcoming, 2: Running, 3: Ended, 4: Archived');
            $table->enum('payment_type', ['free', 'paid'])->default('free')->comment('1: Free, 2: Paid');
            $table->enum('user_type', ['all', 'user', 'member'])->default('all')->comment('1: All, 2: User, 3: Member');
            $table->decimal('amount', 10, 2)->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');  
            $table->boolean('voting_enabled')->default(true);
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('sponsor_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contests');
    }
};
