<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCategory;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // Create Service Categories
        $categories = [
            [
                'name' => 'Cetak & Copy',
                'description' => 'Layanan fotokopi, print dan scan dokumen',
                'icon' => 'printer',
                'color' => '#3B82F6'
            ],
            [
                'name' => 'Finishing',
                'description' => 'Layanan jilid, laminating dan finishing',
                'icon' => 'binding',
                'color' => '#8B5CF6'
            ],
            [
                'name' => 'Desain',
                'description' => 'Layanan desain grafis dan editing',
                'icon' => 'palette',
                'color' => '#06B6D4'
            ],
            [
                'name' => 'Digital',
                'description' => 'Layanan ketik, convert file dan digital',
                'icon' => 'computer',
                'color' => '#10B981'
            ]
        ];

        foreach ($categories as $categoryData) {
            $category = ServiceCategory::create($categoryData);

            // Create services for each category
            $this->createServicesForCategory($category);
        }
    }

    private function createServicesForCategory(ServiceCategory $category)
    {
        $services = [];

        switch ($category->name) {
            case 'Cetak & Copy':
                $services = [
                    [
                        'name' => 'Fotokopi A4',
                        'code' => 'FC-A4',
                        'base_price' => 250,
                        'unit' => 'lembar',
                        'description' => 'Fotokopi ukuran A4 (21 x 29.7 cm)',
                        'pricing_tiers' => [
                            ['min_qty' => 100, 'price' => 200],
                            ['min_qty' => 500, 'price' => 150],
                        ],
                        'estimated_duration' => 1,
                    ],
                    [
                        'name' => 'Fotokopi A3',
                        'code' => 'FC-A3',
                        'base_price' => 500,
                        'unit' => 'lembar',
                        'description' => 'Fotokopi ukuran A3 (29.7 x 42 cm)',
                        'pricing_tiers' => [
                            ['min_qty' => 100, 'price' => 450],
                            ['min_qty' => 500, 'price' => 400],
                        ],
                        'estimated_duration' => 2,
                    ],
                    [
                        'name' => 'Fotokopi F4',
                        'code' => 'FC-F4',
                        'base_price' => 300,
                        'unit' => 'lembar',
                        'description' => 'Fotokopi ukuran F4 (21.5 x 33 cm)',
                        'estimated_duration' => 1,
                    ],
                    [
                        'name' => 'Print Hitam Putih A4',
                        'code' => 'PR-BW-A4',
                        'base_price' => 500,
                        'unit' => 'lembar',
                        'description' => 'Print hitam putih ukuran A4',
                        'estimated_duration' => 2,
                    ],
                    [
                        'name' => 'Print Warna A4',
                        'code' => 'PR-COLOR-A4',
                        'base_price' => 2000,
                        'unit' => 'lembar',
                        'description' => 'Print full color ukuran A4',
                        'estimated_duration' => 3,
                    ],
                    [
                        'name' => 'Scan ke PDF',
                        'code' => 'SCAN-PDF',
                        'base_price' => 1000,
                        'unit' => 'lembar',
                        'description' => 'Scan dokumen ke format PDF',
                        'estimated_duration' => 2,
                    ],
                    [
                        'name' => 'Print Photo 4R',
                        'code' => 'PHOTO-4R',
                        'base_price' => 3000,
                        'unit' => 'foto',
                        'description' => 'Print foto ukuran 4R (10 x 15 cm)',
                        'estimated_duration' => 5,
                    ]
                ];
                break;

            case 'Finishing':
                $services = [
                    [
                        'name' => 'Jilid Spiral',
                        'code' => 'JLD-SPIRAL',
                        'base_price' => 5000,
                        'unit' => 'dokumen',
                        'description' => 'Jilid dengan spiral plastik',
                        'estimated_duration' => 10,
                        'requirements' => 'Dokumen sudah dicetak dan diurutkan'
                    ],
                    [
                        'name' => 'Jilid Hard Cover',
                        'code' => 'JLD-HARD',
                        'base_price' => 15000,
                        'unit' => 'dokumen',
                        'description' => 'Jilid dengan cover keras',
                        'estimated_duration' => 20,
                        'requirements' => 'Dokumen lengkap, tentukan warna cover'
                    ],
                    [
                        'name' => 'Laminating A4',
                        'code' => 'LAM-A4',
                        'base_price' => 2000,
                        'unit' => 'lembar',
                        'description' => 'Laminating ukuran A4',
                        'estimated_duration' => 3,
                    ],
                    [
                        'name' => 'Cutting Custom',
                        'code' => 'CUT-CUSTOM',
                        'base_price' => 1000,
                        'unit' => 'potong',
                        'description' => 'Potong kertas custom sesuai ukuran',
                        'estimated_duration' => 5,
                        'requirements' => 'Tentukan ukuran yang diinginkan'
                    ]
                ];
                break;

            case 'Desain':
                $services = [
                    [
                        'name' => 'Design Banner',
                        'code' => 'DSN-BANNER',
                        'base_price' => 50000,
                        'unit' => 'meter',
                        'description' => 'Desain banner per meter',
                        'estimated_duration' => 120,
                        'requirements' => 'Konten, ukuran, dan brief desain'
                    ],
                    [
                        'name' => 'Design Kartu Nama',
                        'code' => 'DSN-CARD',
                        'base_price' => 25000,
                        'unit' => 'design',
                        'description' => 'Desain kartu nama',
                        'estimated_duration' => 60,
                        'requirements' => 'Data pribadi/perusahaan, logo jika ada'
                    ],
                    [
                        'name' => 'Design Undangan',
                        'code' => 'DSN-INVITATION',
                        'base_price' => 75000,
                        'unit' => 'design',
                        'description' => 'Desain undangan custom',
                        'estimated_duration' => 180,
                        'requirements' => 'Tema, tanggal, data acara lengkap'
                    ],
                    [
                        'name' => 'Editing Photo',
                        'code' => 'DSN-PHOTO-EDIT',
                        'base_price' => 10000,
                        'unit' => 'foto',
                        'description' => 'Edit foto (background, retouch, dll)',
                        'estimated_duration' => 30,
                    ]
                ];
                break;

            case 'Digital':
                $services = [
                    [
                        'name' => 'Ketik Ulang',
                        'code' => 'DIGI-TYPE',
                        'base_price' => 2000,
                        'unit' => 'halaman',
                        'description' => 'Ketik ulang dokumen dari gambar/tulisan tangan',
                        'estimated_duration' => 15,
                    ],
                    [
                        'name' => 'Convert PDF to Word',
                        'code' => 'DIGI-PDF-WORD',
                        'base_price' => 5000,
                        'unit' => 'dokumen',
                        'description' => 'Konversi file PDF ke Word',
                        'estimated_duration' => 10,
                    ],
                    [
                        'name' => 'Burning CD/DVD',
                        'code' => 'DIGI-BURN',
                        'base_price' => 5000,
                        'unit' => 'disc',
                        'description' => 'Burning data ke CD/DVD',
                        'estimated_duration' => 15,
                        'requirements' => 'CD/DVD kosong, data maksimal sesuai kapasitas'
                    ],
                    [
                        'name' => 'Print dari HP',
                        'code' => 'DIGI-PRINT-MOBILE',
                        'base_price' => 1000,
                        'unit' => 'file',
                        'description' => 'Print file dari HP via WhatsApp/Email',
                        'estimated_duration' => 5,
                        'requirements' => 'Kirim file ke WhatsApp/Email toko'
                    ]
                ];
                break;
        }

        foreach ($services as $serviceData) {
            $serviceData['service_category_id'] = $category->id;
            Service::create($serviceData);
        }
    }
}