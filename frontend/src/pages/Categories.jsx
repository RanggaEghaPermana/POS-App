import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { LoadingSpinner } from '../components/ui/loading'
import {
  FolderOpen, Plus, Search, Edit, Trash2, ArrowLeft,
  Save, X, Tag, Sparkles, Scissors, Droplets, Wind,
  ShoppingBag, Bath, Shirt, Car, Home, Star, Circle,
  Crown, Gem, Flame, Zap, Heart, Gift, Award, Shield,
  Coffee, Leaf, Flower, Sun, Moon, Mountain, Waves,
  User, Users, Eye, Smile, ThumbsUp, Target, Palette,
  Brush, PaintBucket, Droplet, Snowflake, Watch,
  Diamond, Music, Camera, Phone, Mail, Bell,
  Lock, Key, Wrench, Settings, Package, Box, Square,
  ChevronDown, ChevronUp, Utensils, ChefHat, Wine, Soup
} from 'lucide-react'

export default function Categories(){
  const { token, logout, activeTenant } = useAuth()

  // Get business type
  const businessType = activeTenant?.business_type || 'general'
  const [q, setQ] = useState('')
  const [list, setList] = useState({ data:[], meta:{} })
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [iconSearch, setIconSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Mock restaurant categories for demonstration when API is unavailable
  function getMockRestaurantCategories() {
    return [
      {
        id: 1,
        name: 'Makanan Utama',
        icon: 'ChefHat',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Minuman',
        icon: 'Coffee',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Soto & Sup',
        icon: 'Soup',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Paket Spesial',
        icon: 'Star',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Salad & Sayuran',
        icon: 'Leaf',
        active: true,
        created_at: new Date().toISOString()
      }
    ]
  }

  // Mock barbershop categories for demonstration when API is unavailable
  function getMockBarbershopCategories() {
    return [
      {
        id: 1,
        name: 'Hair Care',
        icon: 'Heart',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Styling Products',
        icon: 'Sparkles',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Tools & Equipment',
        icon: 'Scissors',
        active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Premium Series',
        icon: 'Crown',
        active: true,
        created_at: new Date().toISOString()
      }
    ]
  }

  // Icon options untuk restaurant categories - Restaurant specific icons
  const restaurantIcons = [
    // Makanan & Masakan
    { name: 'ChefHat', icon: ChefHat, label: 'Makanan Utama' },
    { name: 'Utensils', icon: Utensils, label: 'Menu Spesial' },
    { name: 'Soup', icon: Soup, label: 'Soto & Sup' },
    { name: 'Coffee', icon: Coffee, label: 'Minuman Panas' },
    { name: 'Wine', icon: Wine, label: 'Minuman Dingin' },
    { name: 'Heart', icon: Heart, label: 'Menu Favorit' },

    // Kategori Menu
    { name: 'Star', icon: Star, label: 'Paket Spesial' },
    { name: 'Crown', icon: Crown, label: 'Menu Premium' },
    { name: 'Gem', icon: Gem, label: 'Signature Dish' },
    { name: 'Award', icon: Award, label: 'Best Seller' },
    { name: 'Flame', icon: Flame, label: 'Menu Pedas' },
    { name: 'Snowflake', icon: Snowflake, label: 'Menu Dingin' },

    // Natural & Organic
    { name: 'Leaf', icon: Leaf, label: 'Salad & Sayuran' },
    { name: 'Flower', icon: Flower, label: 'Menu Vegetarian' },
    { name: 'Sun', icon: Sun, label: 'Menu Sehat' },

    // Pelayanan & Jasa
    { name: 'Users', icon: Users, label: 'Paket Keluarga' },
    { name: 'User', icon: User, label: 'Menu Personal' },
    { name: 'Gift', icon: Gift, label: 'Menu Gift' },
    { name: 'Package', icon: Package, label: 'Paket Combo' },

    // Umum
    { name: 'Tag', icon: Tag, label: 'Kategori Umum' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Take Away' },
    { name: 'Home', icon: Home, label: 'Dine In' },
    { name: 'Settings', icon: Settings, label: 'Lainnya' }
  ]

  // Icon options untuk grooming categories - Lebih lengkap dan variatif
  const groomingIcons = [
    // Alat Grooming
    { name: 'Scissors', icon: Scissors, label: 'Alat Potong' },
    { name: 'Wind', icon: Wind, label: 'Sisir & Styling' },
    { name: 'Brush', icon: Brush, label: 'Brush & Kuas' },
    { name: 'Wrench', icon: Wrench, label: 'Tools & Peralatan' },

    // Produk Perawatan
    { name: 'Droplets', icon: Droplets, label: 'Produk Semprot' },
    { name: 'Bath', icon: Bath, label: 'Perawatan Tubuh' },
    { name: 'Droplet', icon: Droplet, label: 'Hair Oil & Serum' },
    { name: 'Snowflake', icon: Snowflake, label: 'Cooling Products' },
    { name: 'Sun', icon: Sun, label: 'Hair Protection' },

    // Kategori Khusus
    { name: 'Crown', icon: Crown, label: 'Premium Series' },
    { name: 'Gem', icon: Gem, label: 'Luxury Products' },
    { name: 'Diamond', icon: Diamond, label: 'Signature Line' },
    { name: 'Award', icon: Award, label: 'Best Seller' },
    { name: 'Star', icon: Star, label: 'Popular Items' },

    // Gaya & Style
    { name: 'Flame', icon: Flame, label: 'Hot Styling' },
    { name: 'Zap', icon: Zap, label: 'Quick Effect' },
    { name: 'Sparkles', icon: Sparkles, label: 'Shine & Gloss' },
    { name: 'WindVolume', icon: Wind, label: 'Volume & Texture' },

    // Jenis Perawatan
    { name: 'Heart', icon: Heart, label: 'Hair Care' },
    { name: 'Shield', icon: Shield, label: 'Hair Protection' },
    { name: 'Eye', icon: Eye, label: 'Eye Care' },
    { name: 'Smile', icon: Smile, label: 'Face Care' },

    // Natural & Organic
    { name: 'Leaf', icon: Leaf, label: 'Natural & Organic' },
    { name: 'Flower', icon: Flower, label: 'Herbal Products' },
    { name: 'Coffee', icon: Coffee, label: 'Coffee Series' },

    // Pelayanan & Jasa
    { name: 'User', icon: User, label: 'Personal Care' },
    { name: 'Users', icon: Users, label: 'Group Services' },
    { name: 'Target', icon: Target, label: 'Specialized' },

    // Produk Lifestyle
    { name: 'Watch', icon: Watch, label: 'Daily Routine' },
    { name: 'Gift', icon: Gift, label: 'Gift Sets' },
    { name: 'Package', icon: Package, label: 'Starter Kits' },
    { name: 'Box', icon: Box, label: 'Bundle Products' },

    // Warna & Styling
    { name: 'Palette', icon: Palette, label: 'Hair Color' },
    { name: 'PaintBucket', icon: PaintBucket, label: 'Hair Dye' },
    { name: 'Circle', icon: Circle, label: 'Color Series' },

    // Umum
    { name: 'Tag', icon: Tag, label: 'Kategori Umum' },
    { name: 'ShoppingBag', icon: ShoppingBag, label: 'Retail Products' },
    { name: 'Settings', icon: Settings, label: 'Maintenance' }
  ]

  // Get current icon set based on business type
  const currentIcons = businessType === 'restaurant' ? restaurantIcons : groomingIcons

  // Get icon component by name
  function getIconComponent(iconName) {
    const iconObj = currentIcons.find(icon => icon.name === iconName)
    return iconObj ? iconObj.icon : Tag
  }

  // Filter icons based on search
  const filteredIcons = currentIcons.filter(icon =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase())
  )

  async function load(page=1){
    setLoading(true)
    try {
      // Try to load from API first
      try {
        let c
        try {
          c = await apiGet('/categories', token)
        } catch {
          c = await apiGet('/setup/categories', token)
        }
        setList(c.data ? c : { data: c || [], total: c?.length || 0, current_page: 1, last_page: 1, from: 0, to: c?.length || 0 })
        console.log("Categories page: Data loaded from API:", c.data?.length || c?.length || 0)
        return
      } catch (apiError) {
        console.log("Categories API failed, checking localStorage...")
      }

      // If API fails, check localStorage
      const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'
      const storedCategories = localStorage.getItem(`${storagePrefix}_categories_data`)

      if (storedCategories) {
        try {
          const categories = JSON.parse(storedCategories)
          setList({
            data: categories || [],
            total: categories?.length || 0,
            current_page: 1,
            last_page: 1,
            from: 0,
            to: categories?.length || 0
          })
          console.log("Categories page: Data loaded from localStorage:", categories?.length || 0)
        } catch (e) {
          console.error('Failed to parse stored categories:', e)
          setList({
            data: [],
            total: 0,
            current_page: 1,
            last_page: 1,
            from: 0,
            to: 0
          })
        }
      } else {
        // Return empty data so user can add manually
        setList({
          data: [],
          total: 0,
          current_page: 1,
          last_page: 1,
          from: 0,
          to: 0
        })
        console.log("Categories page: No stored data - ready for manual entry")
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Return empty data
      setList({
        data: [],
        total: 0,
        current_page: 1,
        last_page: 1,
        from: 0,
        to: 0
      })
    }
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  async function save(){
    if(!name) return

    try {
      const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `${base}/categories/${editing}` : `${base}/categories`
      const payload = { name }
      if(selectedIcon) payload.icon = selectedIcon

      // Add tenant headers manually
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) })
      const data = await res.json().catch(()=>({}))
      if(!res.ok){ throw new Error(data.message || 'Gagal simpan') }

      alert(editing ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan')
      setName(''); setSelectedIcon(''); setEditing(null); setShowIconPicker(false); load()
    } catch (error) {
      console.error('Error saving category:', error)
      // In demo mode, simulate successful save
      if (businessType === 'barbershop' || businessType === 'restaurant') {
        const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'
        alert(`✅ Demo: ${editing ? 'Kategori berhasil diperbarui' : 'Kategori berhasil ditambahkan'}`)
        setName(''); setSelectedIcon(''); setEditing(null); setShowIconPicker(false)
        // Add to current list for demo
        if (!editing) {
          const newCategory = {
            id: Date.now(),
            name: name,
            icon: selectedIcon,
            active: true,
            created_at: new Date().toISOString()
          }
          const updatedList = {
            ...list,
            data: [...(list.data || []), newCategory],
            total: (list.total || 0) + 1
          }
          setList(updatedList)
          // Save to localStorage
          localStorage.setItem(`${storagePrefix}_categories_data`, JSON.stringify(updatedList.data))
        } else {
          // Update existing category
          const updatedData = (list.data || []).map(cat =>
            cat.id === editing
              ? { ...cat, name: name, icon: selectedIcon }
              : cat
          )
          const updatedList = { ...list, data: updatedData }
          setList(updatedList)
          // Save to localStorage
          localStorage.setItem(`${storagePrefix}_categories_data`, JSON.stringify(updatedData))
        }
      } else {
        alert(error.message || 'Gagal simpan')
      }
    }
  }
  async function del(id){
    if(!confirm('Hapus kategori?')) return

    try {
      const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

      // Add tenant headers manually
      const headers = { 'Authorization': `Bearer ${token}` }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      const res = await fetch(`${base}/categories/${id}`, { method:'DELETE', headers })
      if(!res.ok){
        const data=await res.json().catch(()=>({}))
        throw new Error(data.message||'Gagal hapus')
      }

      alert('Kategori berhasil dihapus')
      load()
    } catch (error) {
      console.error('Error deleting category:', error)
      // In demo mode, simulate successful deletion
      if (businessType === 'barbershop' || businessType === 'restaurant') {
        const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'
        alert('✅ Demo: Kategori berhasil dihapus')
        // Remove from current list for demo
        const updatedData = (list.data || []).filter(c => c.id !== id)
        const updatedList = {
          ...list,
          data: updatedData,
          total: Math.max(0, (list.total || 0) - 1)
        }
        setList(updatedList)
        // Save to localStorage
        localStorage.setItem(`${storagePrefix}_categories_data`, JSON.stringify(updatedData))
      } else {
        alert(error.message || 'Gagal hapus')
      }
    }
  }
  async function deleteAll(){
    const message = businessType === 'restaurant'
      ? 'Hapus SEMUA kategori menu? Tindakan ini tidak dapat dibatalkan!'
      : businessType === 'barbershop'
      ? 'Hapus SEMUA kategori grooming? Tindakan ini tidak dapat dibatalkan!'
      : 'Hapus SEMUA kategori? Tindakan ini tidak dapat dibatalkan!'
    if(!confirm(message)) return

    try {
      const base = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

      // Add tenant headers manually
      const headers = { 'Authorization': `Bearer ${token}` }
      if (activeTenant?.slug) headers['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) headers['X-Tenant-Id'] = activeTenant.id

      const res = await fetch(`${base}/categories`, { method:'DELETE', headers })
      const data=await res.json().catch(()=>({}))
      if(!res.ok){ throw new Error(data.message||'Gagal hapus semua kategori') }

      alert(data.message || 'Semua kategori berhasil dihapus')
      load()
    } catch (error) {
      console.error('Error deleting all categories:', error)
      // In demo mode, simulate successful deletion
      if (businessType === 'barbershop' || businessType === 'restaurant') {
        const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'
        const categoryType = businessType === 'restaurant' ? 'kategori menu' : businessType === 'barbershop' ? 'kategori grooming' : 'kategori'
        alert(`✅ Demo: Berhasil menghapus semua ${categoryType} (${list.data?.length || 0} item)`)
        setList({ data: [], total: 0, current_page: 1, last_page: 1, from: 0, to: 0 })
        // Set localStorage flags to indicate categories were cleared
        localStorage.setItem(`${storagePrefix}_categories_cleared`, 'true')
        localStorage.removeItem(`${storagePrefix}_categories_data`)
      } else {
        alert(error.message || 'Gagal hapus semua kategori')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Compact & Professional */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {businessType === 'restaurant' ? 'Kategori Menu Restaurant' : businessType === 'barbershop' ? 'Kategori Produk Grooming' : 'Kategori Produk'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {businessType === 'restaurant'
              ? 'Kelola kategori menu seperti makanan utama, minuman, soto, dan paket spesial'
              : businessType === 'barbershop'
              ? 'Kelola kategori produk grooming seperti hair care, styling, dan tools'
              : 'Atur dan kelola kategori produk toko'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {list.data?.length > 0 && (
            <Button
              onClick={deleteAll}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
              {businessType === 'restaurant' ? 'Hapus Semua Menu' : businessType === 'barbershop' ? 'Hapus Semua Grooming' : 'Hapus Semua'}
            </Button>
          )}
          <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Link to="/inventory" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-blue-600" />
              {businessType === 'restaurant' ? 'Kembali ke Daftar Menu' : businessType === 'barbershop' ? 'Kembali ke Produk Grooming' : 'Kembali ke Inventori'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-purple-100 p-3">
                  <FolderOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Total Kategori Menu' : businessType === 'barbershop' ? 'Total Kategori Grooming' : 'Total Kategori'}</p>
                <p className="text-2xl font-bold text-gray-900">{list.data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-green-100 p-3">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Kategori Menu Aktif' : businessType === 'barbershop' ? 'Kategori Grooming Aktif' : 'Kategori Aktif'}</p>
                <p className="text-2xl font-bold text-gray-900">{list.data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-blue-100 p-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{businessType === 'restaurant' ? 'Kategori Menu Terbaru' : businessType === 'barbershop' ? 'Kategori Grooming Terbaru' : 'Terbaru'}</p>
                <p className="text-2xl font-bold text-gray-900">{list.data?.[0]?.name?.substring(0, 8) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>{businessType === 'restaurant' ? 'Pencarian Kategori Menu' : businessType === 'barbershop' ? 'Pencarian Kategori Grooming' : 'Pencarian Kategori'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                placeholder={businessType === 'restaurant' ? 'Cari kategori menu...' : businessType === 'barbershop' ? 'Cari kategori grooming...' : 'Cari kategori...'}
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <Button
              onClick={() => load()}
              size="lg"
              className="h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors"
            >
              <Search className="h-4 w-4 mr-2 text-white" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editing ? (
              <>
                <Edit className="h-5 w-5 text-orange-600" />
                <span>{businessType === 'restaurant' ? 'Edit Kategori Menu' : businessType === 'barbershop' ? 'Edit Kategori Grooming' : 'Edit Kategori'}</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                <span>{businessType === 'restaurant' ? 'Tambah Kategori Menu Baru' : businessType === 'barbershop' ? 'Tambah Kategori Grooming Baru' : 'Tambah Kategori Baru'}</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Name Input */}
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
              <Input
                placeholder={businessType === 'restaurant' ? 'Contoh: Makanan Utama, Minuman, Soto & Sup...' : businessType === 'barbershop' ? 'Contoh: Hair Care, Styling Products, Grooming Tools...' : 'Nama kategori...'}
                value={name}
                onChange={e=>setName(e.target.value)}
                className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Icon Picker */}
            {(businessType === 'barbershop' || businessType === 'restaurant') && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Pilih Icon Kategori {businessType === 'restaurant' ? 'Menu' : 'Grooming'} ({currentIcons.length} pilihan)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    {showIconPicker ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Sembunyikan
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Tampilkan Icon
                      </>
                    )}
                  </Button>
                </div>

                {showIconPicker && (
                  <>
                    {/* Icon Search */}
                    <div className="relative mb-4 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder={businessType === 'restaurant' ? 'Cari icon... (contoh: makanan, minuman, spesial)' : 'Cari icon... (contoh: hair, premium, natural)'}
                        value={iconSearch}
                        onChange={e => setIconSearch(e.target.value)}
                        className="pl-10 h-10 border border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Icon Grid */}
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {filteredIcons.map((iconOption) => {
                      const IconComponent = iconOption.icon
                      return (
                        <button
                          key={iconOption.name}
                          type="button"
                          onClick={() => setSelectedIcon(iconOption.name)}
                          className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 text-center ${
                            selectedIcon === iconOption.name
                              ? 'border-blue-500 bg-blue-100 scale-105'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm'
                          }`}
                          title={iconOption.label}
                        >
                          <IconComponent className={`h-5 w-5 ${
                            selectedIcon === iconOption.name ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                          <span className="text-xs text-gray-500 truncate w-full leading-tight">
                            {iconOption.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {filteredIcons.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Tidak ada icon yang cocok dengan "{iconSearch}"</p>
                      <p className="text-sm mt-1">Coba kata kunci lain seperti {businessType === 'restaurant' ? '"makanan", "minuman", atau "spesial"' : '"hair", "premium", atau "tools"'}</p>
                    </div>
                  )}
                </div>

                    {/* Selected Icon Preview */}
                    {selectedIcon && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                            {(() => {
                              const IconComponent = getIconComponent(selectedIcon)
                              return <IconComponent className="h-5 w-5 text-blue-600" />
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Icon Terpilih:</p>
                            <p className="text-xs text-blue-700">
                              {currentIcons.find(icon => icon.name === selectedIcon)?.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={save}
                size="lg"
                className={editing
                  ? "h-12 bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors"
                  : "h-12 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                }
              >
                <Save className="h-4 w-4 mr-2 text-white" />
                {editing
                  ? (businessType === 'restaurant' ? 'Update Kategori Menu' : businessType === 'barbershop' ? 'Update Kategori Grooming' : 'Update Kategori')
                  : (businessType === 'restaurant' ? 'Tambah Kategori Menu' : businessType === 'barbershop' ? 'Tambah Kategori Grooming' : 'Tambah Kategori')
                }
              </Button>
              {editing && (
                <Button
                  onClick={() => { setEditing(null); setName(''); setSelectedIcon(''); setShowIconPicker(false) }}
                  variant="outline"
                  size="lg"
                  className="h-12 border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                >
                  <X className="h-4 w-4 mr-2 text-red-500" />
                  Batal
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              <span>{businessType === 'restaurant' ? 'Daftar Kategori Menu' : businessType === 'barbershop' ? 'Daftar Kategori Grooming' : 'Daftar Kategori'}</span>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              {list.data?.length || 0} {businessType === 'restaurant' ? 'kategori menu' : businessType === 'barbershop' ? 'kategori grooming' : 'kategori'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <LoadingSpinner size="sm" />
              <span>Memuat kategori...</span>
            </div>
          ) : list.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-purple-100 p-6 mb-4">
                <FolderOpen className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{businessType === 'restaurant' ? 'Belum ada kategori menu' : businessType === 'barbershop' ? 'Belum ada kategori grooming' : 'Belum ada kategori'}</h3>
              <p className="text-gray-500 text-center mb-6 max-w-sm">
                {businessType === 'restaurant'
                  ? 'Mulai tambahkan kategori menu seperti Makanan Utama, Minuman, Soto & Sup, atau Paket Spesial.'
                  : businessType === 'barbershop'
                  ? 'Mulai tambahkan kategori grooming seperti Hair Care, Styling Tools, atau Treatment Products.'
                  : 'Mulai tambahkan kategori pertama untuk mengorganisir produk toko Anda.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.data?.map(c => (
                <Card key={c.id} className="hover:shadow-lg transition-all duration-200 group border border-gray-200 bg-white hover:bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {c.icon ? (
                            (() => {
                              const IconComponent = getIconComponent(c.icon)
                              return <IconComponent className="h-6 w-6" />
                            })()
                          ) : (
                            c.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {c.name}
                          </h3>
                          <p className="text-sm text-gray-500">{businessType === 'restaurant' ? 'Kategori menu' : businessType === 'barbershop' ? 'Kategori grooming' : 'Kategori produk'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setEditing(c.id);
                          setName(c.name);
                          setSelectedIcon(c.icon || '');
                          setShowIconPicker(c.icon ? true : false);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 hover:bg-orange-100 hover:text-orange-700"
                      >
                        <Edit className="h-3 w-3 mr-1 text-orange-500" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => del(c.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                        Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
