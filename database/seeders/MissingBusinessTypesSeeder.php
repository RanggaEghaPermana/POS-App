<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BusinessType;

class MissingBusinessTypesSeeder extends Seeder
{
    public function run(): void
    {
        $businessTypes = [
            [
                'name' => 'Barbershop & Grooming',
                'slug' => 'barbershop',
                'description' => 'Barbershop, salon cukur rambut pria, grooming',
                'required_fields' => ['service_duration', 'barber_skill_required'],
                'optional_fields' => ['haircut_type', 'appointment_required', 'age_group'],
                'custom_settings' => [
                    'appointment_system' => true,
                    'barber_management' => true
                ],
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'scissors',
                'color' => '#8B5CF6',
                'active' => true,
            ],
            [
                'name' => 'Laundry & Dry Cleaning',
                'slug' => 'laundry',
                'description' => 'Laundry, dry cleaning, cuci setrika',
                'required_fields' => ['weight_calculation', 'service_type'],
                'optional_fields' => ['fabric_type', 'delivery_time', 'pickup_delivery'],
                'custom_settings' => [
                    'pickup_delivery' => true,
                    'weight_tracking' => true
                ],
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => false,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'shirt',
                'color' => '#0EA5E9',
                'active' => true,
            ],
            [
                'name' => 'Electronics & Repair',
                'slug' => 'electronics',
                'description' => 'Toko elektronik, service center, repair',
                'required_fields' => ['brand', 'model_number'],
                'optional_fields' => ['serial_number', 'warranty_period', 'repair_difficulty'],
                'custom_settings' => [
                    'warranty_tracking' => true,
                    'repair_management' => true
                ],
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => false,
                'icon' => 'smartphone',
                'color' => '#EA580C',
                'active' => true,
            ],
            [
                'name' => 'Education & Training',
                'slug' => 'education',
                'description' => 'Lembaga pendidikan, kursus, pelatihan',
                'required_fields' => ['course_level', 'duration_hours'],
                'optional_fields' => ['class_size', 'prerequisites', 'certificate'],
                'custom_settings' => [
                    'student_management' => true,
                    'certificate_system' => true
                ],
                'supports_inventory' => false,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'graduation-cap',
                'color' => '#7C3AED',
                'active' => true,
            ],
            [
                'name' => 'Legal Services',
                'slug' => 'legal',
                'description' => 'Firma hukum, advokat, layanan legal',
                'required_fields' => ['case_type', 'complexity_level'],
                'optional_fields' => ['court_level', 'retainer_required', 'confidentiality_level'],
                'custom_settings' => [
                    'case_management' => true,
                    'document_tracking' => true
                ],
                'supports_inventory' => false,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'scale',
                'color' => '#1F2937',
                'active' => true,
            ],
            [
                'name' => 'Business Consulting',
                'slug' => 'consulting',
                'description' => 'Konsultan bisnis, IT consulting, advisory',
                'required_fields' => ['consulting_type', 'project_duration'],
                'optional_fields' => ['team_size', 'expertise_required', 'deliverables'],
                'custom_settings' => [
                    'project_management' => true,
                    'client_portal' => true
                ],
                'supports_inventory' => false,
                'supports_services' => true,
                'supports_bookings' => true,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'briefcase',
                'color' => '#059669',
                'active' => true,
            ],
            [
                'name' => 'Clinic & Medical',
                'slug' => 'clinic',
                'description' => 'Klinik, praktik dokter, medical center',
                'required_fields' => ['medical_procedure', 'requires_doctor'],
                'optional_fields' => ['preparation_notes', 'age_restriction'],
                'custom_settings' => [
                    'patient_records' => true,
                    'appointment_system' => true
                ],
                'supports_inventory' => true,
                'supports_services' => true,
                'supports_bookings' => false,
                'supports_tables' => false,
                'supports_appointments' => true,
                'icon' => 'stethoscope',
                'color' => '#0891B2',
                'active' => true,
            ],
        ];

        foreach ($businessTypes as $businessType) {
            BusinessType::updateOrCreate(
                ['slug' => $businessType['slug']],
                $businessType
            );
        }
    }
}