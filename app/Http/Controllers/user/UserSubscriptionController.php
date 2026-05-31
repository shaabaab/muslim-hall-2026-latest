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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserSubscriptionController extends Controller
{
    public function index(Request $request)
    {
        $subscriptions = Subscription::with(['user', 'plan'])
            ->where('user_id', Auth::id())
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('plan_type'), fn($q) => $q->planType($request->plan_type))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/Subscription/Index', [
            'subscriptions' => $subscriptions,
            'filters' => $request->only(['search', 'plan_type', 'per_page']),
        ]);
    }

    public function create()
    {
        $plans = Plan::active()
            ->where('plan_type', Plan::PLAN_PAID)
            ->get();

        $users = User::active()
            ->where('role', User::ROLE_USER)
            ->get();

        return Inertia::render('UserNavSection/Subscription/Create', [
            'plans' => $plans,
            'users' => $users,
        ]);
    }

    public function payWithSslCommerz(Request $request)
    {
        try {
            $request->validate([
                'plan_id' => 'required|exists:plans,id',
            ]);

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Please login first.',
                ], 401);
            }

            $activeSubscription = Subscription::where('user_id', $user->id)
                ->where('status', Subscription::STATUS_ACTIVE)
                ->whereDate('end_date', '>=', now())
                ->first();

            if ($activeSubscription) {
                return response()->json([
                    'status' => false,
                    'message' => 'You already have an active subscription.',
                ], 422);
            }

            $plan = Plan::active()->find($request->plan_id);

            if (!$plan) {
                return response()->json([
                    'status' => false,
                    'message' => 'Selected plan is not active.',
                ], 422);
            }

            if ((float) $plan->price <= 0) {
                return response()->json([
                    'status' => false,
                    'message' => 'Invalid paid plan amount.',
                ], 422);
            }

            if (!config('sslcommerz.store_id') || !config('sslcommerz.store_password')) {
                return response()->json([
                    'status' => false,
                    'message' => 'SSLCommerz credential missing. Please check .env and config cache.',
                ], 500);
            }

            $startDate = now();
            $endDate = $startDate->copy()->addDays((int) $plan->validity);

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'validity' => $plan->validity,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => Subscription::STATUS_PENDING,
            ]);

            $tranId = 'SUB-' . $subscription->id . '-' . strtoupper(Str::random(10));

            $payment = SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'payment_method' => 'sslcommerz',
                'transaction_id' => $tranId,
                'currency' => 'BDT',
                'status' => SubscriptionPayment::STATUS_PENDING,
            ]);

            $initUrl = $this->getSslInitUrl();

            $postData = [
                'store_id' => config('sslcommerz.store_id'),
                'store_passwd' => config('sslcommerz.store_password'),
                'total_amount' => number_format((float) $plan->price, 2, '.', ''),
                'currency' => 'BDT',
                'tran_id' => $tranId,

                'success_url' => route('sslcommerz.subscription.success'),
                'fail_url' => route('sslcommerz.subscription.fail'),
                'cancel_url' => route('sslcommerz.subscription.cancel'),
                'ipn_url' => route('sslcommerz.subscription.ipn'),

                'cus_name' => $user->name ?? 'Customer',
                'cus_email' => $user->email ?? 'customer@example.com',
                'cus_add1' => $user->address ?? 'Bangladesh',
                'cus_add2' => $user->address ?? 'Bangladesh',
                'cus_city' => 'Chattogram',
                'cus_state' => 'Chattogram',
                'cus_postcode' => '4000',
                'cus_country' => 'Bangladesh',
                'cus_phone' => $user->phone ?? '01700000000',
                'cus_fax' => $user->phone ?? '01700000000',

                'shipping_method' => 'NO',
                'num_of_item' => 1,
                'product_name' => $plan->name,
                'product_category' => 'Subscription',
                'product_profile' => 'non-physical-goods',

                'value_a' => $subscription->id,
                'value_b' => $user->id,
                'value_c' => $plan->id,
                'value_d' => 'subscription',
            ];

            $response = Http::asForm()
                ->timeout(60)
                ->post($initUrl, $postData);

            $body = $response->body();
            $result = $response->json();

            Log::info('SSLCommerz init response', [
                'init_url' => $initUrl,
                'response_status' => $response->status(),
                'response_body' => $body,
                'response_json' => $result,
                'subscription_id' => $subscription->id,
                'payment_id' => $payment->id,
                'tran_id' => $tranId,
            ]);

            if (
                is_array($result) &&
                isset($result['status']) &&
                $result['status'] === 'SUCCESS' &&
                !empty($result['GatewayPageURL'])
            ) {
                return response()->json([
                    'status' => true,
                    'message' => 'SSLCommerz session created successfully.',
                    'redirect_url' => $result['GatewayPageURL'],
                ]);
            }

            $payment->update([
                'status' => SubscriptionPayment::STATUS_FAILED,
                'gateway_response' => is_array($result) ? $result : ['raw_response' => $body],
            ]);

            $subscription->update([
                'status' => Subscription::STATUS_CANCELLED,
            ]);

            return response()->json([
                'status' => false,
                'message' => $result['failedreason'] ?? $result['error'] ?? 'SSLCommerz payment session failed.',
                'ssl_response' => $result,
                'raw_response' => $body,
            ], 422);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('SSLCommerz payment init failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    public function sslSuccess(Request $request)
    {
        Log::info('SSLCommerz success callback', [
            'data' => $request->all(),
        ]);

        $tranId = $request->input('tran_id');

        if (!$tranId) {
            return redirect()->route('user.subscriptions.index')
                ->with('error', 'Invalid payment response.');
        }

        $payment = SubscriptionPayment::where('transaction_id', $tranId)->first();

        if (!$payment) {
            return redirect()->route('user.subscriptions.index')
                ->with('error', 'Payment record not found.');
        }

        if ($payment->status === SubscriptionPayment::STATUS_COMPLETED) {
            return redirect()->route('dashboard')
                ->with('success', 'Payment already completed. Your membership is active.');
        }

        $isValid = $this->validateSslPayment($request, $payment);

        if (!$isValid) {
            $payment->update([
                'status' => SubscriptionPayment::STATUS_FAILED,
                'gateway_response' => $request->all(),
            ]);

            if ($payment->subscription) {
                $payment->subscription->update([
                    'status' => Subscription::STATUS_CANCELLED,
                ]);
            }

            return redirect()->route('user.subscriptions.index')
                ->with('error', 'Payment validation failed.');
        }

        $this->activateSubscription($payment, $request);

        return redirect()->route('dashboard')
            ->with('success', 'Payment successful. Your membership is now active.');
    }

    public function sslFail(Request $request)
    {
        Log::warning('SSLCommerz fail callback', [
            'data' => $request->all(),
        ]);

        $tranId = $request->input('tran_id');

        if ($tranId) {
            $payment = SubscriptionPayment::where('transaction_id', $tranId)->first();

            if ($payment) {
                $payment->update([
                    'status' => SubscriptionPayment::STATUS_FAILED,
                    'gateway_response' => $request->all(),
                ]);

                if ($payment->subscription) {
                    $payment->subscription->update([
                        'status' => Subscription::STATUS_CANCELLED,
                    ]);
                }
            }
        }

        return redirect()->route('user.subscriptions.index')
            ->with('error', 'Payment failed. Please try again.');
    }

    public function sslCancel(Request $request)
    {
        Log::warning('SSLCommerz cancel callback', [
            'data' => $request->all(),
        ]);

        $tranId = $request->input('tran_id');

        if ($tranId) {
            $payment = SubscriptionPayment::where('transaction_id', $tranId)->first();

            if ($payment) {
                $payment->update([
                    'status' => SubscriptionPayment::STATUS_CANCELLED,
                    'gateway_response' => $request->all(),
                ]);

                if ($payment->subscription) {
                    $payment->subscription->update([
                        'status' => Subscription::STATUS_CANCELLED,
                    ]);
                }
            }
        }

        return redirect()->route('user.subscriptions.index')
            ->with('error', 'Payment cancelled.');
    }

    public function sslIpn(Request $request)
    {
        Log::info('SSLCommerz IPN callback', [
            'data' => $request->all(),
        ]);

        $tranId = $request->input('tran_id');

        if (!$tranId) {
            return response()->json([
                'status' => false,
                'message' => 'tran_id missing',
            ], 400);
        }

        $payment = SubscriptionPayment::where('transaction_id', $tranId)->first();

        if (!$payment) {
            return response()->json([
                'status' => false,
                'message' => 'Payment not found',
            ], 404);
        }

        if ($payment->status === SubscriptionPayment::STATUS_COMPLETED) {
            return response()->json([
                'status' => true,
                'message' => 'Already completed',
            ]);
        }

        $isValid = $this->validateSslPayment($request, $payment);

        if (!$isValid) {
            $payment->update([
                'status' => SubscriptionPayment::STATUS_FAILED,
                'gateway_response' => $request->all(),
            ]);

            if ($payment->subscription) {
                $payment->subscription->update([
                    'status' => Subscription::STATUS_CANCELLED,
                ]);
            }

            return response()->json([
                'status' => false,
                'message' => 'Payment validation failed',
            ], 400);
        }

        $this->activateSubscription($payment, $request);

        return response()->json([
            'status' => true,
            'message' => 'Subscription activated',
        ]);
    }

    private function activateSubscription(SubscriptionPayment $payment, Request $request): void
    {
        $payment->load('subscription.plan');

        if (!$payment->subscription) {
            return;
        }

        $subscription = $payment->subscription;
        $plan = $subscription->plan;

        $startDate = now();

        if ($plan) {
            $endDate = $startDate->copy()->addDays((int) $plan->validity);
            $validity = $plan->validity;
        } else {
            $endDate = $startDate->copy()->addDays((int) $subscription->validity);
            $validity = $subscription->validity;
        }

        $subscription->update([
            'start_date' => $startDate,
            'end_date' => $endDate,
            'validity' => $validity,
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        $payment->update([
            'status' => SubscriptionPayment::STATUS_COMPLETED,
            'val_id' => $request->input('val_id'),
            'bank_tran_id' => $request->input('bank_tran_id'),
            'card_type' => $request->input('card_type'),
            'currency' => $request->input('currency', 'BDT'),
            'gateway_response' => $request->all(),
            'paid_at' => now(),
        ]);
    }

    private function validateSslPayment(Request $request, SubscriptionPayment $payment): bool
    {
        $status = $request->input('status');
        $valId = $request->input('val_id');
        $tranId = $request->input('tran_id');
        $amount = (float) $request->input('amount');
        $currency = $request->input('currency', 'BDT');

        if ($status !== 'VALID' && $status !== 'VALIDATED') {
            Log::warning('SSLCommerz invalid status from callback', [
                'status' => $status,
                'tran_id' => $tranId,
            ]);

            return false;
        }

        if (!$valId || !$tranId) {
            Log::warning('SSLCommerz missing val_id or tran_id', [
                'val_id' => $valId,
                'tran_id' => $tranId,
            ]);

            return false;
        }

        if ($tranId !== $payment->transaction_id) {
            Log::warning('SSLCommerz tran_id mismatch', [
                'callback_tran_id' => $tranId,
                'payment_tran_id' => $payment->transaction_id,
            ]);

            return false;
        }

        if (round($amount, 2) !== round((float) $payment->amount, 2)) {
            Log::warning('SSLCommerz amount mismatch', [
                'callback_amount' => $amount,
                'payment_amount' => $payment->amount,
            ]);

            return false;
        }

        if (strtoupper($currency) !== 'BDT') {
            Log::warning('SSLCommerz currency mismatch', [
                'currency' => $currency,
            ]);

            return false;
        }

        $validationUrl = $this->getSslValidationUrl();

        try {
            $response = Http::get($validationUrl, [
                'val_id' => $valId,
                'store_id' => config('sslcommerz.store_id'),
                'store_passwd' => config('sslcommerz.store_password'),
                'format' => 'json',
            ]);

            $result = $response->json();

            Log::info('SSLCommerz validation response', [
                'response_status' => $response->status(),
                'response_body' => $response->body(),
                'response_json' => $result,
                'payment_id' => $payment->id,
                'transaction_id' => $payment->transaction_id,
            ]);

            if (!is_array($result)) {
                return false;
            }

            $validatedStatus = $result['status'] ?? null;
            $validatedTranId = $result['tran_id'] ?? null;
            $validatedAmount = isset($result['amount']) ? (float) $result['amount'] : 0;
            $validatedCurrency = $result['currency'] ?? 'BDT';

            if ($validatedStatus !== 'VALID' && $validatedStatus !== 'VALIDATED') {
                return false;
            }

            if ($validatedTranId !== $payment->transaction_id) {
                return false;
            }

            if (round($validatedAmount, 2) !== round((float) $payment->amount, 2)) {
                return false;
            }

            if (strtoupper($validatedCurrency) !== 'BDT') {
                return false;
            }

            $riskLevel = isset($result['risk_level']) ? (int) $result['risk_level'] : 0;

            if ($riskLevel === 1) {
                Log::warning('SSLCommerz risky transaction detected', [
                    'payment_id' => $payment->id,
                    'transaction_id' => $payment->transaction_id,
                    'validation_response' => $result,
                ]);

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('SSLCommerz validation failed', [
                'message' => $e->getMessage(),
                'payment_id' => $payment->id,
                'transaction_id' => $payment->transaction_id,
            ]);

            return false;
        }
    }

    private function getSslInitUrl(): string
    {
        return config('sslcommerz.sandbox')
            ? config('sslcommerz.sandbox_init_url')
            : config('sslcommerz.live_init_url');
    }

    private function getSslValidationUrl(): string
    {
        return config('sslcommerz.sandbox')
            ? config('sslcommerz.sandbox_validation_url')
            : config('sslcommerz.live_validation_url');
    }

    public function edit(string $id)
    {
        $subscription = Subscription::with(['user', 'plan'])->findOrFail($id);

        return Inertia::render('UserNavSection/Subscription/Edit', [
            'subscription' => $subscription,
            'plans' => Plan::active()->get(),
        ]);
    }

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
                'plan_id' => 'required|exists:plans,id',
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

        if (
            Subscription::where('status', Subscription::STATUS_ACTIVE)
                ->where('user_id', $user_id)
                ->whereDate('end_date', '>=', now())
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'error' => 'You already have an active subscription.',
            ]);
        }

        $subscription->update([
            'end_date' => $endDate,
            'validity' => $subscription->validity + $plan->validity,
            'status' => Subscription::STATUS_ACTIVE,
        ]);

        if ($plan_type !== Plan::PLAN_FREE) {
            SubscriptionPayment::create([
                'subscription_id' => $subscription->id,
                'amount' => $plan->price,
                'payment_method' => $request->payment_method,
                'transaction_id' => $request->transaction_id,
                'currency' => 'BDT',
                'status' => SubscriptionPayment::STATUS_COMPLETED,
                'paid_at' => now(),
            ]);
        }

        return to_route('user.subscriptions.index')
            ->with('success', 'Subscription renewed and payment recorded successfully.');
    }

    public function paymentHistory(string $id)
    {
        $subscription = Subscription::with(['user', 'plan', 'payment'])->findOrFail($id);

        $paymentHistory = SubscriptionPayment::where('subscription_id', $id)
            ->orderByDesc('id')
            ->get();

        return Inertia::render('UserNavSection/Subscription/Show', [
            'subscription' => $subscription,
            'paymentHistory' => $paymentHistory,
        ]);
    }

    public function destroy(string $id)
    {
        //
    }
}