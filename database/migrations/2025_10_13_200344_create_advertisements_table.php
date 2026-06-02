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
        Schema::create('advertisements', function (Blueprint $table) {
             $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['banner', 'sidebar', 'popup', 'interstitial', 'video_ad']);
            $table->enum('position', ['header', 'footer', 'sidebar_left', 'sidebar_right', 'popup', 'in_content']);
            $table->string('image')->nullable();
            $table->string('video_url')->nullable();
            $table->string('target_url')->nullable();
            $table->string('button_text')->nullable();
            $table->string('background_color')->nullable();
            $table->string('text_color')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->integer('max_impressions')->nullable();
            $table->integer('max_clicks')->nullable();
            $table->integer('impressions_count')->default(0);
            $table->integer('clicks_count')->default(0);
            $table->decimal('cost_per_impression', 10, 4)->nullable();
            $table->decimal('cost_per_click', 10, 4)->nullable();
            $table->decimal('total_budget', 10, 2)->nullable();
            $table->decimal('spent_amount', 10, 2)->default(0);
            $table->string('advertiser_name')->nullable();
            $table->string('advertiser_email')->nullable();
            $table->string('advertiser_phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['pending', 'approved', 'rejected', 'paused', 'completed'])->default('pending');
            $table->json('targeting')->nullable(); // Targeting criteria
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
