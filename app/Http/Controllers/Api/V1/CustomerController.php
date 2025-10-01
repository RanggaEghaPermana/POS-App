<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerCommunication;
use App\Models\LoyaltyTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::with(['sales', 'loyaltyTransactions'])
            ->where('tenant_id', app('tenant')->id);

        // Filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('membership_tier')) {
            $query->byTier($request->membership_tier);
        }

        if ($request->filled('customer_type')) {
            $query->byType($request->customer_type);
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('birthday_month')) {
            $query->whereMonth('birth_date', $request->birthday_month);
        }

        if ($request->filled('high_value')) {
            $threshold = $request->input('high_value', 10000000);
            $query->highValue($threshold);
        }

        if ($request->filled('inactive_days')) {
            $days = $request->input('inactive_days', 90);
            $query->inactive($days);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $customers = $query->paginate($request->input('per_page', 15));

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'id_number' => 'nullable|string|max:50',
            'customer_type' => 'nullable|in:individual,corporate',
            'company_name' => 'nullable|string|max:255',
            'tax_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $customer = Customer::create(array_merge(
            $request->only([
                'name', 'email', 'phone', 'address', 'birth_date',
                'gender', 'id_number', 'customer_type', 'company_name',
                'tax_number', 'notes', 'metadata'
            ]),
            ['tenant_id' => app('tenant')->id]
        ));

        return response()->json([
            'message' => 'Customer created successfully',
            'customer' => $customer->load(['loyaltyTransactions', 'communications']),
        ], 201);
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'sales.items.product',
            'sales.items.service',
            'loyaltyTransactions',
            'communications.user'
        ]);

        $stats = [
            'total_spent' => $customer->total_spent,
            'total_transactions' => $customer->total_transactions,
            'average_transaction' => $customer->average_transaction,
            'loyalty_points' => $customer->loyalty_points,
            'membership_benefits' => $customer->getMembershipBenefits(),
            'is_birthday_today' => $customer->isBirthdayToday(),
            'last_purchase_days_ago' => $customer->last_purchase_at
                ? $customer->last_purchase_at->diffInDays(now())
                : null,
        ];

        return response()->json([
            'customer' => $customer,
            'stats' => $stats,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:customers,email,' . $customer->id,
            'phone' => 'sometimes|string|max:20',
            'address' => 'sometimes|string',
            'birth_date' => 'sometimes|date',
            'gender' => 'sometimes|in:male,female,other',
            'id_number' => 'sometimes|string|max:50',
            'customer_type' => 'sometimes|in:individual,corporate',
            'company_name' => 'sometimes|string|max:255',
            'tax_number' => 'sometimes|string|max:50',
            'active' => 'sometimes|boolean',
            'notes' => 'sometimes|string',
            'metadata' => 'sometimes|array',
            'email_notifications' => 'sometimes|boolean',
            'sms_notifications' => 'sometimes|boolean',
            'whatsapp_notifications' => 'sometimes|boolean',
            'marketing_consent' => 'sometimes|boolean',
        ]);

        $customer->update($request->only([
            'name', 'email', 'phone', 'address', 'birth_date',
            'gender', 'id_number', 'customer_type', 'company_name',
            'tax_number', 'active', 'notes', 'metadata',
            'email_notifications', 'sms_notifications',
            'whatsapp_notifications', 'marketing_consent'
        ]));

        return response()->json([
            'message' => 'Customer updated successfully',
            'customer' => $customer->fresh(),
        ]);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json([
            'message' => 'Customer deleted successfully',
        ]);
    }

    public function addLoyaltyPoints(Request $request, Customer $customer)
    {
        $request->validate([
            'points' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $customer->addLoyaltyPoints(
            $request->points,
            $request->reason
        );

        // Create manual loyalty transaction
        LoyaltyTransaction::create([
            'customer_id' => $customer->id,
            'type' => 'bonus',
            'points' => $request->points,
            'reason' => $request->reason,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Loyalty points added successfully',
            'customer' => $customer->fresh(),
        ]);
    }

    public function redeemLoyaltyPoints(Request $request, Customer $customer)
    {
        $request->validate([
            'points' => 'required|integer|min:1|max:' . $customer->loyalty_points,
            'reason' => 'required|string|max:255',
        ]);

        try {
            $customer->redeemLoyaltyPoints(
                $request->points,
                $request->reason
            );

            return response()->json([
                'message' => 'Loyalty points redeemed successfully',
                'customer' => $customer->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function addCommunication(Request $request, Customer $customer)
    {
        $request->validate([
            'type' => 'required|in:email,sms,whatsapp,phone,visit,note',
            'direction' => 'required|in:inbound,outbound',
            'subject' => 'nullable|string|max:255',
            'content' => 'required|string',
        ]);

        $communication = $customer->communications()->create([
            'user_id' => auth()->id(),
            'type' => $request->type,
            'direction' => $request->direction,
            'subject' => $request->subject,
            'content' => $request->content,
            'status' => $request->direction === 'inbound' ? 'read' : 'draft',
        ]);

        return response()->json([
            'message' => 'Communication added successfully',
            'communication' => $communication->load('user'),
        ], 201);
    }

    public function getCommunications(Customer $customer)
    {
        $communications = $customer->communications()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($communications);
    }

    public function getLoyaltyHistory(Customer $customer)
    {
        $transactions = $customer->loyaltyTransactions()
            ->with('sale')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function getStats()
    {
        $tenantId = app('tenant')->id;

        $stats = DB::select("
            SELECT
                COUNT(*) as total_customers,
                COUNT(CASE WHEN active = 1 THEN 1 END) as active_customers,
                COUNT(CASE WHEN membership_tier = 'bronze' THEN 1 END) as bronze_customers,
                COUNT(CASE WHEN membership_tier = 'silver' THEN 1 END) as silver_customers,
                COUNT(CASE WHEN membership_tier = 'gold' THEN 1 END) as gold_customers,
                COUNT(CASE WHEN membership_tier = 'platinum' THEN 1 END) as platinum_customers,
                COUNT(CASE WHEN last_purchase_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_last_30_days,
                COUNT(CASE WHEN last_purchase_at < DATE_SUB(NOW(), INTERVAL 90 DAY) OR last_purchase_at IS NULL THEN 1 END) as inactive_customers,
                AVG(total_spent) as average_customer_value,
                SUM(loyalty_points) as total_loyalty_points
            FROM customers
            WHERE tenant_id = ?
        ", [$tenantId]);

        $birthdayToday = Customer::where('tenant_id', $tenantId)
            ->withBirthdayToday()
            ->count();

        $birthdayThisMonth = Customer::where('tenant_id', $tenantId)
            ->withBirthdayThisMonth()
            ->count();

        return response()->json([
            'stats' => $stats[0],
            'birthday_today' => $birthdayToday,
            'birthday_this_month' => $birthdayThisMonth,
        ]);
    }

    public function getBirthdayCustomers(Request $request)
    {
        $query = Customer::where('tenant_id', app('tenant')->id);

        if ($request->input('period') === 'today') {
            $query->withBirthdayToday();
        } else {
            $query->withBirthdayThisMonth();
        }

        $customers = $query->orderBy('birth_date')
            ->paginate($request->input('per_page', 15));

        return response()->json($customers);
    }
}