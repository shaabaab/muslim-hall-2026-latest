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
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            $table->string('photo')->nullable();
            $table->string('phone')->nullable();
            $table->string('phone_alternative')->nullable();

            $table->string('type')->nullable();
            $table->string('registration_ip')->nullable();
            $table->string('last_login_ip')->nullable();

            // ✅ use integers or enums with string labels (not numeric strings)
            $table->unsignedTinyInteger('status')
                ->default(1)
                ->comment('0=inactive, 1=active, 2=pending, 3=suspended');

            $table->unsignedTinyInteger('role')
                ->default(1)
                ->comment('1=user, 2=admin, 3=adminviewer');

            // ✅ Use foreign key for parent if applicable
            $table->unsignedBigInteger('sponsor_id')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable()->default(0);
            $table->string('google_id')->nullable();

            $table->rememberToken();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
