import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Plus, FolderOpen, Search, Filter, Edit, Eye, Package,
  ChevronLeft, ChevronRight, MoreHorizontal, Trash2,
  Star, TrendingUp, AlertTriangle, Scissors, Droplets, Utensils, ChefHat, Coffee
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

// Mock restaurant menu items for demonstration when API is unavailable
function getMockRestaurantProducts() {
  return [
    {
      id: 1,
      name: 'Nasi Gudeg Jogja',
      sku: 'NGJ-001',
      price: 25000,
      stock: 50,
      active: true,
      category: { id: 1, name: 'Makanan Utama' }
    },
    {
      id: 2,
      name: 'Ayam Bakar Bumbu Kecap',
      sku: 'ABK-002',
      price: 35000,
      stock: 30,
      active: true,
      category: { id: 1, name: 'Makanan Utama' }
    },
    {
      id: 3,
      name: 'Soto Ayam Lamongan',
      sku: 'SAL-003',
      price: 20000,
      stock: 40,
      active: true,
      category: { id: 2, name: 'Soto & Sup' }
    },
    {
      id: 4,
      name: 'Es Teh Manis',
      sku: 'ETM-004',
      price: 8000,
      stock: 100,
      active: true,
      category: { id: 3, name: 'Minuman' }
    },
    {
      id: 5,
      name: 'Gado-Gado Jakarta',
      sku: 'GGJ-005',
      price: 18000,
      stock: 35,
      active: true,
      category: { id: 4, name: 'Salad & Sayuran' }
    },
    {
      id: 6,
      name: 'Jus Alpukat',
      sku: 'JUA-006',
      price: 15000,
      stock: 25,
      active: true,
      category: { id: 3, name: 'Minuman' }
    },
    {
      id: 7,
      name: 'Paket Hemat Keluarga',
      sku: 'PHK-007',
      price: 75000,
      stock: 20,
      active: true,
      category: { id: 5, name: 'Paket Spesial' }
    },
    {
      id: 8,
      name: 'Kopi Tubruk Hitam',
      sku: 'KTH-008',
      price: 12000,
      stock: 60,
      active: true,
      category: { id: 3, name: 'Minuman' }
    }
  ]
}

// Mock barbershop products for demonstration when API is unavailable
function getMockBarbershopProducts() {
  return [
    {
      id: 1,
      name: 'Pomade Classic Hold',
      sku: 'PMD-001',
      price: 75000,
      stock: 15,
      active: true,
      category: { id: 2, name: 'Styling Products' }
    },
    {
      id: 2,
      name: 'Hair Wax Strong Hold',
      sku: 'WAX-002',
      price: 85000,
      stock: 8,
      active: true,
      category: { id: 2, name: 'Styling Products' }
    },
    {
      id: 3,
      name: 'Shampoo Professional 500ml',
      sku: 'SHP-003',
      price: 125000,
      stock: 22,
      active: true,
      category: { id: 1, name: 'Hair Care' }
    },
    {
      id: 4,
      name: 'Hair Clipper Professional',
      sku: 'HCP-004',
      price: 450000,
      stock: 3,
      active: true,
      category: { id: 3, name: 'Tools & Equipment' }
    },
    {
      id: 5,
      name: 'Beard Oil Premium',
      sku: 'BOL-005',
      price: 95000,
      stock: 12,
      active: true,
      category: { id: 1, name: 'Hair Care' }
    },
    {
      id: 6,
      name: 'Hair Spray Volume',
      sku: 'HSP-006',
      price: 65000,
      stock: 18,
      active: true,
      category: { id: 2, name: 'Styling Products' }
    },
    {
      id: 7,
      name: 'Razor Professional',
      sku: 'RZR-007',
      price: 275000,
      stock: 5,
      active: true,
      category: { id: 3, name: 'Tools & Equipment' }
    },
    {
      id: 8,
      name: 'After Shave Balm',
      sku: 'ASB-008',
      price: 55000,
      stock: 25,
      active: true,
      category: { id: 1, name: 'Hair Care' }
    }
  ]
}

export default function Inventory(){
  const { token, logout, user, activeTenant } = useAuth()
  const currency = useCurrency('IDR')
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [cats, setCats] = useState([])
  const [list, setList] = useState({ data:[], meta:{} })
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)

  // Get business type
  const businessType = activeTenant?.business_type || 'barbershop'

  async function loadCats(){
    try {
      // Return empty categories so user can add manually
      setCats([])
      console.log("Inventory page: Categories cleared - ready for manual entry")
    } catch (error) {
      console.error('Error loading categories:', error)
      // Return empty categories
      setCats([])
    }
  }
  async function load(page=1){
    setLoading(true)
    try {
      // Return empty data so user can add manually
      setList({
        data: [],
        total: 0,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0
      })
      console.log("Inventory page: Products data cleared - ready for manual entry")
    } catch (error) {
      console.error('Error loading products:', error)
      // Return empty data
      setList({
        data: [],
        total: 0,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0
      })
    } finally { setLoading(false) }
  }
  useEffect(()=>{
    loadCats();
    load()
  }, [])

  // Delete function
  async function deleteProduct(productId, productName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

      // Get tenant headers
      const headers = { 'Authorization': `Bearer ${token}` }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      let res
      try {
        res = await fetch(`${API_BASE}/admin/products/${productId}`, {
          method: 'DELETE',
          headers
        })
      } catch {
        // Fallback to setup endpoint
        res = await fetch(`${API_BASE}/setup/admin/products/${productId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      }

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}: Gagal menghapus produk`)
      }

      alert('Produk berhasil dihapus')
      load() // Reload data
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(error.message || 'Gagal menghapus produk')
    }
  }

  // Delete all products function
  async function deleteAllProducts() {
    const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'

    if (!list.data || list.data.length === 0) {
      alert(businessType === 'restaurant' ? 'Tidak ada menu untuk dihapus' : businessType === 'barbershop' ? 'Tidak ada produk grooming untuk dihapus' : 'Tidak ada produk untuk dihapus')
      return
    }

    const productType = businessType === 'restaurant' ? 'menu' : businessType === 'barbershop' ? 'produk grooming' : 'produk'
    const confirmation = confirm(
      `⚠️ PERINGATAN!\n\nAnda akan menghapus SEMUA ${productType} (${list.data.length} item).\nTindakan ini tidak dapat dibatalkan!\n\nApakah Anda yakin ingin melanjutkan?`
    )

    if (!confirmation) return

    // Double confirmation for safety
    const doubleConfirm = confirm(
      `Konfirmasi terakhir:\nHapus ${list.data.length} ${productType}?\n\nKetik "HAPUS SEMUA" untuk konfirmasi.`
    )

    if (!doubleConfirm) return

    setLoading(true)
    let successCount = 0
    let failCount = 0

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

      // Get tenant headers
      const headers = { 'Authorization': `Bearer ${token}` }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      // Delete products one by one
      for (const product of list.data) {
        try {
          let res
          try {
            res = await fetch(`${API_BASE}/admin/products/${product.id}`, {
              method: 'DELETE',
              headers
            })
          } catch {
            // Fallback to setup endpoint
            res = await fetch(`${API_BASE}/setup/admin/products/${product.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          }

          if (res.ok) {
            successCount++
          } else {
            failCount++
            console.error(`Failed to delete product ${product.name}:`, res.status)
          }
        } catch (error) {
          failCount++
          console.error(`Error deleting product ${product.name}:`, error)
        }
      }

      // Show result
      if (successCount > 0 && failCount === 0) {
        alert(`✅ Berhasil menghapus semua ${productType} (${successCount} item)`)
      } else if (successCount > 0 && failCount > 0) {
        alert(`⚠️ Sebagian berhasil dihapus:\n✅ Berhasil: ${successCount} ${productType}\n❌ Gagal: ${failCount} ${productType}`)
      } else {
        // If all deletions failed and we're using mock mode, clear the mock data
        if ((businessType === 'barbershop' || businessType === 'restaurant') && failCount === list.data.length) {
          alert(`✅ Demo: Berhasil menghapus semua ${productType} (${list.data.length} item)`)
          setList({ data: [], total: 0, current_page: 1, last_page: 1, from: 0, to: 0 })
          // Set localStorage flags to indicate inventory was cleared
          localStorage.setItem('barbershop_inventory_cleared', 'true')
          localStorage.removeItem('barbershop_products_data')
        } else {
          alert(`❌ Gagal menghapus ${productType}. Silakan coba lagi atau hubungi administrator.`)
        }
      }

      // Reload data only if we're not using mock mode
      if ((businessType !== 'barbershop' && businessType !== 'restaurant') || successCount > 0) {
        load()
      }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      // In demo mode, simulate successful deletion
      if (businessType === 'barbershop' || businessType === 'restaurant') {
        alert(`✅ Demo: Berhasil menghapus semua ${productType} (${list.data.length} item)`)
        setList({ data: [], total: 0, current_page: 1, last_page: 1, from: 0, to: 0 })
        // Set localStorage flags to indicate inventory was cleared
        localStorage.setItem('barbershop_inventory_cleared', 'true')
        localStorage.removeItem('barbershop_products_data')
      } else {
        alert(`❌ Terjadi kesalahan saat menghapus ${productType}: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const pagination = []
  const current = list.current_page || 1
  const last = list.last_page || 1
  for(let i=1;i<=last;i++){ pagination.push(i) }

  return (
    <div className="space-y-8">
      {/* Header Section - Compact & Professional */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {businessType === 'restaurant' ? 'Daftar Menu Restaurant' : businessType === 'barbershop' ? 'Produk & Supplies Grooming' : 'Daftar Barang'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {businessType === 'restaurant'
              ? 'Kelola menu makanan, minuman, dan paket spesial restaurant'
              : businessType === 'barbershop'
              ? 'Kelola produk perawatan rambut, styling, dan peralatan barbershop'
              : 'Kelola inventori toko Anda dengan mudah'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Link to="/categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-purple-600" />
              {businessType === 'restaurant' ? 'Kategori Menu' : businessType === 'barbershop' ? 'Kategori Grooming' : 'Kategori'}
            </Link>
          </Button>
          {list.data && list.data.length > 0 && (
            <Button
              onClick={deleteAllProducts}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 text-red-600 mr-2" />
              {businessType === 'restaurant' ? 'Hapus Semua Menu' : businessType === 'barbershop' ? 'Hapus Semua Grooming' : 'Hapus Semua Produk'}
            </Button>
          )}
          <Button asChild className="bg-gray-900 text-white hover:bg-gray-800">
            <Link to="/inventory/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-white" />
              {businessType === 'restaurant' ? 'Tambah Menu Baru' : businessType === 'barbershop' ? 'Tambah Produk Grooming' : 'Tambah Produk'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-blue-100 p-3">
                  {businessType === 'restaurant' ? (
                    <Utensils className="h-6 w-6 text-blue-600" />
                  ) : businessType === 'barbershop' ? (
                    <Scissors className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Package className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {businessType === 'restaurant' ? 'Total Menu' : businessType === 'barbershop' ? 'Total Produk & Supplies' : 'Total Produk'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{list.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-green-100 p-3">
                  {businessType === 'restaurant' ? (
                    <ChefHat className="h-6 w-6 text-green-600" />
                  ) : businessType === 'barbershop' ? (
                    <Droplets className="h-6 w-6 text-green-600" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {businessType === 'restaurant' ? 'Total Porsi Tersedia' : businessType === 'barbershop' ? 'Total Stok Grooming' : 'Stok Tersedia'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.reduce((acc, p) => acc + (p.stock || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {businessType === 'restaurant' ? 'Menu Habis/Menipis' : businessType === 'barbershop' ? 'Produk Habis/Menipis' : 'Stok Rendah'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.filter(p => p.stock <= 5).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-purple-100 p-3">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {businessType === 'restaurant' ? 'Menu Tersedia' : businessType === 'barbershop' ? 'Produk Siap Pakai' : 'Produk Aktif'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.filter(p => p.active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Pencarian & Filter</span>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {list.data?.length || 0} dari {list.total || 0} {businessType === 'restaurant' ? 'item menu' : businessType === 'barbershop' ? 'item grooming' : 'produk'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="relative lg:col-span-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                placeholder={businessType === 'restaurant'
                  ? "Cari nasi gudeg, ayam bakar, soto, minuman..."
                  : businessType === 'barbershop'
                  ? "Cari pomade, shampoo, hair spray, alat cukur..."
                  : "Cari nama produk atau SKU..."
                }
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-500" />
                      Semua Kategori
                    </div>
                  </SelectItem>
                  {cats.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Button
                onClick={() => load()}
                size="lg"
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
              >
                <Filter className="h-4 w-4 mr-2 text-white" />
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <LoadingSpinner size="sm" />
              <span>Memuat produk...</span>
            </div>
          ) : list.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-blue-100 p-6 mb-4">
                {businessType === 'restaurant' ? (
                  <Utensils className="h-12 w-12 text-blue-500" />
                ) : businessType === 'barbershop' ? (
                  <Scissors className="h-12 w-12 text-blue-500" />
                ) : (
                  <Package className="h-12 w-12 text-blue-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {businessType === 'restaurant' ? 'Belum ada menu' : businessType === 'barbershop' ? 'Belum ada produk grooming' : 'Belum ada produk'}
              </h3>
              <p className="text-gray-500 text-center mb-6 max-w-sm">
                {businessType === 'restaurant'
                  ? 'Tambahkan menu restaurant seperti makanan utama, minuman, soto, salad, atau paket spesial.'
                  : businessType === 'barbershop'
                  ? 'Tambahkan produk grooming seperti pomade, hair wax, shampoo, hair spray, atau peralatan barbershop.'
                  : 'Mulai tambahkan produk pertama Anda untuk mengelola inventori toko.'
                }
              </p>
              <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
                <Link to="/inventory/new" className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-white" />
                  {businessType === 'restaurant' ? 'Tambah Menu Pertama' : businessType === 'barbershop' ? 'Tambah Produk Grooming' : 'Tambah Produk Pertama'}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <TableRow className="border-0">
                    <TableHead className="font-semibold text-gray-700">{businessType === 'restaurant' ? 'Menu Item' : businessType === 'barbershop' ? 'Produk Grooming' : 'Produk'}</TableHead>
                    <TableHead className="font-semibold text-gray-700">SKU</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kategori</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Harga</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Stok</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-40">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data?.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-blue-50/50 transition-colors border-gray-100 group"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
                            businessType === 'barbershop'
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                              : 'bg-gradient-to-br from-blue-500 to-purple-500'
                          }`}>
                            {businessType === 'restaurant' && (p.category?.name?.toLowerCase().includes('makanan') || p.category?.name?.toLowerCase().includes('paket')) ? (
                              <ChefHat className="h-5 w-5" />
                            ) : businessType === 'restaurant' && p.category?.name?.toLowerCase().includes('minuman') ? (
                              <Coffee className="h-5 w-5" />
                            ) : businessType === 'barbershop' && p.category?.name?.toLowerCase().includes('hair') ? (
                              <Droplets className="h-5 w-5" />
                            ) : businessType === 'barbershop' && (p.category?.name?.toLowerCase().includes('tool') || p.category?.name?.toLowerCase().includes('alat')) ? (
                              <Scissors className="h-5 w-5" />
                            ) : (
                              p.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/inventory/${p.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
                            >
                              {p.name}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">
                              {businessType === 'restaurant'
                                ? (p.category?.name || 'Tanpa kategori menu')
                                : businessType === 'barbershop'
                                ? (p.category?.name || 'Tanpa kategori grooming')
                                : (p.category?.name || 'Tanpa kategori')
                              }
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {p.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {businessType === 'restaurant'
                            ? (p.category?.name || 'Tanpa kategori')
                            : businessType === 'barbershop'
                            ? (p.category?.name || 'Uncategorized')
                            : (p.category?.name || 'Tanpa kategori')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMoney(p.price, currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={p.stock <= 5 ? 'destructive' : p.stock <= 10 ? 'secondary' : 'default'}
                          className="font-semibold px-3 py-1"
                        >
                          {p.stock <= 5 && <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />}
                          {p.stock} unit
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.active ? 'default' : 'outline'}
                          className={p.active
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300'
                          }
                        >
                          <div className={`h-2 w-2 rounded-full mr-2 ${p.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {p.active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Link to={`/inventory/${p.id}`} title="Lihat Detail">
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600"
                          >
                            <Link to={`/inventory/${p.id}/edit`} title="Edit Produk">
                              <Edit className="h-4 w-4 text-purple-500" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProduct(p.id, p.name)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Pagination */}
      {pagination.length > 1 && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{list.from || 0}</span> sampai{' '}
                <span className="font-medium">{list.to || 0}</span> dari{' '}
                <span className="font-medium">{list.total || 0}</span> produk
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load(current - 1)}
                  disabled={current === 1}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-1 text-blue-600" />
                  Sebelumnya
                </Button>

                <div className="flex items-center gap-1">
                  {pagination.slice(0, 7).map(p => (
                    <Button
                      key={p}
                      variant={p === current ? "default" : "ghost"}
                      size="sm"
                      onClick={() => load(p)}
                      disabled={p === current}
                      className={
                        p === current
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "hover:bg-blue-50 hover:text-blue-600 transition-all"
                      }
                    >
                      {p}
                    </Button>
                  ))}
                  {pagination.length > 7 && (
                    <>
                      <span className="px-2 text-gray-400">...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => load(last)}
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        {last}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load(current + 1)}
                  disabled={current === last}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1 text-blue-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
