<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\ServiceCategory;

class BarbershopServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoryNames = [
            'Layanan Potong Rambut',
            'Perawatan Jenggot & Kumis',
            'Hair Styling & Treatment',
            'Cuci & Keramas',
            'Konsultasi & Grooming',
            'Paket Lengkap',
        ];

        $categories = ServiceCategory::whereIn('name', $categoryNames)
            ->get()
            ->keyBy('name');

        $services = [
            [
                'name' => 'Haircut Basic',
                'description' => 'Potongan rambut standar dengan teknik clipper dan gunting rapi',
                'code' => 'HC-BASIC',
                'base_price' => 25000,
                'unit' => 'layanan',
                'estimated_duration' => 30,
                'requirements' => 'Cuci rambut sebelum layanan',
                'category' => 'Layanan Potong Rambut',
            ],
            [
                'name' => 'Haircut Premium',
                'description' => 'Potongan rambut premium dengan konsultasi styling dan finishing detail',
                'code' => 'HC-PREMIUM',
                'base_price' => 50000,
                'unit' => 'layanan',
                'estimated_duration' => 45,
                'requirements' => 'Diskusikan gaya rambut yang diinginkan',
                'category' => 'Layanan Potong Rambut',
            ],
            [
                'name' => 'Kids Haircut',
                'description' => 'Potongan rambut khusus anak dengan pendekatan ramah dan sabar',
                'code' => 'HC-KIDS',
                'base_price' => 20000,
                'unit' => 'layanan',
                'estimated_duration' => 25,
                'requirements' => 'Anak didampingi orang tua/wali',
                'category' => 'Layanan Potong Rambut',
            ],
            [
                'name' => 'Beard Trim',
                'description' => 'Perapihan bentuk jenggot mengikuti kontur wajah',
                'code' => 'BT-BASIC',
                'base_price' => 30000,
                'unit' => 'layanan',
                'estimated_duration' => 20,
                'requirements' => 'Panjang jenggot minimal 1 cm',
                'category' => 'Perawatan Jenggot & Kumis',
            ],
            [
                'name' => 'Mustache Styling',
                'description' => 'Styling kumis dengan wax premium dan shaping detail',
                'code' => 'MS-STYLE',
                'base_price' => 25000,
                'unit' => 'layanan',
                'estimated_duration' => 15,
                'category' => 'Perawatan Jenggot & Kumis',
            ],
            [
                'name' => 'Beard Oil Treatment',
                'description' => 'Treatment jenggot dengan kombinasi serum dan pijat lembut',
                'code' => 'BOT-PREM',
                'base_price' => 45000,
                'unit' => 'layanan',
                'estimated_duration' => 30,
                'category' => 'Perawatan Jenggot & Kumis',
            ],
            [
                'name' => 'Hair Styling',
                'description' => 'Styling rambut menggunakan pomade atau clay sesuai kebutuhan acara',
                'code' => 'HS-STYLE',
                'base_price' => 35000,
                'unit' => 'layanan',
                'estimated_duration' => 20,
                'category' => 'Hair Styling & Treatment',
            ],
            [
                'name' => 'Hair Treatment',
                'description' => 'Perawatan rambut dengan vitamin, masker, dan pijat kulit kepala',
                'code' => 'HT-TREAT',
                'base_price' => 75000,
                'unit' => 'layanan',
                'estimated_duration' => 45,
                'requirements' => 'Sebaiknya konsultasi kondisi rambut terlebih dahulu',
                'category' => 'Hair Styling & Treatment',
            ],
            [
                'name' => 'Hair Coloring',
                'description' => 'Layanan pewarnaan rambut profesional dengan pilihan warna lengkap',
                'code' => 'HC-COLOR',
                'base_price' => 150000,
                'unit' => 'layanan',
                'estimated_duration' => 90,
                'requirements' => 'Tes alergi minimal 24 jam sebelum layanan',
                'category' => 'Hair Styling & Treatment',
            ],
            [
                'name' => 'Hair Wash Basic',
                'description' => 'Cuci rambut dengan shampo dan pijat kulit kepala ringan',
                'code' => 'HW-BASIC',
                'base_price' => 15000,
                'unit' => 'layanan',
                'estimated_duration' => 15,
                'category' => 'Cuci & Keramas',
            ],
            [
                'name' => 'Hair Wash Premium',
                'description' => 'Cuci rambut dengan rangkaian shampo premium dan conditioner',
                'code' => 'HW-PREMIUM',
                'base_price' => 25000,
                'unit' => 'layanan',
                'estimated_duration' => 20,
                'category' => 'Cuci & Keramas',
            ],
            [
                'name' => 'Scalp Massage',
                'description' => 'Pijat kulit kepala dengan essential oil untuk relaksasi',
                'code' => 'SM-RELAX',
                'base_price' => 40000,
                'unit' => 'layanan',
                'estimated_duration' => 25,
                'category' => 'Cuci & Keramas',
            ],
            [
                'name' => 'Style Consultation',
                'description' => 'Sesi konsultasi gaya rambut dan grooming sesuai bentuk wajah',
                'code' => 'SC-CONSULT',
                'base_price' => 20000,
                'unit' => 'layanan',
                'estimated_duration' => 15,
                'category' => 'Konsultasi & Grooming',
            ],
            [
                'name' => 'Grooming Session',
                'description' => 'Sesi grooming lengkap untuk kebutuhan acara khusus',
                'code' => 'GS-EVENT',
                'base_price' => 100000,
                'unit' => 'layanan',
                'estimated_duration' => 60,
                'requirements' => 'Reservasi minimal 1 hari sebelumnya',
                'category' => 'Konsultasi & Grooming',
            ],
            [
                'name' => 'Complete Barbershop Package',
                'description' => 'Paket lengkap: potong rambut, cuci, styling, dan beard trim',
                'code' => 'CBP-FULL',
                'base_price' => 90000,
                'unit' => 'paket',
                'estimated_duration' => 75,
                'requirements' => 'Booking disarankan untuk memastikan slot',
                'category' => 'Paket Lengkap',
            ],
            [
                'name' => 'Groom & Go Package',
                'description' => 'Paket cepat: potong rambut, cuci, dan styling singkat',
                'code' => 'GGP-QUICK',
                'base_price' => 65000,
                'unit' => 'paket',
                'estimated_duration' => 50,
                'category' => 'Paket Lengkap',
            ],
            [
                'name' => 'VIP Royal Treatment',
                'description' => 'Paket VIP dengan layanan premium lengkap dan area private',
                'code' => 'VRT-ROYAL',
                'base_price' => 200000,
                'unit' => 'paket',
                'estimated_duration' => 120,
                'requirements' => 'Reservasi minimal 1 hari sebelumnya',
                'category' => 'Paket Lengkap',
            ],
        ];

        foreach ($services as $serviceData) {
            $categoryName = $serviceData['category'];
            $category = $categories[$categoryName] ?? ServiceCategory::updateOrCreate(
                ['name' => $categoryName],
                ['description' => null, 'icon' => null, 'color' => '#3B82F6', 'active' => true]
            );

            $categories[$category->name] = $category;

            $payload = $serviceData;
            unset($payload['category']);

            $payload['service_category_id'] = $category->id;
            $payload['active'] = true;
            $payload['pricing_tiers'] = null;

            if (! array_key_exists('requirements', $payload)) {
                $payload['requirements'] = null;
            }

            Service::updateOrCreate(
                ['code' => $serviceData['code']],
                $payload
            );
        }
    }
}
