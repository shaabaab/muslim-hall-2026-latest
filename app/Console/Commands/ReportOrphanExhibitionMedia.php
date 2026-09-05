<?php

namespace App\Console\Commands;

use App\Models\Exhibition;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Read-only report on exhibition media in the bucket that no exhibitions row
 * references.
 *
 * Before the submission fix, a failed insert left the uploads behind, so each
 * orphaned folder is the trace of a member whose exhibition never saved. New
 * uploads are namespaced as "exhibitions/<kind>/<name>-<userId>/", which makes
 * those members identifiable — that is what this command is for: work out who
 * to ask to resubmit.
 *
 * This command never deletes anything. The orphans are the evidence.
 */
class ReportOrphanExhibitionMedia extends Command
{
    protected $signature = 'exhibitions:orphan-media-report
                            {--prefix=exhibitions : Bucket prefix to scan}
                            {--files : List every orphaned key, not just the per-member totals}
                            {--csv= : Also write the full report to this CSV path}';

    protected $description = 'Report exhibition uploads in storage that no exhibitions row references, grouped by the member who uploaded them';

    public function handle(): int
    {
        $prefix = trim((string) $this->option('prefix'), '/');

        $this->info("Scanning storage under \"{$prefix}/\"...");

        try {
            $stored = Storage::disk('s3')->allFiles($prefix);
        } catch (\Throwable $e) {
            $this->error('Could not list the bucket: ' . $e->getMessage());
            return Command::FAILURE;
        }

        if (empty($stored)) {
            $this->line('Nothing stored under that prefix.');
            return Command::SUCCESS;
        }

        $referenced = $this->referencedKeys();

        $orphans = array_values(array_filter(
            $stored,
            fn (string $key) => !isset($referenced[ltrim($key, '/')])
        ));

        $this->line(sprintf(
            '%d object(s) stored, %d referenced by an exhibition row, %d orphaned.',
            count($stored),
            count($referenced),
            count($orphans)
        ));

        if (empty($orphans)) {
            return Command::SUCCESS;
        }

        // "exhibitions/images/afifa-jumah-55/<uuid>.jpg" -> owner folder
        // "afifa-jumah-55" -> user id 55. Uploads written before the folders
        // were namespaced sit directly in "exhibitions/images/" and cannot be
        // attributed to anyone.
        $byOwner = [];
        $unattributed = [];

        foreach ($orphans as $key) {
            $userId = $this->userIdFromKey($key, $prefix);

            if ($userId === null) {
                $unattributed[] = $key;
                continue;
            }

            $byOwner[$userId][] = $key;
        }

        $rows = [];

        if (!empty($byOwner)) {
            $users = User::whereIn('id', array_keys($byOwner))->get()->keyBy('id');

            ksort($byOwner, SORT_NUMERIC);

            foreach ($byOwner as $userId => $keys) {
                $user = $users->get($userId);

                $rows[] = [
                    'user_id' => $userId,
                    'name' => $user->name ?? '(user row missing)',
                    'email' => $user->email ?? '',
                    'files' => count($keys),
                    'exhibitions_on_record' => Exhibition::withTrashed()->where('user_id', $userId)->count(),
                ];
            }

            $this->newLine();
            $this->info('Members with orphaned uploads — these are the submissions that never saved:');
            $this->table(
                ['User ID', 'Name', 'Email', 'Orphaned files', 'Exhibitions on record'],
                array_map('array_values', $rows)
            );

            if ($this->option('files')) {
                foreach ($byOwner as $userId => $keys) {
                    $this->newLine();
                    $this->line("User {$userId}:");
                    foreach ($keys as $key) {
                        $this->line('  ' . $key);
                    }
                }
            }
        }

        if (!empty($unattributed)) {
            $this->newLine();
            $this->warn(sprintf(
                '%d orphaned object(s) predate the per-member folders and cannot be attributed to a user:',
                count($unattributed)
            ));

            if ($this->option('files')) {
                foreach ($unattributed as $key) {
                    $this->line('  ' . $key);
                }
            } else {
                $this->line('  (re-run with --files to list them)');
            }
        }

        if ($path = $this->option('csv')) {
            $this->writeCsv($path, $byOwner, $unattributed);
            $this->newLine();
            $this->info("Full report written to {$path}");
        }

        $this->newLine();
        $this->line('Nothing was deleted — this command only reports.');

        return Command::SUCCESS;
    }

    /**
     * Pull the trailing user id out of an owner folder segment, e.g.
     * "exhibitions/gallery/afifa-jumah-55/<uuid>.jpg" -> 55.
     */
    private function userIdFromKey(string $key, string $prefix): ?int
    {
        $segments = explode('/', trim($key, '/'));

        // <prefix>/<kind>/<owner>/<file> — anything shorter has no owner folder.
        if (count($segments) < 4) {
            return null;
        }

        $owner = $segments[count($segments) - 2];

        return preg_match('/(\d+)$/', $owner, $matches) ? (int) $matches[1] : null;
    }

    private function writeCsv(string $path, array $byOwner, array $unattributed): void
    {
        $handle = fopen($path, 'w');
        fputcsv($handle, ['user_id', 'name', 'email', 'key']);

        $users = empty($byOwner)
            ? collect()
            : User::whereIn('id', array_keys($byOwner))->get()->keyBy('id');

        foreach ($byOwner as $userId => $keys) {
            $user = $users->get($userId);
            foreach ($keys as $key) {
                fputcsv($handle, [$userId, $user->name ?? '', $user->email ?? '', $key]);
            }
        }

        foreach ($unattributed as $key) {
            fputcsv($handle, ['', '', '', $key]);
        }

        fclose($handle);
    }

    /**
     * Every storage key any exhibition row points at, keyed for O(1) lookup.
     * Soft-deleted rows count as referencing their media: they can be restored.
     */
    private function referencedKeys(): array
    {
        $referenced = [];

        $keep = function (?string $key) use (&$referenced) {
            if ($key && $key !== 'processing') {
                $referenced[ltrim($key, '/')] = true;
            }
        };

        Exhibition::withTrashed()
            ->with(['videos', 'audios', 'pdfs'])
            ->chunkById(200, function ($exhibitions) use ($keep) {
                foreach ($exhibitions as $exhibition) {
                    $keep($exhibition->image);
                    $keep($exhibition->sponsor_image);
                    $keep($exhibition->document_file);

                    if (is_array($exhibition->gallery)) {
                        foreach ($exhibition->gallery as $image) {
                            $keep($image);
                        }
                    }

                    foreach (['videos', 'audios', 'pdfs'] as $relation) {
                        foreach ($exhibition->{$relation} as $item) {
                            $keep($item->video ?? $item->audio ?? $item->pdf ?? $item->path ?? $item->file_path ?? null);
                        }
                    }
                }
            });

        return $referenced;
    }
}
