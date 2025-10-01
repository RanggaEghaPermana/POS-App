<?php

namespace App\Services\Analytics;

use App\Models\Sale;
use App\Models\Customer;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    private $tenantId;
    private $branchId;

    public function __construct($tenantId = null, $branchId = null)
    {
        $this->tenantId = $tenantId ?? app('tenant')->id;
        $this->branchId = $branchId;
    }

    public function getDashboardStats($dateFrom = null, $dateTo = null)
    {
        $dateFrom = $dateFrom ?? now()->startOfMonth();
        $dateTo = $dateTo ?? now()->endOfDay();

        $query = Sale::when($this->branchId, function ($q) {
            return $q->where('branch_id', $this->branchId);
        })->whereBetween('created_at', [$dateFrom, $dateTo]);

        $totalSales = $query->sum('grand_total');
        $totalTransactions = $query->count();
        $averageTransaction = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;

        // Customer stats
        $totalCustomers = Customer::where('tenant_id', $this->tenantId)->count();
        $newCustomers = Customer::where('tenant_id', $this->tenantId)
                              ->whereBetween('created_at', [$dateFrom, $dateTo])
                              ->count();

        // Product stats
        $totalProducts = Product::count();
        $lowStockProducts = $this->getLowStockCount();

        // Growth calculations
        $previousPeriod = $this->getPreviousPeriodStats($dateFrom, $dateTo);
        $salesGrowth = $this->calculateGrowth($totalSales, $previousPeriod['sales']);
        $transactionGrowth = $this->calculateGrowth($totalTransactions, $previousPeriod['transactions']);

        return [
            'sales' => [
                'total' => $totalSales,
                'growth' => $salesGrowth,
                'transactions_count' => $totalTransactions,
                'transactions_growth' => $transactionGrowth,
                'average_transaction' => $averageTransaction,
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new' => $newCustomers,
                'growth' => $this->calculateGrowth($newCustomers, $previousPeriod['new_customers']),
            ],
            'inventory' => [
                'total_products' => $totalProducts,
                'low_stock_alerts' => $lowStockProducts,
            ],
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d'),
            ]
        ];
    }

    public function getSalesReport($dateFrom, $dateTo, $filters = [])
    {
        $query = Sale::with(['items.product', 'items.service', 'customer', 'payments'])
                    ->when($this->branchId, function ($q) {
                        return $q->where('branch_id', $this->branchId);
                    })
                    ->whereBetween('created_at', [$dateFrom, $dateTo]);

        // Apply filters
        if (isset($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (isset($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (isset($filters['min_amount'])) {
            $query->where('grand_total', '>=', $filters['min_amount']);
        }

        if (isset($filters['max_amount'])) {
            $query->where('grand_total', '<=', $filters['max_amount']);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();

        // Calculate summary
        $summary = [
            'total_sales' => $sales->sum('grand_total'),
            'total_transactions' => $sales->count(),
            'average_transaction' => $sales->avg('grand_total'),
            'total_items_sold' => $sales->sum(function ($sale) {
                return $sale->items->sum('quantity');
            }),
            'payment_methods' => $this->getPaymentMethodBreakdown($sales),
            'top_products' => $this->getTopProducts($dateFrom, $dateTo),
            'hourly_sales' => $this->getHourlySales($dateFrom, $dateTo),
            'daily_sales' => $this->getDailySales($dateFrom, $dateTo),
        ];

        return [
            'data' => $sales,
            'summary' => $summary,
            'charts_data' => $this->generateSalesCharts($summary),
        ];
    }

    public function getCustomerReport($dateFrom, $dateTo, $filters = [])
    {
        $query = Customer::with(['sales', 'loyaltyTransactions'])
                        ->where('tenant_id', $this->tenantId);

        // Apply filters
        if (isset($filters['membership_tier'])) {
            $query->where('membership_tier', $filters['membership_tier']);
        }

        if (isset($filters['customer_type'])) {
            $query->where('customer_type', $filters['customer_type']);
        }

        if (isset($filters['min_spent'])) {
            $query->where('total_spent', '>=', $filters['min_spent']);
        }

        $customers = $query->get();

        // Filter by date range for sales
        $customers = $customers->map(function ($customer) use ($dateFrom, $dateTo) {
            $periodSales = $customer->sales()
                                  ->whereBetween('created_at', [$dateFrom, $dateTo])
                                  ->get();

            $customer->period_sales = $periodSales;
            $customer->period_spent = $periodSales->sum('grand_total');
            $customer->period_transactions = $periodSales->count();

            return $customer;
        });

        $summary = [
            'total_customers' => $customers->count(),
            'new_customers' => $customers->where('created_at', '>=', $dateFrom)->count(),
            'active_customers' => $customers->where('period_transactions', '>', 0)->count(),
            'total_revenue' => $customers->sum('period_spent'),
            'average_customer_value' => $customers->avg('total_spent'),
            'loyalty_points_issued' => $customers->sum('loyalty_points'),
            'tier_distribution' => $customers->groupBy('membership_tier')->map->count(),
            'top_customers' => $customers->sortByDesc('period_spent')->take(10)->values(),
        ];

        return [
            'data' => $customers,
            'summary' => $summary,
            'charts_data' => $this->generateCustomerCharts($summary),
        ];
    }

    public function getInventoryReport($filters = [])
    {
        $query = Product::with(['category']);

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['low_stock_only'])) {
            $query->whereHas('stocks', function ($q) {
                $q->whereRaw('stock <= minimum_stock');
            });
        }

        $products = $query->get();

        // Get stock movements for analysis
        $movements = StockMovement::with(['product'])
                                ->when($this->branchId, function ($q) {
                                    return $q->where('branch_id', $this->branchId);
                                })
                                ->whereBetween('created_at', [now()->subDays(30), now()])
                                ->get();

        $summary = [
            'total_products' => $products->count(),
            'total_stock_value' => $products->sum(function ($product) {
                return $product->price * $product->stock;
            }),
            'low_stock_items' => $products->where('stock', '<=', 'minimum_stock')->count(),
            'out_of_stock_items' => $products->where('stock', 0)->count(),
            'stock_movements_30d' => $movements->count(),
            'top_selling_products' => $this->getTopSellingProducts(),
            'slow_moving_products' => $this->getSlowMovingProducts(),
        ];

        return [
            'data' => $products,
            'summary' => $summary,
            'charts_data' => $this->generateInventoryCharts($summary),
        ];
    }

    public function getFinancialReport($dateFrom, $dateTo)
    {
        $sales = Sale::when($this->branchId, function ($q) {
                       return $q->where('branch_id', $this->branchId);
                     })
                     ->whereBetween('created_at', [$dateFrom, $dateTo])
                     ->get();

        $payments = Payment::whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
                          $q->when($this->branchId, function ($query) {
                              return $query->where('branch_id', $this->branchId);
                          })
                          ->whereBetween('created_at', [$dateFrom, $dateTo]);
                      })
                      ->where('status', 'completed')
                      ->get();

        $summary = [
            'gross_revenue' => $sales->sum('grand_total'),
            'net_revenue' => $payments->sum('net_amount'),
            'payment_fees' => $payments->sum('fee'),
            'total_transactions' => $sales->count(),
            'payment_method_breakdown' => $payments->groupBy('method')
                                                 ->map(function ($group) {
                                                     return [
                                                         'count' => $group->count(),
                                                         'amount' => $group->sum('amount'),
                                                         'fees' => $group->sum('fee'),
                                                     ];
                                                 }),
            'daily_revenue' => $this->getDailyRevenue($dateFrom, $dateTo),
            'monthly_comparison' => $this->getMonthlyComparison($dateFrom, $dateTo),
        ];

        return [
            'summary' => $summary,
            'charts_data' => $this->generateFinancialCharts($summary),
        ];
    }

    private function getPreviousPeriodStats($dateFrom, $dateTo)
    {
        $periodLength = $dateFrom->diffInDays($dateTo);
        $previousFrom = $dateFrom->copy()->subDays($periodLength + 1);
        $previousTo = $dateFrom->copy()->subDay();

        $previousSales = Sale::when($this->branchId, function ($q) {
                                return $q->where('branch_id', $this->branchId);
                              })
                              ->whereBetween('created_at', [$previousFrom, $previousTo])
                              ->get();

        return [
            'sales' => $previousSales->sum('grand_total'),
            'transactions' => $previousSales->count(),
            'new_customers' => Customer::where('tenant_id', $this->tenantId)
                                     ->whereBetween('created_at', [$previousFrom, $previousTo])
                                     ->count(),
        ];
    }

    private function calculateGrowth($current, $previous)
    {
        if ($previous == 0) return 100;
        return round((($current - $previous) / $previous) * 100, 2);
    }

    private function getLowStockCount()
    {
        return Product::whereHas('stocks', function ($q) {
            $q->whereRaw('stock <= minimum_stock OR stock = 0');
        })->count();
    }

    private function getPaymentMethodBreakdown($sales)
    {
        return $sales->flatMap->payments
                    ->where('status', 'completed')
                    ->groupBy('method')
                    ->map(function ($group) {
                        return [
                            'count' => $group->count(),
                            'amount' => $group->sum('amount'),
                        ];
                    });
    }

    private function getTopProducts($dateFrom, $dateTo, $limit = 10)
    {
        return DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->select('products.name',
                        DB::raw('SUM(sale_items.quantity) as total_sold'),
                        DB::raw('SUM(sale_items.price * sale_items.quantity) as total_revenue'))
                ->when($this->branchId, function ($q) {
                    return $q->where('sales.branch_id', $this->branchId);
                })
                ->whereBetween('sales.created_at', [$dateFrom, $dateTo])
                ->whereNotNull('sale_items.product_id')
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_sold', 'desc')
                ->limit($limit)
                ->get();
    }

    private function getHourlySales($dateFrom, $dateTo)
    {
        return Sale::when($this->branchId, function ($q) {
                      return $q->where('branch_id', $this->branchId);
                    })
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->selectRaw('HOUR(created_at) as hour, COUNT(*) as transactions, SUM(grand_total) as total')
                    ->groupBy('hour')
                    ->orderBy('hour')
                    ->get();
    }

    private function getDailySales($dateFrom, $dateTo)
    {
        return Sale::when($this->branchId, function ($q) {
                      return $q->where('branch_id', $this->branchId);
                    })
                    ->whereBetween('created_at', [$dateFrom, $dateTo])
                    ->selectRaw('DATE(created_at) as date, COUNT(*) as transactions, SUM(grand_total) as total')
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get();
    }

    private function getTopSellingProducts($limit = 10)
    {
        return DB::table('sale_items')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_sold'))
                ->whereNotNull('sale_items.product_id')
                ->whereBetween('sale_items.created_at', [now()->subDays(30), now()])
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_sold', 'desc')
                ->limit($limit)
                ->get();
    }

    private function getSlowMovingProducts($limit = 10)
    {
        return Product::select('products.*')
                     ->leftJoin('sale_items', 'products.id', '=', 'sale_items.product_id')
                     ->selectRaw('products.*, COALESCE(SUM(sale_items.quantity), 0) as total_sold')
                     ->groupBy('products.id')
                     ->orderBy('total_sold', 'asc')
                     ->limit($limit)
                     ->get();
    }

    private function getDailyRevenue($dateFrom, $dateTo)
    {
        return Payment::whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
                         $q->when($this->branchId, function ($query) {
                             return $query->where('branch_id', $this->branchId);
                         })
                         ->whereBetween('created_at', [$dateFrom, $dateTo]);
                       })
                       ->where('status', 'completed')
                       ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
                       ->groupBy('date')
                       ->orderBy('date')
                       ->get();
    }

    private function getMonthlyComparison($dateFrom, $dateTo)
    {
        $currentMonth = $dateFrom->format('Y-m');
        $previousMonth = $dateFrom->copy()->subMonth()->format('Y-m');

        $current = Payment::whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
                            $q->when($this->branchId, function ($query) {
                                return $query->where('branch_id', $this->branchId);
                            })
                            ->whereBetween('created_at', [$dateFrom, $dateTo]);
                          })
                          ->where('status', 'completed')
                          ->sum('amount');

        $previous = Payment::whereHas('sale', function ($q) use ($dateFrom) {
                             $previousStart = $dateFrom->copy()->subMonth()->startOfMonth();
                             $previousEnd = $dateFrom->copy()->subMonth()->endOfMonth();

                             $q->when($this->branchId, function ($query) {
                                 return $query->where('branch_id', $this->branchId);
                             })
                             ->whereBetween('created_at', [$previousStart, $previousEnd]);
                           })
                           ->where('status', 'completed')
                           ->sum('amount');

        return [
            'current_month' => $current,
            'previous_month' => $previous,
            'growth' => $this->calculateGrowth($current, $previous),
        ];
    }

    private function generateSalesCharts($summary)
    {
        return [
            'daily_sales' => [
                'type' => 'line',
                'data' => $summary['daily_sales'],
                'title' => 'Daily Sales Trend'
            ],
            'hourly_sales' => [
                'type' => 'bar',
                'data' => $summary['hourly_sales'],
                'title' => 'Sales by Hour'
            ],
            'payment_methods' => [
                'type' => 'pie',
                'data' => $summary['payment_methods'],
                'title' => 'Payment Methods Distribution'
            ],
            'top_products' => [
                'type' => 'bar',
                'data' => $summary['top_products'],
                'title' => 'Top Selling Products'
            ]
        ];
    }

    private function generateCustomerCharts($summary)
    {
        return [
            'tier_distribution' => [
                'type' => 'pie',
                'data' => $summary['tier_distribution'],
                'title' => 'Customer Tier Distribution'
            ],
            'top_customers' => [
                'type' => 'bar',
                'data' => $summary['top_customers'],
                'title' => 'Top Customers by Revenue'
            ]
        ];
    }

    private function generateInventoryCharts($summary)
    {
        return [
            'stock_status' => [
                'type' => 'pie',
                'data' => [
                    'In Stock' => $summary['total_products'] - $summary['low_stock_items'] - $summary['out_of_stock_items'],
                    'Low Stock' => $summary['low_stock_items'],
                    'Out of Stock' => $summary['out_of_stock_items']
                ],
                'title' => 'Stock Status Distribution'
            ],
            'top_selling' => [
                'type' => 'bar',
                'data' => $summary['top_selling_products'],
                'title' => 'Top Selling Products'
            ]
        ];
    }

    private function generateFinancialCharts($summary)
    {
        return [
            'daily_revenue' => [
                'type' => 'line',
                'data' => $summary['daily_revenue'],
                'title' => 'Daily Revenue Trend'
            ],
            'payment_methods' => [
                'type' => 'pie',
                'data' => $summary['payment_method_breakdown'],
                'title' => 'Revenue by Payment Method'
            ]
        ];
    }
}