<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCategory;

class BarbershopServiceCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Layanan Potong Rambut',
                'description' => 'Pilihan potong rambut signature, klasik, hingga trend terbaru',
                'icon' => 'haircut',
                'color' => '#8B5CF6',
                'active' => true,
            ],
            [
                'name' => 'Perawatan Jenggot & Kumis',
                'description' => 'Trimming, shaping, dan perawatan untuk jenggot & kumis',
                'icon' => 'beard',
                'color' => '#F59E0B',
                'active' => true,
            ],
            [
                'name' => 'Hair Styling & Treatment',
                'description' => 'Styling harian, treatment vitamin, hingga coloring rambut',
                'icon' => 'styling',
                'color' => '#10B981',
                'active' => true,
            ],
            [
                'name' => 'Cuci & Keramas',
                'description' => 'Cuci rambut relaksasi lengkap dengan pijat kepala',
                'icon' => 'wash',
                'color' => '#3B82F6',
                'active' => true,
            ],
            [
                'name' => 'Konsultasi & Grooming',
                'description' => 'Sesi konsultasi gaya personal dan grooming total',
                'icon' => 'consultation',
                'color' => '#EF4444',
                'active' => true,
            ],
            [
                'name' => 'Paket Lengkap',
                'description' => 'Bundling hemat untuk layanan lengkap barbershop',
                'icon' => 'package',
                'color' => '#6366F1',
                'active' => true,
            ],
        ];

        $categoryNames = array_column($categories, 'name');

        ServiceCategory::whereNotIn('name', $categoryNames)->delete();

        foreach ($categories as $categoryData) {
            $values = $categoryData;
            unset($values['name']);

            ServiceCategory::updateOrCreate(
                ['name' => $categoryData['name']],
                $values
            );
        }
    }
}
