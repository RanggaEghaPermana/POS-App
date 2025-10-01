<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'product_id',
        'user_id',
        'type',
        'reason',
        'quantity',
        'quantity_before',
        'quantity_after',
        'unit_cost',
        'total_cost',
        'sale_id',
        'stock_transfer_id',
        'reference_type',
        'reference_id',
        'batch_number',
        'serial_number',
        'expiry_date',
        'manufacture_date',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'manufacture_date' => 'date',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function stockTransfer()
    {
        return $this->belongsTo(StockTransfer::class);
    }

    // Scopes
    public function scopeIn($query)
    {
        return $query->where('type', 'in');
    }

    public function scopeOut($query)
    {
        return $query->where('type', 'out');
    }

    public function scopeAdjustment($query)
    {
        return $query->where('type', 'adjustment');
    }

    public function scopeTransfer($query)
    {
        return $query->where('type', 'transfer');
    }

    public function scopeByReason($query, string $reason)
    {
        return $query->where('reason', $reason);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeExpiringBefore($query, $date)
    {
        return $query->where('expiry_date', '<=', $date);
    }

    public function scopeByBatch($query, string $batchNumber)
    {
        return $query->where('batch_number', $batchNumber);
    }

    // Static methods for stock operations
    public static function recordMovement(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Get current stock
            $productStock = ProductStock::where('branch_id', $data['branch_id'])
                                      ->where('product_id', $data['product_id'])
                                      ->first();

            $currentStock = $productStock ? $productStock->stock : 0;
            $newStock = $currentStock + $data['quantity'];

            // Create movement record
            $movement = static::create([
                'tenant_id' => $data['tenant_id'] ?? app('tenant')->id,
                'branch_id' => $data['branch_id'],
                'product_id' => $data['product_id'],
                'user_id' => $data['user_id'] ?? auth()->id(),
                'type' => $data['type'],
                'reason' => $data['reason'],
                'quantity' => $data['quantity'],
                'quantity_before' => $currentStock,
                'quantity_after' => $newStock,
                'unit_cost' => $data['unit_cost'] ?? null,
                'total_cost' => $data['total_cost'] ?? null,
                'sale_id' => $data['sale_id'] ?? null,
                'stock_transfer_id' => $data['stock_transfer_id'] ?? null,
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'batch_number' => $data['batch_number'] ?? null,
                'serial_number' => $data['serial_number'] ?? null,
                'expiry_date' => $data['expiry_date'] ?? null,
                'manufacture_date' => $data['manufacture_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'metadata' => $data['metadata'] ?? null,
            ]);

            // Update stock
            if ($productStock) {
                $productStock->update(['stock' => $newStock]);
            } else {
                ProductStock::create([
                    'branch_id' => $data['branch_id'],
                    'product_id' => $data['product_id'],
                    'stock' => $newStock,
                ]);
            }

            // Check for stock alerts
            static::checkStockAlerts($data['branch_id'], $data['product_id'], $newStock);

            return $movement;
        });
    }

    public static function recordSale(Sale $sale)
    {
        foreach ($sale->items as $item) {
            if ($item->product_id) {
                static::recordMovement([
                    'branch_id' => $sale->branch_id,
                    'product_id' => $item->product_id,
                    'type' => 'out',
                    'reason' => 'sale',
                    'quantity' => -$item->quantity,
                    'sale_id' => $sale->id,
                    'unit_cost' => $item->product->price ?? 0,
                    'total_cost' => $item->price * $item->quantity,
                ]);
            }
        }
    }

    public static function recordPurchase(array $items, int $branchId, array $reference = [])
    {
        foreach ($items as $item) {
            static::recordMovement([
                'branch_id' => $branchId,
                'product_id' => $item['product_id'],
                'type' => 'in',
                'reason' => 'purchase',
                'quantity' => $item['quantity'],
                'unit_cost' => $item['unit_cost'] ?? null,
                'total_cost' => ($item['unit_cost'] ?? 0) * $item['quantity'],
                'reference_type' => $reference['type'] ?? 'purchase_order',
                'reference_id' => $reference['id'] ?? null,
                'batch_number' => $item['batch_number'] ?? null,
                'expiry_date' => $item['expiry_date'] ?? null,
                'manufacture_date' => $item['manufacture_date'] ?? null,
            ]);
        }
    }

    public static function recordAdjustment(int $branchId, int $productId, int $adjustmentQuantity, string $reason, array $extra = [])
    {
        static::recordMovement(array_merge([
            'branch_id' => $branchId,
            'product_id' => $productId,
            'type' => 'adjustment',
            'reason' => $reason,
            'quantity' => $adjustmentQuantity,
        ], $extra));
    }

    private static function checkStockAlerts(int $branchId, int $productId, int $currentStock)
    {
        $product = Product::find($productId);
        $stockAlert = StockAlert::where('branch_id', $branchId)
                                ->where('product_id', $productId)
                                ->where('is_active', true)
                                ->first();

        // Low stock alert
        if (isset($product->minimum_stock) && $currentStock <= $product->minimum_stock) {
            StockAlert::createAlert([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'alert_type' => $currentStock <= 0 ? 'out_of_stock' : 'low_stock',
                'current_stock' => $currentStock,
                'minimum_stock' => $product->minimum_stock,
                'priority' => $currentStock <= 0 ? 'critical' : 'high',
                'message' => $currentStock <= 0
                    ? "Product {$product->name} is out of stock"
                    : "Product {$product->name} is below minimum stock level",
            ]);
        }

        // Reorder point alert
        if (isset($product->reorder_level) && $currentStock <= $product->reorder_level) {
            StockAlert::createAlert([
                'branch_id' => $branchId,
                'product_id' => $productId,
                'alert_type' => 'reorder',
                'current_stock' => $currentStock,
                'reorder_level' => $product->reorder_level,
                'reorder_quantity' => $product->reorder_quantity ?? null,
                'priority' => 'medium',
                'message' => "Product {$product->name} has reached reorder level",
            ]);
        }
    }

    public function isStockIn()
    {
        return $this->type === 'in' || ($this->type === 'adjustment' && $this->quantity > 0);
    }

    public function isStockOut()
    {
        return $this->type === 'out' || ($this->type === 'adjustment' && $this->quantity < 0);
    }

    public function isExpiringSoon($days = 30)
    {
        return $this->expiry_date && $this->expiry_date <= now()->addDays($days);
    }

    public function isExpired()
    {
        return $this->expiry_date && $this->expiry_date < now();
    }
}