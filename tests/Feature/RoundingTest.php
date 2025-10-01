<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoundingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'cashier']);
    }

    public function test_nearest_100_rounding_applied_on_checkout(): void
    {
        AppSetting::updateOrCreate(['key'=>'pricing'], ['value'=>json_encode(['rounding'=>'nearest_100'])]);

        $u = User::factory()->create();
        $u->assignRole('cashier');
        Sanctum::actingAs($u, ['*']);

        $p = Product::create(['name'=>'R','sku'=>'R1','price'=>151,'stock'=>10]);
        $res = $this->postJson('/api/v1/checkout', [
            'items' => [ ['product_id'=>$p->id,'qty'=>1] ],
            'discount' => 0,
            'tax' => 0,
            'payments' => [ ['method'=>'cash','amount'=>200] ],
        ])->assertOk();
        $grand = (int)$res->json('grand_total');
        $this->assertEquals(200, $grand, 'Grand total must be rounded to nearest 100');
    }
}

