<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Columns the User model already declares in $fillable/$casts. They exist on
     * production (added outside Laravel), so each one is guarded individually.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'bio')) {
                $table->string('bio', 255)->nullable();
            }

            if (! Schema::hasColumn('users', 'deposit')) {
                $table->decimal('deposit', 10, 2)->default(0);
            }

            if (! Schema::hasColumn('users', 'registration_date')) {
                $table->timestamp('registration_date')->nullable();
            }

            if (! Schema::hasColumn('users', 'last_login_date')) {
                $table->timestamp('last_login_date')->nullable();
            }

            if (! Schema::hasColumn('users', 'last_seen_at')) {
                $table->timestamp('last_seen_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['bio', 'deposit', 'registration_date', 'last_login_date', 'last_seen_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
