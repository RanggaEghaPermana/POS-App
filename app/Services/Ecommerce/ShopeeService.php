<?php

namespace App\Services\Ecommerce;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeService implements MarketplaceInterface
{
    private $partnerId;
    private $partnerKey;
    private $shopId;
    private $accessToken;
    private $baseUrl;

    public function __construct($credentials = [])
    {
        $this->partnerId = $credentials['partner_id'] ?? config('services.shopee.partner_id');
        $this->partnerKey = $credentials['partner_key'] ?? config('services.shopee.partner_key');
        $this->shopId = $credentials['shop_id'] ?? null;
        $this->accessToken = $credentials['access_token'] ?? null;
        $this->baseUrl = config('services.shopee.base_url', 'https://partner.shopeemobile.com');
    }

    public function authenticate(array $credentials)
    {
        $timestamp = time();
        $path = '/api/v2/auth/token/get';
        $baseString = $this->partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

        $response = Http::post($this->baseUrl . $path, [
            'code' => $credentials['auth_code'],
            'shop_id' => $credentials['shop_id'],
            'partner_id' => $this->partnerId,
        ], [
            'partner_id' => $this->partnerId,
            'timestamp' => $timestamp,
            'sign' => $sign,
        ]);

        if ($response->successful()) {
            $data = $response->json();
            return [
                'success' => true,
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'],
                'expires_at' => now()->addSeconds($data['expire_in']),
            ];
        }

        return [
            'success' => false,
            'error' => $response->json()['message'] ?? 'Authentication failed',
        ];
    }

    public function getProducts(array $filters = [])
    {
        $params = [
            'offset' => ($filters['page'] - 1) * ($filters['per_page'] ?? 50),
            'page_size' => $filters['per_page'] ?? 50,
            'item_status' => $filters['status'] ?? 'NORMAL',
        ];

        $response = $this->makeRequest('GET', '/api/v2/product/get_item_list', $params);

        if ($response['success']) {
            return [
                'success' => true,
                'products' => $response['data']['response']['item'] ?? [],
                'meta' => [
                    'total' => $response['data']['response']['total_count'] ?? 0,
                    'has_next' => $response['data']['response']['has_next_page'] ?? false,
                ],
            ];
        }

        return $response;
    }

    public function syncProduct(array $productData)
    {
        $payload = [
            'item_name' => $productData['name'],
            'description' => $productData['description'],
            'item_sku' => $productData['sku'],
            'category_id' => $productData['category_id'],
            'brand' => [
                'brand_id' => $productData['brand_id'] ?? 0,
                'original_brand_name' => $productData['brand_name'] ?? '',
            ],
            'item_status' => 'NORMAL',
            'dimension' => [
                'package_length' => $productData['length'] ?? 10,
                'package_width' => $productData['width'] ?? 10,
                'package_height' => $productData['height'] ?? 10,
            ],
            'weight' => $productData['weight'] ?? 1.0,
            'logistic_info' => $productData['logistics'] ?? [],
            'price_info' => [
                [
                    'current_price' => $productData['price'],
                    'original_price' => $productData['original_price'] ?? $productData['price'],
                ],
            ],
            'stock_info' => [
                [
                    'stock_type' => 1, // normal stock
                    'current_stock' => $productData['stock'],
                    'normal_stock' => $productData['stock'],
                ],
            ],
            'image' => [
                'image_url_list' => $productData['images'] ?? [],
            ],
        ];

        return $this->makeRequest('POST', '/api/v2/product/add_item', $payload);
    }

    public function updateProduct(string $marketplaceProductId, array $productData)
    {
        $payload = [
            'item_id' => (int) $marketplaceProductId,
            'item_name' => $productData['name'],
            'description' => $productData['description'],
            'price_info' => [
                [
                    'model_id' => 0,
                    'current_price' => $productData['price'],
                ],
            ],
            'stock_info' => [
                [
                    'model_id' => 0,
                    'normal_stock' => $productData['stock'],
                ],
            ],
        ];

        return $this->makeRequest('POST', '/api/v2/product/update_item', $payload);
    }

    public function deleteProduct(string $marketplaceProductId)
    {
        return $this->makeRequest('POST', '/api/v2/product/delete_item', [
            'item_id' => (int) $marketplaceProductId,
        ]);
    }

    public function getOrders(array $filters = [])
    {
        $params = [
            'time_range_field' => 'create_time',
            'time_from' => $filters['from_date'] ?? now()->subDays(30)->timestamp,
            'time_to' => $filters['to_date'] ?? now()->timestamp,
            'page_size' => $filters['per_page'] ?? 50,
            'cursor' => $filters['cursor'] ?? '',
        ];

        if (isset($filters['status'])) {
            $params['order_status'] = $filters['status'];
        }

        return $this->makeRequest('GET', '/api/v2/order/get_order_list', $params);
    }

    public function getOrder(string $marketplaceOrderId)
    {
        return $this->makeRequest('GET', '/api/v2/order/get_order_detail', [
            'order_sn_list' => $marketplaceOrderId,
        ]);
    }

    public function updateOrderStatus(string $marketplaceOrderId, string $status)
    {
        switch ($status) {
            case 'confirmed':
                return $this->makeRequest('POST', '/api/v2/order/accept_order', [
                    'order_sn' => $marketplaceOrderId,
                ]);
            case 'cancelled':
                return $this->makeRequest('POST', '/api/v2/order/cancel_order', [
                    'order_sn' => $marketplaceOrderId,
                    'cancel_reason' => 'OUT_OF_STOCK',
                ]);
            default:
                throw new \InvalidArgumentException("Unsupported status: {$status}");
        }
    }

    public function updateInventory(string $marketplaceProductId, int $quantity)
    {
        return $this->makeRequest('POST', '/api/v2/product/update_stock', [
            'item_id' => (int) $marketplaceProductId,
            'stock_list' => [
                [
                    'model_id' => 0,
                    'normal_stock' => $quantity,
                ],
            ],
        ]);
    }

    public function getShippingMethods()
    {
        return $this->makeRequest('GET', '/api/v2/logistics/get_channel_list');
    }

    public function createShippingLabel(array $orderData)
    {
        return $this->makeRequest('POST', '/api/v2/logistics/ship_order', [
            'order_sn' => $orderData['order_id'],
            'pickup' => $orderData['pickup'] ?? [],
            'dropoff' => $orderData['dropoff'] ?? [],
        ]);
    }

    public function getWebhookUrl()
    {
        return route('marketplace.webhook', 'shopee');
    }

    public function handleWebhook(array $payload)
    {
        $code = $payload['code'] ?? '';
        $data = $payload['data'] ?? [];

        switch ($code) {
            case 1: // Order status update
                return $this->handleOrderStatusUpdate($data);
            case 2: // Product status update
                return $this->handleProductStatusUpdate($data);
            default:
                Log::warning("Unknown Shopee webhook code: {$code}");
                return ['handled' => false];
        }
    }

    public function validateWebhook(array $payload, string $signature)
    {
        $url = request()->fullUrl();
        $body = json_encode($payload);
        $baseString = $url . '|' . $body;
        $expectedSignature = hash_hmac('sha256', $baseString, $this->partnerKey);

        return hash_equals($expectedSignature, $signature);
    }

    private function makeRequest(string $method, string $path, array $params = [])
    {
        try {
            $timestamp = time();
            $partnerId = $this->partnerId;
            $accessToken = $this->accessToken;
            $shopId = $this->shopId;

            // Generate signature
            $baseString = $partnerId . $path . $timestamp;
            if ($accessToken) {
                $baseString .= $accessToken;
            }
            if ($shopId) {
                $baseString .= $shopId;
            }

            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $queryParams = [
                'partner_id' => $partnerId,
                'timestamp' => $timestamp,
                'sign' => $sign,
            ];

            if ($accessToken) {
                $queryParams['access_token'] = $accessToken;
            }
            if ($shopId) {
                $queryParams['shop_id'] = $shopId;
            }

            $url = $this->baseUrl . $path . '?' . http_build_query($queryParams);

            $response = Http::timeout(30);

            if ($method === 'GET') {
                $url .= '&' . http_build_query($params);
                $response = $response->get($url);
            } else {
                $response = $response->post($url, $params);
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
            Log::error('Shopee API Error: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Connection error: ' . $e->getMessage(),
            ];
        }
    }

    private function handleOrderStatusUpdate(array $data)
    {
        $orderSn = $data['ordersn'] ?? null;
        $status = $data['status'] ?? null;

        if ($orderSn) {
            return ['handled' => true, 'order_id' => $orderSn];
        }

        return ['handled' => false];
    }

    private function handleProductStatusUpdate(array $data)
    {
        $itemId = $data['item_id'] ?? null;
        $status = $data['status'] ?? null;

        if ($itemId) {
            return ['handled' => true, 'product_id' => $itemId];
        }

        return ['handled' => false];
    }
}