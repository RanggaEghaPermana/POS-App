import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatTimeOnly } from '../utils/formatters'
import { useAuth } from '../AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Scissors, Search, Minus, Plus, Trash2, User, LogOut,
  CreditCard, Calculator, History, Home, Clock, FileText,
  ShoppingCart, Package, Store, Play, Square, Users, Calendar,
  Star, Heart, Sparkles, Crown, RefreshCw, Utensils
} from 'lucide-react'
import {
  loadServicesFromStorage,
  loadCategoriesFromStorage,
  loadBarbersFromStorage,
  loadAppointmentsFromStorage,
  saveAppointmentsToStorage,
  initializeBarbershopData,
  updateBarberCompletedAppointments
} from '../utils/barbershopData'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

// Helper functions for number formatting
function formatInputNumber(value) {
  if (!value) return ''
  // Remove non-digits
  const numericValue = value.toString().replace(/\D/g, '')
  // Add thousands separator
  return new Intl.NumberFormat('id-ID').format(numericValue)
}

function parseInputNumber(formattedValue) {
  if (!formattedValue) return 0
  // Remove dots and convert to number
  return Number(formattedValue.toString().replace(/\./g, '')) || 0
}

function handleNumberInput(value, setDisplay, setValue) {
  const formatted = formatInputNumber(value)
  const numeric = parseInputNumber(value)
  setDisplay(formatted)
  setValue(numeric)
}

function handlePaymentAmountChange(index, value, payments, setPayments, paymentsDisplay, setPaymentsDisplay) {
  const formatted = formatInputNumber(value)
  const numeric = parseInputNumber(value)

  // Update display array
  const newDisplay = [...paymentsDisplay]
  newDisplay[index] = {...newDisplay[index], amount: formatted}
  setPaymentsDisplay(newDisplay)

  // Update actual values
  const newPayments = [...payments]
  newPayments[index] = {...newPayments[index], amount: numeric}
  setPayments(newPayments)
}

// Helper function to check if service includes barber rate
function serviceIncludesBarberRate(service) {
  return service.pricing_mode === "barber" || service.pricing_mode === "combined";
}

// Helper function to get the pre-selected barber for a service
function getServiceBarber(service) {
  return service.barber_id || null;
}

// Business-specific configurations
const BUSINESS_CONFIGS = {
  restaurant: {
    title: 'Layanan Meja Restaurant',
    subtitle: 'Kelola pesanan dine-in dan reservasi meja',
    icon: '🍽️',
    buttonText: 'Proses Pesanan',
    customerLabel: 'Nama Tamu',
    phoneLabel: 'No. Meja/Kontak',
    staffLabel: 'Pelayan',
    appointmentLabel: 'Reservasi',
    showBarberSection: false,
    showAppointmentSection: true,
    serviceLabel: 'Menu & Paket',
    cartTitle: 'Pesanan Meja',
    emptyCartText: 'Belum ada pesanan'
  },
  barbershop: {
    title: 'Service POS Barbershop',
    subtitle: 'Kelola treatment dan layanan cukur',
    icon: '✂️',
    buttonText: 'Proses Treatment',
    customerLabel: 'Nama Pelanggan',
    phoneLabel: 'No. Telepon',
    staffLabel: 'Barber',
    appointmentLabel: 'Appointment',
    showBarberSection: true,
    showAppointmentSection: true,
    serviceLabel: 'Treatment',
    cartTitle: 'Keranjang Treatment',
    emptyCartText: 'Belum ada treatment'
  }
}

export default function ServicePOS(){
  const { token, user, logout, activeTenant } = useAuth()
  const location = useLocation()
  const [q, setQ] = useState('')
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [barbers, setBarbers] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')

  // Detect business type
  const businessType = activeTenant?.business_type || 'barbershop'
  const config = BUSINESS_CONFIGS[businessType] || BUSINESS_CONFIGS.barbershop
  const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true
  const [cart, setCart] = useState({})
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [discountDisplay, setDiscountDisplay] = useState('')
  const [taxDisplay, setTaxDisplay] = useState('')
  const [payments, setPayments] = useState([{method:'cash',amount:''},{method:'',amount:''}])
  const [paymentsDisplay, setPaymentsDisplay] = useState([{amount:''},{amount:''}])
  const [notes, setNotes] = useState({}) // Notes per service
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedBarber, setSelectedBarber] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [currentAppointmentId, setCurrentAppointmentId] = useState('')
  const [appointments, setAppointments] = useState([])
  const [showAppointmentSection, setShowAppointmentSection] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const currency = useCurrency('IDR')
  const nav = useNavigate()

  async function search(){
    try{
      const p = new URLSearchParams()
      if(q) p.set('q', q)
      if(selectedCategory) p.set('category_id', selectedCategory)
      p.set('per_page', 50)
      p.set('active', 'true')

      const data = await apiGet(`/setup/services?${p.toString()}`, token)
      setServices(data.data || [])
    }catch(e){
      console.warn('API not available, using fallback data:', e.message)
      // Fallback to barbershop data for other business types
      const allServices = loadServicesFromStorage()
      setServices(allServices.filter(service => service.active))
    }
  }

  function generateRestaurantServices() {
    const restaurantServices = [
      { id: 1, name: 'Paket Hemat Keluarga', code: 'PKT001', base_price: 75000, estimated_duration: 30, service_category: { name: 'Paket Spesial' } },
      { id: 2, name: 'Catering 10 Porsi', code: 'CTR001', base_price: 200000, estimated_duration: 60, service_category: { name: 'Paket Spesial' } },
      { id: 3, name: 'Extra Sambel', code: 'ADD001', base_price: 2000, estimated_duration: 0, service_category: { name: 'Add-on' } },
      { id: 4, name: 'Extra Nasi', code: 'ADD002', base_price: 5000, estimated_duration: 0, service_category: { name: 'Add-on' } },
      { id: 5, name: 'Nasi Gudeg', code: 'MENU001', base_price: 25000, estimated_duration: 15, service_category: { name: 'Menu Utama' } },
      { id: 6, name: 'Ayam Bakar', code: 'MENU002', base_price: 35000, estimated_duration: 20, service_category: { name: 'Menu Utama' } },
      { id: 7, name: 'Soto Ayam', code: 'MENU003', base_price: 20000, estimated_duration: 10, service_category: { name: 'Menu Utama' } },
      { id: 8, name: 'Es Teh Manis', code: 'DRINK001', base_price: 8000, estimated_duration: 2, service_category: { name: 'Minuman' } },
      { id: 9, name: 'Jus Jeruk', code: 'DRINK002', base_price: 15000, estimated_duration: 5, service_category: { name: 'Minuman' } }
    ]
    setServices(restaurantServices)
  }

  async function loadCategories(){
    try{
      const cats = await apiGet('/setup/service-categories?per_page=100&active=true', token)
      setCategories(cats.data || [])
    }catch(e){
      console.warn('API not available, using fallback categories:', e.message)
      // Fallback to barbershop data for other business types
      const categories = loadCategoriesFromStorage()
      setCategories(categories.filter(cat => cat.active))
    }
  }

  async function loadBarbers(){
    // Only load barbers for barbershop business type
    if (businessType !== 'barbershop') {
      setBarbers([])
      return
    }

    // Always load fresh barber data from localStorage (updated from Kelola Barber page)
    const barbers = loadBarbersFromStorage()
    setBarbers(barbers.filter(barber => barber.active))
    console.log('Loaded barbers from storage:', barbers.filter(barber => barber.active))

    // Also try to load from API if available (but localStorage takes priority)
    if (!isMockMode && token) {
      try{
        const apiBarbers = await apiGet('/setup/barbers?per_page=100&active=true', token)
        console.log('API barbers available:', apiBarbers.data || [])
        // Only use API data if localStorage is empty
        if (barbers.length === 0 && apiBarbers.data && apiBarbers.data.length > 0) {
          setBarbers(apiBarbers.data.filter(barber => barber.active))
        }
      }catch(e){
        console.warn('API not available, using localStorage barbers:', e.message)
      }
    }
  }

  async function loadTodayAppointments(){
    if (isMockMode || !token) {
      // Use barbershop appointments from localStorage
      const allAppointments = loadAppointmentsFromStorage()
      const today = new Date().toISOString().slice(0, 10)
      const todayAppointments = allAppointments.filter(apt =>
        apt.appointment_date === today &&
        (apt.status === 'scheduled' || apt.status === 'confirmed')
      )
      setAppointments(todayAppointments)
      return
    }

    try{
      const today = new Date().toISOString().slice(0, 10)
      const appointments = await apiGet(`/appointments?date=${today}&status=scheduled,confirmed`, token)
      setAppointments(appointments.data || [])
    }catch(e){
      console.warn('API not available, using barbershop appointments:', e.message)
      // Fallback to barbershop data
      const allAppointments = loadAppointmentsFromStorage()
      const today = new Date().toISOString().slice(0, 10)
      const todayAppointments = allAppointments.filter(apt =>
        apt.appointment_date === today &&
        (apt.status === 'scheduled' || apt.status === 'confirmed')
      )
      setAppointments(todayAppointments)
    }
  }


  useEffect(()=>{
    (async()=>{
      // Initialize barbershop data if in mock mode
      if (isMockMode || !token) {
        initializeBarbershopData()
      }
      await Promise.all([loadCategories(), loadBarbers(), loadTodayAppointments(), search()])
      setInitialLoading(false)
    })()

    // Listen for localStorage changes (when barber data is updated from Kelola Barber page)
    const handleStorageChange = (e) => {
      if (e.key === 'barbershop_barbers') {
        console.log('Barber data updated in localStorage, refreshing...')
        loadBarbers()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(()=>{ search() }, [selectedCategory, q])

  // Recalculate cart prices when barber changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      setCart(prev => {
        const next = {...prev}

        if (selectedBarber) {
          const selectedBarberData = barbers.find(b => b.id === selectedBarber)
          console.log('Selected barber ID:', selectedBarber)
          console.log('Found barber data:', selectedBarberData)
          console.log('All available barbers:', barbers)

          if (selectedBarberData && selectedBarberData.hourly_rate) {
            Object.keys(next).forEach(serviceId => {
              const row = next[serviceId]
              const service = services.find(s => s.id === serviceId)

              // Ensure base_price is preserved
              if (!row.base_price) {
                row.base_price = Number(service?.base_price || 0)
              }

              // Check if service already includes barber rate
              if (service && serviceIncludesBarberRate(service)) {
                // Service already includes barber rate - use base price only
                row.price = row.base_price
                row.barber_hourly_rate = null
                row.barber_cost = 0
                row.has_included_barber = true
                row.included_barber_id = service.barber_id
                console.log(`Service ${service.name} already includes barber rate: ${row.base_price}`)
              } else {
                // Service doesn't include barber rate - add barber cost
                const barberPrice = selectedBarberData.hourly_rate
                row.price = row.base_price + barberPrice
                row.barber_hourly_rate = selectedBarberData.hourly_rate
                row.barber_cost = barberPrice
                row.has_included_barber = false
                row.included_barber_id = null
                console.log(`Service ${service?.name} + barber: ${row.base_price} + ${barberPrice} = ${row.price}`)
              }

              // Ensure unit stays as original service unit (should be "layanan", not "jam")
              const originalService = services.find(s => s.id === serviceId)
              if (originalService && originalService.unit !== "jam") {
                row.unit = originalService.unit
              }
            })
          } else {
            console.warn('No barber data found or no hourly rate set for barber:', selectedBarber)
          }
        } else {
          // No barber selected, use base prices
          Object.keys(next).forEach(serviceId => {
            const row = next[serviceId]
            const service = services.find(s => s.id === serviceId)
            if (service) {
              row.price = Number(service.base_price || 0)
              row.base_price = Number(service.base_price || 0)
              row.barber_hourly_rate = null
              row.barber_cost = 0
              row.has_included_barber = serviceIncludesBarberRate(service)
              row.included_barber_id = serviceIncludesBarberRate(service) ? service.barber_id : null
              // Ensure unit is correct (not "jam")
              row.unit = service.unit === "jam" ? "layanan" : service.unit
            }
          })
        }

        return next
      })
    }
  }, [selectedBarber, barbers, services])

  // Handle appointment data from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const appointmentId = searchParams.get('appointmentId')

    if (appointmentId && services.length > 0 && barbers.length > 0) {
      // Store appointment ID for later use
      setCurrentAppointmentId(appointmentId)

      // Auto-fill customer information
      const customerName = searchParams.get('customerName')
      const customerPhone = searchParams.get('customerPhone')
      const barberId = searchParams.get('barberId')
      const serviceIds = searchParams.get('services')

      if (customerName) setCustomerName(customerName)
      if (customerPhone) setCustomerPhone(customerPhone)
      if (barberId) setSelectedBarber(barberId)

      // Add services to cart
      if (serviceIds) {
        const serviceIdList = serviceIds.split(',')
        serviceIdList.forEach(serviceId => {
          const service = services.find(s => s.id === serviceId)
          if (service) {
            addToCart(service)
          }
        })
      }

      // Clear URL parameters after auto-filling (but keep appointment ID in state)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [location.search, services, barbers])

  function addToCart(service){
    // Auto-select barber if service includes barber rate
    if (serviceIncludesBarberRate(service) && service.barber_id && !selectedBarber) {
      setSelectedBarber(service.barber_id);
    }

    setCart(prev => {
      const next = {...prev}

      // Calculate price based on selected barber's rate per service
      let price = Number(service.base_price||0)
      let barberCost = 0

      // For services with included barber rate, use the service price as is
      if (serviceIncludesBarberRate(service)) {
        price = Number(service.base_price||0); // Already includes barber rate
      } else if (selectedBarber) {
        const selectedBarberData = barbers.find(b => b.id === selectedBarber)
        if (selectedBarberData && selectedBarberData.hourly_rate) {
          // Use barber rate as fixed price per service
          barberCost = selectedBarberData.hourly_rate
          // Add barber rate to base price
          price = price + barberCost
        }
      }

      const row = next[service.id] || {
        service_id: service.id,
        name: service.name,
        code: service.code,
        price: price,
        base_price: Number(service.base_price||0),
        qty: 0,
        unit: service.unit === "jam" ? "layanan" : service.unit, // Fix unit if it's incorrectly set to "jam"
        estimated_duration: service.estimated_duration || 0,
        requirements: service.requirements,
        barber_hourly_rate: selectedBarber ? barbers.find(b => b.id === selectedBarber)?.hourly_rate : null,
        barber_cost: barberCost,
        has_included_barber: serviceIncludesBarberRate(service),
        included_barber_id: serviceIncludesBarberRate(service) ? service.barber_id : null
      }

      // Always ensure base_price is properly set
      if (!row.base_price) {
        row.base_price = Number(service.base_price||0)
      }
      row.qty += 1

      // Recalculate price based on quantity (pricing tiers) or barber rate
      if(service.pricing_tiers && service.pricing_tiers.length > 0) {
        const tiers = [...service.pricing_tiers].sort((a,b) => b.min_qty - a.min_qty)
        const tier = tiers.find(t => row.qty >= t.min_qty)
        if(tier) row.price = tier.price
      } else if (serviceIncludesBarberRate(service)) {
        // Service already includes barber rate, no need to add
        row.price = row.base_price || 0;
      } else if (selectedBarber && service.estimated_duration) {
        // Recalculate barber-based pricing for services without included barber rate
        const selectedBarberData = barbers.find(b => b.id === selectedBarber)
        if (selectedBarberData && selectedBarberData.hourly_rate) {
          // Use barber rate as fixed price per service
          const barberPrice = selectedBarberData.hourly_rate
          row.price = (row.base_price || 0) + barberPrice
          row.barber_cost = barberPrice
          // Ensure unit stays correct
          row.unit = service.unit === "jam" ? "layanan" : service.unit
        }
      }

      next[service.id] = row
      return next
    })
  }

  function updateQty(id, qty){
    setCart(prev=>{
      const next = {...prev}
      if(!next[id]) return prev
      const newQty = Math.max(1, Number(qty||1))
      next[id] = {...next[id], qty: newQty}

      // Recalculate price based on new quantity
      const service = services.find(s => s.id === id)
      if(service?.pricing_tiers?.length > 0) {
        const tiers = [...service.pricing_tiers].sort((a,b) => b.min_qty - a.min_qty)
        const tier = tiers.find(t => newQty >= t.min_qty)
        if(tier) next[id].price = tier.price
        else next[id].price = service.base_price
      } else if (selectedBarber && service?.estimated_duration) {
        // Recalculate barber-based pricing for quantity changes
        const selectedBarberData = barbers.find(b => b.id === selectedBarber)
        if (selectedBarberData && selectedBarberData.hourly_rate) {
          // Use barber rate as fixed price per service
          const barberPrice = selectedBarberData.hourly_rate
          next[id].price = (next[id].base_price || service.base_price || 0) + barberPrice
          next[id].barber_hourly_rate = selectedBarberData.hourly_rate
          next[id].barber_cost = barberPrice
          // Ensure unit stays correct
          next[id].unit = service.unit === "jam" ? "layanan" : service.unit
        }
      }
      return next
    })
  }

  function updateNotes(id, note) {
    setNotes(prev => ({...prev, [id]: note}))
  }

  function loadFromAppointment(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (!appointment) return

    // Auto-fill customer data
    setCustomerName(appointment.customer_name)
    setCustomerPhone(appointment.customer_phone)
    setSelectedBarber(appointment.barber_id)

    // Auto-add services to cart with barber pricing
    const selectedBarberData = barbers.find(b => b.id === appointment.barber_id)
    const newCart = {}

    appointment.service_ids.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId)
      if (service) {
        // Check if service already includes barber pricing
        const serviceIncludesBarber = serviceIncludesBarberRate(service)

        // Calculate price - don't add barber cost if already included
        let price = service.base_price
        let barberCost = 0
        let hasIncludedBarber = serviceIncludesBarber

        if (!serviceIncludesBarber && selectedBarberData && selectedBarberData.hourly_rate) {
          // Only add barber cost if service doesn't already include it
          barberCost = selectedBarberData.hourly_rate
          price = service.base_price + barberCost
        }

        newCart[serviceId] = {
          service_id: serviceId,
          name: service.name,
          code: service.code,
          price: price,
          base_price: service.base_price,
          qty: 1,
          unit: service.unit === "jam" ? "layanan" : service.unit,
          estimated_duration: service.estimated_duration || 0,
          barber_hourly_rate: selectedBarberData?.hourly_rate || null,
          barber_cost: barberCost,
          has_included_barber: hasIncludedBarber,
          included_barber_id: hasIncludedBarber ? appointment.barber_id : null
        }
      }
    })
    setCart(newCart)

    // Set notes if exists
    if (appointment.notes) {
      const newNotes = {}
      appointment.service_ids.forEach(serviceId => {
        newNotes[serviceId] = appointment.notes
      })
      setNotes(newNotes)
    }
  }

  function removeFromCart(id){
    setCart(prev=>{ const n={...prev}; delete n[id]; return n })
    setNotes(prev=>{ const n={...prev}; delete n[id]; return n })
  }

  function clearCart(){
    setCart({})
    setNotes({})
  }

  const subtotal = useMemo(()=>Object.values(cart).reduce((s,r)=>s+(r.price*r.qty),0),[cart])
  const grand = useMemo(()=>Math.max(0, subtotal - Number(discount||0) + Number(tax||0)),[subtotal,discount,tax])
  const totalDuration = useMemo(()=>Object.values(cart).reduce((s,r)=>s+(r.estimated_duration*r.qty),0),[cart])

  async function checkout(){
    if(Object.keys(cart).length===0){ alert(config.emptyCartText); return }

    // Prepare service items
    const items = Object.values(cart).map(r=>({
      service_id: r.service_id,
      qty: r.qty,
      unit_price: r.price,
      notes: notes[r.service_id] || ''
    }))

    const pays = payments.filter(p=>p.method && Number(p.amount)>0).map(p=>({ method:p.method, amount:Number(p.amount), reference:p.reference||'' }))
    if(pays.length===0){ alert('Isi minimal satu pembayaran dengan nominal'); return }

    setLoading(true)
    try{
      let receiptId = 'SRV' + Date.now().toString().slice(-8)

      // In mock mode, simulate checkout without API call
      if (isMockMode || !token) {
        console.log('Mock checkout:', {
          items,
          customerName,
          customerPhone,
          selectedBarber,
          discount,
          tax,
          payments: pays,
          totalDuration
        })

        // Update appointment status if from booking (to 'paid' after payment)
        if (currentAppointmentId) {
          const allAppointments = loadAppointmentsFromStorage()
          const updatedAppointments = allAppointments.map(apt =>
            apt.id === currentAppointmentId
              ? { ...apt, status: 'paid', paid_at: new Date().toISOString() }
              : apt
          )
          saveAppointmentsToStorage(updatedAppointments)
          // Refresh appointments display
          loadTodayAppointments()
        }

        // Get barber name for receipt
        const selectedBarberData = barbers.find(b => b.id === selectedBarber)

        // Create mock sale record for receipt
        const mockSale = {
          id: receiptId,
          number: 'SRV-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(Date.now()).slice(-4),
          type: 'service',
          subtotal: subtotal,
          discount: Number(discount||0),
          tax: Number(tax||0),
          grand_total: grand,
          customer_name: customerName,
          customer_phone: customerPhone,
          barber_id: selectedBarber,
          barber_name: selectedBarberData?.name || '',
          estimated_duration: totalDuration,
          payment_status: 'paid',
          paid_amount: pays.reduce((sum, p) => sum + Number(p.amount), 0),
          change_amount: pays.reduce((sum, p) => sum + Number(p.amount), 0) - grand,
          created_at: new Date().toISOString(),
          date: new Date().toISOString(),
          items: items.map(item => {
            const cartItem = Object.values(cart).find(c => c.service_id === item.service_id)
            return {
              id: item.service_id,
              name: cartItem?.name || 'Layanan Barbershop',
              qty: item.qty,
              unit_price: item.unit_price,
              subtotal: item.qty * item.unit_price
            }
          }),
          service_items: items,
          payments: pays
        }

        // Save to localStorage for mock receipt and history
        const existingSales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
        existingSales.unshift(mockSale)
        localStorage.setItem('barbershop_sales', JSON.stringify(existingSales))

        // Update barber completed appointments count
        if (selectedBarber) {
          updateBarberCompletedAppointments(selectedBarber)
        }

        clearCart()
        setCustomerName('')
        setCustomerPhone('')
        setSelectedBarber('')
        setSelectedAppointment('')
        setCurrentAppointmentId('')
        setDiscount(0)
        setTax(0)
        setDiscountDisplay('')
        setTaxDisplay('')
        setPayments([{method:'cash',amount:''},{method:'',amount:''}])
        setPaymentsDisplay([{amount:''},{amount:''}])

        // Navigate to receipt
        nav(`/receipt/${receiptId}`)
        return
      }

      // Use service-specific checkout endpoint with barbershop customer info
      const data = await apiPost('/service-checkout', {
        service_items: items,
        customer_name: customerName,
        customer_phone: customerPhone,
        barber_id: selectedBarber,
        discount: Number(discount||0),
        tax: Number(tax||0),
        payments: pays,
        estimated_duration: totalDuration
      }, token)

      // Update appointment status if from booking (to 'paid' after payment)
      if (currentAppointmentId) {
        const allAppointments = loadAppointmentsFromStorage()
        const updatedAppointments = allAppointments.map(apt =>
          apt.id === currentAppointmentId
            ? { ...apt, status: 'paid', paid_at: new Date().toISOString() }
            : apt
        )
        saveAppointmentsToStorage(updatedAppointments)
      }

      clearCart()
      setCustomerName('')
      setCustomerPhone('')
      setSelectedBarber('')
      setSelectedAppointment('')
      setCurrentAppointmentId('')
      setDiscount(0)
      setTax(0)
      setPayments([{method:'cash',amount:''},{method:'',amount:''}])
      nav(`/receipt/${data.id}`)
    }catch(e){
      console.warn('API checkout failed, falling back to mock mode:', e.message)

      // Fallback to mock checkout
      if (currentAppointmentId) {
        const allAppointments = loadAppointmentsFromStorage()
        const updatedAppointments = allAppointments.map(apt =>
          apt.id === currentAppointmentId
            ? { ...apt, status: 'paid', paid_at: new Date().toISOString() }
            : apt
        )
        saveAppointmentsToStorage(updatedAppointments)
        // Refresh appointments display
        loadTodayAppointments()
      }

      // Update barber completed appointments count for fallback mode too
      if (selectedBarber) {
        updateBarberCompletedAppointments(selectedBarber)
      }

      alert(`Layanan cukur berhasil dimulai!\nPelanggan: ${customerName}\nTotal: ${formatMoney(grand, currency)}\nEstimasi: ${totalDuration} menit`)

      clearCart()
      setCustomerName('')
      setCustomerPhone('')
      setSelectedBarber('')
      setSelectedAppointment('')
      setCurrentAppointmentId('')
      setDiscount(0)
      setTax(0)
      setPayments([{method:'cash',amount:''},{method:'',amount:''}])
    } finally{
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Compact & Professional */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              {businessType === 'restaurant' ? (
                <span className="text-xl">{config.icon}</span>
              ) : (
                <Scissors className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{config.title}</h1>
              <p className="text-sm text-gray-600">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4" />
              <span className="font-medium">{user?.name||'-'}</span>
            </div>
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="text-gray-700 border-gray-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Service Search & Selection */}
        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              {businessType === 'restaurant' ? (
                <Utensils className="h-5 w-5 text-slate-600" />
              ) : (
                <Scissors className="h-5 w-5 text-slate-600" />
              )}
              {config.serviceLabel}
            </CardTitle>
            <CardDescription>Pilih {config.serviceLabel.toLowerCase()} untuk pelanggan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={q}
                onChange={e=>setQ(e.target.value)}
                placeholder={businessType === 'restaurant' ? 'Cari menu, paket, minuman...' : 'Cari layanan cukur, styling, dll...'}
                className="pl-10 h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori Layanan</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={e=>setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-md transition-all"
              >
                <option value="">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {initialLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Memuat treatment...</span>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {businessType === 'restaurant' ? (
                    <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  ) : (
                    <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  )}
                  <p>Cari atau pilih kategori untuk menampilkan layanan</p>
                </div>
              ) : (
                services.map(service => (
                  <div key={service.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-gray-900 truncate">{service.name}</div>
                          <Badge variant="outline" className="text-xs">{service.code}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 mb-1">{service.description}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium text-amber-700">{formatMoney(service.base_price, currency)}/{service.unit}</span>
                          {service.estimated_duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.estimated_duration}min
                            </span>
                          )}
                        </div>
                        {businessType !== 'restaurant' && !selectedBarber && service.estimated_duration && !serviceIncludesBarberRate(service) && (
                          <div className="text-xs text-gray-400 mt-1">
                            *Harga belum termasuk tarif barber
                          </div>
                        )}
                        {businessType !== 'restaurant' && selectedBarber && service.estimated_duration && !serviceIncludesBarberRate(service) && (
                          <div className="text-xs text-blue-600 mt-1">
                            *Akan menggunakan tarif barber yang dipilih
                          </div>
                        )}
                        {businessType !== 'restaurant' && serviceIncludesBarberRate(service) && (
                          <div className="text-xs text-green-600 mt-1">
                            *Harga sudah termasuk tarif barber
                          </div>
                        )}
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
                        className="bg-slate-600 hover:bg-slate-700 ml-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Cart */}
        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {businessType === 'restaurant' ? (
                <Utensils className="h-5 w-5 text-slate-600" />
              ) : (
                <Scissors className="h-5 w-5 text-slate-600" />
              )}
                {businessType === 'restaurant' ? 'Pesanan Dipilih' : 'Layanan Dipilih'} ({Object.values(cart).length})
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
            {totalDuration > 0 && (
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimasi waktu: {Math.ceil(totalDuration)} menit
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {Object.values(cart).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {businessType === 'restaurant' ? (
                    <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  ) : (
                    <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  )}
                  <p>{businessType === 'restaurant' ? 'Belum ada pesanan' : 'Belum ada layanan dipilih'}</p>
                  <p className="text-sm">{businessType === 'restaurant' ? 'Pilih menu dari panel kiri' : 'Pilih layanan cukur dari panel kiri'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.values(cart).map(row => (
                    <div key={row.service_id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{row.name}</div>
                          <div className="text-sm text-gray-500">{row.code}</div>
                          <div className="text-sm font-medium text-amber-700">{formatMoney(row.price, currency)}/{row.unit}</div>
                          {businessType !== 'restaurant' && (
                            row.has_included_barber ? (
                              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                <div className="flex items-center justify-between">
                                  <span>Sudah termasuk tarif barber</span>
                                </div>
                                {row.included_barber_id && (() => {
                                  const includedBarber = barbers.find(b => b.id === row.included_barber_id);
                                  return includedBarber ? (
                                    <div className="text-xs text-gray-600 mt-1">
                                      🧑‍💼 Barber: {includedBarber.name}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            ) : selectedBarber && row.barber_hourly_rate && row.barber_cost > 0 ? (
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span>Layanan: {formatMoney(row.base_price, currency)}</span>
                                    <span>Barber: +{formatMoney(row.barber_cost || 0, currency)}</span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    🧑‍💼 Barber: {(() => {
                                      const selectedBarberData = barbers.find(b => b.id === selectedBarber);
                                      return selectedBarberData ? selectedBarberData.name : 'Unknown';
                                    })()} - {formatMoney(row.barber_hourly_rate, currency)}/layanan
                                  </div>
                                </div>
                              </div>
                            ) : !selectedBarber ? (
                              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                Belum termasuk tarif barber
                              </div>
                            ) : null
                          )}
                          {row.estimated_duration > 0 && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {row.estimated_duration * row.qty} menit total
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={()=>removeFromCart(row.service_id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          onClick={() => updateQty(row.service_id, Math.max(1, row.qty - 1))}
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
                          onChange={e=>updateQty(row.service_id, e.target.value)}
                          className="w-16 h-8 text-center border-0 bg-white"
                        />
                        <Button
                          onClick={() => updateQty(row.service_id, row.qty + 1)}
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

                      <Input
                        placeholder="Permintaan khusus (gaya rambut, panjang, dll)..."
                        value={notes[row.service_id] || ''}
                        onChange={e=>updateNotes(row.service_id, e.target.value)}
                        className="text-sm h-8 border-0 bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {Object.values(cart).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Subtotal:</span>
                  <span className="text-amber-700 font-semibold">{formatMoney(subtotal, currency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment & Checkout */}
        <Card className="xl:col-span-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-600" />
              Info Pelanggan & Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Today's Appointments */}
            {appointments.length > 0 && (
              <div className="space-y-3 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Booking Hari Ini ({appointments.length})
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAppointmentSection(!showAppointmentSection)}
                  >
                    {showAppointmentSection ? 'Tutup' : 'Lihat'}
                  </Button>
                </div>
                {showAppointmentSection && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {appointments.map(appointment => {
                      const barber = barbers.find(b => b.id === appointment.barber_id)
                      return (
                        <div
                          key={appointment.id}
                          className="p-3 bg-slate-50 rounded-lg border cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment.id)
                            loadFromAppointment(appointment.id)
                            setShowAppointmentSection(false)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{appointment.customer_name}</div>
                              <div className="text-xs text-gray-500">{appointment.start_time} • {barber?.name}</div>
                              <div className="text-xs text-gray-500">{appointment.service_ids.length} treatment</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {appointment.status === 'scheduled' ? 'Terjadwal' : 'Dikonfirmasi'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-3 pb-4 border-b">
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Informasi Pelanggan
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="customerName">{config.customerLabel}</Label>
                  <Input
                    id="customerName"
                    placeholder={`Masukkan ${config.customerLabel.toLowerCase()}`}
                    value={customerName}
                    onChange={e=>setCustomerName(e.target.value)}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">{config.phoneLabel}</Label>
                  <Input
                    id="customerPhone"
                    placeholder={businessType === 'restaurant' ? 'Meja 5 / 08xxxxxxxxxx' : '08xxxxxxxxxx'}
                    value={customerPhone}
                    onChange={e=>setCustomerPhone(e.target.value)}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                  />
                </div>
                {config.showBarberSection && (
                  <div>
                    <Label htmlFor="selectedBarber">Pilih {config.staffLabel}</Label>
                    <select
                      id="selectedBarber"
                      value={selectedBarber}
                      onChange={e=>setSelectedBarber(e.target.value)}
                      className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-md transition-all"
                    >
                      <option value="">Pilih {config.staffLabel}</option>
                      {barbers.map(barber => (
                        <option key={barber.id} value={barber.id}>
                          {barber.name} ({barber.specialty}) - {formatMoney(barber.hourly_rate, currency)}/layanan
                        </option>
                      ))}
                    </select>
                    {selectedBarber && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Tarif barber akan ditambahkan per layanan
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discount">Diskon ({currency})</Label>
                <Input
                  id="discount"
                  type="text"
                  value={discountDisplay}
                  onChange={e=>handleNumberInput(e.target.value, setDiscountDisplay, setDiscount)}
                  placeholder="0"
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="tax">Pajak ({currency})</Label>
                <Input
                  id="tax"
                  type="text"
                  value={taxDisplay}
                  onChange={e=>handleNumberInput(e.target.value, setTaxDisplay, setTax)}
                  placeholder="0"
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Metode Pembayaran</Label>
              <div className="space-y-3 mt-2">
                {[0,1].map(i => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <select
                      value={payments[i]?.method||''}
                      onChange={e=>{
                        const v=[...payments]; v[i]={...v[i], method:e.target.value}; setPayments(v)
                      }}
                      className="h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-md transition-all text-sm"
                    >
                      <option value="">(Opsional)</option>
                      <option value="cash">Tunai</option>
                      <option value="qris">QRIS</option>
                      <option value="transfer">Transfer</option>
                    </select>
                    <Input
                      placeholder="Nominal"
                      type="text"
                      value={paymentsDisplay[i]?.amount||''}
                      onChange={e=>handlePaymentAmountChange(i, e.target.value, payments, setPayments, paymentsDisplay, setPaymentsDisplay)}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                    />
                    <Input
                      placeholder="Ref"
                      value={payments[i]?.reference||''}
                      onChange={e=>{ const v=[...payments]; v[i]={...v[i], reference:e.target.value}; setPayments(v) }}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center text-2xl font-bold text-slate-800">
                  <span>TOTAL:</span>
                  <span className="text-amber-700">{formatMoney(grand, currency)}</span>
                </div>
                {totalDuration > 0 && (
                  <div className="flex justify-between items-center text-sm text-slate-600 mt-1">
                    <span>Estimasi waktu:</span>
                    <span>{Math.ceil(totalDuration)} menit</span>
                  </div>
                )}
              </div>

              <Button
                onClick={checkout}
                disabled={loading || Object.keys(cart).length === 0}
                className="w-full h-12 mt-4 bg-gradient-to-r from-slate-700 to-gray-700 hover:from-slate-800 hover:to-gray-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Calculator className="h-5 w-5 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    {businessType === 'restaurant' ? (
                      <Utensils className="h-5 w-5 mr-2" />
                    ) : (
                      <Scissors className="h-5 w-5 mr-2" />
                    )}
                    {config.buttonText}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
              <Link to="/">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            {businessType === 'restaurant' ? (
              <>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/reservations">
                    <Calendar className="h-4 w-4" />
                    Reservasi Meja
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/menu-packages">
                    <Star className="h-4 w-4" />
                    Paket Menu
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/order-history">
                    <History className="h-4 w-4" />
                    Riwayat Pesanan
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/staff">
                    <Users className="h-4 w-4" />
                    Kelola Staff
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/appointments">
                    <Calendar className="h-4 w-4" />
                    Booking Jadwal
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/service-list">
                    <Star className="h-4 w-4" />
                    Paket Layanan
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/history">
                    <History className="h-4 w-4" />
                    Riwayat Layanan
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="flex items-center gap-2 hover:bg-slate-100">
                  <Link to="/barbers">
                    <Users className="h-4 w-4" />
                    Kelola Barber
                  </Link>
                </Button>
                <Button
                  onClick={loadTodayAppointments}
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-slate-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Booking
                </Button>
                <Button
                  onClick={loadBarbers}
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-slate-100"
                >
                  <Users className="h-4 w-4" />
                  Refresh Barber
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
