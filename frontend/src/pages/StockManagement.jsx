import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { formatDateOnly, formatTimeOnly } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  Boxes, Search, Plus, Minus, Package, AlertTriangle, CheckCircle,
  History, TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

// Mock barbershop products for stock management when API is unavailable
function getMockBarbershopProductsForStock() {
  return [
    {
      id: 1,
      name: 'Pomade Classic Hold',
      sku: 'PMD-001',
      stock: 15,
      category: { name: 'Styling Products' }
    },
    {
      id: 2,
      name: 'Hair Wax Strong Hold',
      sku: 'WAX-002',
      stock: 8,
      category: { name: 'Styling Products' }
    },
    {
      id: 3,
      name: 'Shampoo Professional 500ml',
      sku: 'SHP-003',
      stock: 22,
      category: { name: 'Hair Care' }
    },
    {
      id: 4,
      name: 'Hair Clipper Professional',
      sku: 'HCP-004',
      stock: 3,
      category: { name: 'Tools & Equipment' }
    },
    {
      id: 5,
      name: 'Beard Oil Premium',
      sku: 'BOL-005',
      stock: 12,
      category: { name: 'Hair Care' }
    }
  ]
}

export default function StockManagement(){
  const { token, activeTenant } = useAuth()

  // Get business type
  const businessType = activeTenant?.business_type || 'general'
  const [products, setProducts] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [stockHistory, setStockHistory] = useState({ data: [], meta: {} })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment: '',
    reason: '',
    notes: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Predefined reasons for stock adjustments
  const adjustmentReasons = [
    'Stok rusak/expired',
    'Kehilangan produk',
    'Kesalahan pencatatan',
    'Produk habis dipakai trial',
    'Penyesuaian stok fisik',
    'Pengembalian dari customer',
    'Promo/sample gratis',
    'Lainnya'
  ]

  async function loadProducts() {
    try {
      setLoading(true)

      // For barbershop demo mode, always check localStorage first
      if (businessType === 'barbershop') {
        const inventoryCleared = localStorage.getItem('barbershop_inventory_cleared')
        if (inventoryCleared === 'true') {
          // Show empty inventory regardless of API response
          setProducts([])
          return
        }

        // Check for saved products
        const savedProducts = localStorage.getItem('barbershop_products_data')
        if (savedProducts) {
          let productData = JSON.parse(savedProducts)
          // Map to stock management format
          const stockProducts = productData.map(p => ({
            ...p,
            category: p.category || { name: 'Uncategorized' }
          }))
          setProducts(stockProducts)
          return
        }
      }

      // Try API endpoints for non-barbershop or when no localStorage data exists
      let response
      try {
        response = await apiGet(`/admin/products?per_page=100&q=${encodeURIComponent(searchQuery)}`, token)
      } catch {
        response = await apiGet(`/setup/admin/products?per_page=100&q=${encodeURIComponent(searchQuery)}`, token)
      }
      setProducts(response.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      // Fallback to mock products for barbershop
      if (businessType === 'barbershop') {
        setProducts(getMockBarbershopProductsForStock())
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadLowStockAlerts() {
    try {
      let response
      try {
        response = await apiGet('/admin/products/low-stock-alerts?threshold=10', token)
      } catch {
        response = await apiGet('/setup/admin/products/low-stock-alerts?threshold=10', token)
      }
      setLowStockAlerts(response.alerts || response.data || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
    }
  }

  async function loadStockHistory() {
    try {
      let response
      try {
        response = await apiGet('/admin/products/stock-history?per_page=20', token)
      } catch {
        response = await apiGet('/setup/admin/products/stock-history?per_page=20', token)
      }
      setStockHistory(response)
    } catch (error) {
      console.error('Error loading stock history:', error)
      // Set empty data if both endpoints fail
      setStockHistory({ data: [], meta: {} })
    }
  }

  async function adjustStock(productId) {
    const adjustmentValue = parseInt(adjustmentForm.adjustment) || 0

    if (adjustmentValue === 0 || !adjustmentForm.reason) {
      alert('Harap isi jumlah penyesuaian yang valid dan alasan')
      return
    }

    try {
      setLoading(true)
      const requestData = {
        adjustment: adjustmentValue,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes
      }

      let response
      try {
        response = await apiPost(`/admin/products/${productId}/adjust-stock`, requestData, token)
      } catch {
        response = await apiPost(`/setup/admin/products/${productId}/adjust-stock`, requestData, token)
      }

      if (response.success) {
        alert(`Stok berhasil disesuaikan. Perubahan: ${response.stock_change > 0 ? '+' : ''}${response.stock_change}`)
        setAdjustmentForm({ adjustment: '', reason: '', notes: '' })
        setSelectedProduct(null)
        await loadProducts()
        await loadLowStockAlerts()
        await loadStockHistory()
      }
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Gagal menyesuaikan stok')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    loadLowStockAlerts()
    loadStockHistory()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Habis</Badge>
    } else if (stock <= 5) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Rendah</Badge>
    } else if (stock <= 10) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Sedang</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Aman</Badge>
  }

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {businessType === 'barbershop' ? 'Manajemen Stok Produk Grooming' : 'Manajemen Stok Produk'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {businessType === 'barbershop'
              ? 'Kelola stok fisik produk grooming dan perawatan dengan mudah'
              : 'Kelola stok fisik produk dengan sistem penyesuaian yang akurat'
            }
          </p>
        </div>
        <Button onClick={() => { loadProducts(); loadLowStockAlerts(); loadStockHistory() }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alert Stok Rendah ({lowStockAlerts.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.slice(0, 6).map(alert => (
                <div key={alert.id} className="bg-white p-4 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{alert.name}</h4>
                    <span className={`text-sm font-medium ${getUrgencyColor(alert.urgency)}`}>
                      {alert.urgency === 'critical' ? 'Kritis' : alert.urgency === 'high' ? 'Tinggi' : 'Sedang'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">SKU: {alert.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-orange-600">
                      Stok: {alert.current_stock}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedProduct(products.find(p => p.id === alert.id))}
                      className="h-6 text-xs"
                    >
                      Atur Stok
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                {businessType === 'barbershop' ? 'Daftar Produk Grooming' : 'Daftar Produk'}
              </CardTitle>
              <CardDescription>
                Klik produk untuk menyesuaikan stok
              </CardDescription>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Stok</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Tidak ada produk ditemukan
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map(product => (
                        <TableRow
                          key={product.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                              <div className="text-sm text-gray-500">
                                {product.category?.name || 'Tanpa kategori'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-lg font-semibold">{product.stock}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockBadge(product.stock)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(product)
                              }}
                            >
                              Atur Stok
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Adjustment Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-green-600" />
                Penyesuaian Stok
              </CardTitle>
              <CardDescription>
                {selectedProduct ? `Atur stok untuk ${selectedProduct.name}` : 'Pilih produk untuk menyesuaikan stok'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">{selectedProduct.name}</h4>
                    <p className="text-sm text-blue-700">SKU: {selectedProduct.sku}</p>
                    <p className="text-lg font-bold text-blue-900 mt-2">
                      Stok Saat Ini: {selectedProduct.stock}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="adjustment">Penyesuaian Stok</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdjustmentForm(prev => ({ ...prev, adjustment: '-1' }))}
                        className="px-3"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        id="adjustment"
                        type="number"
                        placeholder="0"
                        value={adjustmentForm.adjustment}
                        onChange={(e) => setAdjustmentForm(prev => ({ ...prev, adjustment: e.target.value }))}
                        className="text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAdjustmentForm(prev => ({ ...prev, adjustment: '1' }))}
                        className="px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Gunakan + untuk menambah, - untuk mengurangi
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="reason">Alasan Penyesuaian</Label>
                    <Select
                      value={adjustmentForm.reason}
                      onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih alasan" />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustmentReasons.map(reason => (
                          <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan tambahan..."
                      value={adjustmentForm.notes}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => adjustStock(selectedProduct.id)}
                      disabled={!adjustmentForm.adjustment || !adjustmentForm.reason || loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProduct(null)}
                    >
                      Batal
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Pilih produk dari daftar untuk mulai menyesuaikan stok</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Stock History */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Riwayat Perubahan Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stockHistory.data?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada riwayat perubahan stok
                  </p>
                ) : (
                  stockHistory.data?.slice(0, 10).map(movement => (
                    <div key={movement.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className={`p-1 rounded ${
                        movement.quantity > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {movement.quantity > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {movement.product?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity} • {movement.reason}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeOnly(movement.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}