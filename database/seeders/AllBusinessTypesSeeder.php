<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class AllBusinessTypesSeeder extends Seeder
{
    public function run(): void
    {
        $businessCategories = [
            // BARBERSHOP
            'Layanan Barbershop' => [
                ['name' => 'Potong Rambut Pria Basic', 'sku' => 'BARBER-BASIC', 'price' => 25000],
                ['name' => 'Potong Rambut Pria Trendy', 'sku' => 'BARBER-TRENDY', 'price' => 40000],
                ['name' => 'Potong Rambut Anak', 'sku' => 'BARBER-KIDS', 'price' => 20000],
                ['name' => 'Cukur Jenggot & Kumis', 'sku' => 'BARBER-BEARD', 'price' => 15000],
                ['name' => 'Hair Wash & Styling', 'sku' => 'BARBER-WASH', 'price' => 20000],
                ['name' => 'Complete Grooming Package', 'sku' => 'BARBER-COMPLETE', 'price' => 75000],
                ['name' => 'Hot Towel Treatment', 'sku' => 'BARBER-TOWEL', 'price' => 30000],
                ['name' => 'Hair Coloring', 'sku' => 'BARBER-COLOR', 'price' => 100000],
            ],

            // RESTAURANT & CAFE
            'Menu Makanan' => [
                ['name' => 'Nasi Goreng Spesial', 'sku' => 'FOOD-NASGOR', 'price' => 25000],
                ['name' => 'Mie Ayam Bakso', 'sku' => 'FOOD-MIEAYAM', 'price' => 20000],
                ['name' => 'Gado-gado Jakarta', 'sku' => 'FOOD-GADO', 'price' => 18000],
                ['name' => 'Soto Ayam Lamongan', 'sku' => 'FOOD-SOTO', 'price' => 22000],
                ['name' => 'Rendang Daging Sapi', 'sku' => 'FOOD-RENDANG', 'price' => 35000],
                ['name' => 'Ayam Penyet Sambal', 'sku' => 'FOOD-PENYET', 'price' => 28000],
                ['name' => 'Seafood Fried Rice', 'sku' => 'FOOD-SEAFOOD', 'price' => 32000],
            ],
            'Menu Minuman' => [
                ['name' => 'Es Teh Manis', 'sku' => 'DRINK-TEH', 'price' => 5000],
                ['name' => 'Es Jeruk Peras', 'sku' => 'DRINK-JERUK', 'price' => 8000],
                ['name' => 'Kopi Hitam', 'sku' => 'DRINK-KOPI', 'price' => 10000],
                ['name' => 'Cappuccino', 'sku' => 'DRINK-CAPPUCCINO', 'price' => 18000],
                ['name' => 'Thai Tea', 'sku' => 'DRINK-THAI', 'price' => 15000],
                ['name' => 'Fresh Juice Mix', 'sku' => 'DRINK-JUICE', 'price' => 20000],
            ],

            // LAUNDRY
            'Layanan Laundry' => [
                ['name' => 'Cuci Kering per Kg', 'sku' => 'LAUNDRY-DRY-KG', 'price' => 8000],
                ['name' => 'Cuci Setrika per Kg', 'sku' => 'LAUNDRY-IRON-KG', 'price' => 12000],
                ['name' => 'Dry Clean Jas/Blazer', 'sku' => 'LAUNDRY-DRYC-JAS', 'price' => 35000],
                ['name' => 'Cuci Sepatu Casual', 'sku' => 'LAUNDRY-SHOES', 'price' => 25000],
                ['name' => 'Cuci Tas/Ransel', 'sku' => 'LAUNDRY-BAG', 'price' => 20000],
                ['name' => 'Express 3 Jam per Kg', 'sku' => 'LAUNDRY-EXPRESS', 'price' => 20000],
                ['name' => 'Pickup & Delivery', 'sku' => 'LAUNDRY-PICKUP', 'price' => 10000],
            ],

            // RETAIL
            'Produk Elektronik' => [
                ['name' => 'Smartphone Android Mid-range', 'sku' => 'RETAIL-PHONE-MID', 'price' => 3500000],
                ['name' => 'Laptop 14 inch i5', 'sku' => 'RETAIL-LAPTOP-I5', 'price' => 8500000],
                ['name' => 'Headphone Wireless', 'sku' => 'RETAIL-HEADPHONE', 'price' => 450000],
                ['name' => 'Power Bank 10000mAh', 'sku' => 'RETAIL-POWERBANK', 'price' => 250000],
                ['name' => 'Smartwatch Fitness', 'sku' => 'RETAIL-SMARTWATCH', 'price' => 1200000],
            ],
            'ATK & Perlengkapan Kantor' => [
                ['name' => 'Kertas A4 70gsm 1 Rim', 'sku' => 'ATK-KERTAS-A4', 'price' => 45000],
                ['name' => 'Pulpen Gel Set 12 pcs', 'sku' => 'ATK-PULPEN-SET', 'price' => 35000],
                ['name' => 'Stapler Heavy Duty', 'sku' => 'ATK-STAPLER', 'price' => 75000],
                ['name' => 'File Folder Set 10 pcs', 'sku' => 'ATK-FOLDER', 'price' => 50000],
            ],

            // ELECTRONICS SERVICE
            'Service Elektronik' => [
                ['name' => 'Service Laptop Software', 'sku' => 'TECH-LAPTOP-SOFT', 'price' => 150000],
                ['name' => 'Service Laptop Hardware', 'sku' => 'TECH-LAPTOP-HARD', 'price' => 250000],
                ['name' => 'Service HP Ganti LCD', 'sku' => 'TECH-HP-LCD', 'price' => 300000],
                ['name' => 'Service HP Software/Flash', 'sku' => 'TECH-HP-FLASH', 'price' => 100000],
                ['name' => 'Install Ulang OS Windows', 'sku' => 'TECH-INSTALL-WIN', 'price' => 100000],
                ['name' => 'Upgrade RAM/SSD', 'sku' => 'TECH-UPGRADE', 'price' => 50000],
                ['name' => 'Data Recovery', 'sku' => 'TECH-RECOVERY', 'price' => 200000],
            ],

            // EDUCATION
            'Kursus & Pelatihan' => [
                ['name' => 'Kursus Bahasa Inggris Basic', 'sku' => 'EDU-ENG-BASIC', 'price' => 500000],
                ['name' => 'Kursus Bahasa Inggris Advanced', 'sku' => 'EDU-ENG-ADV', 'price' => 750000],
                ['name' => 'Kursus Komputer MS Office', 'sku' => 'EDU-OFFICE', 'price' => 400000],
                ['name' => 'Kursus Design Grafis', 'sku' => 'EDU-DESIGN', 'price' => 600000],
                ['name' => 'Kursus Programming Web', 'sku' => 'EDU-WEB', 'price' => 800000],
                ['name' => 'Kursus Digital Marketing', 'sku' => 'EDU-MARKETING', 'price' => 650000],
            ],

            // LEGAL SERVICES
            'Layanan Hukum' => [
                ['name' => 'Konsultasi Hukum 1 Jam', 'sku' => 'LEGAL-CONSULT', 'price' => 500000],
                ['name' => 'Pembuatan Kontrak', 'sku' => 'LEGAL-CONTRACT', 'price' => 1500000],
                ['name' => 'Pendampingan Sidang', 'sku' => 'LEGAL-COURT', 'price' => 2000000],
                ['name' => 'Pengurusan Sertifikat Tanah', 'sku' => 'LEGAL-SERTIF', 'price' => 3000000],
                ['name' => 'Pembentukan PT/CV', 'sku' => 'LEGAL-COMPANY', 'price' => 5000000],
                ['name' => 'Mediasi Sengketa', 'sku' => 'LEGAL-MEDIASI', 'price' => 1000000],
            ],

            // CONSULTING
            'Layanan Konsultasi' => [
                ['name' => 'Business Strategy Consulting', 'sku' => 'CONS-STRATEGY', 'price' => 2000000],
                ['name' => 'IT System Consulting', 'sku' => 'CONS-IT', 'price' => 1500000],
                ['name' => 'Financial Advisory', 'sku' => 'CONS-FINANCE', 'price' => 1800000],
                ['name' => 'HR Management Consulting', 'sku' => 'CONS-HR', 'price' => 1200000],
                ['name' => 'Marketing Strategy', 'sku' => 'CONS-MARKETING', 'price' => 1600000],
                ['name' => 'Operations Improvement', 'sku' => 'CONS-OPS', 'price' => 1400000],
            ],

            // AUTOMOTIVE
            'Service Kendaraan' => [
                ['name' => 'Service Rutin Motor', 'sku' => 'AUTO-SERVICE-MOTOR', 'price' => 75000],
                ['name' => 'Service Rutin Mobil', 'sku' => 'AUTO-SERVICE-MOBIL', 'price' => 200000],
                ['name' => 'Ganti Oli Motor', 'sku' => 'AUTO-OLI-MOTOR', 'price' => 35000],
                ['name' => 'Ganti Oli Mobil', 'sku' => 'AUTO-OLI-MOBIL', 'price' => 85000],
                ['name' => 'Tune Up Engine', 'sku' => 'AUTO-TUNEUP', 'price' => 150000],
                ['name' => 'Balancing & Spooring', 'sku' => 'AUTO-BALANCING', 'price' => 100000],
                ['name' => 'Cuci Motor', 'sku' => 'AUTO-WASH-MOTOR', 'price' => 15000],
                ['name' => 'Cuci Mobil', 'sku' => 'AUTO-WASH-MOBIL', 'price' => 25000],
            ],

            // HEALTHCARE/PHARMACY
            'Layanan Kesehatan' => [
                ['name' => 'Konsultasi Dokter Umum', 'sku' => 'HEALTH-CONSULT', 'price' => 150000],
                ['name' => 'Cek Tensi & Gula Darah', 'sku' => 'HEALTH-CHECKUP', 'price' => 50000],
                ['name' => 'Suntik Vitamin', 'sku' => 'HEALTH-VITAMIN', 'price' => 75000],
                ['name' => 'Konsultasi Farmasi', 'sku' => 'HEALTH-PHARMACY', 'price' => 25000],
                ['name' => 'Tes Rapid Antigen', 'sku' => 'HEALTH-RAPID', 'price' => 85000],
                ['name' => 'Imunisasi Dewasa', 'sku' => 'HEALTH-VACCINE', 'price' => 200000],
            ],
        ];

        foreach ($businessCategories as $categoryName => $products) {
            $category = Category::where('name', $categoryName)->first();

            if (!$category) {
                $category = Category::create([
                    'name' => $categoryName,
                ]);
            }

            foreach ($products as $productData) {
                Product::firstOrCreate(
                    ['sku' => $productData['sku']],
                    [
                        'name' => $productData['name'],
                        'category_id' => $category->id,
                        'price' => $productData['price'],
                        'stock' => 999,
                        'active' => true,
                    ]
                );
            }
        }
    }
}