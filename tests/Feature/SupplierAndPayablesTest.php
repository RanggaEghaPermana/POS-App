<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierAndPayablesTest extends TestCase
{
    use RefreshDatabase;

    protected function authUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        return $user;
    }

    public function test_supplier_mapping_and_payables(): void
    {
        $this->authUser();
        $cat = Category::create(['name'=>'Umum']);
        $p = Product::create(['name'=>'Toner','sku'=>'TONER','price'=>50000,'stock'=>3,'category_id'=>$cat->id]);

        $s = $this->postJson('/api/v1/suppliers', ['name'=>'PT Sumber']);
        $s->assertCreated();
        $sid = $s->json('id');
        $this->postJson("/api/v1/suppliers/{$sid}/products", ['product_id'=>$p->id,'cost_price'=>45000])->assertOk();

        $inv = $this->postJson('/api/v1/payables', [
            'supplier_id'=>$sid,
            'number'=>'INV-1',
            'date'=>now()->toDateString(),
            'total'=>45000,
            'tax_amount'=>4500,
        ]);
        $inv->assertCreated();
        $iid = $inv->json('id');
        $this->postJson("/api/v1/payables/{$iid}/payments", ['amount'=>10000,'method'=>'transfer'])->assertOk();
    }
}

