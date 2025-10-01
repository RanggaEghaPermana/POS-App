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
import { Badge } from '../components/ui/badge'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Plus, FolderOpen, Search, Filter, Edit, Eye, Package,
  ChevronLeft, ChevronRight, MoreHorizontal, Trash2,
  Star, TrendingUp, AlertTriangle, Scissors, Droplets,
  ImageIcon, Tag, Camera, ShoppingBag
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function InventoryCards(){
  const { token, logout, user, activeTenant } = useAuth()
  const currency = useCurrency('IDR')
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [cats, setCats] = useState([])
  const [list, setList] = useState({ data:[], meta:{} })
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)

  // Get business type
  const businessType = activeTenant?.business_type || 'general'

  async function loadCats(){
    try {
      // Try authenticated endpoint first, fallback to setup endpoint
      let result
      try {
        result = await apiGet('/categories?per_page=100', token)
      } catch {
        result = await apiGet('/setup/categories?per_page=100', token)
      }
      setCats(result.data||[])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }
  async function load(page=1){
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if(q) p.set('q', q)
      if(categoryId && categoryId !== 'all') p.set('category_id', categoryId)
      p.set('per_page', 20); p.set('page', page)

      // Try authenticated endpoint first, fallback to setup endpoint
      let data
      try {
        data = await apiGet(`/admin/products?${p.toString()}`, token)
      } catch {
        data = await apiGet(`/setup/admin/products?${p.toString()}`, token)
      }
      setList(data)
    } catch (error) {
      console.error('Error loading products:', error)
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

  const pagination = []
  const current = list.current_page || 1
  const last = list.last_page || 1
  for(let i=1;i<=last;i++){ pagination.push(i) }

  return (
    <div className="min-h-screen bg-gray-50/30 space-y-6">
      {/* Header Section - Modern & Clean */}
      <div className="bg-white border-b border-gray-200/60 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {businessType === 'barbershop' ? 'Produk Grooming Collection' : 'Inventori Produk'}
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              {businessType === 'barbershop'
                ? 'Koleksi lengkap produk perawatan rambut dan tools barbershop profesional'
                : 'Kelola semua produk toko Anda dalam satu tempat'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg">
              <Link to="/inventory/new" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {businessType === 'barbershop' ? 'Tambah Produk Grooming' : 'Tambah Produk'}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Produk</p>
                  <p className="text-2xl font-bold text-gray-900">{list.total || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kategori</p>
                  <p className="text-2xl font-bold text-gray-900">{cats.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stok Rendah</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {list.data?.filter(p => p.stock < 10).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Produk Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {list.data?.filter(p => p.active).length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="relative lg:col-span-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={businessType === 'barbershop'
                    ? "Cari pomade, shampoo, hair spray, alat cukur..."
                    : "Cari nama produk atau SKU..."
                  }
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
              <div className="lg:col-span-4">
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
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
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 mt-4">Memuat produk...</p>
            </div>
          </div>
        ) : list.data?.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12">
              <div className="text-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {businessType === 'barbershop' ? (
                    <Scissors className="h-10 w-10 text-gray-400" />
                  ) : (
                    <Package className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {businessType === 'barbershop' ? 'Belum ada produk grooming' : 'Belum ada produk'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {businessType === 'barbershop'
                    ? 'Mulai tambahkan produk grooming seperti pomade, hair wax, shampoo, dan peralatan barbershop.'
                    : 'Mulai tambahkan produk pertama untuk mengelola inventori toko Anda.'
                  }
                </p>
                <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
                  <Link to="/inventory/new" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {businessType === 'barbershop' ? 'Tambah Produk Grooming' : 'Tambah Produk Pertama'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.data?.map((p, index) => (
              <Card key={p.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:scale-[1.02] overflow-hidden">
                {/* Product Image */}
                <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg ${
                        businessType === 'barbershop'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                          : 'bg-gradient-to-br from-slate-500 to-slate-700'
                      }`}>
                        {businessType === 'barbershop' && p.category?.name?.toLowerCase().includes('hair') ? (
                          <Droplets className="h-10 w-10" />
                        ) : businessType === 'barbershop' && (p.category?.name?.toLowerCase().includes('tool') || p.category?.name?.toLowerCase().includes('alat')) ? (
                          <Scissors className="h-10 w-10" />
                        ) : businessType === 'barbershop' ? (
                          <ShoppingBag className="h-10 w-10" />
                        ) : (
                          <Package className="h-10 w-10" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`
                        backdrop-blur-sm border-0 text-xs font-semibold shadow-lg
                        ${p.stock > 10
                          ? "bg-emerald-600 text-white"
                          : p.stock > 0
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white"
                        }
                      `}
                    >
                      {p.stock} stok
                    </Badge>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={`
                        backdrop-blur-sm border-0 text-xs font-semibold shadow-lg
                        ${p.active
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                        }
                      `}
                    >
                      {p.active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Product Title & Category */}
                  <div className="space-y-2">
                    <Link
                      to={`/inventory/${p.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block text-sm leading-tight line-clamp-2 group-hover:text-blue-600"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Tag className="h-3 w-3" />
                      <span>{p.category?.name || 'Tanpa kategori'}</span>
                    </div>
                  </div>

                  {/* SKU */}
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono text-gray-600 flex-1">
                      {p.sku}
                    </code>
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-xl font-bold text-gray-900">
                      {formatMoney(p.price, currency)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {businessType === 'barbershop' ? 'Harga produk grooming' : 'Harga jual'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs"
                    >
                      <Link to={`/inventory/${p.id}`} className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Detail
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 border-gray-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 text-xs"
                    >
                      <Link to={`/inventory/${p.id}/edit`} className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProduct(p.id, p.name)}
                      className="h-9 w-9 p-0 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                      title="Hapus Produk"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modern Pagination */}
        {pagination.length > 1 && (
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{list.from || 0}</span> sampai{' '}
                  <span className="font-semibold">{list.to || 0}</span> dari{' '}
                  <span className="font-semibold">{list.total || 0}</span> produk
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => load(current - 1)}
                    disabled={current === 1}
                    className="hover:bg-gray-50 border-gray-200"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
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
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "hover:bg-gray-100 text-gray-600"
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
                          className="hover:bg-gray-100 text-gray-600"
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
                    className="hover:bg-gray-50 border-gray-200"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}