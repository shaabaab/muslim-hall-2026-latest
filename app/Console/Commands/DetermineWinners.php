<?php

namespace App\Console\Commands;

use App\Models\Contest;
use App\Models\Entry;
use App\Models\Winner;
use Carbon\Carbon;
use Illuminate\Console\Command;

class DetermineWinners extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminder:declare-winners';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically declare winners for contests whose end date has passed';

    /**
     * Execute the console command.
    */


    public function handle()
    {
        $today = Carbon::today();

        $contests = Contest::whereDate('end_date', '<=', $today)
            ->where('status', '!=', Contest::STATUS_ENDED)
            ->get();

        foreach ($contests as $contest) {
            $this->info("Processing Contest: {$contest->title}");

            $contest->update(['status' => Contest::STATUS_ENDED]);

            $totalPrizeCount = $contest->prizes()->count();

            if ($totalPrizeCount == 0) {
                $this->warn("No prize positions defined for Contest ID {$contest->id}");
                continue;
            }

            // Rank entries
            $entriesRanked = Entry::where('contest_id', $contest->id)
                ->withCount('reviews')
                ->withAvg('reviews', 'rating')
                ->orderByDesc('total_votes')
                ->orderByDesc('reviews_count')
                ->orderByDesc('reviews_avg_rating')
                ->get();

            if ($entriesRanked->isEmpty()) {
                $this->warn("No entries found for Contest ID {$contest->id}");
                continue;
            }

            $alreadyWinners = Winner::where('contest_id', $contest->id)
                ->pluck('entry_id')
                ->toArray();

            $position = 1;
            foreach ($entriesRanked as $rankedEntry) {
                if ($position > $totalPrizeCount) {
                    break;
                }

                if (in_array($rankedEntry->id, $alreadyWinners)) {
                    continue;
                }

                Winner::updateOrCreate(
                    [
                        'contest_id' => $contest->id,
                        'entry_id' => $rankedEntry->id,
                    ],
                    [
                        'type' => 'auto',
                        'position' => $position,
                    ]
                );

                $this->info("Declared Winner: Entry #{$rankedEntry->id} (Position: {$position})");
                $position++;
            }

            $this->info(" Contest '{$contest->title}' winner declaration completed.\n");
        }

        return Command::SUCCESS;
    }

}
