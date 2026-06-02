<?php

namespace App\Console\Commands;

use App\Models\Contest;
use Illuminate\Console\Command;

class ContestCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminder:contest-ended';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update status of ended contests';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now();
        $contests = Contest::where('end_date', '<=', $today)->get();

        foreach ($contests as $contest) {

            Contest::where('id', $contest->id)->update([
                'status' => Contest::STATUS_ENDED,
            ]);
        }

        $this->info('Ended contests status updated.');
        return Command::SUCCESS;
    }
}
