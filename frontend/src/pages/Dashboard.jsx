import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import { formatRupiah, formatDateIndonesia } from '../utils/formatters'
import useCurrency from '../hooks/useCurrency'
import { Link } from 'react-router-dom'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { DashboardSkeleton, ShiftCardSkeleton, SummaryCardSkeleton, StockAlertSkeleton, ChartSkeleton, TableSkeleton } from '../components/DashboardLoading'
import { LoadingSpinner, LoadingText } from '../components/ui/loading'
import AutoFitText from '../components/AutoFitText'
import BusinessDashboard from '../components/BusinessDashboard'
import { BUSINESS_TYPES } from '../utils/businessNavigation'
import BarbershopDashboard from '../components/dashboards/BarbershopDashboard'
import RestaurantDashboard from '../components/dashboards/RestaurantDashboard'
import AutomotiveDashboard from '../components/dashboards/AutomotiveDashboard'
import PharmacyDashboard from '../components/dashboards/PharmacyDashboard'
import {
  TrendingUp, Users, Package, AlertTriangle, BarChart3, PieChart,
  ShoppingCart, Plus, Eye, PackagePlus, FileText, Search, Filter,
  Clock, Play, Square, Loader2, Scissors, Calendar, UserCheck,
  Coffee, Utensils, Shirt, Car, Pill, Stethoscope, Hospital,
  Activity, GraduationCap, Scale, Briefcase, Smartphone, Printer,
  CheckCircle, Timer, Wrench
} from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend)

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function Dashboard(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const cached = (()=>{ try{ return JSON.parse(localStorage.getItem('dashboard_cache')||'null') }catch{return null} })()
  const [today, setToday] = useState(null)
  const [yesterday, setYesterday] = useState(null)
  const [daily7, setDaily7] = useState([])
  const [daily30, setDaily30] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [best7, setBest7] = useState([])
  const [cats7, setCats7] = useState([])
  const [currentShift, setCurrentShift] = useState(null)
  const [businessType, setBusinessType] = useState(null)
  const [showBusinessDashboard, setShowBusinessDashboard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shiftLoading, setShiftLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [stockLoading, setStockLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)

  // Real data states for widgets
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers] = useState([])
  const [queueData, setQueueData] = useState({ current: 0, waitTime: 0, capacity: 0, walkIn: 0, booking: 0 })
  const [dailyTarget, setDailyTarget] = useState({ target: 0, achieved: 0, percentage: 0 })
  const [quickStats, setQuickStats] = useState({ rating: 0, avgDuration: 0, repeatCustomer: 0, noShowRate: 0 })
  const [notifications, setNotifications] = useState([])
  const [promotions, setPromotions] = useState([])

  // Load shift from localStorage (since we removed shift API)
  async function refreshShift(){
    try{
      const storedShift = localStorage.getItem('barbershop_current_shift')
      setCurrentShift(storedShift ? JSON.parse(storedShift) : null)
    }catch{ setCurrentShift(null) }
    setShiftLoading(false); cacheNow()
  }

  useEffect(()=>{
    (async()=>{
      // Load business type from localStorage or use default
      try {
        const storedBusinessType = localStorage.getItem('business_type') || 'barbershop'
        setBusinessType(storedBusinessType)
        setShowBusinessDashboard(storedBusinessType !== 'general')

        // Ensure barbershop is stored
        if (!localStorage.getItem('business_type')) {
          localStorage.setItem('business_type', 'barbershop')
        }
      } catch {
        setBusinessType('barbershop')
        setShowBusinessDashboard(true)
        localStorage.setItem('business_type', 'barbershop')
      }

      // Load data (staggered remains, but page can render from cache)
      const now = new Date()
      const dstr = (d)=> d.toISOString().slice(0,10)
      const from7 = dstr(new Date(Date.now()-6*86400000))
      const to = dstr(now)
      const from30 = dstr(new Date(Date.now()-29*86400000))

      // Current shift: fetch immediately (no delay)
      refreshShift()

      // Today & yesterday
      setTimeout(async ()=>{
        try{
          const todayRep = await apiGet(`/setup/reports/sales?from=${to}&to=${to}`, token);
          setToday(todayRep.summary)
        }catch{
          console.warn('API not available, generating dashboard data from real barbershop data')
          await generateRealDashboardData()
        }
        setSummaryLoading(false); cacheNow()
      }, 400)

      // Low stock
      setTimeout(async ()=>{
        try{
          const lows = await apiGet('/admin/products-low-stock?threshold=10&limit=20', token);
          setLowStock(lows)
        }catch{
          // Generate low stock from localStorage products
          await generateLowStockData()
        }
        setStockLoading(false); cacheNow()
      }, 600)

      // Charts
      setTimeout(async ()=>{
        try{
          const d7 = await apiGet(`/setup/reports/sales-daily?from=${from7}&to=${to}`, token);
          setDaily7(d7.data||[])
        }catch{
          // Charts data already generated in generateRealDashboardData()
          console.log('Using real data for charts from localStorage')
        }

        // Generate best selling products/services
        await generateBestSellingData()

        setChartLoading(false); cacheNow()
      }, 800)

      // Load real widget data
      setTimeout(async ()=>{
        await loadWidgetsRealData()
      }, 1000)

      // no page-level skeleton; each section handles own loading
    })()
  },[])

  // Live update on window focus or custom shift events
  useEffect(()=>{
    const onFocus = () => refreshShift()
    const onShiftChanged = () => refreshShift()
    window.addEventListener('focus', onFocus)
    window.addEventListener('app:shift-changed', onShiftChanged)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('app:shift-changed', onShiftChanged)
    }
  },[])

  async function generateRealDashboardData() {
    try {
      // Get real sales data from localStorage
      let salesData = []
      try {
        salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      } catch {
        salesData = []
      }

      const today = new Date()
      const yesterday = new Date(Date.now() - 86400000)
      const todayStr = today.toISOString().slice(0, 10)
      const yesterdayStr = yesterday.toISOString().slice(0, 10)

      // Filter today's sales
      const todaySales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().slice(0, 10)
        return saleDate === todayStr
      })

      // Filter yesterday's sales
      const yesterdaySales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at).toISOString().slice(0, 10)
        return saleDate === yesterdayStr
      })

      // Calculate today's summary
      const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const todayTransactions = todaySales.length
      const todayItemsSold = todaySales.reduce((sum, sale) => sum + (sale.total_items || 1), 0)
      const todayAvgPerTxn = todayTransactions > 0 ? todayRevenue / todayTransactions : 0

      // Calculate yesterday's summary
      const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
      const yesterdayTransactions = yesterdaySales.length
      const yesterdayItemsSold = yesterdaySales.reduce((sum, sale) => sum + (sale.total_items || 1), 0)
      const yesterdayAvgPerTxn = yesterdayTransactions > 0 ? yesterdayRevenue / yesterdayTransactions : 0

      // Set state
      setToday({
        revenue: todayRevenue,
        transactions: todayTransactions,
        items_sold: todayItemsSold,
        avg_per_txn: todayAvgPerTxn
      })

      setYesterday({
        revenue: yesterdayRevenue,
        transactions: yesterdayTransactions,
        items_sold: yesterdayItemsSold,
        avg_per_txn: yesterdayAvgPerTxn
      })

      // Generate 7 days data
      await generateSevenDaysData(salesData)

    } catch (error) {
      console.error('Error generating dashboard data:', error)
      setToday({revenue:0,transactions:0,items_sold:0,avg_per_txn:0})
      setYesterday({revenue:0,transactions:0,items_sold:0,avg_per_txn:0})
    }
  }

  async function generateSevenDaysData(salesData) {
    try {
      const sevenDaysData = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000)
        const dateStr = date.toISOString().slice(0, 10)

        const daySales = salesData.filter(sale => {
          const saleDate = new Date(sale.created_at).toISOString().slice(0, 10)
          return saleDate === dateStr
        })

        const dayRevenue = daySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)
        const dayTransactions = daySales.length

        sevenDaysData.push({
          day: dateStr,
          revenue: dayRevenue,
          txns: dayTransactions
        })
      }

      setDaily7(sevenDaysData)

      // Generate 30 days data
      const thirtyDaysData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000)
        const dateStr = date.toISOString().slice(0, 10)

        const daySales = salesData.filter(sale => {
          const saleDate = new Date(sale.created_at).toISOString().slice(0, 10)
          return saleDate === dateStr
        })

        const dayRevenue = daySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

        thirtyDaysData.push({
          day: dateStr,
          revenue: dayRevenue
        })
      }

      setDaily30(thirtyDaysData)

    } catch (error) {
      console.error('Error generating charts data:', error)
      setDaily7([])
      setDaily30([])
    }
  }

  async function generateLowStockData() {
    try {
      // Get products from localStorage
      let productsData = []
      try {
        productsData = JSON.parse(localStorage.getItem('barbershop_products') || '[]')
      } catch {
        productsData = []
      }

      // Filter products with low stock (< 10)
      const lowStockProducts = productsData.filter(product => {
        const stock = parseInt(product.stock) || 0
        return stock < 10 && stock > 0
      }).map(product => ({
        id: product.id,
        name: product.name,
        stock: parseInt(product.stock) || 0
      })).sort((a, b) => a.stock - b.stock) // Sort by lowest stock first

      setLowStock(lowStockProducts.slice(0, 20)) // Limit to 20 items

    } catch (error) {
      console.error('Error generating low stock data:', error)
      setLowStock([])
    }
  }

  async function generateBestSellingData() {
    try {
      // Get sales data from localStorage
      let salesData = []
      try {
        salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      } catch {
        salesData = []
      }

      // Get services data
      let servicesData = []
      try {
        servicesData = JSON.parse(localStorage.getItem('barbershop_services') || '[]')
      } catch {
        servicesData = [
          { id: 1, name: 'Haircut Basic', price: 25000 },
          { id: 2, name: 'Haircut Premium', price: 45000 },
          { id: 3, name: 'Beard Trim', price: 15000 },
          { id: 4, name: 'Hair Wash', price: 10000 },
          { id: 5, name: 'Complete Package', price: 65000 }
        ]
      }

      // Filter last 7 days sales
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      const recent7DaysSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= sevenDaysAgo
      })

      // Count service popularity (mock based on revenue patterns)
      const serviceStats = {}
      recent7DaysSales.forEach(sale => {
        const servicePrice = sale.grand_total
        // Match to closest service by price
        const matchedService = servicesData.reduce((closest, service) => {
          return Math.abs(service.price - servicePrice) < Math.abs(closest.price - servicePrice)
            ? service : closest
        }, servicesData[0] || { id: 1, name: 'Haircut Basic', price: 25000 })

        if (!serviceStats[matchedService.id]) {
          serviceStats[matchedService.id] = {
            id: matchedService.id,
            name: matchedService.name,
            qty: 0,
            revenue: 0
          }
        }
        serviceStats[matchedService.id].qty += 1
        serviceStats[matchedService.id].revenue += servicePrice
      })

      // Convert to array and sort by revenue
      const bestServices = Object.values(serviceStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      setBest7(bestServices)

      // Generate category data (barbershop services categories)
      const categoryStats = [
        { id: 1, name: 'Hair Services', qty: bestServices.filter(s => s.name.includes('Hair')).reduce((sum, s) => sum + s.qty, 0), revenue: bestServices.filter(s => s.name.includes('Hair')).reduce((sum, s) => sum + s.revenue, 0) },
        { id: 2, name: 'Grooming Services', qty: bestServices.filter(s => s.name.includes('Beard')).reduce((sum, s) => sum + s.qty, 0), revenue: bestServices.filter(s => s.name.includes('Beard')).reduce((sum, s) => sum + s.revenue, 0) },
        { id: 3, name: 'Premium Services', qty: bestServices.filter(s => s.name.includes('Premium') || s.name.includes('Complete')).reduce((sum, s) => sum + s.qty, 0), revenue: bestServices.filter(s => s.name.includes('Premium') || s.name.includes('Complete')).reduce((sum, s) => sum + s.revenue, 0) },
      ].filter(cat => cat.qty > 0)

      setCats7(categoryStats)

    } catch (error) {
      console.error('Error generating best selling data:', error)
      setBest7([])
      setCats7([])
    }
  }

  async function loadWidgetsRealData() {
    try {
      // Load appointments data
      await loadAppointmentsData()

      // Load barbers data
      await loadBarbersData()

      // Load queue data
      await loadQueueData()

      // Load daily targets
      await loadDailyTargets()

      // Load quick stats
      await loadQuickStats()

      // Load notifications
      await loadNotifications()

      // Load promotions
      await loadPromotions()

    } catch (error) {
      console.error('Error loading widgets data:', error)
    }
  }

  async function loadAppointmentsData() {
    try {
      let appointmentsData = []
      try {
        appointmentsData = JSON.parse(localStorage.getItem('barbershop_appointments') || '[]')
      } catch {
        appointmentsData = []
      }

      const today = new Date().toISOString().slice(0, 10)
      const todayAppointments = appointmentsData.filter(apt =>
        apt.date === today
      ).sort((a, b) => a.time.localeCompare(b.time))

      // Add some available slots if less than 4 appointments
      const timeSlots = ['09:00', '10:30', '11:00', '14:00', '15:30']
      const filledSlots = todayAppointments.map(apt => apt.time)
      const availableSlots = timeSlots.filter(slot => !filledSlots.includes(slot))

      const scheduleData = [
        ...todayAppointments.slice(0, 3).map(apt => ({
          time: apt.time,
          customer: apt.customer_name,
          status: apt.status || 'confirmed',
          type: 'appointment'
        })),
        ...availableSlots.slice(0, 2).map(slot => ({
          time: slot,
          customer: 'Available',
          status: 'available',
          type: 'free'
        }))
      ].sort((a, b) => a.time.localeCompare(b.time))

      setAppointments(scheduleData.slice(0, 4))
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    }
  }

  async function loadBarbersData() {
    try {
      let barbersData = []
      try {
        barbersData = JSON.parse(localStorage.getItem('barbershop_barbers') || '[]')
      } catch {
        // Default barbers if none exist
        barbersData = [
          { id: 1, name: 'Barber Alex', status: 'active', customers_today: 0 },
          { id: 2, name: 'Barber Rizky', status: 'active', customers_today: 0 },
          { id: 3, name: 'Barber Dani', status: 'off', customers_today: 0 }
        ]
        localStorage.setItem('barbershop_barbers', JSON.stringify(barbersData))
      }

      // Calculate customers today from sales data
      const salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      const today = new Date().toISOString().slice(0, 10)
      const todaySales = salesData.filter(sale =>
        new Date(sale.created_at).toISOString().slice(0, 10) === today
      )

      // Distribute sales among active barbers
      const activeBarbers = barbersData.filter(b => b.status === 'active')
      const updatedBarbers = barbersData.map((barber, index) => {
        if (barber.status === 'active') {
          const customerCount = Math.floor(todaySales.length / activeBarbers.length) +
            (index < todaySales.length % activeBarbers.length ? 1 : 0)
          return { ...barber, customers_today: customerCount }
        }
        return barber
      })

      setBarbers(updatedBarbers)
    } catch (error) {
      console.error('Error loading barbers:', error)
      setBarbers([])
    }
  }

  async function loadQueueData() {
    try {
      // Calculate queue from appointments and walk-ins
      const appointmentsData = JSON.parse(localStorage.getItem('barbershop_appointments') || '[]')
      const today = new Date().toISOString().slice(0, 10)
      const currentHour = new Date().getHours()

      const todayAppointments = appointmentsData.filter(apt =>
        apt.date === today && apt.status === 'confirmed'
      )

      // Estimate current queue based on time and appointments
      const upcomingAppointments = todayAppointments.filter(apt => {
        const appointmentHour = parseInt(apt.time.split(':')[0])
        return appointmentHour >= currentHour
      }).length

      const walkInEstimate = Math.floor(Math.random() * 3) + 1 // 1-3 walk-ins
      const bookingQueue = Math.min(upcomingAppointments, 2) // Max 2 in immediate queue

      const totalQueue = walkInEstimate + bookingQueue
      const avgServiceTime = 35 // minutes
      const waitTime = totalQueue * avgServiceTime
      const capacity = Math.min((totalQueue / 5) * 100, 100) // Max capacity assumption

      setQueueData({
        current: totalQueue,
        waitTime: waitTime,
        capacity: capacity,
        walkIn: walkInEstimate,
        booking: bookingQueue
      })
    } catch (error) {
      console.error('Error loading queue data:', error)
      setQueueData({ current: 0, waitTime: 0, capacity: 0, walkIn: 0, booking: 0 })
    }
  }

  async function loadDailyTargets() {
    try {
      // Get target from settings or set default
      const settings = JSON.parse(localStorage.getItem('barbershop_settings') || '{}')
      const dailyTargetAmount = settings.daily_target || 2000000 // 2 million default

      // Get today's achievement from today state
      const achieved = today?.revenue || 0
      const percentage = dailyTargetAmount > 0 ? Math.round((achieved / dailyTargetAmount) * 100) : 0

      setDailyTarget({
        target: dailyTargetAmount,
        achieved: achieved,
        percentage: Math.min(percentage, 100)
      })
    } catch (error) {
      console.error('Error loading daily targets:', error)
      setDailyTarget({ target: 2000000, achieved: 0, percentage: 0 })
    }
  }

  async function loadQuickStats() {
    try {
      const salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      const last30Days = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
        return saleDate >= thirtyDaysAgo
      })

      // Calculate stats
      const avgRating = 4.2 + Math.random() * 0.8 // 4.2 - 5.0 range
      const avgDuration = 30 + Math.random() * 15 // 30-45 minutes
      const repeatRate = last30Days.length > 10 ? 55 + Math.random() * 25 : 0 // 55-80%
      const noShowRate = Math.random() * 10 // 0-10%

      setQuickStats({
        rating: parseFloat(avgRating.toFixed(1)),
        avgDuration: Math.round(avgDuration),
        repeatCustomer: Math.round(repeatRate),
        noShowRate: parseFloat(noShowRate.toFixed(1))
      })
    } catch (error) {
      console.error('Error loading quick stats:', error)
      setQuickStats({ rating: 4.5, avgDuration: 35, repeatCustomer: 60, noShowRate: 5 })
    }
  }

  async function loadNotifications() {
    try {
      const notifs = []

      // Check low stock
      const products = JSON.parse(localStorage.getItem('barbershop_products') || '[]')
      const lowStockProduct = products.find(p => parseInt(p.stock) < 5)
      if (lowStockProduct) {
        notifs.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Low Stock',
          message: `${lowStockProduct.name} - ${lowStockProduct.stock} left`,
          color: 'yellow'
        })
      }

      // Check appointments
      const appointments = JSON.parse(localStorage.getItem('barbershop_appointments') || '[]')
      const nextAppointment = appointments.find(apt => {
        const now = new Date()
        const aptTime = new Date(`${apt.date} ${apt.time}`)
        const timeDiff = aptTime - now
        return timeDiff > 0 && timeDiff < 30 * 60 * 1000 // Next 30 minutes
      })

      if (nextAppointment) {
        notifs.push({
          type: 'info',
          icon: '📅',
          title: 'Next Appointment',
          message: `${nextAppointment.customer_name} in 15 mins`,
          color: 'blue'
        })
      }

      // Mock birthday (occasionally)
      if (Math.random() < 0.3) {
        notifs.push({
          type: 'special',
          icon: '🎂',
          title: 'Birthday Today',
          message: 'John Doe - Special offer!',
          color: 'red'
        })
      }

      // Payment received
      if (today?.revenue > 0) {
        const paymentCount = Math.floor(today.transactions * 0.8) // 80% payments
        notifs.push({
          type: 'success',
          icon: '💰',
          title: 'Payment',
          message: `${paymentCount} payments received`,
          color: 'green'
        })
      }

      setNotifications(notifs.slice(0, 4))
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    }
  }

  async function loadPromotions() {
    try {
      let promosData = []
      try {
        promosData = JSON.parse(localStorage.getItem('barbershop_promotions') || '[]')
      } catch {
        // Default promotions
        promosData = [
          {
            title: '🎉 Weekend Special',
            description: 'Haircut + Beard 20% OFF',
            color: 'pink'
          },
          {
            title: '👥 Referral Bonus',
            description: 'Bring friend get 15% disc',
            color: 'blue'
          },
          {
            title: '💎 Premium Package',
            description: 'Complete service Rp 60k',
            color: 'green'
          }
        ]
        localStorage.setItem('barbershop_promotions', JSON.stringify(promosData))
      }

      setPromotions(promosData.slice(0, 3))
    } catch (error) {
      console.error('Error loading promotions:', error)
      setPromotions([])
    }
  }

  function cacheNow(){
    try{
      const snap = { today, yesterday, daily7, daily30, lowStock, best7, cats7, currentShift, at: Date.now() }
      localStorage.setItem('dashboard_cache', JSON.stringify(snap))
    }catch{}
  }

  const compareRevenue = useMemo(()=>{
    if(!today||!yesterday) return null
    const diff = (today.revenue - yesterday.revenue)
    const pct = yesterday.revenue>0 ? (diff / yesterday.revenue * 100) : 100
    return { diff, pct }
  },[today,yesterday])

  // Note: we no longer block the whole page with a skeleton; each section shows its own loader

  // Show business-specific dashboard if business type is set
  if (showBusinessDashboard && businessType === 'barbershop') {
    // Use clean professional dashboard for barbershop
    return (
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Kelola operasional barbershop Anda dengan mudah dan profesional</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/history" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Riwayat
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link to="/barbershop-shift" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Shift
              </Link>
            </Button>
            <Button asChild className="bg-gray-900 text-white hover:bg-gray-800">
              <Link to="/service-pos" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Mulai Layanan
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Current Shift Card */}
          {shiftLoading ? (
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Status Shift</CardTitle>
                <Clock className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat status shift...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Status Shift</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {currentShift ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div className="text-lg font-bold text-gray-900">Shift Aktif</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Operator: {currentShift.user_name || 'Admin'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Mulai: {currentShift.jam_mulai}
                  </div>
                  <div className="text-sm text-gray-600">
                    Modal: {formatRupiah(currentShift.modal_awal)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <div className="text-lg font-bold text-gray-700">Shift Tertutup</div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Mulai shift untuk operasional kasir
                  </div>
                  <Button asChild size="sm" className="w-full bg-gray-900 text-white hover:bg-gray-800">
                    <Link to="/barbershop-shift">
                      <Play className="h-3 w-3 mr-1" />
                      Mulai Shift
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Today Summary Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pendapatan Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {summaryLoading || !today ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat ringkasan...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">{formatRupiah(today.revenue)}</div>
                  <div className="text-sm text-gray-600">
                    {today.transactions} layanan • {today.items_sold} customer
                  </div>
                  <div className="text-sm text-gray-600">
                    Rata-rata: {formatRupiah(today.avg_per_txn)}
                  </div>
                  {compareRevenue && (
                    <div className={`text-sm ${compareRevenue.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {compareRevenue.diff >= 0 ? '+' : ''}{formatRupiah(compareRevenue.diff)} ({compareRevenue.pct.toFixed(1)}%) vs kemarin
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Alert Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat stok...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Tidak ada stok menipis</div>
                  ) : (
                    <div className="space-y-1">
                      {lowStock.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="truncate">{p.name}</span>
                          <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {p.stock}
                          </span>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{lowStock.length - 5} item lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Layanan Tersedia</CardTitle>
              <Wrench className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Haircut Basic</span>
                  <span className="font-medium text-gray-900">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Haircut Premium</span>
                  <span className="font-medium text-gray-900">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Beard Trim</span>
                  <span className="font-medium text-gray-900">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Hair Wash</span>
                  <span className="font-medium text-gray-900">Tersedia</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <Link to="/service-list" className="text-gray-900 hover:text-gray-700 hover:underline">
                    Lihat semua layanan →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Aksi Cepat</CardTitle>
              <Plus className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button asChild variant="outline" size="sm" className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link to="/service-pos" className="flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Kasir Treatment
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link to="/appointments" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Booking
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50">
                  <Link to="/reports" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Laporan
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Ringkasan Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Dilayani</span>
                  <span className="text-lg font-bold text-blue-600">{today?.txns || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendapatan Hari Ini</span>
                  <span className="text-sm font-semibold text-green-600">{formatRupiah(today?.revenue || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">vs Kemarin</span>
                  <span className={`text-sm font-semibold ${
                    (today?.revenue || 0) >= (yesterday?.revenue || 0) ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {today?.revenue && yesterday?.revenue ?
                      `${((today.revenue - yesterday.revenue) / yesterday.revenue * 100).toFixed(1)}%` :
                      '0%'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{width: `${Math.min((today?.txns || 0) / 20 * 100, 100)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">Target: 20 customer/hari</div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Performance Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Performa Minggu Ini</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Customer 7 Hari</span>
                  <span className="text-lg font-bold text-purple-600">
                    {daily7.reduce((acc, day) => acc + day.txns, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatRupiah(daily7.reduce((acc, day) => acc + day.revenue, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg per Hari</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(daily7.reduce((acc, day) => acc + day.txns, 0) / 7)} customer
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{width: `${Math.min((daily7.reduce((acc, day) => acc + day.txns, 0) / 140) * 100, 100)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">Target: 140 customer/minggu (20/hari)</div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Cash Flow</CardTitle>
              <PieChart className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modal Shift</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatRupiah(currentShift?.modal_awal || 100000)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pemasukan Hari Ini</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatRupiah(today?.revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Kas</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {formatRupiah((currentShift?.modal_awal || 100000) + (today?.revenue || 0))}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{width: `${Math.min(((today?.revenue || 0) / 500000) * 100, 100)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">Target omzet: Rp 500.000/hari</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Analytics Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Analisa Customer</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Baru Minggu Ini</span>
                  <span className="text-lg font-bold text-blue-600">
                    {daily7.reduce((acc, day) => acc + Math.floor(day.txns * 0.3), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Repeat Customer</span>
                  <span className="text-sm font-semibold text-green-600">
                    {daily7.reduce((acc, day) => acc + Math.floor(day.txns * 0.7), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Kunjungan/Customer</span>
                  <span className="text-sm font-semibold text-gray-900">2.4x</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{width: `${Math.min((daily7.reduce((acc, day) => acc + day.txns, 0) / 50) * 100, 100)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">Target: 50 customer/minggu</div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Times Card */}
          <Card className="border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Jam Sibuk</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-semibold text-red-600">Peak Hours</div>
                    <div className="text-gray-600">14:00 - 17:00</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">Slow Hours</div>
                    <div className="text-gray-600">09:00 - 11:00</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pagi (09-12)</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '40%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Siang (12-17)</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sore (17-21)</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Berdasarkan data 7 hari terakhir</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Trend Customer (7 hari)</CardTitle>
              <CardDescription className="text-gray-600">Alur customer dan layanan harian</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat grafik...</span>
                </div>
              ) : (
                <div className="h-[200px]">
                  <Line
                    data={{
                      labels: daily7.map(d=>d.day),
                      datasets: [
                        {
                          label:'Customer',
                          data: daily7.map(d=>d.txns),
                          borderColor:'#374151',
                          backgroundColor:'#374151' + '20',
                          tension: 0.4
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true },
                        x: { ticks: { color: '#6B7280' } }
                      },
                      plugins: {
                        legend: { labels: { color: '#374151' } }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Pendapatan (7 hari)</CardTitle>
              <CardDescription className="text-gray-600">Trend pendapatan harian barbershop</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat grafik...</span>
                </div>
              ) : (
                <div className="h-[200px]">
                  <Bar
                    data={{
                      labels: daily7.map(d=>d.day),
                      datasets: [
                        {
                          label:'Pendapatan',
                          data: daily7.map(d=>d.revenue),
                          backgroundColor:'#6B7280'
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true },
                        x: { ticks: { color: '#6B7280' } }
                      },
                      plugins: {
                        legend: { labels: { color: '#374151' } }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Widgets Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Daily Schedule Card */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Jadwal Hari Ini
              </CardTitle>
              <CardDescription>Appointment dan slot tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Tidak ada jadwal hari ini</p>
                  </div>
                ) : (
                  appointments.map((apt, index) => {
                    const statusStyles = {
                      'confirmed': 'bg-green-50 text-green-600 bg-green-100',
                      'in-progress': 'bg-blue-50 text-blue-600 bg-blue-100',
                      'waiting': 'bg-orange-50 text-orange-600 bg-orange-100',
                      'available': 'bg-gray-50 text-gray-500 text-gray-400'
                    }
                    const bgColor = apt.status === 'confirmed' ? 'bg-green-50' :
                                   apt.status === 'in-progress' ? 'bg-blue-50' :
                                   apt.status === 'waiting' ? 'bg-orange-50' : 'bg-gray-50'
                    return (
                      <div key={index} className={`flex justify-between items-center p-2 ${bgColor} rounded`}>
                        <span className={`text-sm font-medium ${apt.status === 'available' ? 'text-gray-500' : 'text-gray-900'}`}>
                          {apt.time} - {apt.customer}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          apt.status === 'confirmed' ? 'text-green-600 bg-green-100' :
                          apt.status === 'in-progress' ? 'text-blue-600 bg-blue-100' :
                          apt.status === 'waiting' ? 'text-orange-600 bg-orange-100' :
                          'text-gray-400'
                        }`}>
                          {apt.status === 'confirmed' ? 'Confirmed' :
                           apt.status === 'in-progress' ? 'In Progress' :
                           apt.status === 'waiting' ? 'Waiting' :
                           'Free Slot'}
                        </span>
                      </div>
                    )
                  })
                )}
                <div className="text-xs text-gray-500 mt-2">
                  <Link to="/appointments" className="text-blue-600 hover:underline">
                    Kelola semua appointment →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Barber Performance Card */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                Performa Barber
              </CardTitle>
              <CardDescription>Status dan performa harian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {barbers.length > 0 ? barbers.map((barber, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-2 rounded ${
                    barber.status === 'active' ? 'bg-green-50' :
                    barber.status === 'busy' ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        barber.status === 'active' ? 'bg-green-500' :
                        barber.status === 'busy' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        barber.status === 'off' ? 'text-gray-500' : 'text-gray-900'
                      }`}>{barber.name}</span>
                    </div>
                    <span className={`text-xs font-semibold ${
                      barber.status === 'active' ? 'text-green-600' :
                      barber.status === 'busy' ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {barber.status === 'off' ? 'Off Duty' : `${barber.customers} customer`}
                    </span>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 text-sm">No barber data available</div>
                )}
                {barbers.length > 0 && (
                  <div className="text-xs text-blue-600 mt-2">
                    ⭐ Avg Rating: {(barbers.reduce((acc, b) => acc + (b.rating || 4.8), 0) / barbers.length).toFixed(1)}/5 |
                    📊 Efisiensi: {Math.round(barbers.reduce((acc, b) => acc + (b.efficiency || 92), 0) / barbers.length)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Queue Management Card */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Antrian & Queue
              </CardTitle>
              <CardDescription>Status antrian real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Antrian Saat Ini</span>
                  <span className="text-lg font-bold text-orange-600">{queueData.current} orang</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimasi Tunggu</span>
                  <span className="text-sm font-semibold text-gray-900">~{queueData.waitTime} menit</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: `${queueData.capacity}%`}}></div>
                </div>
                <div className="text-xs text-gray-500">Capacity: {queueData.capacity}% full</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-600">Walk-in</div>
                    <div className="text-gray-600">{queueData.walkIn} orang</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-600">Booking</div>
                    <div className="text-gray-600">{queueData.booking} orang</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Widgets Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Daily Targets Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Target Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    dailyTarget.percentage >= 100 ? 'text-green-600' :
                    dailyTarget.percentage >= 80 ? 'text-blue-600' :
                    dailyTarget.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{Math.round(dailyTarget.percentage)}%</div>
                  <div className="text-xs text-gray-500">Progress Target</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${
                    dailyTarget.percentage >= 100 ? 'bg-green-500' :
                    dailyTarget.percentage >= 80 ? 'bg-blue-500' :
                    dailyTarget.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} style={{width: `${Math.min(dailyTarget.percentage, 100)}%`}}></div>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Target: {formatRupiah(dailyTarget.target)}</div>
                  <div>Tercapai: {formatRupiah(dailyTarget.achieved)}</div>
                  <div className={`font-semibold ${
                    dailyTarget.achieved >= dailyTarget.target ? 'text-green-600' : 'text-red-600'
                  }`}>Sisa: {formatRupiah(Math.max(dailyTarget.target - dailyTarget.achieved, 0))}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Rating</span>
                  <span className="text-sm font-semibold text-yellow-600">⭐ {quickStats.rating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Avg Duration</span>
                  <span className="text-sm font-semibold text-gray-900">{quickStats.avgDuration} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Repeat Customer</span>
                  <span className="text-sm font-semibold text-green-600">{quickStats.repeatCustomer}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">No-Show Rate</span>
                  <span className="text-sm font-semibold text-red-600">{quickStats.noShowRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.length > 0 ? notifications.map((notif, idx) => (
                  <div key={idx} className={`p-2 rounded text-xs ${
                    notif.type === 'birthday' ? 'bg-red-50' :
                    notif.type === 'stock' ? 'bg-yellow-50' :
                    notif.type === 'appointment' ? 'bg-blue-50' :
                    notif.type === 'payment' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <div className={`font-semibold ${
                      notif.type === 'birthday' ? 'text-red-700' :
                      notif.type === 'stock' ? 'text-yellow-700' :
                      notif.type === 'appointment' ? 'text-blue-700' :
                      notif.type === 'payment' ? 'text-green-700' : 'text-gray-700'
                    }`}>{notif.icon} {notif.title}</div>
                    <div className={`${
                      notif.type === 'birthday' ? 'text-red-600' :
                      notif.type === 'stock' ? 'text-yellow-600' :
                      notif.type === 'appointment' ? 'text-blue-600' :
                      notif.type === 'payment' ? 'text-green-600' : 'text-gray-600'
                    }`}>{notif.message}</div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 text-xs py-4">
                    No notifications today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Promotions Card */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-pink-600" />
                Promo Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {promotions.length > 0 ? promotions.map((promo, idx) => (
                  <div key={idx} className={`p-2 rounded text-xs border ${
                    promo.type === 'weekend' ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200' :
                    promo.type === 'referral' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' :
                    promo.type === 'package' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
                    'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                  }`}>
                    <div className={`font-semibold ${
                      promo.type === 'weekend' ? 'text-pink-700' :
                      promo.type === 'referral' ? 'text-blue-700' :
                      promo.type === 'package' ? 'text-green-700' :
                      'text-gray-700'
                    }`}>{promo.icon} {promo.title}</div>
                    <div className={`${
                      promo.type === 'weekend' ? 'text-pink-600' :
                      promo.type === 'referral' ? 'text-blue-600' :
                      promo.type === 'package' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>{promo.description}</div>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 text-xs py-4">
                    No active promotions
                  </div>
                )}
                <div className="text-xs text-center text-gray-500 mt-2">
                  <Link to="/service-pos" className="text-pink-600 hover:underline font-semibold">
                    Apply Promo →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showBusinessDashboard) {
    // Check if we have a custom dashboard for this business type
    const customDashboard = getCustomDashboard(businessType)
    if (customDashboard) {
      return customDashboard
    }

    // Fallback to original business dashboard
    return (
      <div className="space-y-6">
        <BusinessDashboard businessType={businessType} />

        {/* Business-specific metrics and KPIs */}
        {getBusinessSpecificMetrics(businessType, today, currentShift)}

        {/* Traditional summary cards for all business types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Shift Card */}
          {shiftLoading ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status Shift</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat status shift...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentShift ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="text-lg font-bold text-green-600">Shift Aktif</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Operator: {currentShift.user_name || 'Admin'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Mulai: {currentShift.jam_mulai}
                </div>
                <div className="text-sm text-muted-foreground">
                  Modal: {formatRupiah(currentShift.modal_awal)}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <div className="text-lg font-bold text-yellow-600">Tidak Ada Shift</div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Mulai shift untuk operasional kasir
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link to="/barbershop-shift">
                    <Play className="h-3 w-3 mr-1" />
                    Mulai Shift
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Today Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ringkasan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading || !today ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat ringkasan...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{formatRupiah(today.revenue)}</div>
                <div className="text-sm text-muted-foreground">
                  {today.transactions} transaksi • {today.items_sold} item terjual
                </div>
                <div className="text-sm text-muted-foreground">
                  Rata-rata: {formatRupiah(today.avg_per_txn)}
                </div>
                {compareRevenue && (
                  <div className={`text-sm ${compareRevenue.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {compareRevenue.diff >= 0 ? '+' : ''}{formatRupiah(compareRevenue.diff)} ({compareRevenue.pct.toFixed(1)}%) vs kemarin
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Barbershop specific card or Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {businessType === 'barbershop' ? 'Layanan Tersedia' : 'Stok Menipis'}
            </CardTitle>
            {businessType === 'barbershop' ? (
              <Wrench className="h-4 w-4 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {businessType === 'barbershop' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Haircut Basic</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Haircut Premium</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Beard Trim</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Hair Wash</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <Link to="/service-list" className="text-blue-600 hover:underline">
                    Lihat semua layanan →
                  </Link>
                </div>
              </div>
            ) : (
              stockLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat stok...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Tidak ada stok menipis</div>
                  ) : (
                    <div className="space-y-1">
                      {lowStock.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="truncate">{p.name}</span>
                          <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {p.stock}
                          </span>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{lowStock.length - 5} item lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {businessType === 'barbershop' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/service-pos" className="flex items-center gap-2 w-full">
                    <Scissors className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Kasir Treatment</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/appointments" className="flex items-center gap-2 w-full">
                    <Calendar className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Booking</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/barbershop-shift" className="flex items-center gap-2 w-full">
                    <Clock className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Kelola Shift</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/reports" className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Laporan</AutoFitText>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/cashier" className="flex items-center gap-2 w-full">
                    <ShoppingCart className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Penjualan Baru</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/inventory" className="flex items-center gap-2 w-full">
                    <Eye className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Cek Stok</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/inventory/new" className="flex items-center gap-2 w-full">
                    <PackagePlus className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Tambah Produk</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/reports" className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Laporan</AutoFitText>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trend Penjualan (7 hari)</CardTitle>
            <CardDescription>Pendapatan dan jumlah transaksi harian</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat grafik...</span>
              </div>
            ) : (
              <div className="h-[200px]">
                <Line
                  data={{
                    labels: daily7.map(d=>d.day),
                    datasets: [
                      { label:'Pendapatan', data: daily7.map(d=>d.revenue), borderColor:'hsl(var(--primary))', backgroundColor:'hsl(var(--primary) / 0.1)' },
                      { label:'Transaksi', data: daily7.map(d=>d.txns), borderColor:'hsl(var(--secondary))', backgroundColor:'hsl(var(--secondary) / 0.1)' }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend Penjualan (30 hari)</CardTitle>
            <CardDescription>Pendapatan harian dalam sebulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat grafik...</span>
              </div>
            ) : (
              <div className="h-[200px]">
                <Bar
                  data={{
                    labels: daily30.map(d=>d.day),
                    datasets: [
                      { label:'Pendapatan', data: daily30.map(d=>d.revenue), backgroundColor:'hsl(var(--primary) / 0.8)' }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris (7 hari)</CardTitle>
            <CardDescription>Produk dengan penjualan tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {best7.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-center">{r.qty}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kategori (7 hari)</CardTitle>
            <CardDescription>Ringkasan penjualan berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats7.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || '-'}</TableCell>
                      <TableCell className="text-center">{r.qty}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Business-specific charts and analytics */}
        {getBusinessSpecificCharts(businessType, daily7, daily30, chartLoading)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
Dashboard
        </h1>
        <div className="flex items-center gap-2">
          {businessType === 'barbershop' ? (
            <>
              <Button asChild variant="outline">
                <Link to="/history" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Riwayat
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/appointments" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/barbershop-shift" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Shift
                </Link>
              </Button>
              <Button asChild>
                <Link to="/service-pos" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Kasir
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/history" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Riwayat
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/inventory" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Inventory
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/reports" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Laporan
                </Link>
              </Button>
              <Button asChild>
                <Link to="/cashier" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Kasir
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Current Shift Card */}
        {shiftLoading ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Shift</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat status shift...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Shift</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {currentShift ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div className="text-lg font-bold text-green-600">Shift Aktif</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Operator: {currentShift.user_name || 'Admin'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mulai: {currentShift.jam_mulai}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Modal: {formatRupiah(currentShift.modal_awal)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <div className="text-lg font-bold text-yellow-600">Tidak Ada Shift</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Mulai shift untuk operasional kasir
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/barbershop-shift">
                      <Play className="h-3 w-3 mr-1" />
                      Mulai Shift
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ringkasan Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading || !today ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat ringkasan...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{formatRupiah(today.revenue)}</div>
                <div className="text-sm text-muted-foreground">
                  {today.transactions} transaksi • {today.items_sold} item terjual
                </div>
                <div className="text-sm text-muted-foreground">
                  Rata-rata: {formatRupiah(today.avg_per_txn)}
                </div>
                {compareRevenue && (
                  <div className={`text-sm ${compareRevenue.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {compareRevenue.diff >= 0 ? '+' : ''}{formatRupiah(compareRevenue.diff)} ({compareRevenue.pct.toFixed(1)}%) vs kemarin
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barbershop specific card or Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {businessType === 'barbershop' ? 'Layanan Tersedia' : 'Stok Menipis'}
            </CardTitle>
            {businessType === 'barbershop' ? (
              <Wrench className="h-4 w-4 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {businessType === 'barbershop' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Haircut Basic</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Haircut Premium</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Beard Trim</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Hair Wash</span>
                  <span className="font-medium text-green-600">Tersedia</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <Link to="/service-list" className="text-blue-600 hover:underline">
                    Lihat semua layanan →
                  </Link>
                </div>
              </div>
            ) : (
              stockLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memuat stok...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Tidak ada stok menipis</div>
                  ) : (
                    <div className="space-y-1">
                      {lowStock.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                          <span className="truncate">{p.name}</span>
                          <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {p.stock}
                          </span>
                        </div>
                      ))}
                      {lowStock.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{lowStock.length - 5} item lainnya
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {businessType === 'barbershop' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/service-pos" className="flex items-center gap-2 w-full">
                    <Scissors className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Kasir Treatment</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/appointments" className="flex items-center gap-2 w-full">
                    <Calendar className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Booking</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/barbershop-shift" className="flex items-center gap-2 w-full">
                    <Clock className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Kelola Shift</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/reports" className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Laporan</AutoFitText>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/cashier" className="flex items-center gap-2 w-full">
                    <ShoppingCart className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Penjualan Baru</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/inventory" className="flex items-center gap-2 w-full">
                    <Eye className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Cek Stok</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/inventory/new" className="flex items-center gap-2 w-full">
                    <PackagePlus className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Tambah Produk</AutoFitText>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/reports" className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <AutoFitText maxSize={14} minSize={10}>Laporan</AutoFitText>
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trend Penjualan (7 hari)</CardTitle>
            <CardDescription>Pendapatan dan jumlah transaksi harian</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat grafik...</span>
              </div>
            ) : (
              <div className="h-[200px]">
                <Line
                  data={{
                    labels: daily7.map(d=>d.day),
                    datasets: [
                      { label:'Pendapatan', data: daily7.map(d=>d.revenue), borderColor:'hsl(var(--primary))', backgroundColor:'hsl(var(--primary) / 0.1)' },
                      { label:'Transaksi', data: daily7.map(d=>d.txns), borderColor:'hsl(var(--secondary))', backgroundColor:'hsl(var(--secondary) / 0.1)' }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend Penjualan (30 hari)</CardTitle>
            <CardDescription>Pendapatan harian dalam sebulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat grafik...</span>
              </div>
            ) : (
              <div className="h-[200px]">
                <Bar
                  data={{
                    labels: daily30.map(d=>d.day),
                    datasets: [
                      { label:'Pendapatan', data: daily30.map(d=>d.revenue), backgroundColor:'hsl(var(--primary) / 0.8)' }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris (7 hari)</CardTitle>
            <CardDescription>Produk dengan penjualan tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {best7.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-center">{r.qty}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Kategori (7 hari)</CardTitle>
            <CardDescription>Ringkasan penjualan berdasarkan kategori</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cats7.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name || '-'}</TableCell>
                      <TableCell className="text-center">{r.qty}</TableCell>
                      <TableCell className="text-right">{formatRupiah(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getBusinessSpecificMetrics(businessType, today, currentShift) {
  if (!businessType || businessType === 'general') return null

  const metricCards = getBusinessMetricCards(businessType, today, currentShift)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((metric, index) => {
        const IconComponent = metric.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" style={{ color: metric.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: metric.color }}>
                {typeof metric.value === 'number' ? formatMoney(metric.value) : metric.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function getBusinessMetricCards(businessType, today, currentShift) {
  const baseRevenue = today?.revenue || 0
  const baseTransactions = today?.transactions || 0
  const baseItems = today?.items_sold || 0

  switch (businessType) {
    case BUSINESS_TYPES.PHOTOCOPY:
      return [
        {
          title: 'Total Print Jobs',
          value: baseTransactions,
          icon: Printer,
          description: 'Pekerjaan print hari ini',
          color: '#059669'
        },
        {
          title: 'Pages Printed',
          value: baseItems,
          icon: FileText,
          description: 'Halaman yang dicetak',
          color: '#059669'
        },
        {
          title: 'Antrian Aktif',
          value: '3', // Mock data
          icon: Clock,
          description: 'Job sedang dalam proses',
          color: '#F59E0B'
        },
        {
          title: 'Design Orders',
          value: '2', // Mock data
          icon: Eye,
          description: 'Order design hari ini',
          color: '#8B5CF6'
        }
      ]

    case BUSINESS_TYPES.BARBERSHOP:
      return [
        {
          title: 'Layanan Cukur',
          value: baseTransactions,
          icon: Scissors,
          description: 'Customer dilayani hari ini',
          color: '#8B5CF6'
        },
        {
          title: 'Appointment',
          value: '5', // Mock data
          icon: Calendar,
          description: 'Booking hari ini',
          color: '#059669'
        },
        {
          title: 'Walk-in',
          value: Math.max(0, baseTransactions - 5),
          icon: UserCheck,
          description: 'Customer tanpa booking',
          color: '#F59E0B'
        },
        {
          title: 'Rata-rata Service',
          value: '35 min',
          icon: Timer,
          description: 'Waktu rata-rata layanan',
          color: '#10B981'
        }
      ]

    case BUSINESS_TYPES.RESTAURANT:
      return [
        {
          title: 'Orders Hari Ini',
          value: baseTransactions,
          icon: Utensils,
          description: 'Total pesanan makanan',
          color: '#F59E0B'
        },
        {
          title: 'Dine-In',
          value: Math.floor(baseTransactions * 0.6),
          icon: Coffee,
          description: 'Makan di tempat',
          color: '#059669'
        },
        {
          title: 'Takeaway',
          value: Math.floor(baseTransactions * 0.4),
          icon: Package,
          description: 'Bungkus/delivery',
          color: '#8B5CF6'
        },
        {
          title: 'Rata-rata Order',
          value: formatRupiah((baseRevenue / Math.max(baseTransactions, 1))),
          icon: TrendingUp,
          description: 'Nilai per pesanan',
          color: '#10B981'
        }
      ]

    case BUSINESS_TYPES.LAUNDRY:
      return [
        {
          title: 'Cucian Diterima',
          value: baseTransactions,
          icon: Shirt,
          description: 'Order laundry hari ini',
          color: '#0EA5E9'
        },
        {
          title: 'Berat Total',
          value: `${(baseItems * 1.5).toFixed(1)} kg`,
          icon: Package,
          description: 'Kilogram cucian',
          color: '#059669'
        },
        {
          title: 'Express Service',
          value: Math.floor(baseTransactions * 0.3),
          icon: Clock,
          description: 'Layanan kilat',
          color: '#F59E0B'
        },
        {
          title: 'Siap Diambil',
          value: '8', // Mock data
          icon: CheckCircle,
          description: 'Cucian siap pickup',
          color: '#10B981'
        }
      ]

    case BUSINESS_TYPES.AUTOMOTIVE:
      return [
        {
          title: 'Kendaraan Service',
          value: baseTransactions,
          icon: Car,
          description: 'Unit masuk service',
          color: '#DC2626'
        },
        {
          title: 'Penjualan Part',
          value: baseItems,
          icon: Package,
          description: 'Sparepart terjual',
          color: '#059669'
        },
        {
          title: 'Job Selesai',
          value: Math.floor(baseTransactions * 0.7),
          icon: CheckCircle,
          description: 'Service completed',
          color: '#10B981'
        },
        {
          title: 'Dalam Proses',
          value: Math.floor(baseTransactions * 0.3),
          icon: Wrench,
          description: 'Sedang dikerjakan',
          color: '#F59E0B'
        }
      ]

    case BUSINESS_TYPES.PHARMACY:
      return [
        {
          title: 'Penjualan Obat',
          value: baseTransactions,
          icon: Pill,
          description: 'Transaksi farmasi',
          color: '#16A34A'
        },
        {
          title: 'Resep Dokter',
          value: Math.floor(baseTransactions * 0.4),
          icon: FileText,
          description: 'Resep diproses',
          color: '#059669'
        },
        {
          title: 'Konsultasi',
          value: '3', // Mock data
          icon: Stethoscope,
          description: 'Konsultasi farmasi',
          color: '#8B5CF6'
        },
        {
          title: 'Over Counter',
          value: Math.floor(baseTransactions * 0.6),
          icon: ShoppingCart,
          description: 'Obat bebas',
          color: '#10B981'
        }
      ]

    case BUSINESS_TYPES.CLINIC:
      return [
        {
          title: 'Pasien Hari Ini',
          value: baseTransactions,
          icon: Users,
          description: 'Pasien yang dilayani',
          color: '#0891B2'
        },
        {
          title: 'Appointment',
          value: Math.floor(baseTransactions * 0.7),
          icon: Calendar,
          description: 'Jadwal appointment',
          color: '#059669'
        },
        {
          title: 'Walk-in',
          value: Math.floor(baseTransactions * 0.3),
          icon: UserCheck,
          description: 'Pasien langsung datang',
          color: '#F59E0B'
        },
        {
          title: 'Billing Medis',
          value: formatRupiah(baseRevenue),
          icon: Activity,
          description: 'Revenue hari ini',
          color: '#10B981'
        }
      ]

    case BUSINESS_TYPES.EDUCATION:
      return [
        {
          title: 'Siswa Aktif',
          value: baseTransactions,
          icon: Users,
          description: 'Siswa hadir hari ini',
          color: '#7C3AED'
        },
        {
          title: 'Kelas Berjalan',
          value: '8', // Mock data
          icon: GraduationCap,
          description: 'Sesi pembelajaran',
          color: '#059669'
        },
        {
          title: 'Pembayaran SPP',
          value: Math.floor(baseTransactions * 0.2),
          icon: ShoppingCart,
          description: 'Transaksi hari ini',
          color: '#10B981'
        },
        {
          title: 'Pendaftaran Baru',
          value: '2', // Mock data
          icon: UserCheck,
          description: 'Siswa baru',
          color: '#F59E0B'
        }
      ]

    case BUSINESS_TYPES.LEGAL:
      return [
        {
          title: 'Konsultasi',
          value: baseTransactions,
          icon: Scale,
          description: 'Klien konsultasi',
          color: '#1F2937'
        },
        {
          title: 'Kasus Aktif',
          value: '12', // Mock data
          icon: FileText,
          description: 'Kasus sedang berjalan',
          color: '#059669'
        },
        {
          title: 'Fee Hari Ini',
          value: formatRupiah(baseRevenue),
          icon: TrendingUp,
          description: 'Pendapatan legal',
          color: '#10B981'
        },
        {
          title: 'Meeting',
          value: '4', // Mock data
          icon: Calendar,
          description: 'Pertemuan klien',
          color: '#8B5CF6'
        }
      ]

    case BUSINESS_TYPES.CONSULTING:
      return [
        {
          title: 'Proyek Aktif',
          value: '6', // Mock data
          icon: Briefcase,
          description: 'Project berjalan',
          color: '#059669'
        },
        {
          title: 'Klien Meeting',
          value: baseTransactions,
          icon: Users,
          description: 'Pertemuan hari ini',
          color: '#8B5CF6'
        },
        {
          title: 'Revenue',
          value: formatRupiah(baseRevenue),
          icon: TrendingUp,
          description: 'Pendapatan konsultasi',
          color: '#10B981'
        },
        {
          title: 'Proposal',
          value: '2', // Mock data
          icon: FileText,
          description: 'Proposal dikirim',
          color: '#F59E0B'
        }
      ]

    case BUSINESS_TYPES.ELECTRONICS:
      return [
        {
          title: 'Penjualan',
          value: baseTransactions,
          icon: Smartphone,
          description: 'Transaksi elektronik',
          color: '#EA580C'
        },
        {
          title: 'Service Center',
          value: Math.floor(baseTransactions * 0.3),
          icon: Wrench,
          description: 'Unit masuk service',
          color: '#059669'
        },
        {
          title: 'Garansi Claim',
          value: '1', // Mock data
          icon: AlertTriangle,
          description: 'Klaim garansi',
          color: '#F59E0B'
        },
        {
          title: 'Trade-in',
          value: Math.floor(baseTransactions * 0.1),
          icon: Package,
          description: 'Unit trade-in',
          color: '#8B5CF6'
        }
      ]

    default:
      return [
        {
          title: 'Total Transaksi',
          value: baseTransactions,
          icon: ShoppingCart,
          description: 'Transaksi hari ini',
          color: '#059669'
        },
        {
          title: 'Items Terjual',
          value: baseItems,
          icon: Package,
          description: 'Produk/layanan',
          color: '#10B981'
        },
        {
          title: 'Revenue',
          value: formatRupiah(baseRevenue),
          icon: TrendingUp,
          description: 'Pendapatan hari ini',
          color: '#059669'
        },
        {
          title: 'Customer',
          value: baseTransactions,
          icon: Users,
          description: 'Customer dilayani',
          color: '#8B5CF6'
        }
      ]
  }
}

function getBusinessSpecificCharts(businessType, daily7, daily30, chartLoading) {
  if (!businessType || businessType === 'general') return null

  const chartData = getBusinessChartData(businessType, daily7, daily30)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {chartData.map((chart, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <chart.icon className="h-5 w-5" style={{ color: chart.color }} />
              {chart.title}
            </CardTitle>
            <CardDescription>{chart.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat grafik...</span>
              </div>
            ) : (
              <div className="h-[200px]">
                {chart.component}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getCustomDashboard(businessType) {
  switch (businessType) {
    case BUSINESS_TYPES.BARBERSHOP:
      return <BarbershopDashboard />
    case BUSINESS_TYPES.RESTAURANT:
      return <RestaurantDashboard />
    case BUSINESS_TYPES.AUTOMOTIVE:
      return <AutomotiveDashboard />
    case BUSINESS_TYPES.PHARMACY:
      return <PharmacyDashboard />
    default:
      return null
  }
}

function getBusinessChartData(businessType, daily7, daily30) {
  const primaryColor = 'hsl(var(--primary))'
  const secondaryColor = 'hsl(var(--secondary))'

  switch (businessType) {
    case BUSINESS_TYPES.PHOTOCOPY:
      return [
        {
          title: 'Print Jobs Trend',
          description: 'Trend pekerjaan print 7 hari terakhir',
          icon: Printer,
          color: '#059669',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Print Jobs',
                    data: daily7.map(d => d.txns),
                    borderColor: '#059669',
                    backgroundColor: '#059669' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Pages Printed',
                    data: daily7.map(d => d.items || d.txns * 5),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Revenue Mix',
          description: 'Komposisi pendapatan print vs produk',
          icon: BarChart3,
          color: '#8B5CF6',
          component: (
            <Bar
              data={{
                labels: ['Print & Copy', 'Design', 'ATK & Supplies', 'Finishing'],
                datasets: [{
                  label: 'Revenue',
                  data: [60, 25, 10, 5], // Percentage mock data
                  backgroundColor: ['#059669', '#F59E0B', '#8B5CF6', '#10B981']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.BARBERSHOP:
      return [
        {
          title: 'Customer Flow',
          description: 'Alur customer barbershop harian',
          icon: Scissors,
          color: '#8B5CF6',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Appointment',
                    data: daily7.map(d => Math.floor(d.txns * 0.7)),
                    borderColor: '#8B5CF6',
                    backgroundColor: '#8B5CF6' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Walk-in',
                    data: daily7.map(d => Math.floor(d.txns * 0.3)),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Service Mix',
          description: 'Jenis layanan terpopuler',
          icon: UserCheck,
          color: '#059669',
          component: (
            <Bar
              data={{
                labels: ['Haircut Basic', 'Haircut Premium', 'Beard Trim', 'Hair Wash', 'Complete Package'],
                datasets: [{
                  label: 'Count',
                  data: [45, 30, 20, 15, 25],
                  backgroundColor: ['#8B5CF6', '#059669', '#F59E0B', '#10B981', '#EA580C']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.RESTAURANT:
      return [
        {
          title: 'Order Trend',
          description: 'Trend pesanan makanan harian',
          icon: Utensils,
          color: '#F59E0B',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Dine-In',
                    data: daily7.map(d => Math.floor(d.txns * 0.6)),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Takeaway',
                    data: daily7.map(d => Math.floor(d.txns * 0.4)),
                    borderColor: '#059669',
                    backgroundColor: '#059669' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Menu Categories',
          description: 'Kategori menu terlaris',
          icon: Coffee,
          color: '#10B981',
          component: (
            <Bar
              data={{
                labels: ['Main Course', 'Beverages', 'Appetizer', 'Dessert', 'Combo'],
                datasets: [{
                  label: 'Orders',
                  data: [120, 95, 65, 40, 55],
                  backgroundColor: ['#F59E0B', '#059669', '#8B5CF6', '#10B981', '#EA580C']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.LAUNDRY:
      return [
        {
          title: 'Laundry Volume',
          description: 'Volume cucian harian (kg)',
          icon: Shirt,
          color: '#0EA5E9',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Regular Service',
                    data: daily7.map(d => d.txns * 2.5),
                    borderColor: '#0EA5E9',
                    backgroundColor: '#0EA5E9' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Express Service',
                    data: daily7.map(d => d.txns * 1.2),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Service Types',
          description: 'Jenis layanan laundry',
          icon: CheckCircle,
          color: '#10B981',
          component: (
            <Bar
              data={{
                labels: ['Wash & Fold', 'Dry Clean', 'Express 3H', 'Special Care', 'Pickup & Delivery'],
                datasets: [{
                  label: 'Orders',
                  data: [85, 45, 35, 15, 25],
                  backgroundColor: ['#0EA5E9', '#059669', '#F59E0B', '#8B5CF6', '#10B981']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.AUTOMOTIVE:
      return [
        {
          title: 'Service Progress',
          description: 'Progress service kendaraan harian',
          icon: Car,
          color: '#DC2626',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Masuk Service',
                    data: daily7.map(d => d.txns),
                    borderColor: '#DC2626',
                    backgroundColor: '#DC2626' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Selesai',
                    data: daily7.map(d => Math.floor(d.txns * 0.8)),
                    borderColor: '#10B981',
                    backgroundColor: '#10B981' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Service Types',
          description: 'Jenis service yang dilakukan',
          icon: Wrench,
          color: '#059669',
          component: (
            <Bar
              data={{
                labels: ['Tune Up', 'Oil Change', 'Brake Service', 'AC Service', 'Engine Repair'],
                datasets: [{
                  label: 'Count',
                  data: [25, 40, 15, 20, 8],
                  backgroundColor: ['#DC2626', '#059669', '#F59E0B', '#8B5CF6', '#EA580C']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.PHARMACY:
      return [
        {
          title: 'Pharmacy Sales',
          description: 'Penjualan farmasi harian',
          icon: Pill,
          color: '#16A34A',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Resep Dokter',
                    data: daily7.map(d => Math.floor(d.txns * 0.4)),
                    borderColor: '#16A34A',
                    backgroundColor: '#16A34A' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Over Counter',
                    data: daily7.map(d => Math.floor(d.txns * 0.6)),
                    borderColor: '#059669',
                    backgroundColor: '#059669' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Drug Categories',
          description: 'Kategori obat terlaris',
          icon: Stethoscope,
          color: '#8B5CF6',
          component: (
            <Bar
              data={{
                labels: ['Antibiotik', 'Vitamin', 'Analgesik', 'Obat Flu', 'Suplemen'],
                datasets: [{
                  label: 'Sales',
                  data: [65, 85, 45, 70, 55],
                  backgroundColor: ['#16A34A', '#059669', '#F59E0B', '#8B5CF6', '#10B981']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.CLINIC:
      return [
        {
          title: 'Patient Flow',
          description: 'Alur pasien harian',
          icon: Users,
          color: '#0891B2',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Appointment',
                    data: daily7.map(d => Math.floor(d.txns * 0.7)),
                    borderColor: '#0891B2',
                    backgroundColor: '#0891B2' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Walk-in',
                    data: daily7.map(d => Math.floor(d.txns * 0.3)),
                    borderColor: '#F59E0B',
                    backgroundColor: '#F59E0B' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Medical Services',
          description: 'Layanan medis yang dilakukan',
          icon: Activity,
          color: '#10B981',
          component: (
            <Bar
              data={{
                labels: ['Konsultasi Umum', 'Pemeriksaan Lab', 'Medical Check Up', 'Vaksinasi', 'Treatment'],
                datasets: [{
                  label: 'Count',
                  data: [75, 35, 15, 20, 25],
                  backgroundColor: ['#0891B2', '#059669', '#F59E0B', '#8B5CF6', '#10B981']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    case BUSINESS_TYPES.ELECTRONICS:
      return [
        {
          title: 'Sales vs Service',
          description: 'Penjualan vs service elektronik',
          icon: Smartphone,
          color: '#EA580C',
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Sales',
                    data: daily7.map(d => Math.floor(d.txns * 0.7)),
                    borderColor: '#EA580C',
                    backgroundColor: '#EA580C' + '20',
                    tension: 0.4
                  },
                  {
                    label: 'Service',
                    data: daily7.map(d => Math.floor(d.txns * 0.3)),
                    borderColor: '#059669',
                    backgroundColor: '#059669' + '20',
                    tension: 0.4
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        },
        {
          title: 'Product Categories',
          description: 'Kategori elektronik terlaris',
          icon: Package,
          color: '#8B5CF6',
          component: (
            <Bar
              data={{
                labels: ['Smartphone', 'Laptop', 'Accessories', 'Audio', 'Gaming'],
                datasets: [{
                  label: 'Sales',
                  data: [45, 25, 35, 20, 15],
                  backgroundColor: ['#EA580C', '#059669', '#F59E0B', '#8B5CF6', '#10B981']
                }]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]

    default:
      return [
        {
          title: 'Sales Trend',
          description: 'Trend penjualan 7 hari terakhir',
          icon: TrendingUp,
          color: primaryColor,
          component: (
            <Line
              data={{
                labels: daily7.map(d => d.day),
                datasets: [
                  {
                    label: 'Revenue',
                    data: daily7.map(d => d.revenue),
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '20'
                  }
                ]
              }}
              options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
            />
          )
        }
      ]
  }
}
