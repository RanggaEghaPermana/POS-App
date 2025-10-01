<?php

namespace App\Services\PaymentGateway;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransGateway implements PaymentGatewayInterface
{
    private $serverKey;
    private $clientKey;
    private $isProduction;
    private $baseUrl;

    public function __construct()
    {
        $this->serverKey = config('services.midtrans.server_key');
        $this->clientKey = config('services.midtrans.client_key');
        $this->isProduction = config('services.midtrans.is_production', false);
        $this->baseUrl = $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function createPayment(array $data)
    {
        $payload = [
            'transaction_details' => [
                'order_id' => $data['order_id'],
                'gross_amount' => $data['amount'],
            ],
            'customer_details' => [
                'first_name' => $data['customer_name'],
                'email' => $data['customer_email'] ?? '',
                'phone' => $data['customer_phone'] ?? '',
            ],
            'enabled_payments' => $data['payment_methods'] ?? [
                'gopay', 'shopeepay', 'dana', 'linkaja', 'ovo',
                'qris', 'bank_transfer', 'credit_card'
            ],
            'expiry' => [
                'duration' => 60,
                'unit' => 'minutes'
            ],
        ];

        if (isset($data['items'])) {
            $payload['item_details'] = $data['items'];
        }

        return $this->makeRequest('/charge', $payload);
    }

    public function createQRCode(array $data)
    {
        $payload = [
            'transaction_details' => [
                'order_id' => $data['order_id'],
                'gross_amount' => $data['amount'],
            ],
            'customer_details' => [
                'first_name' => $data['customer_name'],
                'email' => $data['customer_email'] ?? '',
                'phone' => $data['customer_phone'] ?? '',
            ],
            'enabled_payments' => ['qris'],
            'expiry' => [
                'duration' => 60,
                'unit' => 'minutes'
            ],
        ];

        return $this->makeRequest('/charge', $payload);
    }

    public function getPaymentStatus(string $transactionId)
    {
        return $this->makeRequest("/{$transactionId}/status", null, 'GET');
    }

    public function cancelPayment(string $transactionId)
    {
        return $this->makeRequest("/{$transactionId}/cancel", [], 'POST');
    }

    public function refundPayment(string $transactionId, float $amount = null)
    {
        $payload = [];
        if ($amount) {
            $payload['refund_amount'] = $amount;
        }

        return $this->makeRequest("/{$transactionId}/refund", $payload);
    }

    public function handleWebhook(array $payload)
    {
        $transactionStatus = $payload['transaction_status'] ?? '';
        $orderId = $payload['order_id'] ?? '';
        $fraudStatus = $payload['fraud_status'] ?? '';

        $status = 'pending';

        if ($transactionStatus == 'capture') {
            if ($fraudStatus == 'challenge') {
                $status = 'pending';
            } else if ($fraudStatus == 'accept') {
                $status = 'completed';
            }
        } else if ($transactionStatus == 'settlement') {
            $status = 'completed';
        } else if ($transactionStatus == 'cancel' ||
                   $transactionStatus == 'deny' ||
                   $transactionStatus == 'expire') {
            $status = 'failed';
        } else if ($transactionStatus == 'pending') {
            $status = 'pending';
        } else if ($transactionStatus == 'refund') {
            $status = 'refunded';
        }

        return [
            'order_id' => $orderId,
            'transaction_id' => $payload['transaction_id'] ?? '',
            'status' => $status,
            'amount' => $payload['gross_amount'] ?? 0,
            'payment_type' => $payload['payment_type'] ?? '',
            'raw_response' => $payload,
        ];
    }

    public function validateWebhook(array $payload, string $signature)
    {
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';

        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);

        return hash_equals($signatureKey, $signature);
    }

    private function makeRequest(string $endpoint, array $payload = null, string $method = 'POST')
    {
        try {
            $headers = [
                'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ];

            $response = Http::withHeaders($headers);

            if ($method === 'GET') {
                $response = $response->get($this->baseUrl . $endpoint);
            } else {
                $response = $response->post($this->baseUrl . $endpoint, $payload);
            }

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['error_messages'] ?? ['Payment gateway error'],
                'status_code' => $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Midtrans API Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => ['Connection error: ' . $e->getMessage()],
            ];
        }
    }
}