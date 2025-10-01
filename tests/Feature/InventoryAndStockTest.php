<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryAndStockTest extends TestCase
{
    use RefreshDatabase;

    protected function authUser(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        return $user;
    }

    public function test_stock_count_and_transfer(): void
    {
        $this->authUser();
        $branchA = Branch::first();
        $branchB = Branch::create(['name'=>'Branch B','code'=>'B','address'=>null]);
        $cat = Category::create(['name'=>'Umum']);
        $p = Product::create(['name'=>'Kertas','sku'=>'PAPER','price'=>1000,'stock'=>10,'category_id'=>$cat->id]);

        // Stock Count (branch A)
        $sc = $this->postJson('/api/v1/stock-counts', ['note'=>'audit','branch_id'=>$branchA->id]);
        $sc->assertCreated();
        $scId = $sc->json('id');
        $this->postJson("/api/v1/stock-counts/{$scId}/items", ['product_id'=>$p->id,'counted_qty'=>5])->assertOk();
        $this->postJson("/api/v1/stock-counts/{$scId}/post")->assertOk();

        // Transfer 2 from A to B
        $tf = $this->postJson('/api/v1/stock-transfers', ['from_branch_id'=>$branchA->id,'to_branch_id'=>$branchB->id,'notes'=>'move stock']);
        $tf->assertCreated();
        $tfId = $tf->json('id');
        $this->postJson("/api/v1/stock-transfers/{$tfId}/items", ['product_id'=>$p->id,'quantity'=>2])->assertOk();
        $this->postJson("/api/v1/stock-transfers/{$tfId}/status", ['status'=>'approved'])->assertOk();
        $this->postJson("/api/v1/stock-transfers/{$tfId}/status", ['status'=>'shipped'])->assertOk();
        $this->postJson("/api/v1/stock-transfers/{$tfId}/status", ['status'=>'received'])->assertOk();

        // Products endpoint per branch
        $aList = $this->getJson('/api/v1/products?branch_id='.$branchA->id.'&per_page=10');
        $bList = $this->getJson('/api/v1/products?branch_id='.$branchB->id.'&per_page=10');
        $aList->assertOk(); $bList->assertOk();
    }
}

