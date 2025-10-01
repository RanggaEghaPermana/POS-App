<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ServiceCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(BarbershopServiceCategoriesSeeder::class);
    }
}
