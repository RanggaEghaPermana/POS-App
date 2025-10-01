import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { LoadingSpinner } from '../components/ui/loading'
import {
  ArrowLeft, Edit, Package, Hash, FolderOpen, Banknote,
  Calendar, Building2, Truck, Tag, ImageIcon, Camera,
  ShoppingBag, Scissors, Droplets, PrinterIcon, Star,
  TrendingUp, AlertTriangle, Eye, BarChart3, Clock
} from 'lucide-react'

export default function ProductDetailModern(){
  const { id } = useParams()
  const { token, logout, activeTenant } = useAuth()
  const currency = useCurrency('IDR')
  const [product, setProduct] = useState(null)
  const [barcodeUrl, setBarcodeUrl] = useState('')
  const [loading, setLoading] = useState(true)

  // Get business type
  const businessType = activeTenant?.business_type || 'general'

  useEffect(()=>{ (async()=>{
    try{
      let p
      try {
        p = await apiGet(`/admin/products/${id}`, token)
      } catch {
        p = await apiGet(`/setup/admin/products/${id}`, token)
      }
      setProduct(p)
    }catch(e){
      console.error('Error loading product:', e.message)
    } finally {
      setLoading(false)
    }
  })() },[id])

  useEffect(()=>{ (async()=>{
    try{
      const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'

      // Add tenant headers
      const headers = { Authorization: `Bearer ${token}` }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      let res
      try {
        res = await fetch(`${base}/admin/products/${id}/barcode`, { headers })
      } catch {
        res = await fetch(`${base}/setup/admin/products/${id}/barcode`, { headers: { Authorization: `Bearer ${token}` } })
      }

      if (res.ok) {
        const blob = await res.blob()
        setBarcodeUrl(URL.createObjectURL(blob))
      }
    }catch(e){
      console.log('Barcode not available:', e.message)
    }
  })() },[id, token, activeTenant])

  if(loading) return (
    <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">Memuat detail produk...</p>
      </div>
    </div>
  )

  if(!product) return (
    <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Produk Tidak Ditemukan</h3>
          <p className="text-gray-600 mb-6">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
          <Button asChild className="bg-gray-900 hover:bg-gray-800">
            <Link to="/inventory">Kembali ke Inventori</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50/30 space-y-6">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200/60 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="border-gray-300">
              <Link to="/inventory" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Detail Produk {businessType === 'barbershop' ? 'Grooming' : ''}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Informasi lengkap produk {product.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Link to={`/inventory/${id}/edit`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Produk
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image & Basic Info */}
          <Card className="border-0 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Product Image */}
                <div className="relative h-80 bg-gradient-to-br from-gray-50 to-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-xl ${
                        businessType === 'barbershop'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                          : 'bg-gradient-to-br from-slate-500 to-slate-700'
                      }`}>
                        {businessType === 'barbershop' && product.category?.name?.toLowerCase().includes('hair') ? (
                          <Droplets className="h-12 w-12" />
                        ) : businessType === 'barbershop' && (product.category?.name?.toLowerCase().includes('tool') || product.category?.name?.toLowerCase().includes('alat')) ? (
                          <Scissors className="h-12 w-12" />
                        ) : businessType === 'barbershop' ? (
                          <ShoppingBag className="h-12 w-12" />
                        ) : (
                          <Package className="h-12 w-12" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <Badge
                      className={`
                        backdrop-blur-sm border-0 text-sm font-semibold shadow-lg
                        ${product.active
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-white"
                        }
                      `}
                    >
                      {product.active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <div className="absolute top-4 left-4">
                    <Badge
                      className={`
                        backdrop-blur-sm border-0 text-sm font-semibold shadow-lg
                        ${product.stock > 10
                          ? "bg-emerald-600 text-white"
                          : product.stock > 0
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white"
                        }
                      `}
                    >
                      {product.stock} stok
                    </Badge>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Tag className="h-4 w-4" />
                      <span>{product.category?.name || 'Tanpa kategori'}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      {businessType === 'barbershop' ? 'Harga Produk Grooming' : 'Harga Jual'}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatMoney(product.price, currency)}
                    </p>
                  </div>

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Hash className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">SKU</p>
                        <code className="font-mono text-sm font-medium">{product.sku}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Package className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Stok Tersedia</p>
                        <p className="font-medium">{product.stock} {businessType === 'barbershop' ? 'unit' : 'pcs'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extended Information */}
          {(product.brand || product.supplier || product.notes || product.weight || product.dimensions) && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Informasi Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.brand && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Brand</p>
                      <p className="font-medium">{product.brand}</p>
                    </div>
                  )}

                  {product.supplier && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Supplier</p>
                      <p className="font-medium">{product.supplier}</p>
                    </div>
                  )}

                  {product.weight && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Berat</p>
                      <p className="font-medium">{product.weight}</p>
                    </div>
                  )}

                  {product.dimensions && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Dimensi</p>
                      <p className="font-medium">{product.dimensions}</p>
                    </div>
                  )}
                </div>

                {product.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Catatan</p>
                    <p className="font-medium">{product.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dynamic Fields for Barbershop */}
          {businessType === 'barbershop' && product.dynamic_fields && Object.keys(product.dynamic_fields).length > 0 && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-amber-600" />
                  Informasi Grooming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.dynamic_fields).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Statistik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <Badge variant={product.active ? "default" : "secondary"}>
                  {product.active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stok Level</span>
                <Badge
                  variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                  className={
                    product.stock > 10
                      ? "bg-green-100 text-green-800"
                      : product.stock > 0
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {product.stock > 10 ? 'Aman' : product.stock > 0 ? 'Rendah' : 'Habis'}
                </Badge>
              </div>

              {product.minimum_stock && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Stok Minimum</span>
                  <span className="font-medium">{product.minimum_stock}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Info */}
          {(product.cost_price || product.margin_percentage || product.tax_rate) && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-blue-600" />
                  Informasi Keuangan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.cost_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Harga Modal</span>
                    <span className="font-medium">{formatMoney(product.cost_price, currency)}</span>
                  </div>
                )}

                {product.margin_percentage && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Margin</span>
                    <span className="font-medium">{product.margin_percentage}%</span>
                  </div>
                )}

                {product.tax_rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-medium">{product.tax_rate}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Barcode */}
          {barcodeUrl && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PrinterIcon className="h-5 w-5 text-purple-600" />
                  Barcode
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <img src={barcodeUrl} alt="Barcode" className="mx-auto max-w-full" />
                <p className="text-xs text-gray-500 mt-2">Barcode untuk produk {product.sku}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4 space-y-3">
              <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
                <Link to={`/inventory/${id}/edit`} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Produk
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full border-gray-300">
                <Link to="/inventory" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Inventori
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}