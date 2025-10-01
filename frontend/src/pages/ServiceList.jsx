import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Link } from 'react-router-dom'
import { loadBarbersFromStorage, initializeBarbershopData } from '../utils/barbershopData'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import {
  Wrench, Search, Plus, Edit, Eye, Settings, ArrowLeft,
  Clock, FileText, DollarSign, Package, Sparkles, TrendingUp,
  Filter, Grid, List, Printer, Scissors, Palette, Monitor,
  Brush, UserCheck, Heart, Bath, Building2, User, Utensils, ChefHat, Coffee
} from 'lucide-react'
import { LoadingSpinner } from '../components/ui/loading'

const getIconMap = (businessType) => {
  const baseIcons = {
    printer: Printer,
    binding: Scissors,
    palette: Palette,
    computer: Monitor,
    wrench: Wrench,
    sparkles: Sparkles,
    package: Package
  }

  if (businessType === 'restaurant') {
    return {
      ...baseIcons,
      makanan: ChefHat,
      minuman: Coffee,
      utama: Utensils,
      spesial: Package,
      paket: Package,
      menu: Utensils,
      sup: Coffee,
      soto: Coffee,
      sayuran: Heart,
      salad: Heart
    }
  }

  if (businessType === 'barbershop') {
    return {
      ...baseIcons,
      haircut: Scissors,
      styling: Brush,
      treatment: Heart,
      consultation: UserCheck,
      wash: Bath,
      beard: User,
      package: Package
    }
  }

  if (businessType === 'laundry') {
    return {
      ...baseIcons,
      wash: Bath,
      dry: Sparkles,
      iron: Wrench,
      fold: Package
    }
  }

  return baseIcons
}


export default function ServiceList(){
  const { token, activeTenant } = useAuth()
  const [q, setQ] = useState('')
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [loading, setLoading] = useState(false)
  const businessType = activeTenant?.business_type || 'barbershop'
  const currency = useCurrency('IDR')
  const [meta, setMeta] = useState({})
  const [barbers, setBarbers] = useState([])

  async function load(){
    setLoading(true)
    try{
      // Return empty data so user can add manually
      setServices([])
      setMeta({})
      console.log("ServiceList page: Services data cleared - ready for manual entry")
    }catch(e){
      console.error("Failed to load services from API:", e)
      setServices([]);
      setMeta({});
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories(){
    try{
      // Return empty categories so user can add manually
      setCategories([])
      console.log("ServiceList page: Categories cleared - ready for manual entry")
    }catch(e){
      console.error("Failed to load categories from API:", e)
      setCategories([]);
    }
  }


  async function loadBarbers() {
    try {
      // Try the setup endpoint first
      const result = await apiGet('/setup/barbers', token)
      const activeBarbers = result.data ? result.data.filter(barber => barber.active) : []
      setBarbers(activeBarbers)
    } catch (e) {
      console.warn('Failed to load barbers from setup API, trying localStorage:', e)
      // Fallback to localStorage if API fails
      try {
        const storedBarbers = loadBarbersFromStorage()
        const activeBarbers = storedBarbers.filter(barber => barber.active)
        setBarbers(activeBarbers)
      } catch (fallbackError) {
        console.error('Failed to load barbers from storage, using empty array:', fallbackError)
        setBarbers([])
      }
    }
  }

  useEffect(()=>{
    // Initialize barbershop data if needed
    initializeBarbershopData()
    loadCategories()
    loadBarbers()
  }, [])

  useEffect(()=>{
    load()
  }, [selectedCategory, sortBy])

  // Calculate stats
  const totalServices = services.length
  const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + parseFloat(s.base_price), 0) / services.length : 0
  const avgDuration = services.filter(s => s.estimated_duration).length > 0 ?
    services.filter(s => s.estimated_duration).reduce((sum, s) => sum + s.estimated_duration, 0) / services.filter(s => s.estimated_duration).length : 0

  // Helper functions for business type customization
  const getBusinessTypeTitle = (businessType) => {
    switch(businessType) {
      case 'barbershop': return 'Layanan Barbershop'
      case 'laundry': return 'Layanan Laundry'
      case 'restaurant': return 'Menu & Layanan'
      case 'pharmacy': return 'Layanan Apotek'
      case 'automotive': return 'Layanan Otomotif'
      case 'photocopy': return 'Daftar Jasa'
      case 'clinic': return 'Layanan Klinik'
      case 'retail': return 'Layanan Retail'
      default: return 'Daftar Layanan'
    }
  }

  const getBusinessTypeDescription = (businessType) => {
    switch(businessType) {
      case 'barbershop': return 'Treatment & grooming untuk tampil percaya diri'
      case 'laundry': return 'Layanan cuci & perawatan pakaian terpercaya'
      case 'restaurant': return 'Menu makanan & minuman terbaik'
      case 'pharmacy': return 'Layanan kesehatan & konsultasi obat'
      case 'automotive': return 'Perawatan & perbaikan kendaraan'
      case 'photocopy': return 'Overview lengkap layanan foto copy'
      case 'clinic': return 'Layanan medis & konsultasi kesehatan'
      case 'retail': return 'Layanan retail & konsultasi produk'
      default: return 'Overview lengkap layanan bisnis'
    }
  }

  const getBusinessTypeIcon = (businessType) => {
    switch(businessType) {
      case 'barbershop': return Scissors
      case 'laundry': return Bath
      case 'restaurant': return Utensils
      case 'pharmacy': return Heart
      case 'automotive': return Wrench
      case 'photocopy': return Printer
      case 'clinic': return Heart
      case 'retail': return Package
      default: return Wrench
    }
  }

  const getBusinessTypeGradient = (businessType) => {
    // Using neutral gray gradients for all business types
    return 'from-gray-700 via-slate-700 to-gray-800'
  }

  const getEmptyStateDescription = (businessType) => {
    switch(businessType) {
      case 'barbershop': return 'Mulai tambahkan treatment pertama untuk barbershop Anda.'
      case 'laundry': return 'Mulai tambahkan layanan laundry pertama untuk bisnis Anda.'
      case 'photocopy': return 'Mulai tambahkan layanan pertama untuk bisnis foto copy Anda.'
      default: return 'Mulai tambahkan layanan pertama untuk bisnis Anda.'
    }
  }


  return (
    <div className="space-y-6 -m-6 p-6">
      {/* Header Section - Compact & Professional */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              {(() => {
                const IconComponent = getBusinessTypeIcon(businessType)
                return <IconComponent className="h-5 w-5 text-gray-600" />
              })()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{getBusinessTypeTitle(businessType)}</h1>
              <p className="text-sm text-gray-600">{getBusinessTypeDescription(businessType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/service-pos" className="flex items-center gap-2">
                {businessType === 'restaurant' ? (
                  <>
                    <Utensils className="h-4 w-4" />
                    Layanan Meja
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    Treatment
                  </>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 p-3">
                <Wrench className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {businessType === 'barbershop' ? 'Total Treatment' :
                   businessType === 'restaurant' ? 'Total Menu' :
                   businessType === 'pharmacy' ? 'Layanan Medis' :
                   'Total Layanan'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Harga</p>
                <p className="text-2xl font-bold text-gray-900">{formatMoney(avgPrice, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rata-rata Durasi</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgDuration)} menit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 p-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Kategori</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600" />
            <span>Filter & Pencarian</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={businessType === 'restaurant' ? 'Cari menu...' : 'Cari layanan...'}
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="pl-10 h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-300 transition-all"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={e=>setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-300 rounded-md transition-all"
              >
                <option value="">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={e=>setSortBy(e.target.value)}
                className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-300 rounded-md transition-all"
              >
                <option value="name">Urutkan: Nama</option>
                <option value="price">Urutkan: Harga</option>
                <option value="duration">Urutkan: Durasi</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={load}
                className="bg-gray-800 hover:bg-gray-700 flex-1 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
              <div className="flex border rounded-md">
                <Button
                  onClick={()=>setViewMode('grid')}
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-10 px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  onClick={()=>setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-10 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Display */}
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-gray-600" />
              <span>{businessType === 'restaurant' ? 'Daftar Menu' : 'Daftar Layanan'}</span>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              {totalServices} {businessType === 'restaurant' ? 'menu' : 'layanan'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <LoadingSpinner size="sm" />
              <span>Memuat {businessType === 'restaurant' ? 'menu' : 'layanan'}...</span>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Wrench className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{businessType === 'restaurant' ? 'Belum ada menu' : 'Belum ada layanan'}</h3>
              <p className="text-gray-500 text-center mb-6 max-w-sm">
                {getEmptyStateDescription(businessType)}
              </p>
              <Button asChild>
                <Link to="/services">
                  <Plus className="h-4 w-4 mr-2" />
                  {businessType === 'restaurant' ? 'Tambah Menu' : 'Tambah Layanan'}
                </Link>
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6' : 'space-y-4'}>
              {services.map(service => {
                const IconComponent = getIconMap(businessType)[service.service_category?.icon] || Wrench
                const categoryColor = service.service_category?.color || '#6B7280'
                return (
                  <Card
                    key={service.id}
                    className={`hover:shadow-lg transition-all duration-200 group border-0 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 ${
                      viewMode === 'list' ? 'flex items-center' : ''
                    }`}
                  >
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex items-center w-full' : ''}`}>
                      {viewMode === 'grid' ? (
                        // Grid View
                        <>
                          <div className="mb-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="h-10 w-10 rounded-lg flex items-center justify-center font-semibold flex-shrink-0"
                                style={{
                                  backgroundColor: categoryColor + '20',
                                  color: categoryColor
                                }}
                              >
                                <IconComponent className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors text-sm truncate" title={service.name}>
                                  {service.name}
                                </h3>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {service.code}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                              <div className="text-lg font-bold text-gray-800 truncate" title={formatMoney(service.base_price, currency)}>
                                {formatMoney(service.base_price, currency)}
                              </div>
                              <div className="text-xs text-gray-500">per {service.unit}</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed" title={service.description}>{service.description}</p>
                          </div>

                          <div className="space-y-2 mb-4">
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-700 text-xs truncate block"
                              title={service.service_category?.name}
                            >
                              {service.service_category?.name}
                            </Badge>

                            {/* Barber Info & Pricing Mode */}
                            {(service.pricing_mode === "barber" || service.pricing_mode === "combined") && service.barber_id && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <UserCheck className="h-3 w-3" />
                                <span className="font-medium">
                                  {businessType === 'restaurant' ? 'Chef: ' : 'Barber: '}{(() => {
                                    // Try multiple comparison methods to handle ID format mismatches
                                    let barber = barbers.find(b => b.id === service.barber_id);
                                    if (!barber) {
                                      barber = barbers.find(b => b.id == service.barber_id);
                                    }
                                    if (!barber) {
                                      barber = barbers.find(b => String(b.id) === String(service.barber_id));
                                    }
                                    // Handle "barber-00X" format vs numeric ID
                                    if (!barber && typeof service.barber_id === 'number') {
                                      const paddedId = `barber-${String(service.barber_id).padStart(3, '0')}`;
                                      barber = barbers.find(b => b.id === paddedId);
                                    }
                                    // Handle reverse case: service has "barber-002" but looking for 2
                                    if (!barber && typeof service.barber_id === 'string' && service.barber_id.startsWith('barber-')) {
                                      const numericId = parseInt(service.barber_id.replace('barber-', ''));
                                      barber = barbers.find(b => b.id == numericId);
                                    }
                                    return barber ? barber.name : `Unknown ${businessType === 'restaurant' ? 'Chef' : 'Barber'} (ID: ${service.barber_id})`;
                                  })()}
                                </span>
                                {service.pricing_mode === "combined" && (
                                  <span className="text-gray-500 ml-1">(+ Fee)</span>
                                )}
                              </div>
                            )}
                            {service.pricing_mode && service.pricing_mode !== "fixed" && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  service.pricing_mode === "barber"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {service.pricing_mode === "barber" ? (businessType === 'restaurant' ? 'Tarif Chef' : 'Tarif Barber') : "Kombinasi"}
                              </Badge>
                            )}

                            {service.estimated_duration && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {service.estimated_duration} menit
                              </div>
                            )}
                          </div>

                          {service.requirements && (
                            <div className="mb-4 p-2 bg-amber-50 rounded-md">
                              <div className="flex items-start gap-2">
                                <FileText className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-700 line-clamp-2" title={service.requirements}>{service.requirements}</div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 flex-1 text-xs hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Link to={`/services`}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 flex-1 text-xs hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Link to={`/service-pos`}>
                                <Eye className="h-3 w-3 mr-1" />
                                Gunakan
                              </Link>
                            </Button>
                          </div>
                        </>
                      ) : (
                        // List View
                        <div className="flex items-center justify-between w-full gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center font-semibold flex-shrink-0"
                              style={{
                                backgroundColor: categoryColor + '20',
                                color: categoryColor
                              }}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm truncate" title={service.name}>{service.name}</h3>
                                <Badge variant="outline" className="text-xs flex-shrink-0">{service.code}</Badge>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-1" title={service.description}>{service.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge
                              variant="secondary"
                              className="bg-gray-100 text-gray-700 text-xs hidden sm:block"
                              title={service.service_category?.name}
                            >
                              {service.service_category?.name}
                            </Badge>

                            {/* Barber Info in List View */}
                            {(service.pricing_mode === "barber" || service.pricing_mode === "combined") && service.barber_id && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 hidden lg:flex">
                                <UserCheck className="h-3 w-3" />
                                <span className="font-medium">
                                  {(() => {
                                    // Try multiple comparison methods to handle ID format mismatches
                                    let barber = barbers.find(b => b.id === service.barber_id);
                                    if (!barber) {
                                      barber = barbers.find(b => b.id == service.barber_id);
                                    }
                                    if (!barber) {
                                      barber = barbers.find(b => String(b.id) === String(service.barber_id));
                                    }
                                    // Handle "barber-00X" format vs numeric ID
                                    if (!barber && typeof service.barber_id === 'number') {
                                      const paddedId = `barber-${String(service.barber_id).padStart(3, '0')}`;
                                      barber = barbers.find(b => b.id === paddedId);
                                    }
                                    // Handle reverse case: service has "barber-002" but looking for 2
                                    if (!barber && typeof service.barber_id === 'string' && service.barber_id.startsWith('barber-')) {
                                      const numericId = parseInt(service.barber_id.replace('barber-', ''));
                                      barber = barbers.find(b => b.id == numericId);
                                    }
                                    return barber ? barber.name : `Unknown ${businessType === 'restaurant' ? 'Chef' : 'Barber'} (ID: ${service.barber_id})`;
                                  })()}
                                </span>
                              </div>
                            )}

                            {/* Pricing Mode Badge in List View */}
                            {service.pricing_mode && service.pricing_mode !== "fixed" && (
                              <Badge
                                variant="outline"
                                className={`text-xs hidden xl:block ${
                                  service.pricing_mode === "barber"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {service.pricing_mode === "barber" ? (businessType === 'restaurant' ? 'Tarif Chef' : 'Tarif Barber') : "Kombinasi"}
                              </Badge>
                            )}

                            {service.estimated_duration && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 hidden md:flex">
                                <Clock className="h-3 w-3" />
                                {service.estimated_duration}min
                              </div>
                            )}

                            <div className="text-right min-w-0">
                              <div className="font-bold text-gray-800 text-sm truncate" title={formatMoney(service.base_price, currency)}>
                                {formatMoney(service.base_price, currency)}
                              </div>
                              <div className="text-xs text-gray-500">per {service.unit}</div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Link to={`/services`} title="Edit">
                                  <Edit className="h-3 w-3" />
                                </Link>
                              </Button>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Link to={`/service-pos`} title="Gunakan">
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
