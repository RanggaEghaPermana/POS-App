import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatTimeOnly } from '../utils/formatters'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { LoadingSpinner } from '../components/ui/loading'
import { Badge } from '../components/ui/badge'
import {
  History as HistoryIcon, Search, Filter, Eye, RotateCcw,
  ChevronLeft, ChevronRight, Calendar, Receipt, TrendingUp,
  Scissors, Clock, Users, Star, User as UserIcon, BarChart3,
  Award, Target, DollarSign, TrendingDown, Activity, Zap,
  PieChart, LineChart, Crown, Timer, Heart, Trophy,
  MapPin, Phone, ArrowUpRight, ArrowDownRight, RefreshCw, Utensils, ChefHat
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

// Mock data untuk analytics
function generateMockSalesData(businessType = 'barbershop') {
  const staff = businessType === 'restaurant' ? [
    { id: 1, name: 'Sari Dewi', avatar: '👩‍🍳', specialty: 'Chef Utama', experience: 5 },
    { id: 2, name: 'Budi Prasetyo', avatar: '👨‍🍳', specialty: 'Sous Chef', experience: 3 },
    { id: 3, name: 'Ani Wulandari', avatar: '👩‍💼', specialty: 'Pelayan Senior', experience: 4 }
  ] : [
    { id: 1, name: 'Budi Santoso', avatar: '👨‍💼', specialty: 'Classic Cut', experience: 5 },
    { id: 2, name: 'Andi Wijaya', avatar: '👨‍🦱', specialty: 'Modern Style', experience: 3 },
    { id: 3, name: 'Reza Ahmad', avatar: '👨‍🔧', specialty: 'Beard Care', experience: 4 }
  ]

  const services = businessType === 'restaurant' ? [
    { name: 'Nasi Gudeg', price: 25000, duration: 15, popularity: 90 },
    { name: 'Ayam Bakar', price: 35000, duration: 20, popularity: 85 },
    { name: 'Soto Ayam', price: 20000, duration: 10, popularity: 75 },
    { name: 'Paket Hemat Keluarga', price: 75000, duration: 30, popularity: 95 },
    { name: 'Es Teh Manis', price: 8000, duration: 2, popularity: 80 }
  ] : [
    { name: 'Cukur Rambut Klasik', price: 25000, duration: 30, popularity: 85 },
    { name: 'Cukur + Cuci Rambut', price: 40000, duration: 45, popularity: 90 },
    { name: 'Styling Modern', price: 50000, duration: 60, popularity: 70 },
    { name: 'Potong Jenggot', price: 20000, duration: 20, popularity: 60 },
    { name: 'Paket Lengkap', price: 80000, duration: 90, popularity: 95 }
  ]

  const barbers = staff // Alias for backward compatibility

  const today = new Date()
  const sales = []

  // Generate 30 days of mock sales data
  for (let day = 0; day < 30; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() - day)

    // Random number of sales per day (5-20)
    const dailySales = Math.floor(Math.random() * 16) + 5

    for (let i = 0; i < dailySales; i++) {
      const randomService = services[Math.floor(Math.random() * services.length)]
      const randomBarber = barbers[Math.floor(Math.random() * barbers.length)]
      const saleTime = new Date(date)
      saleTime.setHours(Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60))

      sales.push({
        id: `SERV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: `TS${String(sales.length + 1).padStart(4, '0')}`,
        created_at: saleTime.toISOString(),
        customer_name: `Pelanggan ${Math.floor(Math.random() * 100) + 1}`,
        grand_total: randomService.price,
        payment_status: Math.random() > 0.1 ? 'paid' : 'pending',
        type: 'service',
        items: [{
          product_name: randomService.name,
          service_name: randomService.name,
          name: randomService.name,
          barber_name: randomBarber.name,
          barber_id: randomBarber.id,
          estimated_duration: randomService.duration,
          price: randomService.price
        }],
        barber: randomBarber,
        service: randomService
      })
    }
  }

  return { sales, barbers, services }
}

export default function History(){
  const { token, logout, activeTenant } = useAuth()
  const currency = useCurrency('IDR')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [list, setList] = useState({ data: [], meta: {} })
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({ sales: [], barbers: [], services: [] })
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions', 'analytics', 'barbers', 'customers'

  const businessType = activeTenant?.business_type || 'barbershop'

  async function load(page=1){
    setLoading(true)
    const params = new URLSearchParams()
    if(q) params.set('q', q)
    if(from) params.set('from', from)
    if(to) params.set('to', to)
    params.set('page', page)

    // Generate comprehensive mock data for analytics
    const mockData = generateMockSalesData(businessType)
    setAnalytics(mockData)

    // Periksa jika dalam mode mock atau API tidak tersedia
    const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true

    if (isMockMode || !token) {
      // Muat dari localStorage untuk mode mock, atau gunakan generated data
      try {
        const storageKey = businessType === 'restaurant' ? 'restaurant_sales' : 'barbershop_sales'
        let mockSales = JSON.parse(localStorage.getItem(storageKey) || '[]')

        // Jika tidak ada data di localStorage, gunakan generated data
        if (mockSales.length === 0) {
          mockSales = mockData.sales
          localStorage.setItem(storageKey, JSON.stringify(mockSales))
        }

        let filteredSales = mockSales.filter(sale => sale.type === 'service')

        // Terapkan filter
        if (q) {
          filteredSales = filteredSales.filter(sale =>
            sale.number?.toLowerCase().includes(q.toLowerCase()) ||
            sale.customer_name?.toLowerCase().includes(q.toLowerCase())
          )
        }
        if (from) {
          filteredSales = filteredSales.filter(sale =>
            new Date(sale.created_at).toISOString().slice(0,10) >= from
          )
        }
        if (to) {
          filteredSales = filteredSales.filter(sale =>
            new Date(sale.created_at).toISOString().slice(0,10) <= to
          )
        }

        // Paginasi sederhana untuk data mock
        const perPage = 15
        const start = (page - 1) * perPage
        const end = start + perPage
        const paginatedData = filteredSales.slice(start, end)

        const mockResponse = {
          data: paginatedData,
          current_page: page,
          last_page: Math.ceil(filteredSales.length / perPage),
          total: filteredSales.length,
          from: start + 1,
          to: Math.min(end, filteredSales.length)
        }

        setList(mockResponse)
      } catch (e) {
        console.warn('Error loading mock sales data:', e)
        setList({ data: [], meta: {} })
      }
    } else {
      // Coba API terlebih dahulu
      try{
        const data = await apiGet(`/sales?${params.toString()}&type=service`, token)
        setList(data)
      }catch(e){
        console.warn('API not available, falling back to mock data:', e.message)
        // Fallback ke localStorage
        try {
          const storageKey = businessType === 'restaurant' ? 'restaurant_sales' : 'barbershop_sales'
          const mockSales = JSON.parse(localStorage.getItem(storageKey) || '[]')
          const filteredSales = mockSales.filter(sale => sale.type === 'service')
          setList({ data: filteredSales, total: filteredSales.length })
        } catch (mockError) {
          alert(`Tidak dapat memuat data riwayat ${businessType === 'restaurant' ? 'pesanan' : 'layanan'}`)
          setList({ data: [], meta: {} })
        }
      }
    }

    setLoading(false)
  }

  useEffect(()=>{ (async()=>{ load() })() }, [])

  // Calculate analytics data
  const calculateAnalytics = () => {
    const allSales = analytics.sales || []
    const today = new Date().toISOString().split('T')[0]
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    const thisMonth = new Date()
    thisMonth.setDate(thisMonth.getDate() - 30)

    // Today's metrics
    const todaysSales = allSales.filter(s =>
      new Date(s.created_at).toISOString().split('T')[0] === today
    )
    const todaysRevenue = todaysSales.reduce((acc, s) => acc + s.grand_total, 0)

    // Weekly metrics
    const weeklySales = allSales.filter(s =>
      new Date(s.created_at) >= thisWeek
    )
    const weeklyRevenue = weeklySales.reduce((acc, s) => acc + s.grand_total, 0)

    // Monthly metrics
    const monthlySales = allSales.filter(s =>
      new Date(s.created_at) >= thisMonth
    )
    const monthlyRevenue = monthlySales.reduce((acc, s) => acc + s.grand_total, 0)

    // Barber performance
    const barberStats = analytics.barbers.map(barber => {
      const barberSales = allSales.filter(s => s.barber?.id === barber.id)
      const revenue = barberSales.reduce((acc, s) => acc + s.grand_total, 0)
      const avgDuration = barberSales.length > 0
        ? barberSales.reduce((acc, s) => acc + (s.items?.[0]?.estimated_duration || 30), 0) / barberSales.length
        : 0

      return {
        ...barber,
        totalSales: barberSales.length,
        totalRevenue: revenue,
        avgDuration: Math.round(avgDuration),
        todaysSales: barberSales.filter(s =>
          new Date(s.created_at).toISOString().split('T')[0] === today
        ).length,
        efficiency: barberSales.length > 0 ? Math.round((revenue / barberSales.length) * 100) / 100 : 0
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Service popularity
    const serviceStats = analytics.services.map(service => {
      const serviceSales = allSales.filter(s =>
        s.items?.some(item => item.name === service.name)
      )
      return {
        ...service,
        totalSales: serviceSales.length,
        totalRevenue: serviceSales.reduce((acc, s) => acc + s.grand_total, 0),
        avgRating: (Math.random() * 1.5 + 3.5).toFixed(1) // Mock rating
      }
    }).sort((a, b) => b.totalSales - a.totalSales)

    // Peak hours analysis
    const hourlyStats = {}
    allSales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours()
      if (!hourlyStats[hour]) hourlyStats[hour] = { count: 0, revenue: 0 }
      hourlyStats[hour].count++
      hourlyStats[hour].revenue += sale.grand_total
    })

    const peakHour = Object.entries(hourlyStats).reduce((max, [hour, stats]) =>
      stats.count > (max.stats?.count || 0) ? { hour: parseInt(hour), stats } : max, {}
    )

    return {
      todaysSales: todaysSales.length,
      todaysRevenue,
      weeklySales: weeklySales.length,
      weeklyRevenue,
      monthlySales: monthlySales.length,
      monthlyRevenue,
      barberStats,
      serviceStats,
      peakHour,
      avgTransactionValue: allSales.length > 0
        ? Math.round(allSales.reduce((acc, s) => acc + s.grand_total, 0) / allSales.length)
        : 0,
      customerRetention: Math.round(Math.random() * 30 + 65), // Mock retention rate
      totalCustomers: new Set(allSales.map(s => s.customer_name)).size
    }
  }

  const analyticsData = calculateAnalytics()

  const pagination = []
  const current = list.current_page || 1
  const last = list.last_page || 1
  for(let i=1;i<=last;i++){ pagination.push(i) }

  return (
    <div className="space-y-6">
      {/* Header Section - Enhanced with Analytics Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <HistoryIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {businessType === 'restaurant' ? 'Riwayat Pesanan Restaurant' : 'Analisis Penjualan Barbershop'}
              </h1>
              <p className="text-sm text-gray-600">
                {businessType === 'restaurant' ? 'History pesanan dan analisis performa restaurant' : 'Dashboard lengkap performa bisnis dan analisis mendalam'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/reports" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Laporan
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/return" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Pembatalan
              </Link>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4 bg-gray-100 p-1 rounded-lg">
          {(businessType === 'restaurant' ? [
            { id: 'transactions', label: 'Riwayat Pesanan', icon: Receipt },
            { id: 'analytics', label: 'Dashboard Analytics', icon: BarChart3 },
            { id: 'barbers', label: 'Performa Staff', icon: Award },
            { id: 'customers', label: 'Analisis Tamu', icon: Users }
          ] : [
            { id: 'transactions', label: 'Riwayat Transaksi', icon: Receipt },
            { id: 'analytics', label: 'Dashboard Analytics', icon: BarChart3 },
            { id: 'barbers', label: businessType === 'restaurant' ? 'Performa Staff' : 'Performa Barber', icon: Award },
            { id: 'customers', label: 'Analisis Pelanggan', icon: Users }
          ]).map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Based on Active Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Enhanced Analytics Dashboard */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pendapatan Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(analyticsData.todaysRevenue, currency)}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +12% vs kemarin
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Pesanan Hari Ini' : 'Layanan Hari Ini'}</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.todaysSales}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      Target: 15 {businessType === 'restaurant' ? 'pesanan' : 'layanan'}
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 p-3">
                    {businessType === 'restaurant' ? <Utensils className="h-6 w-6 text-blue-600" /> : <Scissors className="h-6 w-6 text-blue-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nilai Rata-rata Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(analyticsData.avgTransactionValue, currency)}</p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      Optimal: 50K+
                    </p>
                  </div>
                  <div className="rounded-full bg-purple-100 p-3">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tingkat Retensi Pelanggan</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.customerRetention}%</p>
                    <p className="text-xs text-amber-600 flex items-center mt-1">
                      <Heart className="h-3 w-3 mr-1" />
                      Target: 80%+
                    </p>
                  </div>
                  <div className="rounded-full bg-amber-100 p-3">
                    <Heart className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours & Service Popularity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Jam Sibuk & Analisis Waktu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Jam Tersibuk</p>
                        <p className="text-xl font-bold text-blue-900">{analyticsData.peakHour?.hour || 14}:00 - {(analyticsData.peakHour?.hour || 14) + 1}:00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{businessType === 'restaurant' ? 'Pesanan' : 'Layanan'}</p>
                        <p className="text-xl font-bold text-blue-600">{analyticsData.peakHour?.stats?.count || 8}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {['08:00', '12:00', '15:00', '17:00', '19:00', '21:00'].map((time, i) => (
                      <div key={time} className="text-center p-2 bg-gray-100 rounded">
                        <p className="font-semibold">{time}</p>
                        <p className="text-gray-600">{Math.floor(Math.random() * 8) + 2} {businessType === 'restaurant' ? 'pesanan' : 'layanan'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  {businessType === 'restaurant' ? 'Top 5 Menu Populer' : 'Top 5 Layanan Populer'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.serviceStats.slice(0, 5).map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-600">{service.totalSales} kali • ⭐ {service.avgRating}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatMoney(service.totalRevenue, currency)}</p>
                        <p className="text-xs text-gray-600">{service.popularity}% populer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trends */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Tren Pendapatan 30 Hari Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Minggu Ini</p>
                  <p className="text-2xl font-bold text-green-900">{formatMoney(analyticsData.weeklyRevenue, currency)}</p>
                  <p className="text-xs text-green-600">+15% vs minggu lalu</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Bulan Ini</p>
                  <p className="text-2xl font-bold text-blue-900">{formatMoney(analyticsData.monthlyRevenue, currency)}</p>
                  <p className="text-xs text-blue-600">{analyticsData.monthlySales} {businessType === 'restaurant' ? 'pesanan' : 'layanan'}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Proyeksi Bulan Depan</p>
                  <p className="text-2xl font-bold text-purple-900">{formatMoney(analyticsData.monthlyRevenue * 1.1, currency)}</p>
                  <p className="text-xs text-purple-600">+10% pertumbuhan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'barbers' && (
        <>
          {/* Barber Performance Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analyticsData.barberStats.map((barber, index) => (
              <Card key={barber.id} className="shadow-sm border border-gray-200 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
                        {barber.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{barber.name}</h3>
                        <p className="text-sm text-gray-600">{barber.specialty}</p>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-yellow-600" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">{businessType === 'restaurant' ? 'Total Pesanan' : 'Total Layanan'}</p>
                      <p className="text-xl font-bold text-blue-900">{barber.totalSales}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Pendapatan</p>
                      <p className="text-lg font-bold text-green-900">{formatMoney(barber.totalRevenue, currency)}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-gray-600">Hari Ini</p>
                      <p className="text-xl font-bold text-amber-900">{barber.todaysSales}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Efisiensi</p>
                      <p className="text-lg font-bold text-purple-900">{barber.efficiency}K/jam</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pengalaman: {barber.experience} tahun</span>
                      <span className="text-gray-600">Avg: {barber.avgDuration} menit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Barber Comparison Chart */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {businessType === 'restaurant' ? 'Perbandingan Performa Staff' : 'Perbandingan Performa Barber'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.barberStats.map((barber, index) => (
                  <div key={barber.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-32">
                      <span className="text-xl">{barber.avatar}</span>
                      <span className="font-medium text-sm">{barber.name}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Pendapatan</span>
                        <span className="text-sm font-semibold">{formatMoney(barber.totalRevenue, currency)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${(barber.totalRevenue / analyticsData.barberStats[0].totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'customers' && (
        <>
          {/* Customer Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 mx-auto mb-3 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Total Pelanggan</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalCustomers}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Pelanggan Kembali</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.totalCustomers * 0.65)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-amber-100 mx-auto mb-3 flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-sm text-gray-600">Rating Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Pelanggan Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.totalCustomers * 0.45)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Segmentasi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Pelanggan VIP (10+ kunjungan)', percentage: 15, color: 'bg-yellow-500' },
                    { label: 'Pelanggan Setia (5-10 kunjungan)', percentage: 30, color: 'bg-green-500' },
                    { label: 'Pelanggan Reguler (2-5 kunjungan)', percentage: 35, color: 'bg-blue-500' },
                    { label: 'Pelanggan Baru (1 kunjungan)', percentage: 20, color: 'bg-gray-400' }
                  ].map((segment, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{segment.label}</span>
                          <span className="text-sm text-gray-600">{segment.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${segment.color}`} style={{ width: `${segment.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Demografi Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Usia 18-25</p>
                      <p className="text-xl font-bold text-blue-900">35%</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Usia 26-35</p>
                      <p className="text-xl font-bold text-green-900">40%</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Usia 36-45</p>
                      <p className="text-xl font-bold text-amber-900">20%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">45+ Tahun</p>
                      <p className="text-xl font-bold text-purple-900">5%</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Area Terpopuler</h4>
                    <div className="space-y-2">
                      {['Kota Jakarta', 'Bandung', 'Surabaya', 'Medan'].map((area, index) => (
                        <div key={area} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{area}</span>
                          <span className="font-semibold text-gray-900">{[25, 20, 15, 10][index]}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <>
          {/* Summary Stats for Transactions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-slate-100 p-3">
                      {businessType === 'restaurant' ? <Utensils className="h-6 w-6 text-slate-600" /> : <Scissors className="h-6 w-6 text-slate-600" />}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Total Pesanan' : 'Total Layanan'}</p>
                    <p className="text-2xl font-bold text-gray-900">{list.total || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-amber-100 p-3">
                      <TrendingUp className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(list.data?.reduce((acc, s) => acc + (s.grand_total || 0), 0) || 0, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-100 p-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Pesanan Hari Ini' : 'Layanan Hari Ini'}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {list.data?.filter(s => {
                        const today = new Date().toISOString().split('T')[0]
                        const saleDate = new Date(s.created_at).toISOString().split('T')[0]
                        return today === saleDate
                      }).length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Rata-rata per Pesanan' : 'Rata-rata per Layanan'}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(
                      list.data?.length > 0
                        ? list.data.reduce((acc, s) => acc + (s.grand_total || 0), 0) / list.data.length
                        : 0,
                      currency
                    )}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter Section */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gray-600" />
                  <span>Pencarian & Filter</span>
                </div>
                <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                  {list.data?.length || 0} dari {list.total || 0} {businessType === 'restaurant' ? 'pesanan' : 'layanan'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="relative lg:col-span-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={businessType === 'restaurant' ? 'Cari nomor pesanan atau nama tamu...' : 'Cari nomor treatment atau nama pelanggan...'}
                    value={q}
                    onChange={e=>setQ(e.target.value)}
                    className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
                <div className="lg:col-span-3">
                  <Input
                    type="date"
                    value={from}
                    onChange={e=>setFrom(e.target.value)}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
                <div className="lg:col-span-3">
                  <Input
                    type="date"
                    value={to}
                    onChange={e=>setTo(e.target.value)}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
                <div className="lg:col-span-2">
                  <Button
                    onClick={() => load()}
                    size="lg"
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-all"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Terapkan Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Memuat riwayat {businessType === 'restaurant' ? 'pesanan' : 'layanan'}...</span>
                    </div>
                  ) : list.data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4">
                      <div className="rounded-full bg-gray-100 p-6 mb-4">
                        {businessType === 'restaurant' ? (
                          <Utensils className="h-12 w-12 text-gray-400" />
                        ) : (
                          <Scissors className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{businessType === 'restaurant' ? 'Belum ada pesanan' : 'Belum ada layanan'}</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-sm">
                    {businessType === 'restaurant' ? 'Riwayat pesanan restaurant akan muncul di sini setelah Anda melayani tamu pertama.' : 'Riwayat layanan treatment akan muncul di sini setelah Anda melayani pelanggan pertama.'}
                  </p>
                  <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800">
                    <Link to="/service-pos" className="flex items-center gap-2">
                      {businessType === 'restaurant' ? <Utensils className="h-5 w-5" /> : <Scissors className="h-5 w-5" />}
                      Mulai Layanan
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-50">
                      <TableRow className="border-0">
                        <TableHead className="font-semibold text-gray-700">Tanggal & Waktu</TableHead>
                        <TableHead className="font-semibold text-gray-700">{businessType === 'restaurant' ? 'Nomor Pesanan' : 'Nomor Layanan'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">Pelanggan</TableHead>
                        <TableHead className="font-semibold text-gray-700">{businessType === 'restaurant' ? 'Menu' : 'Layanan'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">{businessType === 'restaurant' ? 'Staff' : 'Barber'}</TableHead>
                        <TableHead className="font-semibold text-gray-700">Durasi</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Total</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-32 sticky right-0 bg-gray-50">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.data?.map((s, index) => {
                        // Ekstrak informasi layanan dan barber dari items
                        const firstItem = s.items?.[0] || {};
                        const serviceNames = s.items?.map(item => item.product_name || item.service_name || item.name).join(', ') || (businessType === 'restaurant' ? 'Pesanan Restaurant' : 'Layanan Treatment');
                        const barberName = firstItem.barber_name || firstItem.barber || (businessType === 'restaurant' ? 'Staff Restaurant' : 'Barber Tukang Cukur');
                        const totalDuration = s.items?.reduce((acc, item) => acc + (item.estimated_duration || 30), 0) || 30;
                        const customerName = s.customer_name || s.customer?.name || 'Pelanggan Langsung';

                        return (
                        <TableRow
                          key={s.id}
                          className="hover:bg-gray-50 transition-colors border-gray-100 group"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                                {new Date(s.created_at).getDate()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {new Date(s.created_at).toLocaleDateString('id-ID')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatTimeOnly(s.created_at)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono font-semibold">
                              {s.number}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{customerName}</div>
                                {s.customer?.phone && (
                                  <div className="text-xs text-gray-500">{s.customer.phone}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                {businessType === 'restaurant' ? <ChefHat className="h-4 w-4 text-orange-600" /> : <Scissors className="h-4 w-4 text-orange-600" />}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 line-clamp-1" title={serviceNames}>
                                  {serviceNames.length > 25 ? serviceNames.substring(0, 25) + '...' : serviceNames}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {s.items?.length || 1} {businessType === 'restaurant' ? 'item' : 'layanan'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{barberName}</div>
                                <div className="text-xs text-gray-500">{businessType === 'restaurant' ? 'Keahlian' : 'Spesialis'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{totalDuration} menit</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-gray-900 text-lg">
                              {formatMoney(s.grand_total, currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={s.payment_status === 'paid' ? 'default' : 'secondary'}
                              className={s.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                              }
                            >
                              <div className={`h-2 w-2 rounded-full mr-2 ${
                                s.payment_status === 'paid' ? 'bg-green-500' : 'bg-amber-500'
                              }`}></div>
                              {s.payment_status === 'paid' ? 'Selesai' : 'Menunggu'}
                            </Badge>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-white">
                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm" className="h-8 px-3 text-xs hover:bg-gray-50 hover:text-gray-700 border-gray-300">
                                <Link to={`/sale/${s.id}`} title="Lihat Detail Layanan" className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Detail
                                </Link>
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs hover:bg-blue-50 hover:text-blue-700 border-blue-300"
                              >
                                <Link to={`/receipt/${s.id}`} title="Cetak Struk" className="flex items-center gap-1">
                                  <Receipt className="h-3 w-3" />
                                  Struk
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modern Pagination - Only show for transactions tab */}
      {activeTab === 'transactions' && pagination.length > 1 && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan <span className="font-medium">{list.from || 0}</span> sampai{' '}
                <span className="font-medium">{list.to || 0}</span> dari{' '}
                <span className="font-medium">{list.total || 0}</span> {businessType === 'restaurant' ? 'pesanan' : 'layanan'}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load(current - 1)}
                  disabled={current === 1}
                  className="hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all"
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
                          ? "bg-gray-900 text-white shadow-lg"
                          : "hover:bg-gray-50 hover:text-gray-600 transition-all"
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
                        className="hover:bg-gray-50 hover:text-gray-600"
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
                  className="hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all"
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
  )
}

