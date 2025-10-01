<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

class SeedBarbershopProducts extends Seeder
{
    public function run(): void
    {
        // Get barbershop tenant
        $barbershopTenant = Tenant::where('business_type', 'barbershop')->first();

        if (!$barbershopTenant) {
            $this->command->error('No barbershop tenant found!');
            return;
        }

        // Switch to tenant database
        $tenantDb = $barbershopTenant->database_name;

        // Create categories first
        $categories = [
            'Hair Care & Treatment',
            'Shampoo & Conditioner',
            'Styling Products',
            'Beard & Mustache Care',
            'Shaving Essentials',
            'Barbershop Tools',
            'Grooming Accessories',
            'Face & Skin Care',
        ];

        $categoryIds = [];
        foreach ($categories as $catName) {
            $existing = DB::connection('mysql')->table($tenantDb . '.categories')
                ->where('name', $catName)->first();

            if (!$existing) {
                $id = DB::connection('mysql')->table($tenantDb . '.categories')->insertGetId([
                    'name' => $catName,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $categoryIds[$catName] = $id;
            } else {
                $categoryIds[$catName] = $existing->id;
            }
        }

        // Delete existing non-grooming products
        DB::connection('mysql')->table($tenantDb . '.products')->truncate();

        // Insert grooming products
        $products = [
            // Hair Care & Treatment
            ['name' => 'Pomade Water Based Classic', 'sku' => 'PMD-WB-001', 'price' => 45000, 'stock' => 25, 'category' => 'Hair Care & Treatment'],
            ['name' => 'Pomade Oil Based Heavy Hold', 'sku' => 'PMD-OB-002', 'price' => 50000, 'stock' => 20, 'category' => 'Hair Care & Treatment'],
            ['name' => 'Hair Wax Matte Finish', 'sku' => 'WAX-MT-003', 'price' => 35000, 'stock' => 30, 'category' => 'Hair Care & Treatment'],
            ['name' => 'Hair Clay Natural Hold', 'sku' => 'CLY-NH-004', 'price' => 40000, 'stock' => 18, 'category' => 'Hair Care & Treatment'],
            ['name' => 'Hair Gel Strong Hold', 'sku' => 'GEL-SH-005', 'price' => 25000, 'stock' => 35, 'category' => 'Hair Care & Treatment'],

            // Shampoo & Conditioner
            ['name' => 'Shampoo Anti Ketombe 500ml', 'sku' => 'SHP-AK-009', 'price' => 35000, 'stock' => 25, 'category' => 'Shampoo & Conditioner'],
            ['name' => 'Shampoo Daily Use 500ml', 'sku' => 'SHP-DU-010', 'price' => 28000, 'stock' => 30, 'category' => 'Shampoo & Conditioner'],
            ['name' => 'Conditioner Moisturizing 500ml', 'sku' => 'CON-MO-012', 'price' => 40000, 'stock' => 18, 'category' => 'Shampoo & Conditioner'],

            // Styling Products
            ['name' => 'Hair Spray Flexible Hold', 'sku' => 'SPR-FH-006', 'price' => 30000, 'stock' => 22, 'category' => 'Styling Products'],
            ['name' => 'Sea Salt Spray Texture', 'sku' => 'SSS-TX-015', 'price' => 38000, 'stock' => 20, 'category' => 'Styling Products'],
            ['name' => 'Volume Mousse Light Hold', 'sku' => 'VMS-LH-016', 'price' => 42000, 'stock' => 16, 'category' => 'Styling Products'],

            // Beard & Mustache Care
            ['name' => 'Beard Oil Premium Blend', 'sku' => 'BRD-OIL-021', 'price' => 55000, 'stock' => 15, 'category' => 'Beard & Mustache Care'],
            ['name' => 'Beard Balm Natural Hold', 'sku' => 'BRD-BLM-022', 'price' => 45000, 'stock' => 18, 'category' => 'Beard & Mustache Care'],
            ['name' => 'Mustache Wax Strong Hold', 'sku' => 'MST-WAX-023', 'price' => 35000, 'stock' => 20, 'category' => 'Beard & Mustache Care'],

            // Shaving Essentials
            ['name' => 'Shaving Cream Classic 100ml', 'sku' => 'SHV-CRM-027', 'price' => 25000, 'stock' => 30, 'category' => 'Shaving Essentials'],
            ['name' => 'After Shave Balm Soothing', 'sku' => 'ASV-BLM-030', 'price' => 35000, 'stock' => 20, 'category' => 'Shaving Essentials'],
            ['name' => 'Razor Blades Premium 10pcs', 'sku' => 'RZR-BLD-032', 'price' => 15000, 'stock' => 50, 'category' => 'Shaving Essentials'],

            // Barbershop Tools
            ['name' => 'Hair Scissors Professional 6"', 'sku' => 'HSC-PRO-034', 'price' => 150000, 'stock' => 5, 'category' => 'Barbershop Tools'],
            ['name' => 'Hair Clipper Professional', 'sku' => 'HCP-PRO-036', 'price' => 450000, 'stock' => 3, 'category' => 'Barbershop Tools'],
            ['name' => 'Hair Trimmer Cordless', 'sku' => 'HTR-COR-037', 'price' => 250000, 'stock' => 6, 'category' => 'Barbershop Tools'],

            // Grooming Accessories
            ['name' => 'Cape Barbershop Waterproof', 'sku' => 'CPE-WTR-041', 'price' => 65000, 'stock' => 8, 'category' => 'Grooming Accessories'],
            ['name' => 'Spray Bottle 500ml', 'sku' => 'SPB-500-045', 'price' => 15000, 'stock' => 25, 'category' => 'Grooming Accessories'],
            ['name' => 'Hair Dryer Professional', 'sku' => 'HDR-PRO-048', 'price' => 280000, 'stock' => 4, 'category' => 'Grooming Accessories'],

            // Face & Skin Care
            ['name' => 'Face Wash Charcoal 150ml', 'sku' => 'FCW-CHR-049', 'price' => 28000, 'stock' => 20, 'category' => 'Face & Skin Care'],
            ['name' => 'Face Moisturizer SPF 30', 'sku' => 'FCM-SPF-050', 'price' => 45000, 'stock' => 15, 'category' => 'Face & Skin Care'],
            ['name' => 'Lip Balm Natural SPF 15', 'sku' => 'LPB-SPF-054', 'price' => 18000, 'stock' => 30, 'category' => 'Face & Skin Care'],
        ];

        foreach ($products as $product) {
            DB::connection('mysql')->table($tenantDb . '.products')->insert([
                'name' => $product['name'],
                'sku' => $product['sku'],
                'category_id' => $categoryIds[$product['category']],
                'price' => $product['price'],
                'stock' => $product['stock'],
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Barbershop grooming products seeded successfully!');
    }
}