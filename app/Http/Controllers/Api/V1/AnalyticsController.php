<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    private $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function dashboard(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $dateFrom = $request->date_from ? Carbon::parse($request->date_from) : now()->startOfMonth();
        $dateTo = $request->date_to ? Carbon::parse($request->date_to) : now()->endOfDay();

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);
        $stats = $analytics->getDashboardStats($dateFrom, $dateTo);

        return response()->json([
            'dashboard' => $stats,
            'generated_at' => now(),
        ]);
    }

    public function salesReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'branch_id' => 'nullable|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_status' => 'nullable|in:pending,paid,partial',
            'min_amount' => 'nullable|numeric|min:0',
            'max_amount' => 'nullable|numeric|min:0',
        ]);

        $dateFrom = Carbon::parse($request->date_from);
        $dateTo = Carbon::parse($request->date_to);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);

        $filters = $request->only(['customer_id', 'payment_status', 'min_amount', 'max_amount']);
        $report = $analytics->getSalesReport($dateFrom, $dateTo, $filters);

        return response()->json([
            'report' => $report,
            'filters' => $filters,
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d'),
            ],
            'generated_at' => now(),
        ]);
    }

    public function customerReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'membership_tier' => 'nullable|in:bronze,silver,gold,platinum',
            'customer_type' => 'nullable|in:individual,corporate',
            'min_spent' => 'nullable|numeric|min:0',
        ]);

        $dateFrom = Carbon::parse($request->date_from);
        $dateTo = Carbon::parse($request->date_to);

        $analytics = new AnalyticsService(app('tenant')->id);

        $filters = $request->only(['membership_tier', 'customer_type', 'min_spent']);
        $report = $analytics->getCustomerReport($dateFrom, $dateTo, $filters);

        return response()->json([
            'report' => $report,
            'filters' => $filters,
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d'),
            ],
            'generated_at' => now(),
        ]);
    }

    public function inventoryReport(Request $request)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'category_id' => 'nullable|exists:categories,id',
            'low_stock_only' => 'nullable|boolean',
        ]);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);

        $filters = $request->only(['category_id', 'low_stock_only']);
        $report = $analytics->getInventoryReport($filters);

        return response()->json([
            'report' => $report,
            'filters' => $filters,
            'generated_at' => now(),
        ]);
    }

    public function financialReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $dateFrom = Carbon::parse($request->date_from);
        $dateTo = Carbon::parse($request->date_to);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);
        $report = $analytics->getFinancialReport($dateFrom, $dateTo);

        return response()->json([
            'report' => $report,
            'period' => [
                'from' => $dateFrom->format('Y-m-d'),
                'to' => $dateTo->format('Y-m-d'),
            ],
            'generated_at' => now(),
        ]);
    }

    public function salesForecast(Request $request)
    {
        $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'forecast_days' => 'nullable|integer|min:1|max:90',
        ]);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);

        // Simple linear forecast based on last 30 days
        $historicalData = $analytics->getDailySales(now()->subDays(30), now());

        $forecastDays = $request->input('forecast_days', 30);
        $averageDailySales = $historicalData->avg('total');
        $trend = $this->calculateTrend($historicalData);

        $forecast = [];
        for ($i = 1; $i <= $forecastDays; $i++) {
            $forecastDate = now()->addDays($i);
            $forecastValue = $averageDailySales + ($trend * $i);

            $forecast[] = [
                'date' => $forecastDate->format('Y-m-d'),
                'predicted_sales' => max(0, $forecastValue), // Ensure non-negative
                'confidence' => max(0.5, 1 - ($i / $forecastDays * 0.5)), // Decreasing confidence
            ];
        }

        return response()->json([
            'forecast' => $forecast,
            'historical_data' => $historicalData,
            'metadata' => [
                'average_daily_sales' => $averageDailySales,
                'trend' => $trend,
                'forecast_period' => $forecastDays,
                'based_on_days' => 30,
            ],
            'generated_at' => now(),
        ]);
    }

    public function exportReport(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:sales,customer,inventory,financial',
            'format' => 'required|in:csv,excel,pdf',
            'date_from' => 'required_if:report_type,sales,customer,financial|date',
            'date_to' => 'required_if:report_type,sales,customer,financial|date|after_or_equal:date_from',
        ]);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);

        switch ($request->report_type) {
            case 'sales':
                $report = $analytics->getSalesReport(
                    Carbon::parse($request->date_from),
                    Carbon::parse($request->date_to),
                    $request->only(['customer_id', 'payment_status', 'min_amount', 'max_amount'])
                );
                break;
            case 'customer':
                $report = $analytics->getCustomerReport(
                    Carbon::parse($request->date_from),
                    Carbon::parse($request->date_to),
                    $request->only(['membership_tier', 'customer_type', 'min_spent'])
                );
                break;
            case 'inventory':
                $report = $analytics->getInventoryReport(
                    $request->only(['category_id', 'low_stock_only'])
                );
                break;
            case 'financial':
                $report = $analytics->getFinancialReport(
                    Carbon::parse($request->date_from),
                    Carbon::parse($request->date_to)
                );
                break;
        }

        // Generate export file
        $filename = $request->report_type . '_report_' . now()->format('Y-m-d_H-i-s');

        switch ($request->format) {
            case 'csv':
                return $this->exportToCsv($report, $filename);
            case 'excel':
                return $this->exportToExcel($report, $filename);
            case 'pdf':
                return $this->exportToPdf($report, $filename);
        }
    }

    public function compareReports(Request $request)
    {
        $request->validate([
            'report_type' => 'required|in:sales,customer,financial',
            'period1_from' => 'required|date',
            'period1_to' => 'required|date|after_or_equal:period1_from',
            'period2_from' => 'required|date',
            'period2_to' => 'required|date|after_or_equal:period2_from',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $analytics = new AnalyticsService(app('tenant')->id, $request->branch_id);

        $period1 = [
            'from' => Carbon::parse($request->period1_from),
            'to' => Carbon::parse($request->period1_to),
        ];

        $period2 = [
            'from' => Carbon::parse($request->period2_from),
            'to' => Carbon::parse($request->period2_to),
        ];

        $report1 = $this->getReportByType($analytics, $request->report_type, $period1['from'], $period1['to']);
        $report2 = $this->getReportByType($analytics, $request->report_type, $period2['from'], $period2['to']);

        $comparison = $this->calculateComparison($report1['summary'], $report2['summary']);

        return response()->json([
            'period1' => [
                'data' => $report1,
                'period' => $period1,
            ],
            'period2' => [
                'data' => $report2,
                'period' => $period2,
            ],
            'comparison' => $comparison,
            'generated_at' => now(),
        ]);
    }

    private function calculateTrend($data)
    {
        if ($data->count() < 2) return 0;

        $n = $data->count();
        $sumX = $data->keys()->sum();
        $sumY = $data->sum('total');
        $sumXY = $data->map(function ($item, $key) {
            return $key * $item->total;
        })->sum();
        $sumX2 = $data->keys()->map(function ($x) {
            return $x * $x;
        })->sum();

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumX2 - $sumX * $sumX);

        return $slope;
    }

    private function getReportByType($analytics, $type, $dateFrom, $dateTo)
    {
        switch ($type) {
            case 'sales':
                return $analytics->getSalesReport($dateFrom, $dateTo);
            case 'customer':
                return $analytics->getCustomerReport($dateFrom, $dateTo);
            case 'financial':
                return $analytics->getFinancialReport($dateFrom, $dateTo);
            default:
                throw new \InvalidArgumentException("Invalid report type: {$type}");
        }
    }

    private function calculateComparison($summary1, $summary2)
    {
        $comparison = [];

        foreach ($summary1 as $key => $value1) {
            if (isset($summary2[$key]) && is_numeric($value1) && is_numeric($summary2[$key])) {
                $value2 = $summary2[$key];
                $difference = $value1 - $value2;
                $percentageChange = $value2 != 0 ? round(($difference / $value2) * 100, 2) : 0;

                $comparison[$key] = [
                    'period1' => $value1,
                    'period2' => $value2,
                    'difference' => $difference,
                    'percentage_change' => $percentageChange,
                    'trend' => $difference > 0 ? 'up' : ($difference < 0 ? 'down' : 'stable'),
                ];
            }
        }

        return $comparison;
    }

    private function exportToCsv($report, $filename)
    {
        // Implementation for CSV export
        return response()->json(['message' => 'CSV export feature coming soon']);
    }

    private function exportToExcel($report, $filename)
    {
        // Implementation for Excel export
        return response()->json(['message' => 'Excel export feature coming soon']);
    }

    private function exportToPdf($report, $filename)
    {
        // Implementation for PDF export
        return response()->json(['message' => 'PDF export feature coming soon']);
    }
}