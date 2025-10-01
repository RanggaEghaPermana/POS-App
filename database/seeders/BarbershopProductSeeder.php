<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class BarbershopProductSeeder extends Seeder
{
    public function run(): void
    {
        $groomingCategories = [
            // HAIR CARE PRODUCTS
            'Hair Care & Treatment' => [
                ['name' => 'Pomade Water Based Classic', 'sku' => 'PMD-WB-001', 'price' => 45000, 'stock' => 25],
                ['name' => 'Pomade Oil Based Heavy Hold', 'sku' => 'PMD-OB-002', 'price' => 50000, 'stock' => 20],
                ['name' => 'Hair Wax Matte Finish', 'sku' => 'WAX-MT-003', 'price' => 35000, 'stock' => 30],
                ['name' => 'Hair Clay Natural Hold', 'sku' => 'CLY-NH-004', 'price' => 40000, 'stock' => 18],
                ['name' => 'Hair Gel Strong Hold', 'sku' => 'GEL-SH-005', 'price' => 25000, 'stock' => 35],
                ['name' => 'Hair Spray Flexible Hold', 'sku' => 'SPR-FH-006', 'price' => 30000, 'stock' => 22],
                ['name' => 'Hair Tonic Anti Dandruff', 'sku' => 'TON-AD-007', 'price' => 20000, 'stock' => 40],
                ['name' => 'Hair Oil Natural Growth', 'sku' => 'OIL-NG-008', 'price' => 35000, 'stock' => 15],
            ],

            'Shampoo & Conditioner' => [
                ['name' => 'Shampoo Anti Ketombe 500ml', 'sku' => 'SHP-AK-009', 'price' => 35000, 'stock' => 25],
                ['name' => 'Shampoo Daily Use 500ml', 'sku' => 'SHP-DU-010', 'price' => 28000, 'stock' => 30],
                ['name' => 'Shampoo Oily Hair 500ml', 'sku' => 'SHP-OH-011', 'price' => 32000, 'stock' => 20],
                ['name' => 'Conditioner Moisturizing 500ml', 'sku' => 'CON-MO-012', 'price' => 40000, 'stock' => 18],
                ['name' => 'Hair Mask Deep Treatment', 'sku' => 'MSK-DT-013', 'price' => 55000, 'stock' => 12],
                ['name' => 'Dry Shampoo Spray', 'sku' => 'DSH-SPR-014', 'price' => 45000, 'stock' => 15],
            ],

            'Styling Products' => [
                ['name' => 'Sea Salt Spray Texture', 'sku' => 'SSS-TX-015', 'price' => 38000, 'stock' => 20],
                ['name' => 'Volume Mousse Light Hold', 'sku' => 'VMS-LH-016', 'price' => 42000, 'stock' => 16],
                ['name' => 'Heat Protection Spray', 'sku' => 'HPS-PT-017', 'price' => 48000, 'stock' => 14],
                ['name' => 'Curl Defining Cream', 'sku' => 'CDC-DF-018', 'price' => 45000, 'stock' => 18],
                ['name' => 'Hair Powder Volume', 'sku' => 'HPD-VL-019', 'price' => 35000, 'stock' => 22],
                ['name' => 'Styling Cream Natural', 'sku' => 'SCR-NT-020', 'price' => 40000, 'stock' => 25],
            ],

            // BEARD & MUSTACHE CARE
            'Beard & Mustache Care' => [
                ['name' => 'Beard Oil Premium Blend', 'sku' => 'BRD-OIL-021', 'price' => 55000, 'stock' => 15],
                ['name' => 'Beard Balm Natural Hold', 'sku' => 'BRD-BLM-022', 'price' => 45000, 'stock' => 18],
                ['name' => 'Mustache Wax Strong Hold', 'sku' => 'MST-WAX-023', 'price' => 35000, 'stock' => 20],
                ['name' => 'Beard Shampoo Gentle Clean', 'sku' => 'BRD-SHP-024', 'price' => 38000, 'stock' => 22],
                ['name' => 'Beard Brush Boar Bristle', 'sku' => 'BRD-BRS-025', 'price' => 75000, 'stock' => 10],
                ['name' => 'Beard Comb Wood Handmade', 'sku' => 'BRD-CMB-026', 'price' => 45000, 'stock' => 12],
            ],

            // SHAVING PRODUCTS
            'Shaving Essentials' => [
                ['name' => 'Shaving Cream Classic 100ml', 'sku' => 'SHV-CRM-027', 'price' => 25000, 'stock' => 30],
                ['name' => 'Shaving Foam Sensitive Skin', 'sku' => 'SHV-FOM-028', 'price' => 22000, 'stock' => 35],
                ['name' => 'Pre-Shave Oil Protective', 'sku' => 'PSV-OIL-029', 'price' => 40000, 'stock' => 15],
                ['name' => 'After Shave Balm Soothing', 'sku' => 'ASV-BLM-030', 'price' => 35000, 'stock' => 20],
                ['name' => 'After Shave Lotion Fresh', 'sku' => 'ASV-LOT-031', 'price' => 30000, 'stock' => 25],
                ['name' => 'Razor Blades Premium 10pcs', 'sku' => 'RZR-BLD-032', 'price' => 15000, 'stock' => 50],
                ['name' => 'Shaving Brush Badger Hair', 'sku' => 'SHV-BRS-033', 'price' => 85000, 'stock' => 8],
            ],

            // BARBERSHOP TOOLS
            'Barbershop Tools' => [
                ['name' => 'Hair Scissors Professional 6"', 'sku' => 'HSC-PRO-034', 'price' => 150000, 'stock' => 5],
                ['name' => 'Thinning Scissors 6"', 'sku' => 'TSC-THN-035', 'price' => 120000, 'stock' => 4],
                ['name' => 'Hair Clipper Professional', 'sku' => 'HCP-PRO-036', 'price' => 450000, 'stock' => 3],
                ['name' => 'Hair Trimmer Cordless', 'sku' => 'HTR-COR-037', 'price' => 250000, 'stock' => 6],
                ['name' => 'Straight Razor Carbon Steel', 'sku' => 'STR-RZR-038', 'price' => 200000, 'stock' => 4],
                ['name' => 'Hair Comb Set Professional', 'sku' => 'HCM-SET-039', 'price' => 35000, 'stock' => 15],
                ['name' => 'Hair Brush Round Professional', 'sku' => 'HBR-RND-040', 'price' => 45000, 'stock' => 12],
                ['name' => 'Cape Barbershop Waterproof', 'sku' => 'CPE-WTR-041', 'price' => 65000, 'stock' => 8],
            ],

            // GROOMING ACCESSORIES
            'Grooming Accessories' => [
                ['name' => 'Hot Towel Steamer Electric', 'sku' => 'HTS-ELC-042', 'price' => 350000, 'stock' => 2],
                ['name' => 'Face Towel Premium 6pcs', 'sku' => 'FTW-PRM-043', 'price' => 75000, 'stock' => 10],
                ['name' => 'Neck Paper Roll 100pcs', 'sku' => 'NPR-ROL-044', 'price' => 25000, 'stock' => 20],
                ['name' => 'Spray Bottle 500ml', 'sku' => 'SPB-500-045', 'price' => 15000, 'stock' => 25],
                ['name' => 'Disinfectant Jar Glass', 'sku' => 'DSF-JAR-046', 'price' => 35000, 'stock' => 12],
                ['name' => 'Mirror Hand Professional', 'sku' => 'MIR-HND-047', 'price' => 45000, 'stock' => 8],
                ['name' => 'Hair Dryer Professional', 'sku' => 'HDR-PRO-048', 'price' => 280000, 'stock' => 4],
            ],

            // FACE & SKIN CARE
            'Face & Skin Care' => [
                ['name' => 'Face Wash Charcoal 150ml', 'sku' => 'FCW-CHR-049', 'price' => 28000, 'stock' => 20],
                ['name' => 'Face Moisturizer SPF 30', 'sku' => 'FCM-SPF-050', 'price' => 45000, 'stock' => 15],
                ['name' => 'Face Scrub Exfoliating', 'sku' => 'FCS-EXF-051', 'price' => 32000, 'stock' => 18],
                ['name' => 'Face Toner Refreshing', 'sku' => 'FCT-REF-052', 'price' => 35000, 'stock' => 16],
                ['name' => 'Eye Cream Anti-Aging', 'sku' => 'EYC-AAG-053', 'price' => 55000, 'stock' => 12],
                ['name' => 'Lip Balm Natural SPF 15', 'sku' => 'LPB-SPF-054', 'price' => 18000, 'stock' => 30],
            ],
        ];

        foreach ($groomingCategories as $categoryName => $products) {
            $category = Category::where('name', $categoryName)->first();

            if (!$category) {
                $category = Category::create([
                    'name' => $categoryName,
                    'icon' => $this->getCategoryIcon($categoryName),
                ]);
            }

            foreach ($products as $productData) {
                Product::firstOrCreate(
                    ['sku' => $productData['sku']],
                    [
                        'name' => $productData['name'],
                        'category_id' => $category->id,
                        'price' => $productData['price'],
                        'stock' => $productData['stock'],
                        'active' => true,
                    ]
                );
            }
        }
    }

    private function getCategoryIcon($categoryName)
    {
        $iconMap = [
            'Hair Care & Treatment' => 'Droplets',
            'Shampoo & Conditioner' => 'Bath',
            'Styling Products' => 'Wind',
            'Beard & Mustache Care' => 'User',
            'Shaving Essentials' => 'Scissors',
            'Barbershop Tools' => 'Wrench',
            'Grooming Accessories' => 'Package',
            'Face & Skin Care' => 'Sun',
        ];

        return $iconMap[$categoryName] ?? 'Tag';
    }

}