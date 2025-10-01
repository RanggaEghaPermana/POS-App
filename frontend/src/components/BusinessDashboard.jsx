import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { getBusinessNavigation, BUSINESS_TYPES } from '../utils/businessNavigation'
import {
  ShoppingCart, Scissors, Utensils, Coffee, Shirt, Car, Plus,
  BarChart3, Package, Calendar, Clock, Users, TrendingUp,
  AlertTriangle, FileText, Eye, Play, Loader2, Pill, Stethoscope,
  Hospital, Activity, GraduationCap, Scale, Briefcase, Smartphone,
  Printer, Camera, Download, Upload
} from 'lucide-react'

export default function BusinessDashboard({ businessType }) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [businessConfig, setBusinessConfig] = useState(null)

  useEffect(() => {
    const navigation = getBusinessNavigation(businessType || BUSINESS_TYPES.GENERAL)
    setBusinessConfig(navigation)
    setIsLoading(false)
  }, [businessType])

  if (isLoading || !businessConfig) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const quickActions = getQuickActions(businessType)
  const IconComponent = businessConfig.icon

  return (
    <div className="space-y-6">
      {/* Business Type Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-lg bg-primary/10"
            style={{ backgroundColor: `${businessConfig.primaryColor}20` }}
          >
            <IconComponent
              className="h-8 w-8"
              style={{ color: businessConfig.primaryColor }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{businessConfig.name}</h1>
            <p className="text-muted-foreground">{getBusinessDescription(businessType)}</p>
          </div>
        </div>
        <Badge variant="outline" style={{ borderColor: businessConfig.primaryColor, color: businessConfig.primaryColor }}>
          {businessType?.toUpperCase() || 'GENERAL'}
        </Badge>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aksi Cepat
          </CardTitle>
          <CardDescription>
            {getQuickActionsDescription(businessType)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const ActionIcon = action.icon
              return (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="h-20 flex-col gap-2 hover:bg-primary/5"
                >
                  <Link to={action.to}>
                    <ActionIcon className="h-6 w-6" style={{ color: businessConfig.primaryColor }} />
                    <span className="text-sm font-medium text-center">{action.label}</span>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Business-specific modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getBusinessModules(businessType, businessConfig).map((module, index) => {
          const ModuleIcon = module.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ModuleIcon className="h-5 w-5" style={{ color: businessConfig.primaryColor }} />
                  {module.title}
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: businessConfig.primaryColor }}
                      />
                      {feature}
                    </div>
                  ))}
                  <Button asChild variant="outline" size="sm" className="w-full mt-4">
                    <Link to={module.link}>
                      <Eye className="h-3 w-3 mr-2" />
                      {module.buttonText}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function getQuickActions(businessType) {
  const actions = {
    [BUSINESS_TYPES.PHOTOCOPY]: [
      { icon: Printer, label: 'Print & Copy', to: '/service-pos' },
      { icon: Camera, label: 'Design Order', to: '/design-orders' },
      { icon: ShoppingCart, label: 'Kasir ATK', to: '/cashier' },
      { icon: Clock, label: 'Antrian Print', to: '/print-queue' }
    ],
    [BUSINESS_TYPES.BARBERSHOP]: [
      { icon: Scissors, label: 'Layanan Cukur', to: '/service-pos' },
      { icon: Calendar, label: 'Booking', to: '/appointments' },
      { icon: ShoppingCart, label: 'Penjualan', to: '/cashier' },
    ],
    [BUSINESS_TYPES.RESTAURANT]: [
      { icon: Coffee, label: 'Point of Sale', to: '/cashier' },
      { icon: Utensils, label: 'Dine In', to: '/service-pos' },
      { icon: Package, label: 'Menu Items', to: '/inventory' },
      { icon: BarChart3, label: 'Laporan', to: '/reports' }
    ],
    [BUSINESS_TYPES.RETAIL]: [
      { icon: ShoppingCart, label: 'Point of Sale', to: '/cashier' },
      { icon: Package, label: 'Products', to: '/inventory' },
      { icon: TrendingUp, label: 'Sales Reports', to: '/reports' },
      { icon: AlertTriangle, label: 'Low Stock', to: '/stock-opname' }
    ],
    [BUSINESS_TYPES.LAUNDRY]: [
      { icon: Shirt, label: 'Terima Cucian', to: '/service-pos' },
      { icon: Clock, label: 'Express Service', to: '/express-service' },
      { icon: Truck, label: 'Pickup & Delivery', to: '/pickup-delivery' },
      { icon: Users, label: 'Customer Tracking', to: '/customers' }
    ],
    [BUSINESS_TYPES.PHARMACY]: [
      { icon: Pill, label: 'Penjualan Obat', to: '/cashier' },
      { icon: Stethoscope, label: 'Konsultasi', to: '/service-pos' },
      { icon: Package, label: 'Stok Obat', to: '/inventory' },
      { icon: FileText, label: 'Resep Dokter', to: '/prescriptions' }
    ],
    [BUSINESS_TYPES.CLINIC]: [
      { icon: Stethoscope, label: 'Registrasi Pasien', to: '/service-pos' },
      { icon: Calendar, label: 'Appointment', to: '/appointments' },
      { icon: Users, label: 'Data Pasien', to: '/patients' },
      { icon: Activity, label: 'Billing', to: '/cashier' }
    ],
    [BUSINESS_TYPES.HOSPITAL]: [
      { icon: Hospital, label: 'Admisi Pasien', to: '/service-pos' },
      { icon: Users, label: 'Data Pasien', to: '/patients' },
      { icon: Package, label: 'Medical Supplies', to: '/inventory' },
      { icon: Activity, label: 'Billing', to: '/cashier' }
    ],
    [BUSINESS_TYPES.EDUCATION]: [
      { icon: GraduationCap, label: 'Pendaftaran', to: '/service-pos' },
      { icon: Users, label: 'Data Siswa', to: '/students' },
      { icon: Calendar, label: 'Jadwal', to: '/schedules' },
      { icon: ShoppingCart, label: 'Pembayaran SPP', to: '/cashier' }
    ],
    [BUSINESS_TYPES.LEGAL]: [
      { icon: Scale, label: 'Konsultasi', to: '/service-pos' },
      { icon: FileText, label: 'Kasus', to: '/cases' },
      { icon: Users, label: 'Klien', to: '/clients' },
      { icon: ShoppingCart, label: 'Billing', to: '/cashier' }
    ],
    [BUSINESS_TYPES.CONSULTING]: [
      { icon: Briefcase, label: 'Proyek Baru', to: '/projects' },
      { icon: Users, label: 'Klien', to: '/clients' },
      { icon: FileText, label: 'Proposal', to: '/proposals' },
      { icon: ShoppingCart, label: 'Billing', to: '/cashier' }
    ],
    [BUSINESS_TYPES.ELECTRONICS]: [
      { icon: Smartphone, label: 'Penjualan Elektronik', to: '/cashier' },
      { icon: Activity, label: 'Service Center', to: '/service-pos' },
      { icon: Package, label: 'Stok Elektronik', to: '/inventory' },
      { icon: AlertTriangle, label: 'Tracking Garansi', to: '/warranties' }
    ],
    [BUSINESS_TYPES.AUTOMOTIVE]: [
      { icon: Car, label: 'Service Kendaraan', to: '/service-pos' },
      { icon: Package, label: 'Penjualan Sparepart', to: '/cashier' },
      { icon: Activity, label: 'Antrian Service', to: '/vehicle-queue' },
      { icon: Users, label: 'Data Mekanik', to: '/mechanics' }
    ]
  }

  return actions[businessType] || actions[BUSINESS_TYPES.GENERAL] || [
    { icon: ShoppingCart, label: 'Point of Sale', to: '/cashier' },
    { icon: FileText, label: 'Services', to: '/service-pos' },
    { icon: Package, label: 'Inventory', to: '/inventory' },
    { icon: BarChart3, label: 'Reports', to: '/reports' }
  ]
}

function getBusinessModules(businessType, businessConfig) {
  const modules = {
    [BUSINESS_TYPES.PHOTOCOPY]: [
      {
        icon: Printer,
        title: 'Layanan Print & Copy',
        description: 'Semua layanan printing dan fotocopy',
        features: ['Print HQ/Draft/Color', 'Fotocopy semua ukuran', 'Print photo 2R-8R', 'Scan to PDF/JPG'],
        link: '/service-list',
        buttonText: 'Kelola Layanan Print'
      },
      {
        icon: Camera,
        title: 'Design & Large Format',
        description: 'Layanan design dan percetakan besar',
        features: ['Design banner/kartu nama', 'Large format printing', 'X-Banner & Roll-up', 'Sticker vinyl'],
        link: '/design-orders',
        buttonText: 'Order Design'
      },
      {
        icon: FileText,
        title: 'Finishing & Binding',
        description: 'Jasa finishing dan binding lengkap',
        features: ['Jilid spiral/hard cover', 'Laminating glossy/doff', 'Cutting custom', 'Folding brosur'],
        link: '/service-list',
        buttonText: 'Finishing Services'
      },
      {
        icon: Upload,
        title: 'Digital Services',
        description: 'Layanan digital dan online',
        features: ['Upload & print online', 'Convert PDF/Word', 'Print via WhatsApp', 'Cloud printing'],
        link: '/service-list',
        buttonText: 'Digital Services'
      },
      {
        icon: Clock,
        title: 'Express & Delivery',
        description: 'Layanan express dan antar jemput',
        features: ['Express 15-60 menit', 'Pickup service', 'Delivery dalam kota', 'Order tracking'],
        link: '/service-list',
        buttonText: 'Express Service'
      },
      {
        icon: Package,
        title: 'Inventory & Supplies',
        description: 'Manajemen stok dan ATK',
        features: ['Stok kertas & tinta', 'ATK & supplies', 'Auto reorder alerts', 'Supplier tracking'],
        link: '/inventory',
        buttonText: 'Kelola Stok'
      }
    ],
    [BUSINESS_TYPES.BARBERSHOP]: [
      {
        icon: Scissors,
        title: 'Layanan Cukur',
        description: 'Paket dan layanan barbershop',
        features: ['Haircut packages', 'Beard styling', 'Hair wash', 'Premium services'],
        link: '/service-list',
        buttonText: 'Kelola Layanan Cukur'
      },
      {
        icon: Calendar,
        title: 'Appointment System',
        description: 'Sistem booking dan jadwal',
        features: ['Online booking', 'Schedule management', 'Customer reminders', 'Waitlist'],
        link: '/appointments',
        buttonText: 'Kelola Booking'
      },
      {
        icon: Users,
        title: 'Staff Management',
        description: 'Manajemen barber dan staf',
        features: ['Barber schedules', 'Commission tracking', 'Performance stats', 'Skill levels'],
        link: '/barbers',
        buttonText: 'Kelola Staf'
      }
    ],
    [BUSINESS_TYPES.RESTAURANT]: [
      {
        icon: Utensils,
        title: 'Menu Management',
        description: 'Kelola menu dan kategori makanan',
        features: ['Menu categories', 'Seasonal items', 'Combo packages', 'Nutrition info'],
        link: '/inventory',
        buttonText: 'Kelola Menu'
      },
      {
        icon: Coffee,
        title: 'Order Management',
        description: 'Sistem pemesanan dan delivery',
        features: ['Dine-in orders', 'Takeaway', 'Delivery tracking', 'Kitchen display'],
        link: '/service-pos',
        buttonText: 'Order System'
      },
      {
        icon: Package,
        title: 'Inventory Control',
        description: 'Kontrol bahan makanan dan supplies',
        features: ['Ingredient tracking', 'Expiry monitoring', 'Supplier management', 'Cost control'],
        link: '/inventory',
        buttonText: 'Lihat Inventory'
      }
    ],
    [BUSINESS_TYPES.LAUNDRY]: [
      {
        icon: Shirt,
        title: 'Laundry Services',
        description: 'Paket layanan cuci dan setrika',
        features: ['Wash & fold', 'Dry cleaning', 'Express service', 'Special care'],
        link: '/service-list',
        buttonText: 'Kelola Paket Laundry'
      },
      {
        icon: Clock,
        title: 'Order Tracking',
        description: 'Tracking status cucian customer',
        features: ['Order status', 'Delivery tracking', 'Customer notifications', 'Pickup reminders'],
        link: '/history',
        buttonText: 'Track Orders'
      },
      {
        icon: Users,
        title: 'Customer Management',
        description: 'Database dan loyalty program',
        features: ['Customer profiles', 'Loyalty points', 'Membership tiers', 'Communication'],
        link: '/customers',
        buttonText: 'Kelola Customer'
      }
    ],
    [BUSINESS_TYPES.PHARMACY]: [
      {
        icon: Pill,
        title: 'Stok & Obat',
        description: 'Manajemen obat dan farmasi',
        features: ['Stok obat', 'Alert kadaluarsa', 'Kategori obat', 'Supplier farmasi'],
        link: '/inventory',
        buttonText: 'Kelola Stok'
      },
      {
        icon: Stethoscope,
        title: 'Layanan Konsultasi',
        description: 'Konsultasi farmasi dan kesehatan',
        features: ['Konsultasi obat', 'Check drug interaction', 'Health screening', 'Vaccination'],
        link: '/service-list',
        buttonText: 'Layanan Farmasi'
      },
      {
        icon: FileText,
        title: 'Resep & Billing',
        description: 'Manajemen resep dokter',
        features: ['Resep digital', 'Insurance claims', 'Patient billing', 'Prescription history'],
        link: '/prescriptions',
        buttonText: 'Kelola Resep'
      }
    ],
    [BUSINESS_TYPES.CLINIC]: [
      {
        icon: Users,
        title: 'Manajemen Pasien',
        description: 'Database dan registrasi pasien',
        features: ['Patient registration', 'Medical history', 'Insurance data', 'Emergency contacts'],
        link: '/patients',
        buttonText: 'Kelola Pasien'
      },
      {
        icon: Calendar,
        title: 'Appointment System',
        description: 'Jadwal dan booking dokter',
        features: ['Online booking', 'Doctor schedules', 'Queue management', 'Reminder system'],
        link: '/appointments',
        buttonText: 'Kelola Appointment'
      },
      {
        icon: Activity,
        title: 'Medical Services',
        description: 'Layanan medis dan billing',
        features: ['Medical procedures', 'Lab tests', 'Patient billing', 'Insurance claims'],
        link: '/service-list',
        buttonText: 'Layanan Medis'
      }
    ],
    [BUSINESS_TYPES.HOSPITAL]: [
      {
        icon: Hospital,
        title: 'Patient Management',
        description: 'Sistem manajemen pasien RS',
        features: ['Patient admission', 'Room management', 'Discharge planning', 'Emergency care'],
        link: '/patients',
        buttonText: 'Kelola Pasien'
      },
      {
        icon: Package,
        title: 'Medical Departments',
        description: 'Departemen dan layanan medis',
        features: ['Department management', 'Doctor schedules', 'Specialist services', 'Surgery planning'],
        link: '/departments',
        buttonText: 'Kelola Departemen'
      },
      {
        icon: Activity,
        title: 'Hospital Operations',
        description: 'Operasional dan billing RS',
        features: ['Patient billing', 'Insurance claims', 'Medical supplies', 'Lab integration'],
        link: '/cashier',
        buttonText: 'Hospital Billing'
      }
    ],
    [BUSINESS_TYPES.EDUCATION]: [
      {
        icon: Users,
        title: 'Student Management',
        description: 'Database dan administrasi siswa',
        features: ['Student registration', 'Academic records', 'Attendance tracking', 'Parent communication'],
        link: '/students',
        buttonText: 'Kelola Siswa'
      },
      {
        icon: GraduationCap,
        title: 'Academic Programs',
        description: 'Program dan kurikulum pendidikan',
        features: ['Course management', 'Class schedules', 'Grade tracking', 'Certificate issuance'],
        link: '/courses',
        buttonText: 'Kelola Program'
      },
      {
        icon: ShoppingCart,
        title: 'Fee Management',
        description: 'Manajemen biaya pendidikan',
        features: ['Tuition billing', 'Payment tracking', 'Scholarship management', 'Financial reports'],
        link: '/fees',
        buttonText: 'Kelola Biaya'
      }
    ],
    [BUSINESS_TYPES.LEGAL]: [
      {
        icon: FileText,
        title: 'Case Management',
        description: 'Manajemen kasus hukum',
        features: ['Case tracking', 'Document management', 'Court schedules', 'Legal research'],
        link: '/cases',
        buttonText: 'Kelola Kasus'
      },
      {
        icon: Users,
        title: 'Client Relations',
        description: 'Manajemen klien dan komunikasi',
        features: ['Client database', 'Communication logs', 'Meeting schedules', 'Document sharing'],
        link: '/clients',
        buttonText: 'Kelola Klien'
      },
      {
        icon: Scale,
        title: 'Legal Billing',
        description: 'Billing dan fee management',
        features: ['Time tracking', 'Retainer management', 'Invoice generation', 'Payment tracking'],
        link: '/cashier',
        buttonText: 'Legal Billing'
      }
    ],
    [BUSINESS_TYPES.CONSULTING]: [
      {
        icon: Briefcase,
        title: 'Project Management',
        description: 'Manajemen proyek konsultasi',
        features: ['Project tracking', 'Milestone management', 'Team collaboration', 'Deliverable tracking'],
        link: '/projects',
        buttonText: 'Kelola Proyek'
      },
      {
        icon: Users,
        title: 'Client & Proposals',
        description: 'Klien dan proposal bisnis',
        features: ['Client CRM', 'Proposal templates', 'Contract management', 'Follow-up tracking'],
        link: '/proposals',
        buttonText: 'Kelola Proposal'
      },
      {
        icon: BarChart3,
        title: 'Revenue Analytics',
        description: 'Analytics dan revenue tracking',
        features: ['Revenue reports', 'Project profitability', 'Consultant performance', 'Business insights'],
        link: '/reports',
        buttonText: 'View Analytics'
      }
    ],
    [BUSINESS_TYPES.ELECTRONICS]: [
      {
        icon: Smartphone,
        title: 'Katalog Elektronik',
        description: 'Manajemen produk dan gadget elektronik',
        features: ['Inventory elektronik', 'Tracking serial number', 'Manajemen garansi', 'Perbandingan harga'],
        link: '/inventory',
        buttonText: 'Kelola Produk'
      },
      {
        icon: Activity,
        title: 'Service Center',
        description: 'Pusat service dan perbaikan elektronik',
        features: ['Tracking perbaikan', 'Jadwal teknisi', 'Inventory spare parts', 'Estimasi biaya service'],
        link: '/repairs',
        buttonText: 'Service Center'
      },
      {
        icon: AlertTriangle,
        title: 'Tracking Garansi',
        description: 'Manajemen garansi dan after-sales',
        features: ['Database garansi', 'Proses klaim', 'Manajemen retur', 'Customer support'],
        link: '/warranties',
        buttonText: 'Kelola Garansi'
      }
    ],
    [BUSINESS_TYPES.AUTOMOTIVE]: [
      {
        icon: Car,
        title: 'Service Kendaraan',
        description: 'Layanan service dan maintenance kendaraan',
        features: ['Service rutin & berat', 'Diagnosis mesin', 'Tune up berkala', 'Emergency repair'],
        link: '/service-list',
        buttonText: 'Kelola Service'
      },
      {
        icon: Package,
        title: 'Sparepart & Inventory',
        description: 'Manajemen sparepart dan aksesori',
        features: ['Stok sparepart original', 'Kompatibilitas kendaraan', 'Tracking OEM parts', 'Supplier management'],
        link: '/inventory',
        buttonText: 'Kelola Sparepart'
      },
      {
        icon: Activity,
        title: 'Workshop Management',
        description: 'Manajemen bengkel dan antrian',
        features: ['Antrian kendaraan', 'Jadwal mekanik', 'Estimasi waktu', 'Progress tracking'],
        link: '/vehicle-queue',
        buttonText: 'Kelola Workshop'
      }
    ]
  }

  return modules[businessType] || [
    {
      icon: ShoppingCart,
      title: 'Sales Management',
      description: 'Manajemen penjualan dan transaksi',
      features: ['Point of sale', 'Transaction history', 'Payment methods', 'Receipt printing'],
      link: '/cashier',
      buttonText: 'Buka Kasir'
    },
    {
      icon: Package,
      title: 'Inventory Control',
      description: 'Kontrol stok dan manajemen produk',
      features: ['Product catalog', 'Stock tracking', 'Low stock alerts', 'Supplier management'],
      link: '/inventory',
      buttonText: 'Kelola Inventory'
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Laporan dan analisis bisnis',
      features: ['Sales reports', 'Profit analysis', 'Customer insights', 'Performance metrics'],
      link: '/reports',
      buttonText: 'Lihat Laporan'
    }
  ]
}

function getBusinessDescription(businessType) {
  const descriptions = {
    [BUSINESS_TYPES.PHOTOCOPY]: 'Sistem manajemen lengkap untuk usaha foto copy, printing, dan percetakan',
    [BUSINESS_TYPES.BARBERSHOP]: 'Platform digital untuk manajemen barbershop dan salon cukur modern',
    [BUSINESS_TYPES.RESTAURANT]: 'Solusi lengkap manajemen restoran, cafe, dan usaha kuliner',
    [BUSINESS_TYPES.RETAIL]: 'Sistem point of sale dan inventory untuk toko retail',
    [BUSINESS_TYPES.LAUNDRY]: 'Platform manajemen lengkap untuk usaha laundry dan dry cleaning',
    [BUSINESS_TYPES.AUTOMOTIVE]: 'Sistem manajemen bengkel otomotif dan sparepart kendaraan',
    [BUSINESS_TYPES.PHARMACY]: 'Solusi digital untuk apotek dan farmasi dengan manajemen obat',
    [BUSINESS_TYPES.CLINIC]: 'Sistem informasi klinik dengan manajemen pasien dan layanan medis',
    [BUSINESS_TYPES.HOSPITAL]: 'Platform manajemen rumah sakit dengan sistem terintegrasi',
    [BUSINESS_TYPES.EDUCATION]: 'Sistem manajemen lembaga pendidikan dan kursus',
    [BUSINESS_TYPES.LEGAL]: 'Platform manajemen firma hukum dan layanan legal',
    [BUSINESS_TYPES.CONSULTING]: 'Sistem manajemen konsultan bisnis dan proyek klien',
    [BUSINESS_TYPES.ELECTRONICS]: 'Solusi lengkap toko elektronik dan service center',
    [BUSINESS_TYPES.GENERAL]: 'Sistem bisnis fleksibel untuk berbagai jenis usaha'
  }

  return descriptions[businessType] || 'Dashboard manajemen bisnis digital'
}

function getQuickActionsDescription(businessType) {
  const descriptions = {
    [BUSINESS_TYPES.PHOTOCOPY]: 'Akses cepat layanan printing, fotocopy, dan design grafis',
    [BUSINESS_TYPES.BARBERSHOP]: 'Mulai layanan cukur, booking appointment, dan kelola staf',
    [BUSINESS_TYPES.RESTAURANT]: 'Akses cepat kasir, menu management, dan operasional restoran',
    [BUSINESS_TYPES.RETAIL]: 'Point of sale, inventory management, dan laporan penjualan',
    [BUSINESS_TYPES.LAUNDRY]: 'Terima cucian, tracking order, dan layanan express',
    [BUSINESS_TYPES.AUTOMOTIVE]: 'Service kendaraan, kelola sparepart, dan antrian bengkel',
    [BUSINESS_TYPES.PHARMACY]: 'Penjualan obat, konsultasi farmasi, dan manajemen resep',
    [BUSINESS_TYPES.CLINIC]: 'Registrasi pasien, appointment, dan billing medis',
    [BUSINESS_TYPES.HOSPITAL]: 'Admisi pasien, manajemen kamar, dan billing rumah sakit',
    [BUSINESS_TYPES.EDUCATION]: 'Pendaftaran siswa, pembayaran SPP, dan jadwal pelajaran',
    [BUSINESS_TYPES.LEGAL]: 'Konsultasi hukum, manajemen kasus, dan billing legal',
    [BUSINESS_TYPES.CONSULTING]: 'Kelola proyek, proposal klien, dan billing konsultasi',
    [BUSINESS_TYPES.ELECTRONICS]: 'Penjualan elektronik, service center, dan tracking garansi',
    [BUSINESS_TYPES.GENERAL]: 'Akses fitur utama sistem manajemen bisnis'
  }

  return descriptions[businessType] || 'Akses fitur utama bisnis dengan cepat'
}