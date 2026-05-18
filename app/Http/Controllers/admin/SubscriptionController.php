<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;


class SubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
       $subscriptions = Subscription::with(['user', 'plan'])
                    ->when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->when($request->filled('plan_type'), fn($q) => $q->planType($request->plan_type))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

      return Inertia::render('Subscription/Index', 
        [
            'subscriptions' => $subscriptions,
            'filters' => $request->only(['search','plan_type', 'per_page']),
        ]);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $plans = Plan::active()->get();
        $users = User::active()->where('role', User::ROLE_USER)->get();
        return Inertia::render('Subscription/Create', [
            'plans' => $plans,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $plan_type = Plan::where('id', $request->plan_id)->value('plan_type');

        if($plan_type == Plan::PLAN_FREE)
        {
        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'email' => 'nullable|email|exists:users,email',
            'plan_id' => 'required|exists:plans,id'
            ]);
        }
        else{
        $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'email' => 'nullable|email|exists:users,email',
            'plan_id' => 'required|exists:plans,id',
            'payment_method' => 'required|string',
            'transaction_id' => 'required|string',
        ]);
        }

        if ($request->user_id) {
            $user_id = $request->user_id;
        } elseif ($request->email) {
            $user_id = \App\Models\User::where('email', $request->email)->value('id');
        } else {
            return back()->with('error', 'User ID or Email is required.');
        }

        if (\App\Models\Subscription::where('status', \App\Models\Subscription::STATUS_ACTIVE)
            ->where('user_id', $user_id)->where('plan_id', $request->plan_id)
            ->exists()) 
        {
            return back()->withErrors(['error' => 'This user already has an active subscription. You can renew the subscription instead.']);
        }

        $plan = \App\Models\Plan::findOrFail($request->plan_id);
        $startDate = now();
        $endDate = $startDate->copy()->addDays($plan->validity);


        $subscription = \App\Models\Subscription::where('user_id', $user_id)
                ->where('status', \App\Models\Subscription::STATUS_ACTIVE)
                ->first();

        if($subscription){
            $subscription->update([
                'plan_id'    => $request->plan_id,
                'validity'   => $plan->validity,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'status'     => \App\Models\Subscription::STATUS_ACTIVE,
            ]);
        } else {
            $subscription = \App\Models\Subscription::create([
                'user_id'    => $user_id,
                'plan_id'    => $request->plan_id,
                'validity'   => $plan->validity,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'status'     => \App\Models\Subscription::STATUS_ACTIVE,
            ]);
        }


        // $plan = \App\Models\Plan::findOrFail($request->plan_id);
        // $startDate = now();
        // $endDate = $startDate->copy()->addDays($plan->validity);
        // $subscription = \App\Models\Subscription::updateOrCreate([
        //     'user_id' => $user_id, 
        //     'plan_id' => $request->plan_id,
        //     'validity' => $plan->validity, 
        //     'start_date' => $startDate,
        //     'end_date' => $endDate,
        //     'status' => \App\Models\Subscription::STATUS_ACTIVE,
        // ]);


        // Record payment
        \App\Models\SubscriptionPayment::create([
            'subscription_id' => $subscription->id,
            'amount' => $plan->price,
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
        ]);

        return to_route('admin.subscriptions.index')->with('success', 'Subscription created and payment recorded successfully.');

    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }


    //payment history

    public function paymentHistory(string $id)
    {
        $subscription = Subscription::with(['user', 'plan' ,'payment'])->findOrFail($id);
        $paymentHistory = SubscriptionPayment::where('subscription_id', $id)->orderByDesc('id')->get();

        return Inertia::render('Subscription/PaymentHistory', [
            'subscription' => $subscription,
            'paymentHistory' => $paymentHistory,
        ]);
    }



    //verify subscription
    public function verify(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);
        $plan = $subscription->plan;
        $startDate = now();
        $endDate = $startDate->copy()->addDays($plan->validity);
        $subscription->update([
            'validity' => $plan->validity, 
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => \App\Models\Subscription::STATUS_ACTIVE,
        ]);

        $subscription->payment()->update([
            'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
        ]);

        return back()->with('success', 'Subscription verified successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */

    public function edit(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);

        return Inertia::render('Subscription/Edit', [ 
            'subscription' => $subscription,
            'plans' => Plan::active()->get(),
        ]);
    }
    /**
     * Update the specified resource in storage.
     */

    public function update(Request $request, string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);
        $plan = Plan::findOrFail($request->plan_id);
        $plan_type = $plan->plan_type;

        if ($plan_type == Plan::PLAN_FREE) {
            $request->validate([
                'user_id' => 'nullable|exists:users,id',
                'email' => 'nullable|email|exists:users,email',
                'plan_id' => 'required|exists:plans,id'
            ]);
        } else {
            $request->validate([
                'user_id' => 'nullable|exists:users,id',
                'email' => 'nullable|email|exists:users,email',
                'plan_id' => 'required|exists:plans,id',
                'payment_method' => 'required|string',
                'transaction_id' => 'required|string',
            ]);
        }

        $startDate = Carbon::parse($subscription->end_date);
        $endDate = $startDate->addDays($plan->validity);

        $subscription->update([
            'end_date' => $endDate,
            'validity' => $subscription->validity + $plan->validity,
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        if ($plan_type !== Plan::PLAN_FREE) {
            \App\Models\SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'payment_method' => $request->payment_method,
                'transaction_id' => $request->transaction_id,
                'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
            ]);
        }

        return to_route('admin.subscriptions.index')->with('success', 'Subscription renewed and payment recorded successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
