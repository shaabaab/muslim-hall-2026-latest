<?php

namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserSubscriptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
         $subscriptions = Subscription::with(['user', 'plan'])
                    ->where('user_id', Auth::id())
                    ->when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->when($request->filled('plan_type'), fn($q) => $q->planType($request->plan_type))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

        return Inertia::render('UserNavSection/Subscription/Index', 
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
        $plans = Plan::active()->where('plan_type', Plan::PLAN_PAID)->get();
        $users = User::active()->where('role', User::ROLE_USER)->get();
        return Inertia::render('UserNavSection/Subscription/Create', [
            'plans' => $plans,
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'payment_method' => 'required|string',
            'transaction_id' => 'required|string',
        ]);

        $user_id = Auth::id();

        if (\App\Models\Subscription::where('status', \App\Models\Subscription::STATUS_ACTIVE)
            ->where('user_id', $user_id)
            ->exists()) {
                throw ValidationException::withMessages(['user_id' => 'you already have an active subscription.']);
        }

        $plan = \App\Models\Plan::findOrFail($request->plan_id);
        $startDate = now();
        $endDate = $startDate->copy()->addDays($plan->validity);
        $subscription = \App\Models\Subscription::updateOrCreate([
            'user_id' => $user_id, 
            'plan_id' => $request->plan_id,
            'validity' => $plan->validity, 
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => \App\Models\Subscription::STATUS_PENDING,
        ]);


        // Record payment
        \App\Models\SubscriptionPayment::create([
            'subscription_id' => $subscription->id,
            'amount' => $plan->price,
            'payment_method' => $request->payment_method,
            'transaction_id' => $request->transaction_id,
            'status' => \App\Models\SubscriptionPayment::STATUS_COMPLETED,
        ]);

        return to_route('user.subscriptions.index')->with('success', 'Subscription created and payment recorded successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
       $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);

        return Inertia::render('UserNavSection/Subscription/Edit', [ 
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
        $user_id = Auth::id();


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


        if (\App\Models\Subscription::where('status', \App\Models\Subscription::STATUS_ACTIVE)
            ->where('user_id', $user_id)
            ->exists()) {
                throw ValidationException::withMessages(['error' => 'you already have an active subscription.']);
        }


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

        return to_route('user.subscriptions.index')->with('success', 'Subscription renewed and payment recorded successfully.');
    }



    //payment history for a subscription

    public function paymentHistory(string $id)
    {
        $subscription = Subscription::with(['user', 'plan' ,'payment'])->findOrFail($id);
        $paymentHistory = SubscriptionPayment::where('subscription_id', $id)->orderByDesc('id')->get();

        return Inertia::render('UserNavSection/Subscription/Show', [
            'subscription' => $subscription,
            'paymentHistory' => $paymentHistory,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
