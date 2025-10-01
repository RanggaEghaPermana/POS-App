import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import { LoadingSpinner } from '../components/ui/loading'
import useCurrency from '../hooks/useCurrency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import {
  Package, TrendingUp, TrendingDown, AlertTriangle,
  DollarSign, Clock, BarChart3, Filter, Calendar, Scissors
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function InventoryReport(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  async function load(){
    setLoading(true)

    try{
      // Try to get real data from API first
      const response = await apiGet(`/reports/inventory?days=${days}`, token)
      setData(response)
    }catch(e){
      console.warn('API not available, generating report from existing data', e.message)

      // Generate real data from localStorage/existing data
      await generateRealInventoryReport()
    } finally { setLoading(false) }
  }

  async function generateRealInventoryReport(){
    try {
      // Get actual products from inventory
      let products = []
      try {
        products = JSON.parse(localStorage.getItem('barbershop_products') || '[]')
      } catch {
        // Fallback to default barbershop products if no data
        products = [
          { id: 1, name: 'Pomade Classic Hold 100ml', stock: 25, buy_price: 45000, sell_price: 65000 },
          { id: 2, name: 'Hair Wax Strong Hold 85g', stock: 18, buy_price: 35000, sell_price: 50000 },
          { id: 3, name: 'Beard Oil Premium 30ml', stock: 32, buy_price: 55000, sell_price: 75000 },
          { id: 4, name: 'Aftershave Lotion 250ml', stock: 12, buy_price: 25000, sell_price: 35000 },
          { id: 5, name: 'Hair Styling Gel 150ml', stock: 22, buy_price: 20000, sell_price: 30000 },
          { id: 6, name: 'Shampoo Anti-Dandruff 400ml', stock: 15, buy_price: 30000, sell_price: 45000 },
          { id: 7, name: 'Face Wash Men 100ml', stock: 28, buy_price: 18000, sell_price: 25000 },
          { id: 8, name: 'Hair Serum Repair 50ml', stock: 8, buy_price: 40000, sell_price: 60000 },
          { id: 9, name: 'Beard Balm Natural 60g', stock: 10, buy_price: 32000, sell_price: 48000 },
          { id: 10, name: 'Hair Tonic Growth 200ml', stock: 6, buy_price: 28000, sell_price: 42000 },
          { id: 11, name: 'Cologne Fresh 100ml', stock: 14, buy_price: 35000, sell_price: 55000 },
          { id: 12, name: 'Clay Hair Mask 150g', stock: 4, buy_price: 25000, sell_price: 40000 },
          { id: 13, name: 'Hair Spray Extra Hold 300ml', stock: 15, buy_price: 22000, sell_price: 32000 },
          { id: 14, name: 'Mustache Wax Vintage 25g', stock: 12, buy_price: 15000, sell_price: 25000 },
          { id: 15, name: 'Scalp Treatment Oil 50ml', stock: 8, buy_price: 45000, sell_price: 70000 }
        ]
      }

      // Get actual sales data
      let salesData = []
      try {
        salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      } catch {
        salesData = []
      }

      // Calculate stock valuation from real products
      const stock_valuation = products.reduce((total, product) => {
        return total + ((product.stock || 0) * (product.buy_price || 0))
      }, 0)

      // Calculate sales within the specified period
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))

      const recentSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= cutoffDate
      })

      // Calculate product sales from real sales data
      const productSales = {}
      recentSales.forEach(sale => {
        if (sale.items) {
          sale.items.forEach(item => {
            const productName = item.product_name || item.name
            if (productName) {
              if (!productSales[productName]) {
                productSales[productName] = { qty: 0, id: item.id || Math.random() }
              }
              productSales[productName].qty += (item.quantity || 1)
            }
          })
        }
      })

      // Convert to arrays and sort
      const salesArray = Object.entries(productSales).map(([name, data]) => ({
        id: data.id,
        name: name,
        sold_qty: data.qty
      })).sort((a, b) => b.sold_qty - a.sold_qty)

      // Categorize products based on sales performance
      const fast_moving = salesArray.filter(item => item.sold_qty >= 15) // High sales
      const slow_moving = salesArray.filter(item => item.sold_qty >= 1 && item.sold_qty < 15) // Some sales

      // Dead stock: products with stock but no sales
      const soldProductNames = new Set(salesArray.map(item => item.name))
      const dead_stock = products
        .filter(product =>
          !soldProductNames.has(product.name) && (product.stock || 0) > 0
        )
        .map(product => ({
          id: product.id,
          name: product.name,
          stock: product.stock || 0
        }))

      const reportData = {
        stock_valuation,
        fast_moving: fast_moving.slice(0, 10), // Top 10
        slow_moving: slow_moving.slice(0, 10), // Top 10 slow movers
        dead_stock
      }

      setData(reportData)

    } catch (error) {
      console.error('Error generating inventory report:', error)
      // Fallback to empty data structure
      setData({
        stock_valuation: 0,
        fast_moving: [],
        slow_moving: [],
        dead_stock: []
      })
    }
  }
  useEffect(()=>{ (async()=>{ load() })() },[])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Laporan Inventory Barbershop</h1>
                <p className="text-green-100">Analisis performa stok produk grooming dan perawatan</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/reports" className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Laporan Lain
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Period Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-green-600" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="days">Periode Analisis (hari)</Label>
              <Input
                id="days"
                type="number"
                value={days}
                onChange={e=>setDays(e.target.value)}
                className="w-32 h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 transition-all"
                min="1"
                max="365"
              />
            </div>
            <Button
              onClick={load}
              className="h-10 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {!data || loading ? (
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground gap-2">
          <LoadingSpinner size="sm" />
          <span>Memuat data inventory...</span>
        </div>
      ) : (
        <>
          {/* Stock Valuation Overview */}
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="rounded-full bg-green-100 p-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Valuasi Stok Grooming</p>
                      <p className="text-4xl font-bold text-green-600">{formatMoney(data.stock_valuation, currency)}</p>
                    </div>
                  </div>
                  <p className="text-gray-500">Nilai total produk grooming dan perawatan di inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fast Moving Products */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Produk Grooming Terlaris
                </CardTitle>
                <CardDescription>
                  Produk perawatan dengan penjualan tertinggi dalam {days} hari terakhir
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.fast_moving?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada produk grooming terlaris</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold text-gray-700">Produk</th>
                          <th className="text-center py-2 font-semibold text-gray-700">Qty Terjual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.fast_moving.map((r, index) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium">{r.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <Badge className="bg-green-500 text-white">
                                {r.sold_qty}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slow Moving Products */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Produk Grooming Slow Moving
                </CardTitle>
                <CardDescription>
                  Produk perawatan dengan penjualan rendah (perlu promosi)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.slow_moving?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Semua produk grooming bergerak dengan baik</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold text-gray-700">Produk</th>
                          <th className="text-center py-2 font-semibold text-gray-700">Qty Terjual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slow_moving.map((r, index) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium">{r.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <Badge className="bg-orange-500 text-white">
                                {r.sold_qty}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dead Stock */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Dead Stock Grooming
              </CardTitle>
              <CardDescription>
                Produk grooming yang tidak terjual dalam {days} hari terakhir (perlu evaluasi)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.dead_stock?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Scissors className="h-16 w-16 mx-auto mb-4 text-green-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Grooming Optimal!</h3>
                  <p>Semua produk perawatan bergerak dengan baik. Manajemen stok efisien!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold text-gray-700">Produk</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Stok Tersisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dead_stock.map((r, index) => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs">
                                !
                              </div>
                              <span className="font-medium">{r.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                              {r.stock}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
