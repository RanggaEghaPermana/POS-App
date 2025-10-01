<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\PaymentGateway\PaymentGatewayManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentGatewayController extends Controller
{
    private $paymentManager;

    public function __construct(PaymentGatewayManager $paymentManager)
    {
        $this->paymentManager = $paymentManager;
    }

    public function createPayment(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'gateway' => 'required|in:midtrans,xendit',
            'customer_name' => 'required|string',
            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string',
            'payment_methods' => 'sometimes|array',
        ]);

        $sale = Sale::findOrFail($request->sale_id);

        if ($sale->payment_status === 'paid') {
            return response()->json(['error' => 'Sale already paid'], 400);
        }

        $orderId = 'ORD-' . $sale->id . '-' . time();

        $paymentData = [
            'order_id' => $orderId,
            'amount' => $sale->grand_total,
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'description' => "Payment for Sale #{$sale->number}",
            'payment_methods' => $request->payment_methods,
            'items' => $sale->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->product ? $item->product->name : $item->service->name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                ];
            })->toArray(),
        ];

        $result = $this->paymentManager->createPayment($request->gateway, $paymentData);

        if (!$result['success']) {
            return response()->json([
                'error' => 'Payment creation failed',
                'details' => $result['error'],
            ], 400);
        }

        // Save payment record
        $payment = Payment::create([
            'sale_id' => $sale->id,
            'method' => 'online',
            'gateway' => $request->gateway,
            'amount' => $sale->grand_total,
            'reference' => $orderId,
            'transaction_id' => $result['data']['transaction_id'] ?? $result['data']['id'] ?? null,
            'status' => 'pending',
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'payment_url' => $result['data']['redirect_url'] ?? $result['data']['invoice_url'] ?? null,
            'qr_code_url' => $result['data']['qr_code_url'] ?? null,
            'expires_at' => now()->addHour(),
            'metadata' => $result['data'],
        ]);

        return response()->json([
            'message' => 'Payment created successfully',
            'payment' => $payment,
            'payment_url' => $payment->payment_url,
            'qr_code_url' => $payment->qr_code_url,
        ]);
    }

    public function createQRCode(Request $request)
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'gateway' => 'required|in:midtrans,xendit',
            'customer_name' => 'required|string',
        ]);

        $sale = Sale::findOrFail($request->sale_id);

        if ($sale->payment_status === 'paid') {
            return response()->json(['error' => 'Sale already paid'], 400);
        }

        $orderId = 'QR-' . $sale->id . '-' . time();

        $qrData = [
            'order_id' => $orderId,
            'amount' => $sale->grand_total,
            'customer_name' => $request->customer_name,
            'callback_url' => route('payment.webhook', $request->gateway),
        ];

        $result = $this->paymentManager->createQRCode($request->gateway, $qrData);

        if (!$result['success']) {
            return response()->json([
                'error' => 'QR Code creation failed',
                'details' => $result['error'],
            ], 400);
        }

        // Save payment record
        $payment = Payment::create([
            'sale_id' => $sale->id,
            'method' => 'qris',
            'gateway' => $request->gateway,
            'amount' => $sale->grand_total,
            'reference' => $orderId,
            'transaction_id' => $result['data']['id'] ?? null,
            'status' => 'pending',
            'customer_name' => $request->customer_name,
            'qr_code_url' => $result['data']['qr_code_url'] ?? $result['data']['qr_string'] ?? null,
            'expires_at' => now()->addHour(),
            'metadata' => $result['data'],
        ]);

        return response()->json([
            'message' => 'QR Code created successfully',
            'payment' => $payment,
            'qr_code_url' => $payment->qr_code_url,
        ]);
    }

    public function checkStatus(Request $request, Payment $payment)
    {
        if (!$payment->transaction_id) {
            return response()->json(['error' => 'No transaction ID found'], 400);
        }

        $result = $this->paymentManager->getPaymentStatus(
            $payment->gateway,
            $payment->transaction_id
        );

        if (!$result['success']) {
            return response()->json([
                'error' => 'Status check failed',
                'details' => $result['error'],
            ], 400);
        }

        // Update payment status based on gateway response
        $gatewayData = $this->paymentManager->handleWebhook(
            $payment->gateway,
            $result['data']
        );

        $this->updatePaymentStatus($payment, $gatewayData);

        return response()->json([
            'payment' => $payment->fresh(),
            'gateway_data' => $result['data'],
        ]);
    }

    public function webhook(Request $request, string $gateway)
    {
        $payload = $request->all();
        $signature = $request->header('X-Callback-Token') ?:
                    $request->header('X-Hub-Signature-256') ?:
                    $request->input('signature');

        // Validate webhook signature
        if (!$this->paymentManager->validateWebhook($gateway, $payload, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $webhookData = $this->paymentManager->handleWebhook($gateway, $payload);

        // Find payment by order_id or transaction_id
        $payment = Payment::where('reference', $webhookData['order_id'])
                         ->orWhere('transaction_id', $webhookData['transaction_id'])
                         ->first();

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        $this->updatePaymentStatus($payment, $webhookData);

        return response()->json(['status' => 'success']);
    }

    public function cancelPayment(Request $request, Payment $payment)
    {
        if ($payment->isCompleted()) {
            return response()->json(['error' => 'Cannot cancel completed payment'], 400);
        }

        if (!$payment->transaction_id) {
            return response()->json(['error' => 'No transaction ID found'], 400);
        }

        $result = $this->paymentManager->gateway($payment->gateway)
                                     ->cancelPayment($payment->transaction_id);

        if (!$result['success']) {
            return response()->json([
                'error' => 'Payment cancellation failed',
                'details' => $result['error'],
            ], 400);
        }

        $payment->update([
            'status' => 'cancelled',
            'gateway_response' => json_encode($result['data']),
        ]);

        return response()->json([
            'message' => 'Payment cancelled successfully',
            'payment' => $payment,
        ]);
    }

    public function refundPayment(Request $request, Payment $payment)
    {
        $request->validate([
            'amount' => 'nullable|numeric|min:0.01|max:' . $payment->amount,
            'reason' => 'required|string|max:255',
        ]);

        if (!$payment->isCompleted()) {
            return response()->json(['error' => 'Cannot refund non-completed payment'], 400);
        }

        $refundAmount = $request->amount ?? $payment->amount;

        $result = $this->paymentManager->gateway($payment->gateway)
                                     ->refundPayment($payment->transaction_id, $refundAmount);

        if (!$result['success']) {
            return response()->json([
                'error' => 'Refund failed',
                'details' => $result['error'],
            ], 400);
        }

        $payment->update([
            'status' => 'refunded',
            'gateway_response' => json_encode($result['data']),
            'metadata' => array_merge($payment->metadata ?? [], [
                'refund' => [
                    'amount' => $refundAmount,
                    'reason' => $request->reason,
                    'refunded_at' => now(),
                ]
            ]),
        ]);

        return response()->json([
            'message' => 'Payment refunded successfully',
            'payment' => $payment,
            'refund_amount' => $refundAmount,
        ]);
    }

    private function updatePaymentStatus(Payment $payment, array $webhookData)
    {
        DB::transaction(function () use ($payment, $webhookData) {
            $payment->update([
                'status' => $webhookData['status'],
                'gateway_response' => json_encode($webhookData['raw_response']),
                'paid_at' => $webhookData['status'] === 'completed' ? now() : null,
            ]);

            // Update sale payment status
            if ($webhookData['status'] === 'completed') {
                $sale = $payment->sale;
                $totalPaid = $sale->payments()->completed()->sum('amount');

                if ($totalPaid >= $sale->grand_total) {
                    $sale->update([
                        'payment_status' => 'paid',
                        'paid_amount' => $totalPaid,
                    ]);
                }
            }
        });
    }
}