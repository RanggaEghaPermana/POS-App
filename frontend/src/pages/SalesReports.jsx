import { useEffect, useState } from 'react'
import useCurrency from '../hooks/useCurrency'
import { LoadingSpinner } from '../components/ui/loading'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Link } from 'react-router-dom'
import { Pie, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import {
  BarChart3, Search, Filter, Calendar, Users, Scissors,
  DollarSign, TrendingUp, Receipt, Clock, User, Award, Crown
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

export default function SalesReports(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().slice(0,10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [data, setData] = useState(null)

  async function load(){
    setLoading(true)
    const p = new URLSearchParams()
    if(from) p.set('from', from)
    if(to) p.set('to', to)
    if(barberId) p.set('barber_id', barberId)
    if(serviceId) p.set('service_id', serviceId)

    try{
      // Try API first
      const apiData = await apiGet(`/setup/reports/barbershop-sales?${p.toString()}`, token)
      setData(apiData)
    }catch(e){
      console.warn('API not available, generating report from real data', e.message)
      // Generate real data from existing sales and services
      await generateRealSalesReport()
    } finally { setLoading(false) }
  }

  async function generateRealSalesReport() {
    try {
      // Get real sales data
      let salesData = []
      try {
        salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      } catch {
        salesData = []
      }

      // Filter sales by date range
      const fromDate = new Date(from)
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999) // Include full end date

      const filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= fromDate && saleDate <= toDate
      })

      // Filter by barber if specified
      const barberFilteredSales = barberId
        ? filteredSales.filter(sale => sale.barber?.id == barberId || sale.items?.some(item => item.barber_id == barberId))
        : filteredSales

      // Filter by service if specified
      const finalSales = serviceId
        ? barberFilteredSales.filter(sale => sale.items?.some(item => item.service_id == serviceId || item.id == serviceId))
        : barberFilteredSales

      // Calculate summary
      const revenue = finalSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const transactions = finalSales.length
      const services_provided = finalSales.reduce((sum, sale) => sum + (sale.items?.length || 1), 0)
      const avg_per_txn = transactions > 0 ? Math.round(revenue / transactions) : 0
      const total_customers = new Set(finalSales.map(sale => sale.customer_name || sale.customer?.name || 'Unknown')).size

      // Calculate by service
      const serviceStats = {}
      finalSales.forEach(sale => {
        if (sale.items) {
          sale.items.forEach(item => {
            const serviceName = item.service_name || item.product_name || item.name || 'Unknown Service'
            if (!serviceStats[serviceName]) {
              serviceStats[serviceName] = { qty: 0, revenue: 0, id: item.id || Math.random() }
            }
            serviceStats[serviceName].qty += (item.quantity || 1)
            serviceStats[serviceName].revenue += (item.price || item.sub_total || 0) * (item.quantity || 1)
          })
        }
      })

      const byService = Object.entries(serviceStats)
        .map(([name, data]) => ({ id: data.id, name, qty: data.qty, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)

      // Calculate by barber
      const barberStats = {}
      finalSales.forEach(sale => {
        const barberName = sale.barber?.name || sale.items?.[0]?.barber_name || 'Unknown Barber'
        const barberId = sale.barber?.id || sale.items?.[0]?.barber_id || Math.random()

        if (!barberStats[barberName]) {
          barberStats[barberName] = { txns: 0, revenue: 0, id: barberId }
        }
        barberStats[barberName].txns += 1
        barberStats[barberName].revenue += (sale.grand_total || 0)
      })

      const byBarber = Object.entries(barberStats)
        .map(([name, data]) => ({ id: data.id, name, txns: data.txns, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)

      // Calculate by payment method
      const paymentStats = {}
      finalSales.forEach(sale => {
        const method = sale.payment_method || 'cash'
        if (!paymentStats[method]) {
          paymentStats[method] = 0
        }
        paymentStats[method] += (sale.grand_total || 0)
      })

      const byPayment = Object.entries(paymentStats)
        .map(([method, amount]) => ({ method, amount }))
        .sort((a, b) => b.amount - a.amount)

      // Calculate by hour
      const hourStats = {}
      for (let h = 8; h <= 20; h++) {
        hourStats[h] = { revenue: 0, txns: 0 }
      }

      finalSales.forEach(sale => {
        const hour = new Date(sale.created_at).getHours()
        if (hourStats[hour]) {
          hourStats[hour].revenue += (sale.grand_total || 0)
          hourStats[hour].txns += 1
        }
      })

      const byHour = Object.entries(hourStats)
        .map(([hour, data]) => ({
          hour: `${hour.padStart(2, '0')}:00`,
          revenue: data.revenue,
          txns: data.txns
        }))

      const reportData = {
        summary: {
          revenue,
          transactions,
          services_provided,
          avg_per_txn,
          total_customers
        },
        byService: byService.length > 0 ? byService : [],
        byBarber: byBarber.length > 0 ? byBarber : [],
        byPayment: byPayment.length > 0 ? byPayment : [{ method: 'cash', amount: 0 }],
        byHour,
        // Backward compatibility
        byProduct: byService,
        byCashier: byBarber,
        byCategory: []
      }

      setData(reportData)

    } catch (error) {
      console.error('Error generating sales report:', error)
      setData({
        summary: { revenue: 0, transactions: 0, services_provided: 0, avg_per_txn: 0, total_customers: 0 },
        byService: [],
        byBarber: [],
        byPayment: [{ method: 'cash', amount: 0 }],
        byHour: [],
        byProduct: [],
        byCashier: [],
        byCategory: []
      })
    }
  }
  useEffect(()=>{ (async()=>{
    // Load barbers data
    try{
      const barbersData = await apiGet('/barbers', token)
      setBarbers(barbersData.data || barbersData || [])
    }catch{
      // Mock barbers data
      setBarbers([
        { id: 1, name: 'Budi Santoso' },
        { id: 2, name: 'Andi Wijaya' },
        { id: 3, name: 'Reza Ahmad' }
      ])
    }

    // Load services data
    try{
      const servicesData = await apiGet('/setup/services', token)
      setServices(servicesData.data || servicesData || [])
    }catch{
      // Mock services data
      setServices([
        { id: 1, name: 'Cukur Rambut + Cuci' },
        { id: 2, name: 'Styling Modern' },
        { id: 3, name: 'Potong Jenggot' },
        { id: 4, name: 'Paket Lengkap' },
        { id: 5, name: 'Cuci Rambut' }
      ])
    }

    load()
  })() },[])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Laporan Penjualan Barbershop</h1>
                <p className="text-blue-100">Analisis performa layanan, barber, dan tren bisnis barbershop</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <Label htmlFor="from">Dari Tanggal</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={e=>setFrom(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="to">Sampai Tanggal</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={e=>setTo(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="lg:col-span-3">
              <Label htmlFor="barber">Barber</Label>
              <select
                id="barber"
                value={barberId}
                onChange={e=>setBarberId(e.target.value)}
                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
              >
                <option value="">Semua Barber</option>
                {barbers.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-3">
              <Label htmlFor="service">Jenis Layanan</Label>
              <select
                id="service"
                value={serviceId}
                onChange={e=>setServiceId(e.target.value)}
                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-md transition-all"
              >
                <option value="">Semua Layanan</option>
                {services.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={load}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Filter className="h-4 w-4 mr-2" />
                Terapkan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!data || loading ? (
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground gap-2">
          <LoadingSpinner size="sm" />
          <span>Memuat data laporan...</span>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-100 p-3">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(data.summary.revenue, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-green-100 p-3">
                      <Scissors className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Layanan Treatment</p>
                    <p className="text-2xl font-bold text-gray-900">{data.summary.transactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-purple-100 p-3">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Rata-rata/Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(data.summary.avg_per_txn, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-orange-100 p-3">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Pelanggan</p>
                    <p className="text-2xl font-bold text-gray-900">{data.summary.total_customers || data.summary.items_sold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Metode Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Pie data={{ labels: data.byPayment.map(p=>String(p.method).toUpperCase()), datasets:[{ data: data.byPayment.map(p=>p.amount), backgroundColor:['#60a5fa','#34d399','#fbbf24','#f472b6','#c084fc'] }] }} />
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Performa per Barber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold text-gray-700">Barber</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Layanan</th>
                        <th className="text-right py-2 font-semibold text-gray-700">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.byBarber || data.byCashier || []).map((b, index)=> (
                        <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2 flex items-center gap-2">
                            {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                            <span>{b.name||'-'}</span>
                          </td>
                          <td className="text-center py-2">{b.txns}</td>
                          <td className="text-right py-2 font-semibold">{formatMoney(b.revenue, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products & Categories */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-blue-600" />
                  Per Jenis Layanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold text-gray-700">Layanan</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Jumlah</th>
                        <th className="text-right py-2 font-semibold text-gray-700">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.byService || data.byProduct || []).map(r=> (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-2">{r.name}</td>
                          <td className="text-center py-2">{r.qty}</td>
                          <td className="text-right py-2 font-semibold">{formatMoney(r.revenue, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Ranking Layanan Populer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(data.byService || data.byCategory || data.byProduct || []).slice(0, 5).map((r, index)=> (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{r.name||'-'}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatMoney(r.revenue, currency)}</div>
                        <div className="text-xs text-gray-600">{r.qty} kali layanan</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Chart */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Tren Per Jam
              </CardTitle>
              <CardDescription>
                Analisis pola penjualan berdasarkan waktu dalam hari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Line data={{ labels: data.byHour.map(h=>h.hour), datasets:[ { label:'Pendapatan (IDR)', data: data.byHour.map(h=>h.revenue), borderColor:'#60a5fa', backgroundColor:'rgba(96,165,250,.2)' }, { label:'Jumlah Layanan', data: data.byHour.map(h=>h.txns), borderColor:'#34d399', backgroundColor:'rgba(52,211,153,.2)' } ] }} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
