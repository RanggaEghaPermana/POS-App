import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatTimeOnly } from '../utils/formatters'
import { useAuth } from '../AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { LoadingSpinner } from '../components/ui/loading'
import {
  ShoppingCart, ShoppingBag, Search, Minus, Plus, Trash2, User, LogOut,
  Package, CreditCard, Calculator, History, RotateCcw,
  BarChart3, Home, Store, Clock, Play, Square,
  Wrench, FileText, Scissors, Printer, Utensils, Calendar,
  Droplet, Car, Pill, Stethoscope, AlertCircle, CheckCircle
} from 'lucide-react'

const DEFAULT_QUICK_LINKS = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/return', label: 'Retur', icon: RotateCcw },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/service-pos', label: 'Service POS', icon: Wrench },
  { to: '/services', label: 'Kelola Layanan', icon: Wrench },
  { to: '/reports', label: 'Laporan', icon: BarChart3 }
]

const DEFAULT_CASHIER_CONFIG = {
  header: {
    title: 'Kasir POS',
    subtitle: 'Sistem Point of Sale',
    icon: ShoppingCart,
    gradient: 'from-emerald-600 via-green-600 to-teal-600',
    subtitleClass: 'text-emerald-100'
  },
  tabs: {
    default: 'products',
    products: {
      enabled: true,
      label: 'Produk',
      listTitle: 'Daftar Produk',
      description: 'Cari dan pilih produk untuk ditambahkan ke keranjang',
      searchPlaceholder: 'Cari nama / SKU produk',
      icon: Package,
      emptyState: 'Cari produk untuk menampilkan hasil',
      categoryLabel: 'Kategori Produk'
    },
    services: {
      enabled: true,
      label: 'Layanan',
      listTitle: 'Daftar Layanan',
      description: 'Cari dan pilih layanan untuk ditambahkan ke pesanan',
      searchPlaceholder: 'Cari nama layanan',
      icon: Wrench,
      emptyState: 'Cari layanan untuk ditambahkan ke pesanan',
      categoryLabel: 'Kategori Layanan',
      notePlaceholder: 'Catatan khusus untuk layanan ini...',
      durationLabel: 'Estimasi total layanan'
    }
  },
  labels: {
    branch: 'Cabang',
    cartTitle: 'Keranjang',
    cartIcon: ShoppingCart,
    cartEmptyPrimary: 'Keranjang masih kosong',
    cartEmptySecondary: 'Tambahkan produk dari panel kiri',
    productBadge: 'Produk',
    serviceBadge: 'Layanan',
    subtotal: 'Subtotal:',
    total: 'TOTAL:',
    discount: 'Diskon (Mata Uang Aktif)',
    tax: 'Pajak',
    paymentTitle: 'Pembayaran',
    paymentMethods: 'Metode Pembayaran',
    checkoutButton: 'Checkout',
    serviceDuration: 'Estimasi waktu layanan:'
  },
  quickLinks: DEFAULT_QUICK_LINKS,
  quickNav: {
    background: 'from-emerald-50 to-green-50',
    hoverClass: 'hover:bg-emerald-100'
  },
  texts: {
    emptyCartAlert: 'Keranjang kosong'
  }
}
const CASHIER_BUSINESS_OVERRIDES = {
  photocopy: {
    header: {
      title: 'Kasir Fotocopy',
      subtitle: 'Kelola layanan percetakan dan penjualan alat tulis',
      icon: Printer,
      gradient: 'from-sky-600 via-blue-600 to-indigo-600',
      subtitleClass: 'text-sky-100'
    },
    tabs: {
      products: {
        label: 'Produk Percetakan',
        listTitle: 'Produk Percetakan',
        searchPlaceholder: 'Cari kertas, tinta, atau alat tulis',
        categoryLabel: 'Kategori Produk Percetakan'
      },
      services: {
        label: 'Layanan Cetak',
        listTitle: 'Layanan Percetakan',
        searchPlaceholder: 'Cari layanan fotocopy / printing',
        categoryLabel: 'Kategori Layanan Percetakan',
        emptyState: 'Cari layanan percetakan untuk ditambahkan ke pesanan',
        notePlaceholder: 'Catatan ukuran, warna, atau finishing khusus'
      }
    },
    labels: {
      branch: 'Loket / Cabang',
      cartEmptySecondary: 'Tambahkan produk atau layanan dari panel kiri'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Barang', icon: ShoppingCart },
      { to: '/service-pos', label: 'Kasir Layanan', icon: Printer },
      { to: '/history', label: 'Riwayat', icon: History },
      { to: '/service-list', label: 'Daftar Layanan', icon: Wrench },
      { to: '/reports', label: 'Laporan', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-sky-50 to-indigo-50',
      hoverClass: 'hover:bg-sky-100'
    }
  },
  barbershop: {
    header: {
      title: 'Kasir Barbershop',
      subtitle: 'Kelola treatment dan produk grooming',
      icon: Scissors,
      gradient: 'from-purple-600 via-fuchsia-600 to-pink-500',
      subtitleClass: 'text-purple-100'
    },
    tabs: {
      default: 'services',
      products: {
        label: 'Produk Grooming',
        listTitle: 'Produk Grooming',
        searchPlaceholder: 'Cari pomade, shampoo, atau aksesoris',
        categoryLabel: 'Kategori Produk Grooming'
      },
      services: {
        label: 'Treatment',
        listTitle: 'Treatment Barbershop',
        searchPlaceholder: 'Cari treatment cukur & grooming',
        categoryLabel: 'Kategori Treatment',
        notePlaceholder: 'Catatan gaya rambut, preferensi pelanggan, atau barber pilihan',
        emptyState: 'Cari treatment untuk ditambahkan ke keranjang',
        durationLabel: 'Estimasi durasi treatment'
      }
    },
    labels: {
      branch: 'Cabang / Kursi',
      cartEmptySecondary: 'Tambahkan treatment atau produk dari panel kiri',
      checkoutButton: 'Selesaikan Treatment',
      serviceDuration: 'Estimasi durasi treatment:'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/appointments', label: 'Booking', icon: Calendar },
      { to: '/history', label: 'Riwayat', icon: History },
      { to: '/service-list', label: 'Treatment', icon: Wrench },
      { to: '/barbers', label: 'Kelola Barber', icon: User }
    ],
    quickNav: {
      background: 'from-purple-50 to-pink-50',
      hoverClass: 'hover:bg-purple-100'
    },
    texts: {
      emptyCartAlert: 'Belum ada treatment atau produk di keranjang'
    }
  },
  restaurant: {
    header: {
      title: 'Kasir Restoran',
      subtitle: 'Kelola pesanan dine-in & take-away',
      icon: Utensils,
      gradient: 'from-orange-500 via-amber-500 to-rose-500',
      subtitleClass: 'text-amber-100'
    },
    tabs: {
      products: {
        label: 'Menu Utama',
        listTitle: 'Menu Restoran',
        searchPlaceholder: 'Cari menu atau kode pesanan',
        categoryLabel: 'Kategori Menu'
      },
      services: {
        label: 'Paket & Add-on',
        listTitle: 'Paket & Tambahan',
        searchPlaceholder: 'Cari paket catering atau add-on',
        categoryLabel: 'Kategori Paket',
        notePlaceholder: 'Catatan permintaan pelanggan (level pedas, alergi, dll)',
        emptyState: 'Cari paket atau add-on untuk ditambahkan ke pesanan'
      }
    },
    labels: {
      branch: 'Outlet',
      cartEmptySecondary: 'Tambahkan menu dari panel kiri',
      discount: 'Diskon / Voucher',
      checkoutButton: 'Selesaikan Pesanan'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Dine-in', icon: Utensils },
      { to: '/service-pos', label: 'Kasir Layanan', icon: Wrench },
      { to: '/history', label: 'Riwayat Order', icon: History },
      { to: '/reports', label: 'Laporan Penjualan', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-orange-50 to-amber-50',
      hoverClass: 'hover:bg-amber-100'
    }
  },
  retail: {
    header: {
      title: 'Kasir Retail',
      subtitle: 'Kelola penjualan toko retail',
      icon: Store,
      gradient: 'from-emerald-600 via-green-600 to-lime-600',
      subtitleClass: 'text-lime-100'
    },
    tabs: {
      products: {
        label: 'Produk Retail',
        listTitle: 'Produk Retail',
        searchPlaceholder: 'Cari barang atau SKU',
        categoryLabel: 'Kategori Produk Retail'
      },
      services: {
        label: 'Layanan Tambahan',
        description: 'Tambahkan layanan pendukung seperti pemasangan atau garansi',
        listTitle: 'Layanan Pendukung',
        emptyState: 'Layanan pendukung belum tersedia'
      }
    },
    labels: {
      cartEmptySecondary: 'Tambahkan barang dari panel kiri',
      checkoutButton: 'Proses Pembayaran'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/inventory', label: 'Inventory', icon: Package },
      { to: '/cashier', label: 'Kasir Retail', icon: ShoppingCart },
      { to: '/return', label: 'Retur', icon: RotateCcw },
      { to: '/reports', label: 'Laporan Penjualan', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-green-50 to-lime-50',
      hoverClass: 'hover:bg-green-100'
    }
  },
  laundry: {
    header: {
      title: 'Kasir Laundry',
      subtitle: 'Atur layanan cuci, setrika, dan delivery',
      icon: Droplet,
      gradient: 'from-cyan-600 via-teal-600 to-emerald-600',
      subtitleClass: 'text-cyan-100'
    },
    tabs: {
      products: {
        label: 'Produk Penunjang',
        listTitle: 'Produk Penunjang',
        searchPlaceholder: 'Cari deterjen, pewangi, atau perlengkapan',
        categoryLabel: 'Kategori Produk Penunjang'
      },
      services: {
        label: 'Layanan Laundry',
        listTitle: 'Layanan Laundry',
        searchPlaceholder: 'Cari layanan cuci, setrika, atau paket',
        categoryLabel: 'Kategori Layanan Laundry',
        notePlaceholder: 'Catatan berat, jenis kain, atau layanan antar-jemput'
      }
    },
    labels: {
      branch: 'Cabang / Drop point',
      checkoutButton: 'Selesaikan Transaksi'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Laundry', icon: Droplet },
      { to: '/service-pos', label: 'Kasir Layanan', icon: Wrench },
      { to: '/history', label: 'Riwayat', icon: History },
      { to: '/reports', label: 'Laporan', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-cyan-50 to-teal-50',
      hoverClass: 'hover:bg-cyan-100'
    }
  },
  automotive: {
    header: {
      title: 'Kasir Bengkel',
      subtitle: 'Kelola servis kendaraan dan penjualan sparepart',
      icon: Car,
      gradient: 'from-slate-600 via-gray-700 to-gray-900',
      subtitleClass: 'text-slate-100'
    },
    tabs: {
      products: {
        label: 'Sparepart',
        listTitle: 'Produk Sparepart',
        searchPlaceholder: 'Cari sparepart atau SKU',
        categoryLabel: 'Kategori Sparepart'
      },
      services: {
        label: 'Layanan Servis',
        listTitle: 'Layanan Servis',
        searchPlaceholder: 'Cari layanan bengkel',
        categoryLabel: 'Kategori Layanan Bengkel',
        notePlaceholder: 'Catatan keluhan kendaraan atau teknisi yang ditugaskan'
      }
    },
    labels: {
      branch: 'Bengkel / Cabang',
      checkoutButton: 'Selesaikan Servis'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Sparepart', icon: ShoppingCart },
      { to: '/service-pos', label: 'Kasir Servis', icon: Wrench },
      { to: '/history', label: 'Riwayat Servis', icon: History },
      { to: '/reports', label: 'Laporan Bengkel', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-slate-50 to-gray-100',
      hoverClass: 'hover:bg-slate-100'
    }
  },
  pharmacy: {
    header: {
      title: 'Kasir Apotek',
      subtitle: 'Kelola penjualan obat & layanan konsultasi',
      icon: Pill,
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      subtitleClass: 'text-teal-100'
    },
    tabs: {
      products: {
        label: 'Obat & Produk',
        listTitle: 'Produk Apotek',
        searchPlaceholder: 'Cari obat atau SKU',
        categoryLabel: 'Kategori Produk Apotek'
      },
      services: {
        label: 'Layanan Konsultasi',
        listTitle: 'Layanan Konsultasi',
        searchPlaceholder: 'Cari layanan konsultasi',
        categoryLabel: 'Kategori Layanan Kesehatan',
        notePlaceholder: 'Catatan resep, keluhan pasien, atau dokter pengarah'
      }
    },
    labels: {
      branch: 'Cabang Apotek',
      discount: 'Diskon / Asuransi',
      checkoutButton: 'Selesaikan Penjualan'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Apotek', icon: Pill },
      { to: '/service-pos', label: 'Kasir Layanan', icon: Stethoscope },
      { to: '/history', label: 'Riwayat', icon: History },
      { to: '/reports', label: 'Laporan', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-teal-50 to-cyan-50',
      hoverClass: 'hover:bg-teal-100'
    }
  },
  clinic: {
    header: {
      title: 'Kasir Klinik',
      subtitle: 'Kelola layanan medis & pembayaran pasien',
      icon: Stethoscope,
      gradient: 'from-sky-600 via-blue-600 to-indigo-600',
      subtitleClass: 'text-sky-100'
    },
    tabs: {
      products: {
        label: 'Obat & Supplies',
        listTitle: 'Supplies Klinik',
        searchPlaceholder: 'Cari obat atau kebutuhan medis',
        categoryLabel: 'Kategori Supplies'
      },
      services: {
        label: 'Layanan Medis',
        listTitle: 'Layanan Medis',
        searchPlaceholder: 'Cari layanan konsultasi atau tindakan',
        categoryLabel: 'Kategori Layanan Medis',
        notePlaceholder: 'Catatan diagnosis, dokter penanggung jawab, atau tindakan lanjutan'
      }
    },
    labels: {
      branch: 'Unit / Cabang',
      checkoutButton: 'Selesaikan Pembayaran'
    },
    quickLinks: [
      { to: '/', label: 'Dashboard', icon: Home },
      { to: '/cashier', label: 'Kasir Klinik', icon: Stethoscope },
      { to: '/service-pos', label: 'Kasir Layanan', icon: Wrench },
      { to: '/history', label: 'Riwayat Pasien', icon: History },
      { to: '/reports', label: 'Laporan Klinik', icon: BarChart3 }
    ],
    quickNav: {
      background: 'from-sky-50 to-indigo-50',
      hoverClass: 'hover:bg-sky-100'
    }
  }
}

function buildCashierConfig(type) {
  const slug = (type || 'general').toLowerCase()
  const override = CASHIER_BUSINESS_OVERRIDES[slug] || {}
  const tabs = {
    default: override.tabs?.default || DEFAULT_CASHIER_CONFIG.tabs.default,
    products: { ...DEFAULT_CASHIER_CONFIG.tabs.products, ...(override.tabs?.products || {}) },
    services: { ...DEFAULT_CASHIER_CONFIG.tabs.services, ...(override.tabs?.services || {}) }
  }

  return {
    header: { ...DEFAULT_CASHIER_CONFIG.header, ...(override.header || {}) },
    tabs,
    labels: { ...DEFAULT_CASHIER_CONFIG.labels, ...(override.labels || {}) },
    quickLinks: override.quickLinks || DEFAULT_QUICK_LINKS,
    quickNav: { ...DEFAULT_CASHIER_CONFIG.quickNav, ...(override.quickNav || {}) },
    texts: { ...DEFAULT_CASHIER_CONFIG.texts, ...(override.texts || {}) }
  }
}

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }
export default function Cashier(){
  const { token, user, logout, activeTenant } = useAuth()
  const businessType = (activeTenant?.business_type || 'general').toLowerCase()
  const cashierConfig = useMemo(() => buildCashierConfig(businessType), [businessType])
  const { header, tabs, labels, quickLinks, quickNav, texts } = cashierConfig
  const productTab = tabs.products
  const serviceTab = tabs.services
  const availableTabs = useMemo(() => {
    const list = []
    if (productTab?.enabled !== false) list.push('products')
    if (serviceTab?.enabled !== false) list.push('services')
    return list.length > 0 ? list : ['products']
  }, [productTab?.enabled, serviceTab?.enabled])
  const defaultTabPreference = tabs.default
  const initialTab = useMemo(() => (
    availableTabs.includes(defaultTabPreference) ? defaultTabPreference : availableTabs[0]
  ), [availableTabs, defaultTabPreference])
  const [activeTab, setActiveTab] = useState(initialTab)
  useEffect(() => {
    setActiveTab(prev => {
      if (availableTabs.includes(prev)) return prev
      const fallback = availableTabs.includes(defaultTabPreference) ? defaultTabPreference : availableTabs[0]
      return fallback
    })
  }, [availableTabs, defaultTabPreference])

  const [q, setQ] = useState('')
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [serviceCategories, setServiceCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('')
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState(() => localStorage.getItem('branchId') || '')
  const [cart, setCart] = useState({})
  const [notes, setNotes] = useState({})
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [payments, setPayments] = useState([{method:'cash',amount:''},{method:'',amount:''}])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [currentShift, setCurrentShift] = useState(null)
  // Barbershop specific states
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedBarber, setSelectedBarber] = useState('')
  const [barbers, setBarbers] = useState([])
  const currency = useCurrency('IDR')
  const nav = useNavigate()

  const showProductTab = productTab?.enabled !== false
  const showServiceTab = serviceTab?.enabled !== false
  const HeaderIcon = header.icon || ShoppingCart
  const headerSubtitleClass = header.subtitleClass || 'text-emerald-100'
  const productCategoryLabel = productTab.categoryLabel || 'Kategori Produk'
  const serviceCategoryLabel = serviceTab.categoryLabel || 'Kategori Layanan'
  const ProductTabIcon = productTab.icon || Package
  const ServiceTabIcon = serviceTab.icon || Wrench
  const activeTabConfig = activeTab === 'services' ? serviceTab : productTab
  const ActiveTabIcon = activeTabConfig.icon || (activeTab === 'services' ? Wrench : Package)
  const activeIconClass = activeTab === 'products' ? 'text-emerald-600' : 'text-cyan-600'
  const activeListTitle = activeTabConfig.listTitle || (activeTab === 'products' ? 'Daftar Produk' : 'Daftar Layanan')
  const activeDescription = activeTabConfig.description || (activeTab === 'products'
    ? 'Cari dan pilih produk untuk ditambahkan ke keranjang'
    : 'Cari dan pilih layanan untuk ditambahkan ke pesanan')
  const activeSearchPlaceholder = activeTabConfig.searchPlaceholder || (activeTab === 'products'
    ? 'Cari nama / SKU produk'
    : 'Cari nama layanan')
  const CartIcon = labels.cartIcon || ShoppingCart
  const quickLinksToRender = Array.isArray(quickLinks) && quickLinks.length > 0 ? quickLinks : DEFAULT_QUICK_LINKS
  const quickNavBackground = quickNav?.background || 'from-emerald-50 to-green-50'
  const quickNavHover = quickNav?.hoverClass || 'hover:bg-emerald-100'
  const cartDurationLabel = serviceTab.durationLabel || 'Estimasi total layanan'
  const serviceDurationLabel = labels.serviceDuration || 'Estimasi waktu layanan:'
  const showBranchFilter = !!labels.branch
  async function searchProducts(){
    try{
      const p = new URLSearchParams()
      if(q) p.set('q', q)
      if(selectedCategory) p.set('category_id', selectedCategory)
      if(branchId) p.set('branch_id', branchId)
      p.set('per_page', 50)
      p.set('active', 'true')

      const data = await apiGet(`/setup/admin/products?${p.toString()}`, token)
      setProducts(data.data || [])
    }catch(e){
      console.warn('API not available, using mock data')
      generateMockProducts()
    }
  }

  async function searchServices(){
    try{
      const p = new URLSearchParams()
      if(q) p.set('q', q)
      if(selectedServiceCategory) p.set('category_id', selectedServiceCategory)
      p.set('per_page', 50)
      p.set('active', 'true')

      const data = await apiGet(`/setup/services?${p.toString()}`, token)
      setServices(data.data || [])
    }catch(e){
      console.warn('API not available, using mock data')
      generateMockServices()
    }
  }

  function generateMockProducts() {
    if (businessType === 'restaurant') {
      const restaurantMenu = [
        { id: 1, name: 'Nasi Gudeg Ayam', price: 25000, category_id: 1, category: { name: 'Makanan Utama' }, stock: 999 },
        { id: 2, name: 'Gado-gado Spesial', price: 20000, category_id: 1, category: { name: 'Makanan Utama' }, stock: 999 },
        { id: 3, name: 'Ayam Bakar Bumbu Rujak', price: 30000, category_id: 1, category: { name: 'Makanan Utama' }, stock: 999 },
        { id: 4, name: 'Soto Ayam Lamongan', price: 18000, category_id: 1, category: { name: 'Makanan Utama' }, stock: 999 },
        { id: 5, name: 'Es Teh Manis', price: 5000, category_id: 2, category: { name: 'Minuman' }, stock: 999 },
        { id: 6, name: 'Es Jeruk Nipis', price: 8000, category_id: 2, category: { name: 'Minuman' }, stock: 999 },
        { id: 7, name: 'Jus Alpukat', price: 12000, category_id: 2, category: { name: 'Minuman' }, stock: 999 },
        { id: 8, name: 'Kopi Tubruk', price: 7000, category_id: 2, category: { name: 'Minuman' }, stock: 999 },
        { id: 9, name: 'Pisang Goreng', price: 10000, category_id: 3, category: { name: 'Snack' }, stock: 999 },
        { id: 10, name: 'Tahu Isi', price: 8000, category_id: 3, category: { name: 'Snack' }, stock: 999 }
      ]
      setProducts(restaurantMenu)
    } else {
      // Default barbershop/general products
      const defaultProducts = [
        { id: 1, name: 'Pomade Hold Strong', price: 45000, category_id: 1, category: { name: 'Hair Products' }, stock: 15 },
        { id: 2, name: 'Hair Wax Natural', price: 35000, category_id: 1, category: { name: 'Hair Products' }, stock: 8 },
        { id: 3, name: 'Shampoo Anti Dandruff', price: 25000, category_id: 1, category: { name: 'Hair Products' }, stock: 12 }
      ]
      setProducts(defaultProducts)
    }
  }

  function generateMockServices() {
    if (businessType === 'restaurant') {
      const restaurantServices = [
        { id: 1, name: 'Paket Hemat Keluarga', price: 75000, category_id: 1, category: { name: 'Paket Spesial' }, duration: 30 },
        { id: 2, name: 'Catering 10 Porsi', price: 200000, category_id: 1, category: { name: 'Paket Spesial' }, duration: 60 },
        { id: 3, name: 'Extra Sambel', price: 2000, category_id: 2, category: { name: 'Add-on' }, duration: 0 },
        { id: 4, name: 'Extra Nasi', price: 5000, category_id: 2, category: { name: 'Add-on' }, duration: 0 }
      ]
      setServices(restaurantServices)
    } else {
      // Default barbershop services
      const defaultServices = [
        { id: 1, name: 'Cukur Rambut Klasik', price: 25000, category_id: 1, category: { name: 'Cukur' }, duration: 30 },
        { id: 2, name: 'Cukur + Cuci', price: 35000, category_id: 1, category: { name: 'Cukur' }, duration: 45 }
      ]
      setServices(defaultServices)
    }
  }

  function generateMockCategories() {
    if (businessType === 'restaurant') {
      const restaurantCategories = [
        { id: 1, name: 'Makanan Utama' },
        { id: 2, name: 'Minuman' },
        { id: 3, name: 'Snack' }
      ]
      setCategories(restaurantCategories)
    } else {
      // Default categories
      const defaultCategories = [
        { id: 1, name: 'Hair Products' },
        { id: 2, name: 'Tools' }
      ]
      setCategories(defaultCategories)
    }
  }

  function search() {
    if (activeTab === 'products' && showProductTab) {
      searchProducts()
    } else if (activeTab === 'services' && showServiceTab) {
      searchServices()
    }
  }

  async function loadBranches(){
    try{
      const bs = await apiGet('/branches', token)
      setBranches(bs)
      if (!branchId && bs.length){ setBranchId(String(bs[0].id)); localStorage.setItem('branchId', String(bs[0].id)) }
    }catch(e){
      console.warn('API not available, using mock branches')
      const mockBranches = [{ id: 1, name: businessType === 'restaurant' ? 'Outlet Utama' : 'Cabang Utama' }]
      setBranches(mockBranches)
      if (!branchId){ setBranchId('1'); localStorage.setItem('branchId', '1') }
    }
  }

  async function loadCategories(){
    try{
      const cats = await apiGet('/categories?per_page=100&active=true', token)
      setCategories(cats.data || [])
    }catch(e){
      console.warn('API not available, using mock categories')
      generateMockCategories()
    }
  }

  async function loadServiceCategories(){
    try{
      const cats = await apiGet('/setup/service-categories?per_page=100&active=true', token)
      setServiceCategories(cats.data || [])
    }catch(e){
      console.warn('API not available, using mock service categories')
      // Fallback to restaurant service categories
      if (businessType === 'restaurant') {
        setServiceCategories([
          { id: 1, name: 'Paket Spesial' },
          { id: 2, name: 'Add-on' }
        ])
      }
    }
  }

  // Load barbers for barbershop business type
  async function loadBarbers(){
    if (businessType !== 'barbershop') return

    try{
      // Try API first
      const apiBarbers = await apiGet('/setup/barbers?per_page=100&active=true', token)
      if (apiBarbers.data && apiBarbers.data.length > 0) {
        setBarbers(apiBarbers.data.filter(barber => barber.active))
        return
      }
    }catch(e){
      console.warn('API not available for barbers, trying localStorage:', e.message)
    }

    // Fallback to localStorage (from ServicePOS mock data)
    try {
      const storedBarbers = localStorage.getItem('barbershop_barbers')
      if (storedBarbers) {
        const barbers = JSON.parse(storedBarbers)
        setBarbers(barbers.filter(barber => barber.active))
      }
    } catch(e) {
      console.error('Failed to load barbers:', e)
      setBarbers([])
    }
  }

  // Load current shift status
  function loadCurrentShift() {
    try {
      const storedShift = localStorage.getItem('barbershop_current_shift')
      const newShift = storedShift ? JSON.parse(storedShift) : null
      setCurrentShift(newShift)

      // If shift is closed, clear any cash payments
      if (!newShift || newShift.status !== 'active') {
        setPayments(prev => prev.map(p =>
          p.method === 'cash' ? { ...p, method: '', amount: '' } : p
        ))
      }
    } catch (error) {
      console.error('Failed to load shift:', error)
      setCurrentShift(null)
      // Clear cash payments on error too
      setPayments(prev => prev.map(p =>
        p.method === 'cash' ? { ...p, method: '', amount: '' } : p
      ))
    }
  }


  useEffect(()=>{
    (async()=>{
      try {
        const tasks = []
        if(showProductTab){
          tasks.push(loadBranches(), loadCategories(), searchProducts())
        }
        if(showServiceTab){
          tasks.push(loadServiceCategories(), searchServices())
        }
        // Load shift status and barbers for barbershop business type
        if (businessType === 'barbershop') {
          loadCurrentShift()
          tasks.push(loadBarbers())
        }
        await Promise.all(tasks)
      } finally {
        setInitialLoading(false)
      }
    })()
  }, [showProductTab, showServiceTab, businessType])

  useEffect(()=>{
    if(!showProductTab) return
    if(branchId){
      localStorage.setItem('branchId', String(branchId))
    }
    if(activeTab === 'products'){
      searchProducts()
    }
  }, [branchId, showProductTab, activeTab])

  useEffect(()=>{
    if(activeTab === 'products'){
      if(showProductTab) searchProducts()
    } else if(activeTab === 'services'){
      if(showServiceTab) searchServices()
    }
  }, [activeTab, selectedCategory, selectedServiceCategory, showProductTab, showServiceTab])

  // Listen for shift status changes
  useEffect(() => {
    if (businessType !== 'barbershop') return

    const handleShiftChange = () => {
      loadCurrentShift()
    }

    // Listen for localStorage changes
    window.addEventListener('storage', handleShiftChange)

    // Also check periodically in case changes happen in the same tab
    const interval = setInterval(handleShiftChange, 5000)

    return () => {
      window.removeEventListener('storage', handleShiftChange)
      clearInterval(interval)
    }
  }, [businessType])

  // Recalculate service prices when barber changes (barbershop only)
  useEffect(() => {
    if (businessType !== 'barbershop' || Object.keys(cart).length === 0) return

    setCart(prev => {
      const next = {...prev}
      let updated = false

      Object.keys(next).forEach(key => {
        const item = next[key]
        if (item.type === 'service' && item.estimated_duration) {
          let newBarberCost = 0
          let newPrice = item.base_price || 0

          if (selectedBarber) {
            const selectedBarberData = barbers.find(b => b.id === selectedBarber)
            if (selectedBarberData && selectedBarberData.hourly_rate) {
              newBarberCost = selectedBarberData.hourly_rate
              if (item.pricing_mode === 'barber') {
                // For barber mode: base_price is final price, don't add barber cost
                newPrice = item.base_price || 0
              } else if (item.pricing_mode === 'combined') {
                // For combined mode: add barber cost to base price
                newPrice = (item.base_price || 0) + newBarberCost
              } else {
                // For fixed mode: no barber cost
                newPrice = item.base_price || 0
              }
            }
          }

          if (item.barber_cost !== newBarberCost || item.price !== newPrice) {
            next[key] = {
              ...item,
              price: newPrice,
              barber_cost: newBarberCost,
              barber_id: selectedBarber
            }
            updated = true
          }
        }
      })

      return updated ? next : prev
    })
  }, [selectedBarber, barbers, businessType, cart])

  function addToCart(item){
    setCart(prev => {
      const next = {...prev}
      let row
      if (item.sku) {
        row = next[`product_${item.id}`] || {
          type: 'product',
          product_id: item.id,
          name: item.name,
          sku: item.sku,
          price: Number(item.price||0),
          qty: 0
        }
        row.qty += 1
        next[`product_${item.id}`] = row
      } else {
        // Auto-select first available barber if none selected and service requires barber
        if (businessType === 'barbershop' &&
            (item.pricing_mode === 'barber' || item.pricing_mode === 'combined') &&
            !selectedBarber && barbers.length > 0) {
          setSelectedBarber(barbers[0].id)
        }

        // Calculate service price with barber rate for barbershop
        let basePrice = Number(item.base_price||0)
        let finalPrice = basePrice
        let barberCost = 0
        let barberIdToUse = selectedBarber

        // Auto-use first barber if none selected but service requires barber
        if (businessType === 'barbershop' &&
            (item.pricing_mode === 'barber' || item.pricing_mode === 'combined') &&
            !barberIdToUse && barbers.length > 0) {
          barberIdToUse = barbers[0].id
        }

        // Handle pricing based on pricing mode
        if (businessType === 'barbershop' && barberIdToUse && item.estimated_duration) {
          const selectedBarberData = barbers.find(b => b.id === barberIdToUse)
          if (selectedBarberData && selectedBarberData.hourly_rate) {
            if (item.pricing_mode === 'barber') {
              // For barber mode: base_price already includes everything, just show breakdown
              barberCost = selectedBarberData.hourly_rate
              finalPrice = basePrice // Don't add, base_price is final price
            } else if (item.pricing_mode === 'combined') {
              // For combined mode: add barber rate to base price
              barberCost = selectedBarberData.hourly_rate
              finalPrice = basePrice + barberCost
            }
          }
        }

        row = next[`service_${item.id}`] || {
          type: 'service',
          service_id: item.id,
          name: item.name,
          code: item.code,
          price: finalPrice,
          base_price: basePrice,
          qty: 0,
          unit: item.unit,
          estimated_duration: item.estimated_duration || 0,
          requirements: item.requirements,
          barber_cost: barberCost,
          barber_id: barberIdToUse,
          pricing_mode: item.pricing_mode
        }
        row.qty += 1

        // Apply pricing tiers if available
        if(item.pricing_tiers && item.pricing_tiers.length > 0) {
          const tiers = [...item.pricing_tiers].sort((a,b) => b.min_qty - a.min_qty)
          const tier = tiers.find(t => row.qty >= t.min_qty)
          if(tier) {
            row.base_price = tier.price
            if (item.pricing_mode === 'barber') {
              // For barber mode: tier price is final price
              row.price = tier.price
            } else {
              // For other modes: add barber cost
              row.price = tier.price + barberCost
            }
          }
        }
        next[`service_${item.id}`] = row
      }
      return next
    })
  }
  function updateQty(id, qty){
    setCart(prev=>{
      const next = {...prev}
      if(!next[id]) return prev
      const newQty = Math.max(1, Number(qty||1))
      next[id] = {...next[id], qty: newQty}

      if(next[id].type === 'service') {
        const serviceId = next[id].service_id
        const service = services.find(s => s.id === serviceId)
        if(service?.pricing_tiers?.length > 0) {
          const tiers = [...service.pricing_tiers].sort((a,b) => b.min_qty - a.min_qty)
          const tier = tiers.find(t => newQty >= t.min_qty)
          if(tier) next[id].price = tier.price
          else next[id].price = service.base_price
        }
      }
      return next
    })
  }
  function updateNotes(id, note) {
    setNotes(prev => ({...prev, [id]: note}))
  }

  function removeFromCart(id){
    setCart(prev=>{ const n={...prev}; delete n[id]; return n })
    setNotes(prev=>{ const n={...prev}; delete n[id]; return n })
  }

  function clearCart(){
    setCart({})
    setNotes({})
    // Clear barbershop customer info after checkout
    if (businessType === 'barbershop') {
      setCustomerName('')
      setCustomerPhone('')
      setSelectedBarber('')
    }
  }

  const subtotal = useMemo(()=>Object.values(cart).reduce((s,r)=>s+(r.price*r.qty),0),[cart])
  const grand = useMemo(()=>Math.max(0, subtotal - Number(discount||0) + Number(tax||0)),[subtotal,discount,tax])
  const totalDuration = useMemo(()=>Object.values(cart).filter(r=>r.type==='service').reduce((s,r)=>s+(r.estimated_duration*r.qty),0),[cart])
  const hasBarberModeService = useMemo(()=>Object.values(cart).some(item => item.type === 'service' && (item.pricing_mode === 'barber' || item.pricing_mode === 'combined')),[cart])

  async function checkout(){
    if(Object.keys(cart).length===0){ alert(texts.emptyCartAlert || 'Keranjang kosong'); return }

    // Validate barber selection for barber mode services
    if(businessType === 'barbershop' && hasBarberModeService && !selectedBarber){
      alert('Pilih barber terlebih dahulu untuk treatment dengan tarif barber'); return
    }

    const cartItems = Object.values(cart)
    const productItems = cartItems.filter(r => r.type === 'product')
    const serviceItems = cartItems.filter(r => r.type === 'service')

    const pays = payments.filter(p=>p.method && Number(p.amount)>0).map(p=>({ method:p.method, amount:Number(p.amount), reference:p.reference||'' }))
    if(pays.length===0){ alert('Isi minimal satu pembayaran dengan nominal'); return }

    // Check if cash payment is blocked due to closed shift (barbershop only)
    if (businessType === 'barbershop') {
      const hasCashPayment = pays.some(p => p.method === 'cash')
      if (hasCashPayment && (!currentShift || currentShift.status !== 'active')) {
        alert('Transaksi tunai tidak dapat diproses karena shift belum dibuka. Silakan buka shift terlebih dahulu atau gunakan metode pembayaran non-tunai.')
        return
      }
    }

    setLoading(true)
    try{
      let data

      if (productItems.length > 0 && serviceItems.length === 0) {
        const items = productItems.map(r=>({ product_id:r.product_id, qty:r.qty }))
        data = await apiPost('/checkout', {
          items,
          discount: Number(discount||0),
          tax: Number(tax||0),
          payments: pays,
          branch_id: branchId ? Number(branchId) : undefined,
        }, token)
      } else if (serviceItems.length > 0 && productItems.length === 0) {
        const items = serviceItems.map(r=>({
          service_id: r.service_id,
          qty: r.qty,
          unit_price: r.price,
          notes: notes[`service_${r.service_id}`] || ''
        }))
        // Prepare service checkout payload with barbershop data
        const payload = {
          service_items: items,
          discount: Number(discount||0),
          tax: Number(tax||0),
          payments: pays,
          estimated_duration: totalDuration
        }

        // Add barbershop specific data
        if (businessType === 'barbershop') {
          payload.customer_name = customerName
          payload.customer_phone = customerPhone
          payload.barber_id = selectedBarber
        }

        data = await apiPost('/service-checkout', payload, token)
      } else {
        alert('Checkout campuran produk dan layanan belum didukung. Silakan checkout secara terpisah.')
        setLoading(false)
        return
      }

      clearCart()
      setDiscount(0)
      setTax(0)
      setPayments([{method:'cash',amount:''},{method:'',amount:''}])
      nav(`/receipt/${data.id}`)
    }catch(e){ alert(e.message) } finally{ setLoading(false) }
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-4 px-1 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <HeaderIcon className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{header.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {businessType === 'barbershop' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${
              currentShift?.status === 'active'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {currentShift?.status === 'active' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>
                Shift: {currentShift?.status === 'active' ? 'Aktif' : 'Tertutup'}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span>{user?.name||'-'}</span>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            {(showProductTab || showServiceTab) && (
              <div className="flex items-center gap-2 mb-4">
                {showProductTab && (
                  <Button
                    onClick={() => setActiveTab('products')}
                    variant={activeTab === 'products' ? 'default' : 'outline'}
                    size="sm"
                    className={activeTab === 'products' ? 'bg-emerald-600 text-white' : 'text-emerald-600 border-emerald-200'}
                  >
                    <ProductTabIcon className="h-4 w-4 mr-2" />
                    {productTab.label}
                  </Button>
                )}
                {showServiceTab && (
                  <Button
                    onClick={() => setActiveTab('services')}
                    variant={activeTab === 'services' ? 'default' : 'outline'}
                    size="sm"
                    className={activeTab === 'services' ? 'bg-cyan-600 text-white' : 'text-cyan-600 border-cyan-200'}
                  >
                    <ServiceTabIcon className="h-4 w-4 mr-2" />
                    {serviceTab.label}
                  </Button>
                )}
              </div>
            )}
            <CardTitle className="flex items-center gap-2">
              <ActiveTabIcon className={`h-5 w-5 ${activeIconClass}`} />
              {activeListTitle}
            </CardTitle>
            <CardDescription>
              {activeDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                  placeholder={activeSearchPlaceholder}
                  className={`pl-10 h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 ${activeTab === 'products' ? 'focus:ring-emerald-500' : 'focus:ring-cyan-500'} transition-all`}
                  onKeyPress={e => e.key === 'Enter' && search()}
                />
              </div>
              <Button onClick={search} className={activeTab === 'products' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700'}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeTab === 'products' && showProductTab && (
                <div>
                  <Label htmlFor="category">{productCategoryLabel}</Label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={e=>setSelectedCategory(e.target.value)}
                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md transition-all"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'services' && showServiceTab && (
                <div>
                  <Label htmlFor="serviceCategory">{serviceCategoryLabel}</Label>
                  <select
                    id="serviceCategory"
                    value={selectedServiceCategory}
                    onChange={e=>setSelectedServiceCategory(e.target.value)}
                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 rounded-md transition-all"
                  >
                    <option value="">Semua Kategori</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {branches.length > 0 && activeTab === 'products' && showBranchFilter && (
                <div>
                  <Label htmlFor="branch">{labels.branch}</Label>
                  <select
                    id="branch"
                    value={branchId}
                    onChange={e=>setBranchId(e.target.value)}
                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md transition-all"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {initialLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Memuat {(activeTabConfig.label || (activeTab === 'products' ? 'produk' : 'layanan')).toLowerCase()}...</span>
                </div>
              ) : activeTab === 'products' ? (
                products.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{productTab.emptyState}</p>
                  </div>
                ) : (
                  products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {p.image_url ? (
                        <img src={p.image_url} className="w-12 h-12 object-cover rounded-md" alt={p.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-semibold">
                          {p.name?.slice(0,2)?.toUpperCase() || 'PR'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-500">SKU: {p.sku || '-'}</div>
                          </div>
                          <div className="text-sm font-medium text-emerald-600">{formatMoney(parseFloat(p.price || 0), currency)}</div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-500">Stok: {money(p.stock)}</span>
                          <Button
                            onClick={()=>addToCart(p)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                services.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{serviceTab.emptyState}</p>
                  </div>
                ) : (
                  services.map(service => (
                    <div key={service.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-900">{service.name}</div>
                            <div className="text-xs text-gray-500">Kode: {service.code || '-'}</div>
                          </div>
                          <div className="text-sm font-medium text-cyan-600">{formatMoney(service.base_price, currency)}{service.unit ? `/${service.unit}` : ''}</div>
                        </div>
                        {service.description && (
                          <div className="text-xs text-gray-500 mt-1">{service.description}</div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          {service.estimated_duration ? (
                            <span className="flex items-center gap-1 bg-white rounded px-2 py-1">
                              <Clock className="h-3 w-3" />
                              {service.estimated_duration} menit
                            </span>
                          ) : null}
                          {service.unit && (
                            <span className="bg-white rounded px-2 py-1">Satuan: {service.unit}</span>
                          )}
                          {/* Pricing Mode Info */}
                          {service.pricing_mode && (
                            <span className={`rounded px-2 py-1 font-medium ${
                              service.pricing_mode === 'fixed' ? 'bg-blue-50 text-blue-700' :
                              service.pricing_mode === 'barber' ? 'bg-purple-50 text-purple-700' :
                              service.pricing_mode === 'combined' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {service.pricing_mode === 'fixed' ? '💰 Harga Tetap' :
                               service.pricing_mode === 'barber' ? '👨‍💼 Tarif Barber' :
                               service.pricing_mode === 'combined' ? '🔄 Kombinasi' :
                               service.pricing_mode}
                            </span>
                          )}
                        </div>
                        {service.requirements && (
                          <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {service.requirements}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={()=>addToCart(service)}
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700 ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CartIcon className="h-5 w-5 text-emerald-600" />
                {`${labels.cartTitle} (${Object.values(cart).length})`}
              </CardTitle>
              {Object.values(cart).length > 0 && (
                <Button
                  onClick={clearCart}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {totalDuration > 0 && showServiceTab && (
              <div className="text-sm text-cyan-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {cartDurationLabel}: {Math.ceil(totalDuration)} menit
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {Object.values(cart).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{labels.cartEmptyPrimary}</p>
                  <p className="text-sm">{labels.cartEmptySecondary}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([key, row]) => (
                    <div key={key} className={`p-3 bg-gray-50 rounded-lg ${row.type === 'service' ? 'border-l-4 border-cyan-500' : 'border-l-4 border-emerald-500'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-medium text-gray-900 truncate">{row.name}</div>
                            {row.type === 'service' ? (
                              <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200">
                                <Wrench className="h-3 w-3 mr-1" />
                                {labels.serviceBadge}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                <Package className="h-3 w-3 mr-1" />
                                {labels.productBadge}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{row.sku || row.code}</div>
                          <div className={`text-sm font-medium ${row.type === 'service' ? 'text-cyan-600' : 'text-emerald-600'}`}>
                            {formatMoney(row.price, currency)}{row.unit ? `/${row.unit}` : ''}
                          </div>
                          {row.estimated_duration && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {row.estimated_duration * row.qty} menit total
                            </div>
                          )}
                          {/* Pricing Mode Info in Cart */}
                          {row.type === 'service' && row.pricing_mode && (
                            <div className="text-xs mt-1 space-y-1">
                              <span className={`inline-flex items-center gap-1 rounded px-2 py-1 font-medium ${
                                row.pricing_mode === 'fixed' ? 'bg-blue-50 text-blue-700' :
                                row.pricing_mode === 'barber' ? 'bg-purple-50 text-purple-700' :
                                row.pricing_mode === 'combined' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-700'
                              }`}>
                                {row.pricing_mode === 'fixed' ? '💰 Harga Tetap' :
                                 row.pricing_mode === 'barber' ? '👨‍💼 Tarif Barber' :
                                 row.pricing_mode === 'combined' ? '🔄 Kombinasi' :
                                 row.pricing_mode}
                              </span>
                              {/* Show selected barber name for barber mode services */}
                              {(row.pricing_mode === 'barber' || row.pricing_mode === 'combined') && row.barber_id && (
                                <div className="text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                  <span className="flex items-center gap-1">
                                    <Scissors className="h-3 w-3" />
                                    Barber: {barbers.find(b => b.id === row.barber_id)?.name || 'Tidak ditemukan'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {businessType === 'barbershop' && row.type === 'service' && row.barber_cost && (
                            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1">
                              {row.pricing_mode === 'barber' ? (
                                <div className="text-center">
                                  <span>Total termasuk tarif barber: {formatMoney(row.price, currency)}</span>
                                </div>
                              ) : row.pricing_mode === 'combined' ? (
                                <div className="flex items-center justify-between">
                                  <span>Service: {formatMoney((row.base_price || 0), currency)}</span>
                                  <span>Barber: +{formatMoney(row.barber_cost, currency)}</span>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <span>Harga tetap: {formatMoney(row.price, currency)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={()=>removeFromCart(key)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          onClick={() => updateQty(key, Math.max(1, row.qty - 1))}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={row.qty}
                          onChange={e=>updateQty(key, e.target.value)}
                          className="w-16 h-8 text-center border-0 bg-white"
                        />
                        <Button
                          onClick={() => updateQty(key, row.qty + 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="text-right flex-1">
                          <div className="font-medium text-gray-900">{formatMoney(row.price * row.qty, currency)}</div>
                        </div>
                      </div>

                      {row.type === 'service' && (
                        <Input
                          placeholder={serviceTab.notePlaceholder || 'Catatan khusus untuk layanan ini...'}
                          value={notes[key] || ''}
                          onChange={e=>updateNotes(key, e.target.value)}
                          className="text-sm h-8 border-0 bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {Object.values(cart).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{labels.subtotal}</span>
                  <span className="text-emerald-600">{formatMoney(subtotal, currency)}</span>
                </div>
                {businessType === 'barbershop' && totalDuration > 0 && (
                  <div className="flex justify-between items-center text-sm text-purple-600 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {labels.serviceDuration}
                    </span>
                    <span>{Math.ceil(totalDuration)} menit</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              {labels.paymentTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Information for Barbershop */}
            {businessType === 'barbershop' && (
              <div className="space-y-3 pb-4 border-b">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Pelanggan
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="customerName">Nama Pelanggan</Label>
                    <Input
                      id="customerName"
                      placeholder="Masukkan nama pelanggan"
                      value={customerName}
                      onChange={e=>setCustomerName(e.target.value)}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">No. Handphone</Label>
                    <Input
                      id="customerPhone"
                      placeholder="08xxxxxxxxxx"
                      value={customerPhone}
                      onChange={e=>setCustomerPhone(e.target.value)}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <Label htmlFor="selectedBarber" className={hasBarberModeService && !selectedBarber ? 'text-red-600 font-medium' : ''}>
                      Pilih Barber {hasBarberModeService ? '(Wajib untuk Tarif Barber)' : ''}
                    </Label>
                    <select
                      id="selectedBarber"
                      value={selectedBarber}
                      onChange={e=>setSelectedBarber(e.target.value)}
                      className={`w-full h-10 px-3 border-0 focus:bg-white focus:ring-2 rounded-md transition-all ${
                        hasBarberModeService && !selectedBarber
                          ? 'bg-red-50 focus:ring-red-500 border border-red-200'
                          : 'bg-gray-50 focus:ring-purple-500'
                      }`}
                    >
                      <option value="">{hasBarberModeService ? 'Pilih Barber (Wajib)' : 'Tanpa Barber'}</option>
                      {barbers.map(barber => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name} ({barber.specialty}) - {formatMoney(barber.hourly_rate || 0, currency)}
                        </option>
                      ))}
                    </select>
                    {hasBarberModeService && !selectedBarber && (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Wajib pilih barber untuk treatment dengan tarif barber
                      </div>
                    )}
                    {selectedBarber && (
                      <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <Scissors className="h-3 w-3" />
                        Tarif barber akan ditambahkan untuk treatment
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount">{labels.discount}</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={e=>setDiscount(e.target.value)}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="tax">{labels.tax}</Label>
                <Input
                  id="tax"
                  type="number"
                  value={tax}
                  onChange={e=>setTax(e.target.value)}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">{labels.paymentMethods}</Label>
              {businessType === 'barbershop' && (!currentShift || currentShift.status !== 'active') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 mb-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Pembayaran Tunai Diblokir</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Shift kasir belum dibuka. Buka shift di halaman Barbershop Shift untuk menggunakan pembayaran tunai.
                  </p>
                </div>
              )}
              <div className="space-y-3 mt-2">
                {[0,1].map(i => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <select
                      value={payments[i]?.method||''}
                      onChange={e=>{
                        const v=[...payments]; v[i]={...v[i], method:e.target.value}; setPayments(v)
                      }}
                      className="h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md transition-all text-sm"
                    >
                      <option value="">(Opsional)</option>
                      <option
                        value="cash"
                        disabled={businessType === 'barbershop' && (!currentShift || currentShift.status !== 'active')}
                      >
                        Tunai {businessType === 'barbershop' && (!currentShift || currentShift.status !== 'active') ? '(Shift Tertutup)' : ''}
                      </option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Transfer</option>
                    </select>
                    <Input
                      placeholder="Nominal"
                      type="number"
                      value={payments[i]?.amount||''}
                      onChange={e=>{ const v=[...payments]; v[i]={...v[i], amount:e.target.value}; setPayments(v) }}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <Input
                      placeholder="Ref"
                      value={payments[i]?.reference||''}
                      onChange={e=>{ const v=[...payments]; v[i]={...v[i], reference:e.target.value}; setPayments(v) }}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-2xl font-bold text-emerald-700">
                  <span>{labels.total}</span>
                  <span>{formatMoney(grand, currency)}</span>
                </div>
                {totalDuration > 0 && showServiceTab && (
                  <div className="flex justify-between items-center text-sm text-cyan-600 mt-1">
                    <span>{serviceDurationLabel}</span>
                    <span>{Math.ceil(totalDuration)} menit</span>
                  </div>
                )}
              </div>

              <Button
                onClick={checkout}
                disabled={loading || Object.keys(cart).length === 0}
                className="w-full h-12 mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Calculator className="h-5 w-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {labels.checkoutButton}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`shadow-lg border-0 bg-gradient-to-r ${quickNavBackground}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {quickLinksToRender.map((link, index) => {
              const IconComponent = link.icon || Home
              return (
                <Button key={`${link.to}-${index}`} asChild variant="ghost" className={`flex items-center gap-2 ${quickNavHover}`}>
                  <Link to={link.to}>
                    <IconComponent className="h-4 w-4" />
                    {link.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
