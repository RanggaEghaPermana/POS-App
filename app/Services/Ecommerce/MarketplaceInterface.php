<?php

namespace App\Services\Ecommerce;

interface MarketplaceInterface
{
    public function authenticate(array $credentials);

    public function getProducts(array $filters = []);

    public function syncProduct(array $productData);

    public function updateProduct(string $marketplaceProductId, array $productData);

    public function deleteProduct(string $marketplaceProductId);

    public function getOrders(array $filters = []);

    public function getOrder(string $marketplaceOrderId);

    public function updateOrderStatus(string $marketplaceOrderId, string $status);

    public function updateInventory(string $marketplaceProductId, int $quantity);

    public function getShippingMethods();

    public function createShippingLabel(array $orderData);

    public function getWebhookUrl();

    public function handleWebhook(array $payload);

    public function validateWebhook(array $payload, string $signature);
}