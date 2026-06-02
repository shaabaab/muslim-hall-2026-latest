<?php

namespace App\Console;

use App\Console\Commands\DetermineWinners;
use App\Console\Commands\SubscriptionCommand;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

use App\Console\Commands\ResetStuckProcessing;

class Kernel extends ConsoleKernel
{

    protected $commands = [
        SubscriptionCommand::class,
        DetermineWinners::class,
        ResetStuckProcessing::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        $schedule->command('cron:check-subscriptions')->everyMinute();
        $schedule->command('reminder:declare-winners')->everyMinute();
        $schedule->command('reminder:contest-ended')->everyMinute();
        $schedule->command('remainder:subscription-brdge')->everyMinute();

        // Clean up media records stuck in 'processing' (caused by tab-close mid-upload)
        $schedule->command('posts:reset-stuck --hours=2')->everyTwoHours();

        // $schedule->command('cron:daily-task')->daily();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
