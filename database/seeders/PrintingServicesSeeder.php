<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Product;

class PrintingServicesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Jasa Cetak & Copy' => [
                ['name' => 'Fotokopi A4', 'sku' => 'FC-A4', 'price' => 250],
                ['name' => 'Fotokopi A3', 'sku' => 'FC-A3', 'price' => 500],
                ['name' => 'Fotokopi F4', 'sku' => 'FC-F4', 'price' => 300],
                ['name' => 'Fotokopi Legal', 'sku' => 'FC-LEGAL', 'price' => 350],
                ['name' => 'Fotokopi A5', 'sku' => 'FC-A5', 'price' => 200],
                ['name' => 'Print Hitam Putih A4', 'sku' => 'PR-BW-A4', 'price' => 500],
                ['name' => 'Print Hitam Putih A3', 'sku' => 'PR-BW-A3', 'price' => 1000],
                ['name' => 'Print Warna A4', 'sku' => 'PR-COLOR-A4', 'price' => 2000],
                ['name' => 'Print Warna A3', 'sku' => 'PR-COLOR-A3', 'price' => 4000],
                ['name' => 'Print Draft Quality A4', 'sku' => 'PR-DRAFT-A4', 'price' => 300],
                ['name' => 'Print High Quality A4', 'sku' => 'PR-HQ-A4', 'price' => 750],
                ['name' => 'Scan ke PDF', 'sku' => 'SCAN-PDF', 'price' => 1000],
                ['name' => 'Scan ke JPG', 'sku' => 'SCAN-JPG', 'price' => 1000],
                ['name' => 'Scan HIRES ke PDF', 'sku' => 'SCAN-HIRES-PDF', 'price' => 2000],
                ['name' => 'Print Photo 2R (6x9)', 'sku' => 'PHOTO-2R', 'price' => 1500],
                ['name' => 'Print Photo 3R (9x13)', 'sku' => 'PHOTO-3R', 'price' => 2000],
                ['name' => 'Print Photo 4R (10x15)', 'sku' => 'PHOTO-4R', 'price' => 3000],
                ['name' => 'Print Photo 5R (13x18)', 'sku' => 'PHOTO-5R', 'price' => 4000],
                ['name' => 'Print Photo 6R (15x20)', 'sku' => 'PHOTO-6R', 'price' => 6000],
                ['name' => 'Print Photo 8R (20x25)', 'sku' => 'PHOTO-8R', 'price' => 12000],
                ['name' => 'Print Photo A4', 'sku' => 'PHOTO-A4', 'price' => 15000],
                ['name' => 'Print HVS 70gsm', 'sku' => 'PR-HVS70', 'price' => 400],
                ['name' => 'Print HVS 80gsm', 'sku' => 'PR-HVS80', 'price' => 500],
                ['name' => 'Print Art Paper 120gsm', 'sku' => 'PR-ART120', 'price' => 1500],
                ['name' => 'Print Art Paper 150gsm', 'sku' => 'PR-ART150', 'price' => 2000],
            ],
            'Jasa Finishing' => [
                ['name' => 'Jilid Spiral', 'sku' => 'JLD-SPIRAL', 'price' => 5000],
                ['name' => 'Jilid Hard Cover', 'sku' => 'JLD-HARD', 'price' => 15000],
                ['name' => 'Jilid Soft Cover', 'sku' => 'JLD-SOFT', 'price' => 8000],
                ['name' => 'Laminating A4', 'sku' => 'LAM-A4', 'price' => 2000],
                ['name' => 'Laminating A3', 'sku' => 'LAM-A3', 'price' => 4000],
                ['name' => 'Laminating F4', 'sku' => 'LAM-F4', 'price' => 2500],
                ['name' => 'Cutting Custom', 'sku' => 'CUT-CUSTOM', 'price' => 1000],
                ['name' => 'Folding Brosur', 'sku' => 'FOLD-BROSUR', 'price' => 500],
                ['name' => 'Folding Undangan', 'sku' => 'FOLD-INVITATION', 'price' => 1000],
            ],
            'Jasa Desain' => [
                ['name' => 'Design Banner per meter', 'sku' => 'DSN-BANNER-M', 'price' => 50000],
                ['name' => 'Design Kartu Nama', 'sku' => 'DSN-CARD', 'price' => 25000],
                ['name' => 'Design Undangan Custom', 'sku' => 'DSN-INVITATION', 'price' => 75000],
                ['name' => 'Editing Photo per foto', 'sku' => 'DSN-PHOTO-EDIT', 'price' => 10000],
            ],
            'Jasa Digital' => [
                ['name' => 'Ketik Ulang per halaman', 'sku' => 'DIGI-TYPE', 'price' => 2000],
                ['name' => 'Convert PDF to Word', 'sku' => 'DIGI-PDF-WORD', 'price' => 5000],
                ['name' => 'Convert Word to PDF', 'sku' => 'DIGI-WORD-PDF', 'price' => 2000],
                ['name' => 'Burning CD/DVD', 'sku' => 'DIGI-BURN', 'price' => 5000],
                ['name' => 'Print dari HP via WhatsApp', 'sku' => 'DIGI-PRINT-WA', 'price' => 1000],
                ['name' => 'Print dari HP via Email', 'sku' => 'DIGI-PRINT-EMAIL', 'price' => 1000],
                ['name' => 'Upload & Print via Cloud', 'sku' => 'DIGI-CLOUD-PRINT', 'price' => 1500],
                ['name' => 'Compress PDF', 'sku' => 'DIGI-COMPRESS', 'price' => 3000],
                ['name' => 'Merge PDF Files', 'sku' => 'DIGI-MERGE-PDF', 'price' => 2000],
                ['name' => 'Split PDF Pages', 'sku' => 'DIGI-SPLIT-PDF', 'price' => 2000],
            ],
            'Large Format & Banner' => [
                ['name' => 'Banner Indoor per m2', 'sku' => 'LF-BANNER-INDOOR', 'price' => 25000],
                ['name' => 'Banner Outdoor per m2', 'sku' => 'LF-BANNER-OUTDOOR', 'price' => 35000],
                ['name' => 'X-Banner 60x160cm', 'sku' => 'LF-XBANNER', 'price' => 75000],
                ['name' => 'Roll Up Banner 85x200cm', 'sku' => 'LF-ROLLUP', 'price' => 250000],
                ['name' => 'Sticker Vinyl per m2', 'sku' => 'LF-STICKER-VINYL', 'price' => 45000],
                ['name' => 'Cutting Sticker per m2', 'sku' => 'LF-CUTTING-STICKER', 'price' => 65000],
                ['name' => 'Print Kanvas per m2', 'sku' => 'LF-CANVAS', 'price' => 85000],
                ['name' => 'Print MMT per m2', 'sku' => 'LF-MMT', 'price' => 20000],
            ],
            'Jasa Kartu & ID Card' => [
                ['name' => 'Kartu Nama (Art Paper)', 'sku' => 'CARD-NAME-ART', 'price' => 350],
                ['name' => 'Kartu Nama (Premium)', 'sku' => 'CARD-NAME-PREMIUM', 'price' => 500],
                ['name' => 'ID Card PVC', 'sku' => 'CARD-ID-PVC', 'price' => 8000],
                ['name' => 'Member Card', 'sku' => 'CARD-MEMBER', 'price' => 7500],
                ['name' => 'Laminating ID Card', 'sku' => 'CARD-LAMINATE', 'price' => 2000],
                ['name' => 'Cetak Lanyard', 'sku' => 'CARD-LANYARD', 'price' => 15000],
            ],
            'Jasa Express & Premium' => [
                ['name' => 'Express 1 Jam', 'sku' => 'EXP-1H', 'price' => 5000],
                ['name' => 'Express 30 Menit', 'sku' => 'EXP-30M', 'price' => 10000],
                ['name' => 'Express 15 Menit', 'sku' => 'EXP-15M', 'price' => 15000],
                ['name' => 'Delivery dalam Kota', 'sku' => 'EXP-DELIVERY-CITY', 'price' => 25000],
                ['name' => 'Pickup Service', 'sku' => 'EXP-PICKUP', 'price' => 20000],
            ],
        ];

        foreach ($categories as $categoryName => $products) {
            $category = Category::where('name', $categoryName)->first();

            if ($category) {
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
}