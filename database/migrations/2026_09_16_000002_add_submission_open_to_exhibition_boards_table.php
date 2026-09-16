<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-board gate on member exhibition submissions, driven by the switch in
     * the Action column of the admin exhibition board list.
     *
     * Defaults to true so every existing board stays open and behaviour is
     * unchanged until an admin actually closes one.
     */
    public function up(): void
    {
        if (!Schema::hasTable('exhibition_boards')) {
            return;
        }

        if (Schema::hasColumn('exhibition_boards', 'submission_open')) {
            return;
        }

        Schema::table('exhibition_boards', function (Blueprint $table) {
            $table->boolean('submission_open')->default(true)->after('is_active');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('exhibition_boards', 'submission_open')) {
            return;
        }

        Schema::table('exhibition_boards', function (Blueprint $table) {
            $table->dropColumn('submission_open');
        });
    }
};
