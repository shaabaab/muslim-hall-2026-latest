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
        Schema::create('exhibition_board_members', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('exhibition_board_id');
            $table->unsignedBigInteger('user_id');

            $table->enum('owner_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('admin_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->timestamp('owner_approved_at')->nullable();
            $table->unsignedBigInteger('owner_approved_by')->nullable();

            $table->timestamp('admin_approved_at')->nullable();
            $table->unsignedBigInteger('admin_approved_by')->nullable();

            $table->text('request_message')->nullable();
            $table->text('owner_note')->nullable();
            $table->text('admin_note')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['exhibition_board_id', 'user_id'], 'board_user_unique');

            $table->index('exhibition_board_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('owner_status');
            $table->index('admin_status');

            $table->foreign('exhibition_board_id')
                ->references('id')
                ->on('exhibition_boards')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->foreign('owner_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('admin_approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exhibition_board_members');
    }
};
