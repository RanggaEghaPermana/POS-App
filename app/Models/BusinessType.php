<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'description', 'required_fields', 'optional_fields',
        'custom_settings', 'supports_inventory', 'supports_services',
        'supports_bookings', 'supports_tables', 'supports_appointments',
        'icon', 'color', 'active'
    ];

    protected $casts = [
        'required_fields' => 'array',
        'optional_fields' => 'array',
        'custom_settings' => 'array',
        'supports_inventory' => 'boolean',
        'supports_services' => 'boolean',
        'supports_bookings' => 'boolean',
        'supports_tables' => 'boolean',
        'supports_appointments' => 'boolean',
        'active' => 'boolean',
    ];

    public function tenants()
    {
        return $this->hasMany(Tenant::class);
    }

    /**
     * Get form fields configuration for this business type
     */
    public function getFormFieldsAttribute()
    {
        $baseFields = $this->getBaseFieldsForBusiness();

        // Add business-specific fields
        $dynamicFields = $this->getDynamicFieldsConfig();

        return array_merge($baseFields, $dynamicFields);
    }

    private function getBaseFieldsForBusiness()
    {
        switch ($this->slug) {
            case 'barbershop':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Cukur'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Layanan'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Cukur'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Slot Tersedia'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Layanan'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'restaurant':
            case 'cafe':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Menu'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Menu'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga Menu'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok Bahan'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Menu'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Menu Tersedia'],
                ];

            case 'laundry':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Paket Laundry'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Paket'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Laundry'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Kapasitas Harian'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Cucian'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Paket Aktif'],
                ];

            case 'printing':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Print'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Layanan'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif per Unit'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok Kertas/Material'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Print'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'healthcare':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Obat/Alkes'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Obat'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga Obat'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok Obat'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Obat'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Obat Tersedia'],
                ];

            case 'electronics':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Produk/Service'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Part Number/Kode'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga/Tarif Service'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok/Slot Service'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Elektronik'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Produk/Service Aktif'],
                ];

            case 'education':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Kursus/Program'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Kursus'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Biaya Kursus'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Kuota Peserta'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Pendidikan'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Kursus Aktif'],
                ];

            case 'legal':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Legal'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Layanan'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Fee Layanan'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Slot Konsultasi'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Bidang Hukum'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Tersedia'],
                ];

            case 'consulting':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Konsultasi'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Kode Konsultasi'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Fee Konsultasi'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Slot Konsultan'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Bidang Konsultasi'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'automotive':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Sparepart/Service'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'Part Number'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga/Ongkos Service'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok Part'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Automotive'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Part/Service Tersedia'],
                ];

            default:
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama'],
                    'sku' => ['type' => 'text', 'required' => true, 'label' => 'SKU/Kode'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga Jual'],
                    'stock' => ['type' => 'number', 'required' => true, 'label' => 'Stok'],
                    'category_id' => ['type' => 'select', 'required' => false, 'label' => 'Kategori'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Status Aktif'],
                ];
        }
    }

    /**
     * Get dynamic fields configuration based on business type
     */
    public function getDynamicFieldsConfig()
    {
        $config = [];

        switch ($this->slug) {
            case 'retail':
                $config = [
                    'brand' => ['type' => 'text', 'required' => false, 'label' => 'Merk/Brand'],
                    'supplier' => ['type' => 'text', 'required' => false, 'label' => 'Supplier'],
                    'cost_price' => ['type' => 'number', 'required' => false, 'label' => 'Harga Modal'],
                    'weight' => ['type' => 'number', 'required' => false, 'label' => 'Berat (gram)'],
                    'dimensions' => ['type' => 'text', 'required' => false, 'label' => 'Dimensi (PxLxT cm)'],
                    'expired_date' => ['type' => 'date', 'required' => false, 'label' => 'Tanggal Kedaluwarsa'],
                    'minimum_stock' => ['type' => 'number', 'required' => false, 'label' => 'Minimum Stok'],
                ];
                break;

            case 'restaurant':
            case 'cafe':
                $config = [
                    'ingredients' => ['type' => 'textarea', 'required' => true, 'label' => 'Bahan-bahan'],
                    'recipe' => ['type' => 'textarea', 'required' => false, 'label' => 'Resep/Cara Membuat'],
                    'cooking_time' => ['type' => 'number', 'required' => false, 'label' => 'Waktu Masak (menit)'],
                    'serving_size' => ['type' => 'select', 'required' => false, 'label' => 'Ukuran Porsi', 'options' => ['Small', 'Regular', 'Large', 'Extra Large', 'Family Size']],
                    'allergens' => ['type' => 'text', 'required' => false, 'label' => 'Alergen'],
                    'spice_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Pedas', 'options' => ['Tidak Pedas', 'Sedikit Pedas', 'Pedas', 'Sangat Pedas', 'Extra Pedas']],
                    'calories' => ['type' => 'number', 'required' => false, 'label' => 'Kalori'],
                    'menu_category' => ['type' => 'select', 'required' => false, 'label' => 'Kategori Menu', 'options' => ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Snack', 'Combo Package']],
                    'dietary_info' => ['type' => 'select', 'required' => false, 'label' => 'Info Diet', 'options' => ['Halal', 'Vegetarian', 'Vegan', 'Gluten Free', 'Keto', 'Low Carb', 'High Protein']],
                    'temperature' => ['type' => 'select', 'required' => false, 'label' => 'Suhu Sajian', 'options' => ['Hot', 'Cold', 'Room Temperature', 'Frozen']],
                    'availability' => ['type' => 'select', 'required' => false, 'label' => 'Ketersediaan', 'options' => ['Always Available', 'Breakfast Only', 'Lunch Only', 'Dinner Only', 'Weekend Special', 'Seasonal']],
                ];
                break;

            case 'service':
                $config = [
                    'service_duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi (menit)'],
                    'difficulty_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kesulitan', 'options' => ['Mudah', 'Sedang', 'Sulit']],
                    'required_tools' => ['type' => 'textarea', 'required' => false, 'label' => 'Alat yang Dibutuhkan'],
                    'warranty_days' => ['type' => 'number', 'required' => false, 'label' => 'Garansi (hari)'],
                    'location_type' => ['type' => 'select', 'required' => false, 'label' => 'Lokasi Layanan', 'options' => ['Di Toko', 'Di Tempat Pelanggan', 'Remote']],
                ];
                break;

            case 'healthcare':
                $config = [
                    'medical_code' => ['type' => 'text', 'required' => true, 'label' => 'Kode Medis'],
                    'dosage' => ['type' => 'text', 'required' => false, 'label' => 'Dosis'],
                    'requires_prescription' => ['type' => 'boolean', 'required' => false, 'label' => 'Perlu Resep'],
                    'side_effects' => ['type' => 'textarea', 'required' => false, 'label' => 'Efek Samping'],
                    'contraindications' => ['type' => 'textarea', 'required' => false, 'label' => 'Kontraindikasi'],
                    'storage_conditions' => ['type' => 'text', 'required' => false, 'label' => 'Kondisi Penyimpanan'],
                ];
                break;

            case 'beauty':
            case 'barbershop':
                $config = [
                    'service_duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi (menit)', 'default' => 30],
                    'haircut_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Potong', 'options' => ['Basic Cut', 'Trendy Cut', 'Beard Trim', 'Mustache Trim', 'Hair Wash', 'Hair Styling', 'Complete Package']],
                    'hair_length' => ['type' => 'select', 'required' => false, 'label' => 'Panjang Rambut', 'options' => ['Pendek', 'Sedang', 'Panjang', 'Semua Panjang']],
                    'difficulty_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kesulitan', 'options' => ['Mudah', 'Sedang', 'Sulit', 'Expert']],
                    'age_group' => ['type' => 'select', 'required' => false, 'label' => 'Kelompok Usia', 'options' => ['Anak (0-12)', 'Remaja (13-17)', 'Dewasa (18-50)', 'Lansia (50+)', 'Semua Usia']],
                    'required_tools' => ['type' => 'textarea', 'required' => false, 'label' => 'Alat yang Dibutuhkan'],
                    'aftercare_instructions' => ['type' => 'textarea', 'required' => false, 'label' => 'Instruksi Perawatan'],
                    'barber_skill_required' => ['type' => 'select', 'required' => false, 'label' => 'Skill Barber', 'options' => ['Junior', 'Senior', 'Expert', 'Master']],
                    'appointment_required' => ['type' => 'boolean', 'required' => false, 'label' => 'Perlu Booking'],
                ];
                break;

            case 'automotive':
                $config = [
                    'part_number' => ['type' => 'text', 'required' => true, 'label' => 'Nomor Part'],
                    'vehicle_compatibility' => ['type' => 'textarea', 'required' => true, 'label' => 'Kompatibilitas Kendaraan'],
                    'oem_number' => ['type' => 'text', 'required' => false, 'label' => 'Nomor OEM'],
                    'installation_time' => ['type' => 'number', 'required' => false, 'label' => 'Waktu Instalasi (menit)'],
                    'warranty_km' => ['type' => 'number', 'required' => false, 'label' => 'Garansi (KM)'],
                ];
                break;

            case 'printing':
                $config = [
                    'paper_size' => ['type' => 'select', 'required' => true, 'label' => 'Ukuran Kertas', 'options' => ['A4', 'A3', 'A5', 'F4', 'Letter', 'Legal', '10R (10x15cm)', '4R (10x15cm)', '6R (15x20cm)', '8R (20x25cm)']],
                    'print_type' => ['type' => 'select', 'required' => true, 'label' => 'Jenis Cetak', 'options' => ['Hitam Putih', 'Warna', 'Grayscale', 'Photo Quality', 'Draft', 'Normal', 'Best Quality']],
                    'finishing' => ['type' => 'select', 'required' => false, 'label' => 'Finishing', 'options' => ['Tanpa Finishing', 'Jilid Spiral', 'Jilid Thermal', 'Jilid Lem Panas', 'Laminating Glossy', 'Laminating Doff', 'Potong Custom', 'Lipat']],
                    'paper_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Kertas', 'options' => ['HVS 70gsm', 'HVS 80gsm', 'Art Paper 120gsm', 'Art Paper 150gsm', 'Photo Paper Glossy', 'Photo Paper Matte', 'Sticker Vinyl', 'Banner Flexi']],
                    'copies' => ['type' => 'number', 'required' => false, 'label' => 'Jumlah Copy', 'default' => 1],
                    'pages' => ['type' => 'number', 'required' => false, 'label' => 'Jumlah Halaman', 'default' => 1],
                    'orientation' => ['type' => 'select', 'required' => false, 'label' => 'Orientasi', 'options' => ['Portrait', 'Landscape']],
                    'print_quality' => ['type' => 'select', 'required' => false, 'label' => 'Kualitas Print', 'options' => ['Draft 300dpi', 'Normal 600dpi', 'High 1200dpi', 'Photo 2400dpi']],
                    'urgent_order' => ['type' => 'boolean', 'required' => false, 'label' => 'Order Express'],
                    'delivery_method' => ['type' => 'select', 'required' => false, 'label' => 'Metode Pengambilan', 'options' => ['Ambil di Tempat', 'Delivery', 'WhatsApp/Online']],
                ];
                break;

            case 'laundry':
                $config = [
                    'fabric_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Kain', 'options' => ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Delicate', 'Mixed']],
                    'weight_calculation' => ['type' => 'select', 'required' => true, 'label' => 'Perhitungan Berat', 'options' => ['Per Kg', 'Per Item', 'Per Set', 'Flat Rate']],
                    'service_type' => ['type' => 'select', 'required' => true, 'label' => 'Jenis Layanan', 'options' => ['Wash Only', 'Wash & Dry', 'Wash & Iron', 'Dry Clean', 'Iron Only', 'Complete Service']],
                    'delivery_time' => ['type' => 'number', 'required' => false, 'label' => 'Waktu Selesai (jam)', 'default' => 24],
                    'special_treatment' => ['type' => 'textarea', 'required' => false, 'label' => 'Perawatan Khusus'],
                    'pickup_delivery' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Antar Jemput'],
                    'express_service' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Express'],
                ];
                break;

            case 'electronics':
                $config = [
                    'brand' => ['type' => 'text', 'required' => false, 'label' => 'Merk/Brand'],
                    'model_number' => ['type' => 'text', 'required' => false, 'label' => 'Model Number'],
                    'serial_number' => ['type' => 'text', 'required' => false, 'label' => 'Serial Number'],
                    'warranty_period' => ['type' => 'number', 'required' => false, 'label' => 'Garansi (bulan)'],
                    'condition' => ['type' => 'select', 'required' => false, 'label' => 'Kondisi', 'options' => ['New', 'Refurbished', 'Used - Like New', 'Used - Good', 'Used - Fair', 'For Parts']],
                    'compatibility' => ['type' => 'textarea', 'required' => false, 'label' => 'Kompatibilitas'],
                    'power_requirement' => ['type' => 'text', 'required' => false, 'label' => 'Kebutuhan Daya'],
                    'repair_difficulty' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kesulitan Repair', 'options' => ['Easy', 'Medium', 'Hard', 'Expert Only']],
                ];
                break;

            case 'education':
                $config = [
                    'course_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Kursus', 'options' => ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'All Levels']],
                    'duration_hours' => ['type' => 'number', 'required' => false, 'label' => 'Durasi (jam)'],
                    'class_size' => ['type' => 'number', 'required' => false, 'label' => 'Maksimal Siswa'],
                    'age_group' => ['type' => 'select', 'required' => false, 'label' => 'Kelompok Usia', 'options' => ['Anak (4-12)', 'Remaja (13-17)', 'Dewasa (18-50)', 'Lansia (50+)', 'Semua Usia']],
                    'prerequisites' => ['type' => 'textarea', 'required' => false, 'label' => 'Persyaratan'],
                    'certificate' => ['type' => 'boolean', 'required' => false, 'label' => 'Bersetifikat'],
                    'materials_included' => ['type' => 'textarea', 'required' => false, 'label' => 'Materi yang Disediakan'],
                    'schedule_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Jadwal', 'options' => ['Regular', 'Intensive', 'Weekend', 'Online', 'Hybrid']],
                ];
                break;

            case 'legal':
                $config = [
                    'case_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Kasus', 'options' => ['Civil', 'Criminal', 'Corporate', 'Family', 'Property', 'Labor', 'Tax', 'Immigration']],
                    'complexity_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kompleksitas', 'options' => ['Simple', 'Medium', 'Complex', 'High Profile']],
                    'estimated_duration' => ['type' => 'select', 'required' => false, 'label' => 'Estimasi Durasi', 'options' => ['1-30 days', '1-3 months', '3-6 months', '6-12 months', '1+ years']],
                    'court_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Pengadilan', 'options' => ['District Court', 'High Court', 'Supreme Court', 'Administrative Court', 'Arbitration']],
                    'retainer_required' => ['type' => 'boolean', 'required' => false, 'label' => 'Perlu Retainer'],
                    'confidentiality_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kerahasiaan', 'options' => ['Public', 'Confidential', 'Highly Confidential', 'Top Secret']],
                ];
                break;

            case 'consulting':
                $config = [
                    'consulting_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Konsultasi', 'options' => ['Business Strategy', 'IT Consulting', 'Financial Advisory', 'HR Consulting', 'Marketing', 'Operations', 'Management']],
                    'project_duration' => ['type' => 'select', 'required' => false, 'label' => 'Durasi Proyek', 'options' => ['1-7 days', '1-4 weeks', '1-3 months', '3-6 months', '6+ months', 'Ongoing']],
                    'team_size' => ['type' => 'number', 'required' => false, 'label' => 'Ukuran Tim'],
                    'deliverables' => ['type' => 'textarea', 'required' => false, 'label' => 'Deliverables'],
                    'client_industry' => ['type' => 'select', 'required' => false, 'label' => 'Industri Klien', 'options' => ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Government', 'Non-profit']],
                    'expertise_required' => ['type' => 'select', 'required' => false, 'label' => 'Keahlian Diperlukan', 'options' => ['Junior', 'Mid-level', 'Senior', 'Expert', 'Specialist']],
                ];
                break;
        }

        return $config;
    }

    /**
     * Get service fields for this business type
     */
    public function getServiceFieldsConfig()
    {
        if (!$this->supports_services) {
            return [];
        }

        $baseServiceFields = $this->getBaseServiceFieldsForBusiness();

        // Add business-specific service fields
        $dynamicFields = $this->getDynamicServiceFieldsConfig();

        return array_merge($baseServiceFields, $dynamicFields);
    }

    private function getBaseServiceFieldsForBusiness()
    {
        switch ($this->slug) {
            case 'barbershop':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Cukur'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Layanan'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi (menit)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Cukur'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'restaurant':
            case 'cafe':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Menu'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Menu'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Waktu Masak (menit)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga Menu'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Menu Tersedia'],
                ];

            case 'laundry':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Paket Laundry'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Paket'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Waktu Pengerjaan (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Laundry'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Paket Aktif'],
                ];

            case 'printing':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Print'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Layanan'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Estimasi Waktu (menit)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif per Unit'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'healthcare':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Medis'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Layanan'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi Konsultasi (menit)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Layanan'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Tersedia'],
                ];

            case 'electronics':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Service'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Service'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Estimasi Perbaikan (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Tarif Service'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Service Tersedia'],
                ];

            case 'education':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Kursus'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Kursus'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi Kursus (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Biaya Kursus'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Kursus Aktif'],
                ];

            case 'legal':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Legal'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Layanan'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Estimasi Waktu (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Fee Layanan'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Tersedia'],
                ];

            case 'consulting':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan Konsultasi'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Konsultasi'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi Sesi (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Fee Konsultasi'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Layanan Aktif'],
                ];

            case 'automotive':
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Service'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi Service'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Estimasi Waktu (jam)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Ongkos Service'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Service Tersedia'],
                ];

            default:
                return [
                    'name' => ['type' => 'text', 'required' => true, 'label' => 'Nama Layanan'],
                    'description' => ['type' => 'textarea', 'required' => false, 'label' => 'Deskripsi'],
                    'duration' => ['type' => 'number', 'required' => true, 'label' => 'Durasi (menit)'],
                    'price' => ['type' => 'number', 'required' => true, 'label' => 'Harga'],
                    'active' => ['type' => 'boolean', 'required' => false, 'label' => 'Status Aktif'],
                ];
        }
    }

    private function getDynamicServiceFieldsConfig()
    {
        $config = [];

        switch ($this->slug) {
            case 'service':
                $config = [
                    'difficulty_level' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kesulitan', 'options' => ['Mudah', 'Sedang', 'Sulit']],
                    'required_tools' => ['type' => 'textarea', 'required' => false, 'label' => 'Alat yang Dibutuhkan'],
                    'warranty_days' => ['type' => 'number', 'required' => false, 'label' => 'Garansi (hari)'],
                ];
                break;

            case 'healthcare':
                $config = [
                    'medical_procedure' => ['type' => 'text', 'required' => false, 'label' => 'Prosedur Medis'],
                    'requires_doctor' => ['type' => 'boolean', 'required' => false, 'label' => 'Memerlukan Dokter'],
                    'preparation_notes' => ['type' => 'textarea', 'required' => false, 'label' => 'Persiapan Pasien'],
                ];
                break;

            case 'beauty':
            case 'barbershop':
                $config = [
                    'skin_type_compatibility' => ['type' => 'text', 'required' => false, 'label' => 'Kompatibilitas Jenis Kulit'],
                    'aftercare_instructions' => ['type' => 'textarea', 'required' => false, 'label' => 'Instruksi Perawatan'],
                    'age_restriction' => ['type' => 'number', 'required' => false, 'label' => 'Batas Usia Minimum'],
                    'barber_skill_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Skill Barber', 'options' => ['Junior', 'Senior', 'Expert', 'Master']],
                    'appointment_required' => ['type' => 'boolean', 'required' => false, 'label' => 'Perlu Appointment'],
                ];
                break;

            case 'restaurant':
            case 'cafe':
                $config = [
                    'ingredients' => ['type' => 'textarea', 'required' => false, 'label' => 'Bahan-bahan'],
                    'allergen_info' => ['type' => 'text', 'required' => false, 'label' => 'Info Alergen'],
                    'spice_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Pedas', 'options' => ['Tidak Pedas', 'Pedas', 'Sangat Pedas']],
                    'prep_time' => ['type' => 'number', 'required' => false, 'label' => 'Waktu Persiapan (menit)'],
                    'dietary_restrictions' => ['type' => 'text', 'required' => false, 'label' => 'Pantangan Diet'],
                ];
                break;

            case 'laundry':
                $config = [
                    'fabric_care' => ['type' => 'text', 'required' => false, 'label' => 'Perawatan Kain'],
                    'delivery_time' => ['type' => 'number', 'required' => false, 'label' => 'Waktu Pengerjaan (jam)'],
                    'pickup_delivery' => ['type' => 'boolean', 'required' => false, 'label' => 'Antar Jemput'],
                    'special_instructions' => ['type' => 'textarea', 'required' => false, 'label' => 'Instruksi Khusus'],
                ];
                break;

            case 'electronics':
                $config = [
                    'repair_type' => ['type' => 'select', 'required' => false, 'label' => 'Jenis Repair', 'options' => ['Software', 'Hardware', 'Both', 'Diagnostic Only']],
                    'warranty_service' => ['type' => 'number', 'required' => false, 'label' => 'Garansi Service (hari)'],
                    'parts_required' => ['type' => 'textarea', 'required' => false, 'label' => 'Parts yang Diperlukan'],
                    'technician_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Teknisi', 'options' => ['Junior', 'Senior', 'Specialist']],
                ];
                break;

            case 'education':
                $config = [
                    'instructor_required' => ['type' => 'text', 'required' => false, 'label' => 'Instruktur'],
                    'materials_provided' => ['type' => 'boolean', 'required' => false, 'label' => 'Materi Disediakan'],
                    'certificate_issued' => ['type' => 'boolean', 'required' => false, 'label' => 'Bersetifikat'],
                    'online_available' => ['type' => 'boolean', 'required' => false, 'label' => 'Tersedia Online'],
                ];
                break;

            case 'legal':
                $config = [
                    'lawyer_required' => ['type' => 'text', 'required' => false, 'label' => 'Lawyer yang Diperlukan'],
                    'court_appearance' => ['type' => 'boolean', 'required' => false, 'label' => 'Perlu Sidang'],
                    'document_preparation' => ['type' => 'boolean', 'required' => false, 'label' => 'Persiapan Dokumen'],
                    'confidentiality' => ['type' => 'select', 'required' => false, 'label' => 'Tingkat Kerahasiaan', 'options' => ['Public', 'Confidential', 'Highly Confidential']],
                ];
                break;

            case 'consulting':
                $config = [
                    'consultant_level' => ['type' => 'select', 'required' => false, 'label' => 'Level Konsultan', 'options' => ['Junior', 'Senior', 'Principal', 'Partner']],
                    'remote_available' => ['type' => 'boolean', 'required' => false, 'label' => 'Tersedia Remote'],
                    'follow_up_included' => ['type' => 'boolean', 'required' => false, 'label' => 'Termasuk Follow-up'],
                    'report_delivery' => ['type' => 'select', 'required' => false, 'label' => 'Penyerahan Laporan', 'options' => ['Digital', 'Physical', 'Both']],
                ];
                break;
        }

        return $config;
    }
}