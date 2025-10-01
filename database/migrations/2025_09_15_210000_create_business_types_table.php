<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('business_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 'Retail', 'Restaurant', 'Service', 'Healthcare', 'Automotive'
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('required_fields')->nullable(); // Dynamic fields per business type
            $table->json('optional_fields')->nullable();
            $table->json('custom_settings')->nullable(); // Business-specific configurations
            $table->boolean('supports_inventory')->default(true);
            $table->boolean('supports_services')->default(false);
            $table->boolean('supports_bookings')->default(false);
            $table->boolean('supports_tables')->default(false); // For restaurants
            $table->boolean('supports_appointments')->default(false); // For healthcare/beauty
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Add business_type_id to tenants
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('business_type_id')->nullable()->constrained('business_types');
        });

        // Seed default business types
        $businessTypes = [
            [
                'name' => 'Retail & E-commerce',
                'slug' => 'retail',
                'description' => 'Toko retail, minimarket, fashion, elektronik',
                'required_fields' => json_encode(['sku', 'stock', 'supplier', 'category']),
                'optional_fields' => json_encode(['brand', 'warranty', 'dimensions', 'weight']),
                'custom_settings' => null,
                'supports_inventory' => true,
                'supports_services' => false,
                'supports_bookings' => false,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'shopping-cart',
                'color' => '#10B981',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Restaurant & F&B',
                'slug' => 'restaurant',
                'description' => 'Restoran, cafe, katering, food court',
                'required_fields' => json_encode(['ingredients', 'recipe', 'cooking_time', 'category']),
                'optional_fields' => json_encode(['allergens', 'spice_level', 'nutrition_info']),
                'custom_settings' => json_encode(['table_management' => true, 'kitchen_display' => true]),
                'supports_inventory' => true,
                'supports_services' => false,
                'supports_bookings' => false,
                'supports_tables' => true,
                'supports_appointments' => false,
                'icon' => 'utensils',
                'color' => '#F59E0B',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Service & Repair',
                'slug' => 'service',
                'description' => 'Bengkel, service elektronik, reparasi',
                'required_fields' => json_encode(['service_type', 'duration', 'technician', 'tools_required']),
                'optional_fields' => json_encode(['warranty_period', 'parts_needed', 'skill_level']),
                'custom_settings' => null,
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'wrench',
                'color' => '#6366F1',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Healthcare & Clinic',
                'slug' => 'healthcare',
                'description' => 'Klinik, apotek, lab, dental',
                'required_fields' => json_encode(['medical_code', 'dosage', 'prescription_required', 'category']),
                'optional_fields' => json_encode(['side_effects', 'contraindications', 'storage_conditions']),
                'custom_settings' => json_encode(['patient_records' => true, 'prescription_tracking' => true]),
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => false,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'heart',
                'color' => '#EF4444',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Beauty & Salon',
                'slug' => 'beauty',
                'description' => 'Salon, barbershop, spa, klinik kecantikan',
                'required_fields' => json_encode(['service_duration', 'staff_required', 'room_type']),
                'optional_fields' => json_encode(['skin_type_compatibility', 'aftercare_instructions']),
                'custom_settings' => null,
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'scissors',
                'color' => '#EC4899',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Automotive',
                'slug' => 'automotive',
                'description' => 'Bengkel mobil, motor, spare parts',
                'required_fields' => json_encode(['part_number', 'vehicle_compatibility', 'service_type']),
                'optional_fields' => json_encode(['oem_number', 'brand_compatibility', 'installation_time']),
                'custom_settings' => null,
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'car',
                'color' => '#374151',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Photo Copy & Printing',
                'slug' => 'printing',
                'description' => 'Foto copy, printing, percetakan, design',
                'required_fields' => json_encode(['paper_size', 'print_type', 'finishing']),
                'optional_fields' => json_encode(['color_profile', 'binding_type', 'delivery_time']),
                'custom_settings' => null,
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => false,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'printer',
                'color' => '#059669',
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($businessTypes as $businessType) {
            DB::table('business_types')->insert($businessType);
        }
    }

    public function down()
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('business_type_id');
        });
        Schema::dropIfExists('business_types');
    }
};