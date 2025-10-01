<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SalesFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function authUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        return $user;
    }

    public function test_checkout_and_receipt_and_return(): void
    {
        $this->authUser();
        $cat = Category::create(['name' => 'Umum']);
        $p = Product::create(['name'=>'Item A','sku'=>'A1','price'=>1000,'stock'=>100,'category_id'=>$cat->id]);

        $res = $this->postJson('/api/v1/checkout', [
            'items' => [ ['product_id'=>$p->id,'qty'=>2] ],
            'discount' => 0,
            'tax' => 0,
            'payments' => [ ['method'=>'cash','amount'=>2000] ],
        ]);
        $res->assertOk()->assertJsonStructure(['id','number','items','payments']);
        $saleId = $res->json('id');

        $receipt = $this->getJson("/api/v1/sales/{$saleId}");
        $receipt->assertOk()->assertJsonPath('items.0.qty', 2);

        $sale = Sale::find($saleId);
        $saleNumber = $sale->number;
        $show = $this->getJson("/api/v1/sales/by-number?number={$saleNumber}");
        $show->assertOk()->assertJsonPath('number', $saleNumber);

        $return = $this->postJson('/api/v1/returns', [
            'sale_number' => $saleNumber,
            'items' => [ ['sale_item_id'=>$sale->items()->first()->id, 'qty'=>1] ],
            'method' => 'cash',
        ]);
        $return->assertOk()->assertJsonStructure(['number','total_refund']);
    }
}

