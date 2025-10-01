<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InvoiceFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'cashier']);
    }

    public function test_create_and_show_invoice(): void
    {
        // Admin creates a sale
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin, ['*']);
        $p = Product::create(['name'=>'Inv','sku'=>'INV1','price'=>1000,'stock'=>10]);
        $res = $this->postJson('/api/v1/checkout', [
            'items' => [ ['product_id'=>$p->id,'qty'=>1] ],
            'discount' => 0,
            'tax' => 0,
            'payments' => [ ['method'=>'cash','amount'=>1000] ],
        ])->assertOk();
        $saleId = $res->json('id');

        // Cashier creates invoice (idempotent)
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        Sanctum::actingAs($cashier, ['*']);
        $inv = $this->postJson('/api/v1/invoices', ['sale_id'=>$saleId])->assertStatus(201);
        $invoiceId = $inv->json('id');

        // Admin can view invoice details
        Sanctum::actingAs($admin, ['*']);
        $this->getJson("/api/v1/invoices/{$invoiceId}")
            ->assertOk()
            ->assertJsonStructure(['number','currency','store'=>['name']]);
    }
}

