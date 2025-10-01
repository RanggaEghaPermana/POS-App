<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Carbon\Carbon;

class BusinessHoursGuardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'manager']);
        Role::firstOrCreate(['name' => 'cashier']);
    }

    public function test_cashier_blocked_outside_business_hours(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 03:00:00', 'UTC'));
        AppSetting::updateOrCreate(['key'=>'store'], ['value'=>json_encode(['business_hours'=>'02:00-02:10'])]);

        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        Sanctum::actingAs($cashier, ['*']);

        // Prepare a sale via admin (bypass hours) to get sale item id
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin, ['*']);
        $p = Product::create(['name'=>'X','sku'=>'X1','price'=>1000,'stock'=>10]);
        $res = $this->postJson('/api/v1/checkout', [
            'items' => [ ['product_id'=>$p->id,'qty'=>1] ],
            'discount' => 0,
            'tax' => 0,
            'payments' => [ ['method'=>'cash','amount'=>1000] ],
        ])->assertOk();
        $saleId = $res->json('id');
        $sale = \App\Models\Sale::find($saleId);
        $saleItemId = $sale->items()->first()->id;

        // Back to cashier context
        Sanctum::actingAs($cashier, ['*']);
        $this->postJson('/api/v1/returns', [
            'sale_number' => $sale->number,
            'items' => [ ['sale_item_id'=>$saleItemId,'qty'=>1] ],
            'method' => 'cash',
        ])->assertStatus(423);
    }

    public function test_admin_bypass_business_hours(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-01 03:00:00', 'UTC'));
        AppSetting::updateOrCreate(['key'=>'store'], ['value'=>json_encode(['business_hours'=>'02:00-02:10'])]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin, ['*']);
        $p = Product::create(['name'=>'Y','sku'=>'Y1','price'=>1000,'stock'=>10]);
        $res = $this->postJson('/api/v1/checkout', [
            'items' => [ ['product_id'=>$p->id,'qty'=>1] ],
            'discount' => 0,
            'tax' => 0,
            'payments' => [ ['method'=>'cash','amount'=>1000] ],
        ])->assertOk();
        $saleId = $res->json('id');
        $sale = \App\Models\Sale::find($saleId);
        $saleItemId = $sale->items()->first()->id;

        $this->postJson('/api/v1/returns', [
            'sale_number' => $sale->number,
            'items' => [ ['sale_item_id'=>$saleItemId,'qty'=>1] ],
            'method' => 'cash',
        ])->assertOk();
    }
}

