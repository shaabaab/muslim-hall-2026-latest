<?php

namespace App\Console\Commands;

use App\Models\Badge;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SubscriptionBrdge extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'remainder:subscription-brdge';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description for subscription bridge';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::with(['subscriptions.payment'])->whereHas('subscriptions.payment', function ($query) {
            $query->where('status', SubscriptionPayment::STATUS_COMPLETED);
        })->get();

        $badges = Badge::all();


        foreach ($users as $user) {

            $subscriptions = $user->subscriptions;

            $totalPaid = $subscriptions->reduce(function ($carry, $subscription) {
                $payment = $subscription->payment;
                if ($payment && $payment->status === SubscriptionPayment::STATUS_COMPLETED) {
                    return $carry + $payment->amount;
                }
                return $carry;
            }, 0);

                
            $matchedBadge = $badges->first(function ($badge) use ($totalPaid) {
                return $totalPaid >= $badge->min_amount &&
                    ($badge->max_amount === null || $totalPaid <= $badge->max_amount);
            });

            if ($matchedBadge) {
                User::where('id',$user->id)->update(['badge_id' => $matchedBadge->id]);
            }

        }

            Log::info('All user badges updated successfully!');
                return Command::SUCCESS;
    }


}

