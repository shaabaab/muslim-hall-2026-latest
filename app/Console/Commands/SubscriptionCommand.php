<?php

namespace App\Console\Commands;

use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriptionCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cron:check-subscriptions';
    // protected $signature = 'reminder:subscriptions';


    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and update expired subscriptions';

    /**
     * Execute the console command.
     */
    public function handle()
    {

        // 1st way to notify users before expiry

        // Subscription::where('status', 'active')
        // ->where('end_date', '<=', Carbon::today())
        // ->chunkById(100, function ($subscriptions) {
        //     foreach ($subscriptions as $subscription) {
        //         $subscription->update(['status' => Subscription::STATUS_EXPIRED]);
        //         Log::info("Subscription #{$subscription->id} expired at " . now());
        //     }
        // });

        // $this->info('Expired subscriptions processed.');
        // return Command::SUCCESS;



        // 2nd way to notify users before expiry

        $today = now();
        $data = [];

        $subscriptions = Subscription::where('status', Subscription::STATUS_ACTIVE)->get();

        foreach ($subscriptions as $subscription) {
            $end_date = Carbon::parse($subscription->end_date);

            if ($end_date <= $today) {
                $subscription->update(['status' => Subscription::STATUS_EXPIRED]);
                $item = "Subscription for {$subscription->user->name} has expired on {$end_date->toDateString()}";
                // Mail::to($subscription->user->email)->send(new UserSubscriptionExpired($item, $subscription->user->name));
                $data[] = $item;
            }
        }
        $this->info('Your subscriptions are expired.');
        return Command::SUCCESS;

    }

}
