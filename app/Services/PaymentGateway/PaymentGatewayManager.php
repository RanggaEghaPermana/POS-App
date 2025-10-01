<?php

namespace App\Services\PaymentGateway;

use Illuminate\Support\Facades\Log;

class PaymentGatewayManager
{
    private $gateways;

    public function __construct()
    {
        $this->gateways = [
            'midtrans' => new MidtransGateway(),
            'xendit' => new XenditGateway(),
        ];
    }

    public function gateway(string $name): PaymentGatewayInterface
    {
        if (!isset($this->gateways[$name])) {
            throw new \InvalidArgumentException("Payment gateway '{$name}' not supported");
        }

        return $this->gateways[$name];
    }

    public function createPayment(string $gateway, array $data)
    {
        try {
            return $this->gateway($gateway)->createPayment($data);
        } catch (\Exception $e) {
            Log::error("Payment creation failed for gateway {$gateway}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => ['Payment creation failed: ' . $e->getMessage()],
            ];
        }
    }

    public function createQRCode(string $gateway, array $data)
    {
        try {
            return $this->gateway($gateway)->createQRCode($data);
        } catch (\Exception $e) {
            Log::error("QR Code creation failed for gateway {$gateway}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => ['QR Code creation failed: ' . $e->getMessage()],
            ];
        }
    }

    public function getPaymentStatus(string $gateway, string $transactionId)
    {
        try {
            return $this->gateway($gateway)->getPaymentStatus($transactionId);
        } catch (\Exception $e) {
            Log::error("Payment status check failed for gateway {$gateway}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => ['Payment status check failed: ' . $e->getMessage()],
            ];
        }
    }

    public function handleWebhook(string $gateway, array $payload)
    {
        try {
            return $this->gateway($gateway)->handleWebhook($payload);
        } catch (\Exception $e) {
            Log::error("Webhook handling failed for gateway {$gateway}: " . $e->getMessage());
            throw $e;
        }
    }

    public function validateWebhook(string $gateway, array $payload, string $signature)
    {
        try {
            return $this->gateway($gateway)->validateWebhook($payload, $signature);
        } catch (\Exception $e) {
            Log::error("Webhook validation failed for gateway {$gateway}: " . $e->getMessage());
            return false;
        }
    }

    public function getAvailableGateways(): array
    {
        return array_keys($this->gateways);
    }
}