<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetStuckProcessing extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'posts:reset-stuck
                            {--dry-run : Show what would be reset without doing it}
                            {--hours=24 : Reset records stuck processing for more than this many hours}';

    /**
     * The console command description.
     */
    protected $description = 'Reset video/audio/pdf records stuck in "processing" state (when queue worker was not running)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $hours    = (int) $this->option('hours');

        $cutoff = now()->subHours($hours);

        $this->info("Checking for records stuck in 'processing' state for more than {$hours} hour(s)...");

        $tables = [
            'post_videos' => 'video',
            'post_audios' => 'audio',
            'post_pdfs'   => 'pdf',
        ];

        $total = 0;

        foreach ($tables as $table => $column) {
            $query = DB::table($table)
                ->where($column, 'processing')
                ->where('created_at', '<', $cutoff);

            $count = $query->count();

            if ($count > 0) {
                $this->warn("  [{$table}] Found {$count} stuck record(s).");

                if (!$isDryRun) {
                    DB::table($table)
                        ->where($column, 'processing')
                        ->where('created_at', '<', $cutoff)
                        ->update([$column => null, 'updated_at' => now()]);

                    $this->info("  [{$table}] Reset {$count} record(s) to null.");
                }

                $total += $count;
            } else {
                $this->line("  [{$table}] No stuck records.");
            }
        }

        // Also check posts.audio column
        $postsQuery = DB::table('posts')
            ->where('audio', 'processing')
            ->where('created_at', '<', $cutoff);

        $postsCount = $postsQuery->count();

        if ($postsCount > 0) {
            $this->warn("  [posts.audio] Found {$postsCount} stuck record(s).");

            if (!$isDryRun) {
                DB::table('posts')
                    ->where('audio', 'processing')
                    ->where('created_at', '<', $cutoff)
                    ->update(['audio' => null, 'updated_at' => now()]);

                $this->info("  [posts.audio] Reset {$postsCount} record(s) to null.");
            }

            $total += $postsCount;
        } else {
            $this->line("  [posts.audio] No stuck records.");
        }

        if ($isDryRun) {
            $this->warn("\nDRY RUN: {$total} record(s) would be reset. Run without --dry-run to apply.");
        } else {
            $this->info("\nDone! Total reset: {$total} record(s).");
        }

        return Command::SUCCESS;
    }
}
