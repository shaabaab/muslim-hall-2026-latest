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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->text('reason');
            $table->string('report_type')->default('post'); // post, comment, etc.
            $table->string('status')->default('pending'); // pending, reviewed, resolved
            $table->text('admin_note')->nullable();

            // Polymorphic relationship
            $table->unsignedBigInteger('reportable_id');
            $table->string('reportable_type');

            // User who reported
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Handled by admin
            $table->foreignId('handled_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['reportable_id', 'reportable_type']);
            $table->index('status');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};