<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `exhibitions.link` was created as INTEGER but every form feeds it a URL, and
 * `exhibitions.title` is a VARCHAR(255) fed by a ReactQuill editor validated to
 * 5000 characters. Under strict mode MySQL rejected both (errors 1366 / 1406),
 * which killed the request *after* the media had already been written to S3 —
 * so the user saw "nothing happened" and the bucket kept an orphaned folder.
 *
 * Raw ALTER statements rather than Blueprint->change(): doctrine/dbal is not
 * installed, so column changes are unavailable on Laravel 10 here.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('exhibitions')) {
            return;
        }

        if (Schema::hasColumn('exhibitions', 'link')) {
            DB::statement('ALTER TABLE `exhibitions` MODIFY `link` VARCHAR(1000) NULL');
        }

        if (Schema::hasColumn('exhibitions', 'title')) {
            DB::statement('ALTER TABLE `exhibitions` MODIFY `title` TEXT NOT NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('exhibitions')) {
            return;
        }

        if (Schema::hasColumn('exhibitions', 'link')) {
            // Narrowing back to INTEGER cannot keep URLs; drop them so the
            // rollback does not abort under strict mode.
            DB::statement("UPDATE `exhibitions` SET `link` = NULL WHERE `link` IS NOT NULL AND `link` NOT REGEXP '^-?[0-9]+$'");
            DB::statement('ALTER TABLE `exhibitions` MODIFY `link` INT NULL');
        }

        if (Schema::hasColumn('exhibitions', 'title')) {
            // Same caveat: captions longer than 255 characters are truncated.
            DB::statement('ALTER TABLE `exhibitions` MODIFY `title` VARCHAR(255) NOT NULL');
        }
    }
};
