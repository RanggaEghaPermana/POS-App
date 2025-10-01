import {
  Home, ShoppingCart, History, RotateCcw, Package, Boxes, ArrowRightLeft,
  Truck, CreditCard, BarChart3, PieChart, TrendingUp, Receipt, DollarSign,
  Users, Store, Tag, Database, FileText, Printer, Clock, Wrench, Settings,
  Scissors, Calendar, UserCheck, Coffee, Utensils, ShoppingBag, Shirt,
  Camera, Building, Car, Heart, GraduationCap, Briefcase, BookOpen,
  Pill, Stethoscope, Hospital, Activity, Zap, Hammer, Scale, Shield,
  Headphones, Laptop, Smartphone, AlertTriangle, Sparkles
} from 'lucide-react'

// Business types dan konfigurasi navigasi mereka
export const BUSINESS_TYPES = {
  PHOTOCOPY: 'printing',
  BARBERSHOP: 'barbershop',
  RESTAURANT: 'restaurant',
  RETAIL: 'retail',
  LAUNDRY: 'laundry',
  AUTOMOTIVE: 'automotive',
  PHARMACY: 'healthcare',
  CLINIC: 'clinic',
  HOSPITAL: 'hospital',
  EDUCATION: 'education',
  LEGAL: 'legal',
  CONSULTING: 'consulting',
  ELECTRONICS: 'electronics',
  BEAUTY: 'beauty',
  SERVICE: 'service',
  GENERAL: 'general'
}

// Konfigurasi navigasi berdasarkan business type
export const BUSINESS_NAVIGATION = {
  [BUSINESS_TYPES.PHOTOCOPY]: {
    name: 'Foto Copy & Printing',
    icon: Printer,
    primaryColor: '#059669',
    sections: {
      main: {
        title: 'Utama',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Transaksi',
        items: [
          { to: '/cashier', label: 'Kasir Barang/ATK', icon: ShoppingCart },
          { to: '/service-pos', label: 'Kasir Print & Copy', icon: Printer },
          { to: '/history', label: 'Riwayat Transaksi', icon: History },
          { to: '/return', label: 'Retur/Komplain', icon: RotateCcw },
          { to: '/barbershop-shift', label: 'Manajemen Shift', icon: Clock }
        ]
      },
      services: {
        title: 'Layanan Print & Copy',
        items: [
          { to: '/service-list', label: 'Daftar Layanan', icon: Printer },
          { to: '/print-queue', label: 'Antrian Print', icon: Clock },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/service-categories', label: 'Kategori Layanan', icon: Package, roles: ['admin', 'manager'] }
        ]
      },
      design: {
        title: 'Design & Percetakan',
        items: [
          { to: '/design-orders', label: 'Order Design', icon: Camera },
          { to: '/templates', label: 'Template Design', icon: FileText },
          { to: '/large-format', label: 'Large Format Print', icon: Database },
        ]
      }
    }
  },

  [BUSINESS_TYPES.BARBERSHOP]: {
    name: 'Barbershop',
    icon: Scissors,
    primaryColor: '#374151',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Operasional',
        items: [
          { to: '/cashier', label: 'Kasir Unified (Produk & Treatment)', icon: ShoppingCart },
          { to: '/history', label: 'Riwayat Transaksi', icon: History },
          { to: '/return', label: 'Pembatalan', icon: RotateCcw }
        ]
      },
      appointments: {
        title: 'Booking & Jadwal',
        items: [
          { to: '/appointments', label: 'Booking Treatment', icon: Calendar },
          { to: '/barbershop-shift', label: 'Shift Barbershop', icon: Clock },
        ]
      },
      services: {
        title: 'Treatment & Staf',
        items: [
          { to: '/service-list', label: 'Daftar Treatment', icon: Scissors },
          { to: '/services', label: 'Kelola Treatment', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/service-categories', label: 'Kategori Treatment', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/barbers', label: 'Kelola Staf Barber', icon: Users, roles: ['admin', 'manager'] },
        ]
      },
      products: {
        title: 'Produk Grooming',
        items: [
          { to: '/inventory', label: 'Daftar Produk Grooming', icon: Package, roles: ['admin', 'manager'] },
          { to: '/categories', label: 'Kategori Produk', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/stock-management', label: 'Manajemen Stok', icon: Boxes, roles: ['admin', 'manager'] }
        ]
      },
      finance: {
        title: 'Keuangan',
        items: [
          { to: '/expenses', label: 'Manajemen Pengeluaran', icon: CreditCard, roles: ['admin', 'manager'] }
        ]
      },
      reports: {
        title: 'Laporan',
        items: [
          { to: '/reports', label: 'Laporan Treatment', icon: BarChart3 },
          { to: '/reports/inventory', label: 'Laporan Produk', icon: PieChart, roles: ['admin', 'manager'] },
          { to: '/reports/cashflow', label: 'Arus Kas', icon: TrendingUp, roles: ['admin'] },
          { to: '/reports/profit-loss', label: 'Laba Rugi', icon: DollarSign, roles: ['admin'] }
        ]
      }
    }
  },

  [BUSINESS_TYPES.RESTAURANT]: {
    name: 'Restaurant & Cafe',
    icon: Utensils,
    primaryColor: '#F59E0B',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Pemesanan & Transaksi',
        items: [
          { to: '/cashier', label: 'Kasir Restaurant', icon: Coffee },
          { to: '/service-pos', label: 'Layanan Meja', icon: Utensils },
          { to: '/history', label: 'Riwayat Pesanan', icon: History },
          { to: '/return', label: 'Pembatalan Pesanan', icon: RotateCcw }
        ]
      },
      menu: {
        title: 'Manajemen Menu',
        items: [
          { to: '/inventory', label: 'Daftar Menu', icon: Utensils, roles: ['admin', 'manager'] },
          { to: '/categories', label: 'Kategori Menu', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/services', label: 'Kelola Menu', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/service-list', label: 'Paket Spesial', icon: Coffee }
        ]
      },
      kitchen: {
        title: 'Dapur & Bahan',
        items: [
          { to: '/stock-management', label: 'Stok Bahan Baku', icon: Boxes, roles: ['admin', 'manager'] },
          { to: '/suppliers', label: 'Pemasok Bahan', icon: Truck, roles: ['admin', 'manager'] },
          { to: '/kitchen-orders', label: 'Pesanan Dapur', icon: Utensils }
        ]
      },
      operations: {
        title: 'Operasional Restaurant',
        items: [
          { to: '/barbershop-shift', label: 'Shift Karyawan', icon: Clock },
          { to: '/tables', label: 'Manajemen Meja', icon: Coffee, roles: ['admin', 'manager'] },
          { to: '/reservations', label: 'Reservasi Meja', icon: Calendar }
        ]
      }
    }
  },

  [BUSINESS_TYPES.RETAIL]: {
    name: 'Retail Store',
    icon: Store,
    primaryColor: '#10B981',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Penjualan',
        items: [
          { to: '/cashier', label: 'Point of Sale', icon: ShoppingCart },
          { to: '/history', label: 'Riwayat Penjualan', icon: History },
          { to: '/return', label: 'Retur Barang', icon: RotateCcw },
          { to: '/barbershop-shift', label: 'Manajemen Shift', icon: Clock }
        ]
      }
    }
  },

  [BUSINESS_TYPES.LAUNDRY]: {
    name: 'Laundry Service',
    icon: Shirt,
    primaryColor: '#0EA5E9',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Layanan',
        items: [
          { to: '/service-pos', label: 'Terima Cucian', icon: Shirt },
          { to: '/cashier', label: 'Penjualan Deterjen', icon: ShoppingBag },
          { to: '/history', label: 'Riwayat Layanan', icon: History },
          { to: '/return', label: 'Pembatalan/Komplain', icon: RotateCcw }
        ]
      },
      services: {
        title: 'Paket Layanan',
        items: [
          { to: '/service-list', label: 'Paket Laundry', icon: Shirt },
          { to: '/express-service', label: 'Express Service', icon: Clock },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/service-categories', label: 'Jenis Cucian', icon: Tag, roles: ['admin', 'manager'] }
        ]
      },
      operations: {
        title: 'Operasional',
        items: [
          { to: '/pickup-delivery', label: 'Pickup & Delivery', icon: Truck },
          { to: '/laundry-queue', label: 'Antrian Cucian', icon: Clock },
          { to: '/fabric-care', label: 'Perawatan Khusus', icon: AlertTriangle }
        ]
      }
    }
  },

  [BUSINESS_TYPES.PHARMACY]: {
    name: 'Apotek & Farmasi',
    icon: Pill,
    primaryColor: '#16A34A',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Pelayanan',
        items: [
          { to: '/cashier', label: 'Penjualan Obat', icon: Pill },
          { to: '/service-pos', label: 'Konsultasi', icon: Stethoscope },
          { to: '/history', label: 'Riwayat Penjualan', icon: History },
          { to: '/return', label: 'Retur Obat', icon: RotateCcw }
        ]
      },
      pharmacy: {
        title: 'Manajemen Obat',
        items: [
          { to: '/inventory', label: 'Stok Obat', icon: Package, roles: ['admin', 'manager'] },
          { to: '/categories', label: 'Kategori Obat', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/stock-management', label: 'Manajemen Stok', icon: Boxes, roles: ['admin', 'manager'] },
          { to: '/expiry-alerts', label: 'Alert Kadaluarsa', icon: Calendar, roles: ['admin', 'manager'] }
        ]
      },
      services: {
        title: 'Layanan Kesehatan',
        items: [
          { to: '/service-list', label: 'Layanan Konsultasi', icon: Stethoscope },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/prescriptions', label: 'Resep Dokter', icon: FileText }
        ]
      }
    }
  },

  [BUSINESS_TYPES.CLINIC]: {
    name: 'Klinik Kesehatan',
    icon: Stethoscope,
    primaryColor: '#0891B2',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      patient: {
        title: 'Pasien',
        items: [
          { to: '/service-pos', label: 'Registrasi Pasien', icon: UserCheck },
          { to: '/appointments', label: 'Appointment', icon: Calendar },
          { to: '/patients', label: 'Data Pasien', icon: Users },
          { to: '/medical-records', label: 'Rekam Medis', icon: FileText }
        ]
      },
      medical: {
        title: 'Pelayanan Medis',
        items: [
          { to: '/service-list', label: 'Layanan Medis', icon: Activity },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/doctors', label: 'Jadwal Dokter', icon: Clock, roles: ['admin', 'manager'] }
        ]
      },
      billing: {
        title: 'Billing & Farmasi',
        items: [
          { to: '/cashier', label: 'Billing Pasien', icon: CreditCard },
          { to: '/inventory', label: 'Stok Obat', icon: Pill, roles: ['admin', 'manager'] },
          { to: '/history', label: 'Riwayat Billing', icon: History }
        ]
      }
    }
  },

  [BUSINESS_TYPES.HOSPITAL]: {
    name: 'Rumah Sakit',
    icon: Hospital,
    primaryColor: '#DC2626',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      patient: {
        title: 'Manajemen Pasien',
        items: [
          { to: '/service-pos', label: 'Admisi Pasien', icon: UserCheck },
          { to: '/patients', label: 'Data Pasien', icon: Users },
          { to: '/rooms', label: 'Kamar & Bed', icon: Building },
          { to: '/medical-records', label: 'Rekam Medis', icon: FileText }
        ]
      },
      medical: {
        title: 'Pelayanan Medis',
        items: [
          { to: '/service-list', label: 'Layanan Medis', icon: Activity },
          { to: '/departments', label: 'Departemen', icon: Package, roles: ['admin', 'manager'] },
          { to: '/doctors', label: 'Jadwal Dokter', icon: Clock, roles: ['admin', 'manager'] },
          { to: '/lab-results', label: 'Hasil Lab', icon: FileText }
        ]
      },
      billing: {
        title: 'Billing & Inventory',
        items: [
          { to: '/cashier', label: 'Billing Pasien', icon: CreditCard },
          { to: '/inventory', label: 'Medical Supplies', icon: Package, roles: ['admin', 'manager'] },
          { to: '/pharmacy', label: 'Farmasi', icon: Pill, roles: ['admin', 'manager'] }
        ]
      }
    }
  },

  [BUSINESS_TYPES.EDUCATION]: {
    name: 'Lembaga Pendidikan',
    icon: GraduationCap,
    primaryColor: '#7C3AED',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      academic: {
        title: 'Akademik',
        items: [
          { to: '/service-pos', label: 'Pendaftaran', icon: UserCheck },
          { to: '/students', label: 'Data Siswa', icon: Users },
          { to: '/courses', label: 'Mata Pelajaran', icon: BookOpen },
          { to: '/schedules', label: 'Jadwal Pelajaran', icon: Calendar }
        ]
      },
      services: {
        title: 'Layanan Pendidikan',
        items: [
          { to: '/service-list', label: 'Program Kursus', icon: GraduationCap },
          { to: '/services', label: 'Kelola Program', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/teachers', label: 'Data Pengajar', icon: Users, roles: ['admin', 'manager'] }
        ]
      },
      billing: {
        title: 'Keuangan',
        items: [
          { to: '/cashier', label: 'Pembayaran SPP', icon: CreditCard },
          { to: '/fees', label: 'Biaya Pendidikan', icon: DollarSign, roles: ['admin', 'manager'] },
          { to: '/history', label: 'Riwayat Pembayaran', icon: History }
        ]
      }
    }
  },

  [BUSINESS_TYPES.LEGAL]: {
    name: 'Firma Hukum',
    icon: Scale,
    primaryColor: '#1F2937',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      cases: {
        title: 'Manajemen Kasus',
        items: [
          { to: '/service-pos', label: 'Konsultasi Baru', icon: Users },
          { to: '/cases', label: 'Daftar Kasus', icon: FileText },
          { to: '/clients', label: 'Data Klien', icon: Users },
          { to: '/appointments', label: 'Appointment', icon: Calendar }
        ]
      },
      services: {
        title: 'Layanan Hukum',
        items: [
          { to: '/service-list', label: 'Layanan Legal', icon: Scale },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/lawyers', label: 'Data Lawyer', icon: Users, roles: ['admin', 'manager'] }
        ]
      },
      billing: {
        title: 'Billing & Retainer',
        items: [
          { to: '/cashier', label: 'Fee & Retainer', icon: CreditCard },
          { to: '/invoices', label: 'Invoice Klien', icon: Receipt },
          { to: '/history', label: 'Riwayat Billing', icon: History }
        ]
      }
    }
  },

  [BUSINESS_TYPES.CONSULTING]: {
    name: 'Konsultan Bisnis',
    icon: Briefcase,
    primaryColor: '#059669',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      projects: {
        title: 'Manajemen Proyek',
        items: [
          { to: '/projects', label: 'Daftar Proyek', icon: Briefcase },
          { to: '/clients', label: 'Data Klien', icon: Users },
          { to: '/proposals', label: 'Proposal', icon: FileText },
          { to: '/meetings', label: 'Schedule Meeting', icon: Calendar }
        ]
      },
      services: {
        title: 'Layanan Konsultasi',
        items: [
          { to: '/service-list', label: 'Paket Konsultasi', icon: Briefcase },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/consultants', label: 'Data Konsultan', icon: Users, roles: ['admin', 'manager'] }
        ]
      },
      billing: {
        title: 'Revenue & Billing',
        items: [
          { to: '/cashier', label: 'Invoice & Payment', icon: CreditCard },
          { to: '/retainer', label: 'Retainer Fees', icon: DollarSign },
          { to: '/reports', label: 'Revenue Reports', icon: BarChart3 }
        ]
      }
    }
  },

  [BUSINESS_TYPES.ELECTRONICS]: {
    name: 'Toko Elektronik',
    icon: Smartphone,
    primaryColor: '#EA580C',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Penjualan & Service',
        items: [
          { to: '/cashier', label: 'Penjualan Elektronik', icon: ShoppingCart },
          { to: '/service-pos', label: 'Service Center', icon: Wrench },
          { to: '/history', label: 'Riwayat Transaksi', icon: History },
          { to: '/return', label: 'Retur & Klaim Garansi', icon: RotateCcw }
        ]
      },
      inventory: {
        title: 'Manajemen Produk',
        items: [
          { to: '/inventory', label: 'Stok Elektronik', icon: Laptop, roles: ['admin', 'manager'] },
          { to: '/categories', label: 'Kategori Produk', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/serials', label: 'Database Serial Number', icon: Package, roles: ['admin', 'manager'] },
          { to: '/warranties', label: 'Tracking Garansi', icon: Shield, roles: ['admin', 'manager'] }
        ]
      },
      services: {
        title: 'Service Center',
        items: [
          { to: '/service-list', label: 'Paket Service', icon: Wrench },
          { to: '/repairs', label: 'Status Perbaikan', icon: Activity },
          { to: '/technicians', label: 'Teknisi & Spesialis', icon: Users, roles: ['admin', 'manager'] }
        ]
      }
    }
  },

  [BUSINESS_TYPES.AUTOMOTIVE]: {
    name: 'Bengkel Otomotif',
    icon: Car,
    primaryColor: '#DC2626',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Service & Penjualan',
        items: [
          { to: '/cashier', label: 'Penjualan Sparepart', icon: ShoppingCart },
          { to: '/service-pos', label: 'Service Kendaraan', icon: Wrench },
          { to: '/history', label: 'Riwayat Service', icon: History },
          { to: '/return', label: 'Retur Sparepart', icon: RotateCcw }
        ]
      },
      inventory: {
        title: 'Manajemen Sparepart',
        items: [
          { to: '/inventory', label: 'Stok Sparepart', icon: Package, roles: ['admin', 'manager'] },
          { to: '/categories', label: 'Kategori Parts', icon: Tag, roles: ['admin', 'manager'] },
          { to: '/oem-parts', label: 'OEM Parts Database', icon: Database, roles: ['admin', 'manager'] },
          { to: '/compatibility', label: 'Kompatibilitas Kendaraan', icon: Car, roles: ['admin', 'manager'] }
        ]
      },
      services: {
        title: 'Service Center',
        items: [
          { to: '/service-list', label: 'Paket Service', icon: Wrench },
          { to: '/vehicle-queue', label: 'Antrian Kendaraan', icon: Clock },
          { to: '/mechanics', label: 'Data Mekanik', icon: Users, roles: ['admin', 'manager'] }
        ]
      }
    }
  },

  [BUSINESS_TYPES.GENERAL]: {
    name: 'General Business',
    icon: Building,
    primaryColor: '#6B7280',
    sections: {
      main: {
        title: 'Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: Home }
        ]
      },
      transactions: {
        title: 'Transaksi',
        items: [
          { to: '/cashier', label: 'Point of Sale', icon: ShoppingCart },
          { to: '/service-pos', label: 'Layanan Jasa', icon: Wrench },
          { to: '/history', label: 'Riwayat', icon: History },
          { to: '/return', label: 'Retur', icon: RotateCcw },
          { to: '/barbershop-shift', label: 'Manajemen Shift', icon: Clock }
        ]
      },
      services: {
        title: 'Layanan',
        items: [
          { to: '/service-list', label: 'Daftar Layanan', icon: Wrench },
          { to: '/services', label: 'Kelola Layanan', icon: Settings, roles: ['admin', 'manager'] },
          { to: '/service-categories', label: 'Kategori Layanan', icon: Package, roles: ['admin', 'manager'] }
        ]
      }
    }
  }
}

// Sections yang selalu ada untuk semua business types
export const COMMON_SECTIONS = {
  inventory: {
    title: 'Inventory',
    roles: ['admin', 'manager'],
    items: [
      { to: '/inventory', label: 'Daftar Barang', icon: Package },
      { to: '/categories', label: 'Kategori Barang', icon: Tag },
      { to: '/stock-management', label: 'Manajemen Stok', icon: Boxes },
      { to: '/stock-transfers', label: 'Transfer Stok', icon: ArrowRightLeft }
    ]
  },
  suppliers: {
    title: 'Supplier',
    roles: ['admin', 'manager'],
    items: [
      { to: '/suppliers', label: 'Supplier', icon: Truck },
      { to: '/payables', label: 'Hutang (Payables)', icon: CreditCard }
    ]
  },
  reports: {
    title: 'Laporan',
    items: [
      { to: '/reports', label: 'Penjualan', icon: BarChart3 },
      { to: '/reports/inventory', label: 'Inventory', icon: PieChart, roles: ['admin', 'manager'] },
      { to: '/reports/cashflow', label: 'Arus Kas', icon: TrendingUp, roles: ['admin'] },
      { to: '/reports/profit-loss', label: 'Laba Rugi', icon: DollarSign, roles: ['admin'] },
      { to: '/reports/tax', label: 'Pajak', icon: Receipt, roles: ['admin'] }
    ]
  },
  settings: {
    title: 'Pengaturan',
    roles: ['admin', 'manager'],
    items: [
      { to: '/users', label: 'Manajemen User', icon: Users, roles: ['admin', 'manager'] },
      { to: '/settings/store', label: 'Pengaturan Toko', icon: Store, roles: ['admin'] },
      { to: '/settings/business-type', label: 'Jenis Bisnis', icon: Building, roles: ['admin'] },
      { to: '/settings/pricing', label: 'Manajemen Harga', icon: Tag, roles: ['admin'] },
      { to: '/settings/backup', label: 'Backup & Restore', icon: Database, roles: ['admin'] },
      { to: '/settings/logs', label: 'Log Sistem', icon: FileText, roles: ['admin'] },
      { to: '/settings/printer', label: 'Uji Printer', icon: Printer, roles: ['admin'] }
    ]
  }
}

// Fungsi untuk mendapatkan navigation berdasarkan business type
export function getBusinessNavigation(businessType = BUSINESS_TYPES.GENERAL) {
  const businessConfig = BUSINESS_NAVIGATION[businessType] || BUSINESS_NAVIGATION[BUSINESS_TYPES.GENERAL]

  // Untuk barbershop, tidak menambahkan common sections yang sudah ada di business-specific
  const commonSectionsToAdd = { ...COMMON_SECTIONS }
  if (businessType === BUSINESS_TYPES.BARBERSHOP) {
    delete commonSectionsToAdd.inventory // Hapus section inventory untuk barbershop
    delete commonSectionsToAdd.reports   // Hapus section reports untuk barbershop (sudah ada di business config)
    delete commonSectionsToAdd.suppliers // Hapus section suppliers untuk barbershop (tidak relevan)
  }

  return {
    ...businessConfig,
    sections: {
      ...businessConfig.sections,
      ...commonSectionsToAdd
    }
  }
}

// Fungsi untuk filter navigation berdasarkan user roles
export function filterNavigationByRoles(navigation, userRoles) {
  const hasRole = (roles) => {
    if (!roles || roles.length === 0) return true
    if (Array.isArray(userRoles) && userRoles.includes('super_admin')) return true
    return Array.isArray(userRoles) && roles.some(role => userRoles.includes(role))
  }

  const filteredSections = {}

  Object.entries(navigation.sections).forEach(([sectionKey, section]) => {
    // Check if user has access to this section
    if (section.roles && !hasRole(section.roles)) {
      return
    }

    // Filter items based on roles
    const filteredItems = section.items.filter(item => {
      return !item.roles || hasRole(item.roles)
    })

    if (filteredItems.length > 0) {
      filteredSections[sectionKey] = {
        ...section,
        items: filteredItems
      }
    }
  })

  return {
    ...navigation,
    sections: filteredSections
  }
}
