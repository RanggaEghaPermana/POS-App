<?php

namespace App\Services\PaymentGateway;

interface PaymentGatewayInterface
{
    public function createPayment(array $data);

    public function getPaymentStatus(string $transactionId);

    public function cancelPayment(string $transactionId);

    public function refundPayment(string $transactionId, float $amount = null);

    public function createQRCode(array $data);

    public function handleWebhook(array $payload);

    public function validateWebhook(array $payload, string $signature);
}