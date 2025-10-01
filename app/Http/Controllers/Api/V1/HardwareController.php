<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Hardware\HardwareManager;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HardwareController extends Controller
{
    private $hardwareManager;

    public function __construct()
    {
        // Load hardware configuration from settings or config
        $config = $this->getHardwareConfig();
        $this->hardwareManager = new HardwareManager($config);
    }

    public function status()
    {
        try {
            $status = $this->hardwareManager->getAllDeviceStatus();

            return response()->json([
                'status' => 'success',
                'devices' => $status,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function testDevices()
    {
        try {
            $results = $this->hardwareManager->testAllDevices();

            return response()->json([
                'status' => 'success',
                'test_results' => $results,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function printReceipt(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'printer_name' => 'nullable|string',
        ]);

        try {
            $sale = Sale::with(['items.product', 'items.service', 'customer', 'payments', 'cashier'])
                       ->findOrFail($request->sale_id);

            $receiptData = $this->formatReceiptData($sale);

            $result = $this->hardwareManager->printReceipt(
                $receiptData,
                $request->input('printer_name', 'receipt')
            );

            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Receipt printed successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to print receipt',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Receipt printing failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function printKitchenOrder(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'printer_name' => 'nullable|string',
        ]);

        try {
            $sale = Sale::with(['items.product', 'items.service', 'customer'])
                       ->findOrFail($request->sale_id);

            // Only print items that need kitchen preparation
            $kitchenItems = $sale->items->filter(function ($item) {
                return $item->service && isset($item->service->metadata['requires_kitchen']);
            });

            if ($kitchenItems->isEmpty()) {
                return response()->json([
                    'status' => 'info',
                    'message' => 'No kitchen items found in this order',
                ]);
            }

            $orderData = $this->formatKitchenOrderData($sale, $kitchenItems);

            $result = $this->hardwareManager->printKitchenOrder(
                $orderData,
                $request->input('printer_name', 'kitchen')
            );

            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Kitchen order printed successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to print kitchen order',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Kitchen order printing failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function openCashDrawer(Request $request)
    {
        $request->validate([
            'reason' => 'required|string|in:sale,refund,change,manual,no_sale',
            'sale_id' => 'nullable|exists:sales,id',
            'amount' => 'nullable|numeric',
        ]);

        try {
            $transactionData = [
                'user_id' => auth()->id(),
                'sale_id' => $request->sale_id,
                'amount' => $request->amount,
            ];

            $result = $this->hardwareManager->openCashDrawer(
                $request->reason,
                $transactionData
            );

            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Cash drawer opened successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to open cash drawer',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Cash drawer operation failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function validateBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
        ]);

        try {
            $result = $this->hardwareManager->validateBarcode($request->barcode);

            return response()->json([
                'status' => 'success',
                'validation' => $result,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function printBarcode(Request $request)
    {
        $request->validate([
            'barcode' => 'required|string',
            'title' => 'nullable|string',
            'footer' => 'nullable|string',
            'printer_name' => 'nullable|string',
        ]);

        try {
            $printer = $this->hardwareManager->getPrinter(
                $request->input('printer_name', 'receipt')
            );

            if (!$printer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Printer not found',
                ], 404);
            }

            $options = [
                'title' => $request->title,
                'footer' => $request->footer,
            ];

            $result = $printer->printBarcode($request->barcode, $options);

            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Barcode printed successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to print barcode',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Barcode printing failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function printCustom(Request $request)
    {
        $request->validate([
            'text' => 'required|string',
            'formatting' => 'nullable|array',
            'printer_name' => 'nullable|string',
        ]);

        try {
            $printer = $this->hardwareManager->getPrinter(
                $request->input('printer_name', 'receipt')
            );

            if (!$printer) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Printer not found',
                ], 404);
            }

            $formatting = $request->input('formatting', []);
            $result = $printer->printText($request->text, $formatting);

            if ($result) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Text printed successfully',
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to print text',
            ], 500);

        } catch (\Exception $e) {
            Log::error('Custom printing failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private function getHardwareConfig()
    {
        // This would typically load from database settings or config files
        return [
            'printers' => [
                'receipt' => [
                    'connection_type' => 'network',
                    'ip_address' => config('hardware.receipt_printer.ip', '192.168.1.100'),
                    'port' => config('hardware.receipt_printer.port', 9100),
                ],
                'kitchen' => [
                    'connection_type' => 'network',
                    'ip_address' => config('hardware.kitchen_printer.ip', '192.168.1.101'),
                    'port' => config('hardware.kitchen_printer.port', 9100),
                ],
            ],
            'scanners' => [
                'default' => [
                    'type' => 'USB HID',
                    'model' => 'Generic',
                ],
            ],
            'cash_drawers' => [
                'default' => [
                    'connection_type' => 'printer',
                    'printer' => 'receipt',
                ],
            ],
        ];
    }

    private function formatReceiptData(Sale $sale)
    {
        $tenant = app('tenant');

        return [
            'store_name' => $tenant->name ?? 'Store Name',
            'store_address' => $tenant->settings['address'] ?? '',
            'store_phone' => $tenant->settings['phone'] ?? '',
            'logo' => $tenant->logo ? storage_path('app/' . $tenant->logo) : null,
            'receipt_number' => $sale->number,
            'date' => $sale->created_at->format('d/m/Y H:i:s'),
            'cashier_name' => $sale->cashier->name ?? 'Unknown',
            'customer_name' => $sale->customer->name ?? null,
            'items' => $sale->items->map(function ($item) {
                return [
                    'name' => $item->product ? $item->product->name : $item->service->name,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                    'total' => $item->price * $item->quantity,
                ];
            })->toArray(),
            'subtotal' => $sale->subtotal,
            'discount' => $sale->discount,
            'tax' => $sale->tax,
            'total' => $sale->grand_total,
            'payment_method' => $sale->payments->first()->method ?? 'Cash',
            'paid_amount' => $sale->paid_amount,
            'change' => $sale->change_amount,
            'footer_message' => $tenant->settings['receipt_footer'] ?? 'Thank you for your business!',
        ];
    }

    private function formatKitchenOrderData(Sale $sale, $kitchenItems)
    {
        return [
            'order_number' => $sale->number,
            'time' => $sale->created_at->format('H:i:s'),
            'customer' => $sale->customer->name ?? 'Walk-in Customer',
            'items' => $kitchenItems->map(function ($item) {
                return [
                    'name' => $item->service->name,
                    'quantity' => $item->quantity,
                    'notes' => $item->notes,
                    'modifiers' => $item->metadata['modifiers'] ?? [],
                ];
            })->toArray(),
            'special_instructions' => $sale->notes,
        ];
    }
}