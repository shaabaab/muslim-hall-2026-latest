<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SubscriptionPayment;
use Inertia\Inertia;

class PaymentManageController extends Controller
{

    public function payments(Request $request)
    {
        $query = SubscriptionPayment::with(['subscription', 'subscription.user', 'subscription.plan']);

       if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                
                ->orWhereHas('subscription.user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                })
                
                ->orWhereHas('subscription.plan', function ($planQuery) use ($search) {
                    $planQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('plan_type', 'like', "%{$search}%");
                });
            });
        }


        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        $payments = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 10))->withQueryString();

        return Inertia::render('Subscription/Payments', [
            'payments' => $payments,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

}
