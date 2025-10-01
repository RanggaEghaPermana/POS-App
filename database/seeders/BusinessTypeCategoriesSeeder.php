<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\BusinessType;
use App\Models\Category;

class BusinessTypeCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get business type IDs
        $barbershopType = BusinessType::where('slug', 'barbershop')->first();
        $laundryType = BusinessType::where('slug', 'laundry')->first();
        $restaurantType = BusinessType::where('slug', 'restaurant')->first();
        $pharmacyType = BusinessType::where('slug', 'pharmacy')->first();
        $automotiveType = BusinessType::where('slug', 'automotive')->first();
        $photocopyType = BusinessType::where('slug', 'photocopy')->first();

        // Barbershop categories
        if ($barbershopType) {
            $barbershopCategories = [
                'Produk Perawatan Rambut',
                'Produk Styling',
                'Perawatan Jenggot',
                'Shampo & Kondisioner',
                'Treatment Rambut',
                'Alat & Perlengkapan',
                'Aftershave & Parfum'
            ];

            foreach ($barbershopCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $barbershopType->id],
                    ['name' => $categoryName, 'business_type_id' => $barbershopType->id]
                );
            }
        }

        // Laundry categories
        if ($laundryType) {
            $laundryCategories = [
                'Deterjen',
                'Pelembut Kain',
                'Penghilang Noda',
                'Pemutih',
                'Chemical Dry Clean',
                'Peralatan Laundry',
                'Bahan Kemasan'
            ];

            foreach ($laundryCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $laundryType->id],
                    ['name' => $categoryName, 'business_type_id' => $laundryType->id]
                );
            }
        }

        // Restaurant categories
        if ($restaurantType) {
            $restaurantCategories = [
                'Makanan Utama',
                'Makanan Pembuka',
                'Makanan Penutup',
                'Minuman',
                'Bahan Baku',
                'Bumbu & Rempah',
                'Perlengkapan Dapur'
            ];

            foreach ($restaurantCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $restaurantType->id],
                    ['name' => $categoryName, 'business_type_id' => $restaurantType->id]
                );
            }
        }

        // Pharmacy categories
        if ($pharmacyType) {
            $pharmacyCategories = [
                'Obat Resep',
                'Obat Bebas',
                'Vitamin & Suplemen',
                'Alat Kesehatan',
                'Pertolongan Pertama',
                'Perawatan Pribadi',
                'Monitoring Kesehatan'
            ];

            foreach ($pharmacyCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $pharmacyType->id],
                    ['name' => $categoryName, 'business_type_id' => $pharmacyType->id]
                );
            }
        }

        // Automotive categories
        if ($automotiveType) {
            $automotiveCategories = [
                'Spare Part Mesin',
                'Spare Part Body',
                'Spare Part Elektrik',
                'Oli & Pelumas',
                'Ban & Velg',
                'Aksesoris Mobil',
                'Alat & Perlengkapan'
            ];

            foreach ($automotiveCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $automotiveType->id],
                    ['name' => $categoryName, 'business_type_id' => $automotiveType->id]
                );
            }
        }

        // Photocopy categories (existing)
        if ($photocopyType) {
            $photocopyCategories = [
                'Layanan Cetak',
                'Layanan Jilid',
                'Layanan Desain',
                'Kertas & Alat Tulis',
                'Peralatan & Perlengkapan'
            ];

            foreach ($photocopyCategories as $categoryName) {
                Category::firstOrCreate(
                    ['name' => $categoryName, 'business_type_id' => $photocopyType->id],
                    ['name' => $categoryName, 'business_type_id' => $photocopyType->id]
                );
            }
        }
    }
}
