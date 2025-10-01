<?php

namespace App\Services\PaymentGateway;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditGateway implements PaymentGatewayInterface
{
    private $secretKey;
    private $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.xendit.secret_key');
        $this->baseUrl = 'https://api.xendit.co';
    }

    public function createPayment(array $data)
    {
        // Create invoice for multiple payment methods
        $payload = [
            'external_id' => $data['order_id'],
            'payer_email' => $data['customer_email'] ?? '',
            'description' => $data['description'] ?? 'Payment',
            'amount' => $data['amount'],
            'currency' => 'IDR',
            'invoice_duration' => 3600, // 1 hour
            'should_send_email' => false,
            'success_redirect_url' => $data['success_url'] ?? '',
            'failure_redirect_url' => $data['failure_url'] ?? '',
        ];

        if (isset($data['payment_methods'])) {
            $payload['payment_methods'] = $data['payment_methods'];
        }

        return $this->makeRequest('/v2/invoices', $payload);
    }

    public function createQRCode(array $data)
    {
        // Create QRIS payment
        $payload = [
            'external_id' => $data['order_id'],
            'type' => 'DYNAMIC',
            'callback_url' => $data['callback_url'] ?? '',
            'amount' => $data['amount'],
        ];

        return $this->makeRequest('/qr_codes', $payload);
    }

    public function getPaymentStatus(string $transactionId)
    {
        return $this->makeRequest("/v2/invoices/{$transactionId}", null, 'GET');
    }

    public function cancelPayment(string $transactionId)
    {
        return $this->makeRequest("/v2/invoices/{$transactionId}/expire!", [], 'POST');
    }

    public function refundPayment(string $transactionId, float $amount = null)
    {
        // Xendit refunds work differently, need payment ID
        $payload = [
            'invoice_id' => $transactionId,
            'reason' => 'REQUESTED_BY_CUSTOMER',
        ];

        if ($amount) {
            $payload['amount'] = $amount;
        }

        return $this->makeRequest('/refunds', $payload);
    }

    public function handleWebhook(array $payload)
    {
        $status = 'pending';

        if (isset($payload['status'])) {
            switch ($payload['status']) {
                case 'PAID':
                    $status = 'completed';
                    break;
                case 'PENDING':
                    $status = 'pending';
                    break;
                case 'EXPIRED':
                    $status = 'failed';
                    break;
                default:
                    $status = 'pending';
            }
        }

        return [
            'order_id' => $payload['external_id'] ?? '',
            'transaction_id' => $payload['id'] ?? '',
            'status' => $status,
            'amount' => $payload['amount'] ?? 0,
            'payment_type' => $payload['payment_method'] ?? '',
            'raw_response' => $payload,
        ];
    }

    public function validateWebhook(array $payload, string $signature)
    {
        $rawBody = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $expectedSignature = hash_hmac('sha256', $rawBody, $this->secretKey);

        return hash_equals($expectedSignature, $signature);
    }

    private function makeRequest(string $endpoint, array $payload = null, string $method = 'POST')
    {
        try {
            $headers = [
                'Authorization' => 'Basic ' . base64_encode($this->secretKey . ':'),
                'Content-Type' => 'application/json',
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
                'error' => $response->json()['message'] ?? ['Payment gateway error'],
                'status_code' => $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Xendit API Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => ['Connection error: ' . $e->getMessage()],
            ];
        }
    }
}