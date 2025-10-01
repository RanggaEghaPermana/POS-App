<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AppSetting;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $from = $request->query('from') ?: now()->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $cashierId = $request->query('cashier_id');
        $categoryId = $request->query('category_id');

        $user = $request->user();

        $baseItemQuery = DB::table('sale_items as si')
            ->join('sales as s', 's.id', '=', 'si.sale_id')
            ->leftJoin('products as p', 'p.id', '=', 'si.product_id')
            ->when($cashierId, fn($q) => $q->where('s.cashier_id', $cashierId))
            ->when($user && $user->hasRole('cashier'), fn($q) => $q->where('s.cashier_id', $user->id))
            ->when($categoryId, fn($q) => $q->where('p.category_id', $categoryId))
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from, $to]);

        $summary = [
            'revenue' => (float)((clone $baseItemQuery)->sum('si.subtotal') ?? 0),
            'transactions' => (int)((clone $baseItemQuery)->distinct('si.sale_id')->count('si.sale_id') ?? 0),
            'items_sold' => (int)((clone $baseItemQuery)->sum('si.quantity') ?? 0),
        ];
        $summary['avg_per_txn'] = $summary['transactions'] > 0 ? $summary['revenue'] / $summary['transactions'] : 0.0;

        $byProduct = (clone $baseItemQuery)
            ->select('p.id','p.name', DB::raw('SUM(si.quantity) as qty'), DB::raw('SUM(si.subtotal) as revenue'))
            ->groupBy('p.id','p.name')
            ->orderByDesc('revenue')
            ->limit(100)
            ->get();

        $byCategory = (clone $baseItemQuery)
            ->leftJoin('categories as c', 'c.id', '=', 'p.category_id')
            ->select('c.id','c.name', DB::raw('SUM(si.quantity) as qty'), DB::raw('SUM(si.subtotal) as revenue'))
            ->groupBy('c.id','c.name')
            ->orderByDesc('revenue')
            ->get();

        $baseSaleQuery = DB::table('sales as s')
            ->when($cashierId, fn($q) => $q->where('s.cashier_id', $cashierId))
            ->when($user && $user->hasRole('cashier'), fn($q) => $q->where('s.cashier_id', $user->id))
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from, $to]);

        $byCashier = (clone $baseSaleQuery)
            ->leftJoin('users as u', 'u.id', '=', 's.cashier_id')
            ->select('u.id','u.name', DB::raw('COUNT(*) as txns'), DB::raw('SUM(s.grand_total) as revenue'))
            ->groupBy('u.id','u.name')
            ->orderByDesc('revenue')
            ->get();

        $byPayment = DB::table('payments as pay')
            ->join('sales as s', 's.id', '=', 'pay.sale_id')
            ->when($cashierId, fn($q) => $q->where('s.cashier_id', $cashierId))
            ->when($user && $user->hasRole('cashier'), fn($q) => $q->where('s.cashier_id', $user->id))
            ->when($categoryId, function($q) use ($from,$to,$categoryId){
                $q->whereIn('s.id', function($sub) use ($from,$to,$categoryId){
                    $sub->from('sale_items as si')
                        ->join('products as p','p.id','=','si.product_id')
                        ->join('sales as s2','s2.id','=','si.sale_id')
                        ->whereBetween(DB::raw('DATE(s2.created_at)'), [$from, $to])
                        ->where('p.category_id', $categoryId)
                        ->select('si.sale_id');
                });
            })
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from, $to])
            ->select('pay.method', DB::raw('COUNT(*) as payments'), DB::raw('SUM(pay.amount) as amount'))
            ->groupBy('pay.method')
            ->orderByDesc('amount')
            ->get();

        $byHour = (clone $baseSaleQuery)
            ->select(DB::raw("DATE_FORMAT(s.created_at, '%Y-%m-%d %H:00') as hour"), DB::raw('SUM(s.grand_total) as revenue'), DB::raw('COUNT(*) as txns'))
            ->groupBy(DB::raw("DATE_FORMAT(s.created_at, '%Y-%m-%d %H:00')"))
            ->orderBy('hour')
            ->get();

        // Segment within/outside business hours
        $hours = '09:00:00-21:00:00';
        $store = AppSetting::where('key','store')->value('value');
        if ($store) {
            $decoded = json_decode($store, true);
            if (is_array($decoded) && !empty($decoded['business_hours'])) {
                $parts = explode('-', str_replace(' ', '', (string)$decoded['business_hours']));
                $hStart = (strlen($parts[0] ?? '') === 5 ? ($parts[0].':00') : ($parts[0] ?? '09:00:00'));
                $hEnd = (strlen($parts[1] ?? '') === 5 ? ($parts[1].':00') : ($parts[1] ?? '21:00:00'));
                $hours = $hStart.'-'.$hEnd;
            }
        }
        [$hStart, $hEnd] = explode('-', $hours);

        $withinQuery = (clone $baseSaleQuery);
        $outsideQuery = (clone $baseSaleQuery);

        if ($hStart <= $hEnd) {
            $withinQuery->whereBetween(DB::raw('TIME(s.created_at)'), [$hStart, $hEnd]);
            $outsideQuery->where(function($q) use ($hStart,$hEnd){
                $q->where(DB::raw('TIME(s.created_at)'), '<', $hStart)
                  ->orWhere(DB::raw('TIME(s.created_at)'), '>', $hEnd);
            });
        } else {
            $withinQuery->where(function($q) use ($hStart,$hEnd){
                $q->where(DB::raw('TIME(s.created_at)'), '>=', $hStart)
                  ->orWhere(DB::raw('TIME(s.created_at)'), '<=', $hEnd);
            });
            $outsideQuery->where(function($q) use ($hStart,$hEnd){
                $q->where(function($qq) use ($hStart,$hEnd){
                    $qq->where(DB::raw('TIME(s.created_at)'), '>', $hEnd)
                       ->where(DB::raw('TIME(s.created_at)'), '<', $hStart);
                });
            });
        }

        $within = [
            'revenue' => (float)(clone $withinQuery)->sum('s.grand_total'),
            'txns' => (int)(clone $withinQuery)->count(),
        ];
        $outside = [
            'revenue' => (float)(clone $outsideQuery)->sum('s.grand_total'),
            'txns' => (int)(clone $outsideQuery)->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'byProduct' => $byProduct,
            'byCategory' => $byCategory,
            'byCashier' => $byCashier,
            'byPayment' => $byPayment,
            'byHour' => $byHour,
            'byBusinessHours' => [
                'hours' => $hours,
                'within' => $within,
                'outside' => $outside,
            ],
        ]);
    }

    public function salesDaily(Request $request)
    {
        $from = $request->query('from');
        $to = $request->query('to');
        $days = (int)($request->query('days', 7));
        if (!$from || !$to) {
            $to = now()->toDateString();
            $from = now()->subDays(max(1, min(365, $days)) - 1)->toDateString();
        }
        $cashierId = $request->query('cashier_id');

        $rows = DB::table('sales as s')
            ->when($cashierId, fn($q) => $q->where('s.cashier_id', $cashierId))
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from, $to])
            ->select(DB::raw('DATE(s.created_at) as day'), DB::raw('SUM(s.grand_total) as revenue'), DB::raw('COUNT(*) as txns'))
            ->groupBy(DB::raw('DATE(s.created_at)'))
            ->orderBy('day')
            ->get();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'data' => $rows,
        ]);
    }

    public function inventory(Request $request)
    {
        $days = (int)min(365, max(1, $request->query('days', 30)));
        $from = now()->subDays($days-1)->toDateString();
        $to = now()->toDateString();

        $products = DB::table('products as p')
            ->leftJoin('categories as c','c.id','=','p.category_id')
            ->select('p.id','p.name','p.sku','p.stock','p.price','c.name as category')
            ->orderBy('p.name')
            ->get();

        $costs = DB::table('supplier_products as sp')
            ->select('sp.product_id', DB::raw('MAX(sp.cost_price) as cost_price'))
            ->groupBy('sp.product_id')
            ->get()->keyBy('product_id');

        $mov = DB::table('sale_items as si')
            ->join('sales as s','s.id','=','si.sale_id')
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from,$to])
            ->select('si.product_id', DB::raw('SUM(si.quantity) as sold_qty'))
            ->groupBy('si.product_id')
            ->get()->keyBy('product_id');

        $rows = [];
        $totalStockVal = 0.0;
        foreach ($products as $p) {
            $cost = (float)($costs[$p->id]->cost_price ?? $p->price);
            $stockVal = $cost * (int)$p->stock;
            $totalStockVal += $stockVal;
            $sold = (int)($mov[$p->id]->sold_qty ?? 0);
            $turnover = $p->stock > 0 ? $sold / max(1, (int)$p->stock) : $sold;
            $rows[] = [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category' => $p->category,
                'stock' => (int)$p->stock,
                'cost' => $cost,
                'stock_value' => $stockVal,
                'sold_qty' => $sold,
                'turnover_ratio' => $turnover,
            ];
        }

        $fast = collect($rows)->sortByDesc('sold_qty')->take(20)->values();
        $slow = collect($rows)->sortBy('sold_qty')->take(20)->values();
        $dead = collect($rows)->filter(fn($r)=>$r['sold_qty']==0)->take(50)->values();

        return response()->json([
            'period' => [ 'from'=>$from, 'to'=>$to ],
            'stock_valuation' => $totalStockVal,
            'items' => $rows,
            'fast_moving' => $fast,
            'slow_moving' => $slow,
            'dead_stock' => $dead,
        ]);
    }

    public function cashflow(Request $request)
    {
        $from = $request->query('from') ?: now()->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $in = DB::table('payments as p')
            ->join('sales as s','s.id','=','p.sale_id')
            ->whereBetween(DB::raw('DATE(p.paid_at)'), [$from,$to])
            ->select(DB::raw('DATE(p.paid_at) as day'), DB::raw('SUM(p.amount) as amount'))
            ->groupBy(DB::raw('DATE(p.paid_at)'))
            ->get()->keyBy('day');
        $out = DB::table('vendor_payments as vp')
            ->whereBetween(DB::raw('DATE(vp.paid_at)'), [$from,$to])
            ->select(DB::raw('DATE(vp.paid_at) as day'), DB::raw('SUM(vp.amount) as amount'))
            ->groupBy(DB::raw('DATE(vp.paid_at)'))
            ->get()->keyBy('day');
        $days = [];
        for($d=strtotime($from); $d<=strtotime($to); $d+=86400){
            $day = date('Y-m-d',$d);
            $cashIn = (float)($in[$day]->amount ?? 0);
            $cashOut = (float)($out[$day]->amount ?? 0);
            $days[] = [ 'day'=>$day, 'cash_in'=>$cashIn, 'cash_out'=>$cashOut, 'net'=>$cashIn-$cashOut ];
        }
        $totals = [
            'cash_in' => array_sum(array_column($days,'cash_in')),
            'cash_out' => array_sum(array_column($days,'cash_out')),
            'net' => array_sum(array_column($days,'net')),
        ];
        return response()->json(['from'=>$from,'to'=>$to,'daily'=>$days,'totals'=>$totals]);
    }

    public function profitLoss(Request $request)
    {
        $from = $request->query('from') ?: now()->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $sales = DB::table('sales')->whereBetween(DB::raw('DATE(created_at)'), [$from,$to])->get();
        $revenueGross = (float)$sales->sum('grand_total');
        $tax = (float)$sales->sum('tax');
        $revenueNet = $revenueGross - $tax;
        $cogs = (float)DB::table('sale_items as si')
            ->join('sales as s','s.id','=','si.sale_id')
            ->leftJoin('supplier_products as sp','sp.product_id','=','si.product_id')
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$from,$to])
            ->select(DB::raw('SUM(si.quantity * COALESCE(sp.cost_price, 0)) as cogs'))
            ->value('cogs');
        if ($cogs === null) $cogs = 0.0;
        $gross = $revenueNet - $cogs;
        $operating = 0.0; // placeholder
        $net = $gross - $operating;
        return response()->json([
            'from'=>$from,'to'=>$to,
            'revenue_gross'=>$revenueGross,
            'tax_output'=>$tax,
            'revenue_net'=>$revenueNet,
            'cogs'=>$cogs,
            'gross_profit'=>$gross,
            'operating_expenses'=>$operating,
            'net_profit'=>$net,
        ]);
    }

    public function tax(Request $request)
    {
        $from = $request->query('from') ?: now()->toDateString();
        $to = $request->query('to') ?: now()->toDateString();
        $output = (float)DB::table('sales')->whereBetween(DB::raw('DATE(created_at)'), [$from,$to])->sum('tax');
        $input = (float)DB::table('vendor_invoices')->whereBetween(DB::raw('DATE(date)'), [$from,$to])->sum('tax_amount');
        return response()->json(['from'=>$from,'to'=>$to,'ppn_output'=>$output,'ppn_input'=>$input,'ppn_net'=>$output-$input]);
    }
}
