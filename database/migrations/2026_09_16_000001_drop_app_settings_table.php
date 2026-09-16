<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The exhibition submission gate moved from one site-wide flag to a per-board
     * `submission_open` column, so the key/value table that backed the global
     * version has no remaining reader. It shipped in 47c1953 and was created on
     * production before the redesign, so it needs an explicit drop rather than
     * just deleting the create migration.
     */
    public function up(): void
    {
        Schema::dropIfExists('app_settings');
    }

    public function down(): void
    {
        if (Schema::hasTable('app_settings')) {
            return;
        }

        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }
};
