<?php

namespace App\Services\Ecommerce;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokopediaService implements MarketplaceInterface
{
    private $apiKey;
    private $apiSecret;
    private $accessToken;
    private $baseUrl;

    public function __construct($credentials = [])
    {
        $this->apiKey = $credentials['api_key'] ?? config('services.tokopedia.api_key');
        $this->apiSecret = $credentials['api_secret'] ?? config('services.tokopedia.api_secret');
        $this->accessToken = $credentials['access_token'] ?? null;
        $this->baseUrl = config('services.tokopedia.base_url', 'https://fs.tokopedia.net');
    }

    public function authenticate(array $credentials)
    {
        $response = Http::post($this->baseUrl . '/token', [
            'client_id' => $credentials['api_key'],
            'client_secret' => $credentials['api_secret'],
            'grant_type' => 'client_credentials',
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return [
                'success' => true,
                'access_token' => $data['access_token'],
                'expires_at' => now()->addSeconds($data['expires_in']),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json()['error_description'] ?? 'Authentication failed',
        ];
    }

    public function getProducts(array $filters = [])
    {
        $response = $this->makeRequest('GET', '/inventory/v1/fs/{fs_id}/product', [
            'page' => $filters['page'] ?? 1,
            'per_page' => $filters['per_page'] ?? 50,
        ]);

        if ($response['success']) {
            return [
                'success' => true,
                'products' => $response['data']['data'] ?? [],
                'meta' => $response['data']['meta'] ?? [],
            ];
        }

        return $response;
    }

    public function syncProduct(array $productData)
    {
        $payload = [
            'name' => $productData['name'],
            'category_id' => $productData['category_id'],
            'price' => $productData['price'],
            'stock' => $productData['stock'],
            'description' => $productData['description'],
            'weight' => $productData['weight'] ?? 1000, // grams
            'condition' => $productData['condition'] ?? 'NEW',
            'images' => $productData['images'] ?? [],
            'wholesale' => $productData['wholesale'] ?? [],
            'preorder' => $productData['preorder'] ?? [],
        ];

        return $this->makeRequest('POST', '/inventory/v1/fs/{fs_id}/product', $payload);
    }

    public function updateProduct(string $marketplaceProductId, array $productData)
    {
        $payload = [
            'name' => $productData['name'],
            'price' => $productData['price'],
            'stock' => $productData['stock'],
            'description' => $productData['description'],
            'weight' => $productData['weight'] ?? 1000,
            'condition' => $productData['condition'] ?? 'NEW',
        ];

        return $this->makeRequest('PATCH', "/inventory/v1/fs/{fs_id}/product/{$marketplaceProductId}", $payload);
    }

    public function deleteProduct(string $marketplaceProductId)
    {
        return $this->makeRequest('DELETE', "/inventory/v1/fs/{fs_id}/product/{$marketplaceProductId}");
    }

    public function getOrders(array $filters = [])
    {
        $params = [
            'from_date' => $filters['from_date'] ?? now()->subDays(30)->format('Y-m-d'),
            'to_date' => $filters['to_date'] ?? now()->format('Y-m-d'),
            'page' => $filters['page'] ?? 1,
            'per_page' => $filters['per_page'] ?? 50,
        ];

        if (isset($filters['status'])) {
            $params['order_status'] = $filters['status'];
        }

        return $this->makeRequest('GET', '/v2/order/list', $params);
    }

    public function getOrder(string $marketplaceOrderId)
    {
        return $this->makeRequest('GET', "/v2/order/detail", [
            'order_id' => $marketplaceOrderId,
        ]);
    }

    public function updateOrderStatus(string $marketplaceOrderId, string $status)
    {
        $endpoint = match ($status) {
            'confirmed' => '/v1/order/status',
            'shipped' => '/v2/logistics/fs/{fs_id}/confirm_shipping',
            'delivered' => '/v1/order/delivered',
            default => throw new \InvalidArgumentException("Unsupported status: {$status}"),
        };

        $payload = [
            'order_id' => $marketplaceOrderId,
        ];

        if ($status === 'shipped') {
            $payload['shipping_ref_num'] = $marketplaceOrderId; // You may need tracking number
        }

        return $this->makeRequest('POST', $endpoint, $payload);
    }

    public function updateInventory(string $marketplaceProductId, int $quantity)
    {
        return $this->makeRequest('POST', '/inventory/v1/fs/{fs_id}/product/manage_stock', [
            'product_id' => $marketplaceProductId,
            'stock' => $quantity,
        ]);
    }

    public function getShippingMethods()
    {
        return $this->makeRequest('GET', '/v2/logistic/fs/{fs_id}/info');
    }

    public function createShippingLabel(array $orderData)
    {
        return $this->makeRequest('POST', '/v2/logistics/fs/{fs_id}/confirm_shipping', [
            'order_id' => $orderData['order_id'],
            'shipping_ref_num' => $orderData['tracking_number'],
        ]);
    }

    public function getWebhookUrl()
    {
        return route('marketplace.webhook', 'tokopedia');
    }

    public function handleWebhook(array $payload)
    {
        $type = $payload['type'] ?? '';
        $data = $payload['data'] ?? [];

        switch ($type) {
            case 'order_notification':
                return $this->handleOrderNotification($data);
            case 'product_update':
                return $this->handleProductUpdate($data);
            default:
                Log::warning("Unknown Tokopedia webhook type: {$type}");
                return ['handled' => false];
        }
    }

    public function validateWebhook(array $payload, string $signature)
    {
        $expectedSignature = hash_hmac('sha256', json_encode($payload), $this->apiSecret);
        return hash_equals($expectedSignature, $signature);
    }

    private function makeRequest(string $method, string $endpoint, array $params = [])
    {
        try {
            $headers = [
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ];

            $url = $this->baseUrl . $endpoint;

            // Replace {fs_id} placeholder if exists
            $url = str_replace('{fs_id}', config('services.tokopedia.fs_id'), $url);

            $response = Http::withHeaders($headers);

            if ($method === 'GET') {
                $response = $response->get($url, $params);
            } else {
                $response = $response->{strtolower($method)}($url, $params);
            }

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json()['message'] ?? 'Request failed',
                'status_code' => $response->status(),
            ];

        } catch (\Exception $e) {
            Log::error('Tokopedia API Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Connection error: ' . $e->getMessage(),
            ];
        }
    }

    private function handleOrderNotification(array $data)
    {
        // Handle new order notification
        $orderId = $data['order_id'] ?? null;
        $status = $data['order_status'] ?? null;

        if ($orderId) {
            // Sync order to local database
            // Implementation would depend on your order sync logic
            return ['handled' => true, 'order_id' => $orderId];
        }

        return ['handled' => false];
    }

    private function handleProductUpdate(array $data)
    {
        // Handle product update notification
        $productId = $data['product_id'] ?? null;
        $stock = $data['stock'] ?? null;

        if ($productId) {
            // Update local inventory
            // Implementation would depend on your inventory sync logic
            return ['handled' => true, 'product_id' => $productId];
        }

        return ['handled' => false];
    }
}