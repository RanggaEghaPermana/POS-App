import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { RupiahInput } from '../components/ui/rupiah-input'
import { formatDateIndonesia, formatRupiah, formatDateTimeLocal, parseDateTimeLocal } from '../utils/formatters'
import {
  Tag, Plus, Trash2, TrendingUp, TrendingDown, Percent,
  DollarSign, Package, Calendar, Settings, Home, Search, X, Check
} from 'lucide-react'

export default function Pricing(){
  const { token, logout } = useAuth()
  const [rules, setRules] = useState({ data:[], meta:{} })
  const [ruleForm, setRuleForm] = useState({ name:'', type:'percentage', value:'', product_id:'', category_id:'', start_at:'', end_at:'', active:true })
  const [bulkForm, setBulkForm] = useState({ category_id:'', product_ids:[], operation:'increase', amount:'', mode:'percentage' })

  // New states for product/category data
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [previewData, setPreviewData] = useState(null)

  async function load(page=1){ setRules(await apiGet(`/pricing/rules?per_page=50&page=${page}`, token)) }

  // Load products and categories
  async function loadProducts(){
    try {
      const data = await apiGet('/products?per_page=1000', token)
      setProducts(data.data || [])
    } catch(err) {
      console.error('Failed to load products:', err)
    }
  }

  async function loadCategories(){
    try {
      const data = await apiGet('/categories?per_page=100', token)
      setCategories(data.data || [])
    } catch(err) {
      console.error('Failed to load categories:', err)
    }
  }

  // Preview bulk update effects
  async function previewBulkUpdate(){
    try {
      const data = {
        category_id: bulkForm.category_id || null,
        product_ids: selectedProducts.map(p => p.id),
        operation: bulkForm.operation,
        amount: Number(bulkForm.amount || 0),
        mode: bulkForm.mode
      }
      const result = await apiPost('/pricing/bulk-preview', data, token)
      setPreviewData(result)
    } catch(err) {
      console.error('Failed to preview:', err)
      alert('Gagal mendapatkan preview: ' + (err.message || 'Error tidak diketahui'))
      setPreviewData(null)
    }
  }
  async function saveRule(){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/pricing/rules`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(ruleForm) })
    const d = await res.json().catch(()=>({})); if(!res.ok){ alert(d.message||'Gagal simpan rule'); return }
    setRuleForm({ name:'', type:'percentage', value:'', product_id:'', category_id:'', start_at:'', end_at:'', active:true }); load()
  }
  async function delRule(id){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/pricing/rules/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
    if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.message||'Gagal hapus'); return }
    load()
  }
  async function runBulk(){
    const data = {
      ...bulkForm,
      amount:Number(bulkForm.amount||0),
      product_ids: selectedProducts.map(p => p.id)
    }
    const res = await apiPost('/pricing/bulk-update', data, token)
    alert(`Updated: ${res.updated}`)
    setSelectedProducts([])
    setPreviewData(null)
  }

  useEffect(()=>{
    load()
    loadProducts()
    loadCategories()
  },[])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowProductDropdown(false)
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const pagination=[]; const current=rules.current_page||1; const last=rules.last_page||1; for(let i=1;i<=last;i++){ pagination.push(i) }

  // Filter products for search
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Helper functions
  const getProductName = (id) => products.find(p => p.id == id)?.name || `Product #${id}`
  const getCategoryName = (id) => categories.find(c => c.id == id)?.name || `Category #${id}`

  const selectProduct = (product) => {
    setRuleForm({...ruleForm, product_id: product.id, category_id: ''})
    setShowProductDropdown(false)
  }

  const selectCategory = (category) => {
    setRuleForm({...ruleForm, category_id: category.id, product_id: ''})
    setShowCategoryDropdown(false)
  }

  const toggleProductSelection = (product) => {
    const exists = selectedProducts.find(p => p.id === product.id)
    if (exists) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id))
    } else {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Tag className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Manajemen Harga</h1>
                <p className="text-yellow-100">Aturan harga dan update massal produk</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pricing Rules */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-yellow-600" />
              Pricing Rules
            </CardTitle>
            <CardDescription>Buat aturan harga otomatis untuk produk atau kategori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Input
                placeholder="Nama aturan"
                value={ruleForm.name}
                onChange={e=>setRuleForm({...ruleForm,name:e.target.value})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={ruleForm.type}
                  onChange={e=>setRuleForm({...ruleForm,type:e.target.value})}
                  className="h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 rounded-md transition-all"
                >
                  <option value="percentage">Persentase</option>
                  <option value="fixed">Nominal</option>
                </select>
                {ruleForm.type === 'fixed' ? (
                  <RupiahInput
                    placeholder="Nilai dalam rupiah"
                    value={ruleForm.value}
                    onChange={value=>setRuleForm({...ruleForm,value:value.toString()})}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                ) : (
                  <Input
                    placeholder="Nilai (%)"
                    type="number"
                    value={ruleForm.value}
                    onChange={e=>setRuleForm({...ruleForm,value:e.target.value})}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Product Selector */}
                <div className="relative dropdown-container">
                  <Label>Target Produk (opsional)</Label>
                  <Button
                    type="button"
                    onClick={() => setShowProductDropdown(!showProductDropdown)}
                    variant="outline"
                    className="w-full h-10 justify-between border-0 bg-gray-50 hover:bg-white focus:bg-white"
                  >
                    <span className="text-left truncate">
                      {ruleForm.product_id ? getProductName(ruleForm.product_id) : 'Pilih Produk'}
                    </span>
                    <Search className="h-4 w-4" />
                  </Button>
                  {ruleForm.product_id && (
                    <Button
                      type="button"
                      onClick={() => setRuleForm({...ruleForm, product_id: ''})}
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-7 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {showProductDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input
                          placeholder="Cari produk..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredProducts.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">Tidak ada produk</div>
                        ) : (
                          filteredProducts.map(product => (
                            <button
                              key={product.id}
                              onClick={() => selectProduct(product)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                            >
                              <div className="font-medium">{product.name}</div>
                              <div className="text-gray-500 text-xs">#{product.id} - {product.code}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Selector */}
                <div className="relative dropdown-container">
                  <Label>Target Kategori (opsional)</Label>
                  <Button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    variant="outline"
                    className="w-full h-10 justify-between border-0 bg-gray-50 hover:bg-white focus:bg-white"
                  >
                    <span className="text-left truncate">
                      {ruleForm.category_id ? getCategoryName(ruleForm.category_id) : 'Pilih Kategori'}
                    </span>
                    <Search className="h-4 w-4" />
                  </Button>
                  {ruleForm.category_id && (
                    <Button
                      type="button"
                      onClick={() => setRuleForm({...ruleForm, category_id: ''})}
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-7 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}

                  {showCategoryDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {categories.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Tidak ada kategori</div>
                      ) : (
                        categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => selectCategory(category)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            <div className="font-medium">{category.name}</div>
                            <div className="text-gray-500 text-xs">#{category.id}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(ruleForm.start_at)}
                    onChange={e=>setRuleForm({...ruleForm,start_at:parseDateTimeLocal(e.target.value)})}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
                <div>
                  <Label>Berakhir</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(ruleForm.end_at)}
                    onChange={e=>setRuleForm({...ruleForm,end_at:parseDateTimeLocal(e.target.value)})}
                    className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={ruleForm.active}
                  onChange={e=>setRuleForm({...ruleForm,active:e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="active">Aktif</Label>
              </div>
              <Button
                onClick={saveRule}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Simpan Rule
              </Button>
            </div>

            {/* Rules List */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Aturan Aktif</h4>
              <div className="max-h-64 overflow-y-auto">
                {rules.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Belum ada aturan harga</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.data?.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{r.name}</div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div>
                              {r.type === 'percentage' ? <Percent className="h-3 w-3 inline mr-1" /> : <span className="inline-block mr-1 text-xs font-bold">Rp</span>}
                              {r.type === 'percentage' ? `${r.value}%` : formatRupiah(r.value)} | Target: {
                                r.product_id ? getProductName(r.product_id) :
                                r.category_id ? getCategoryName(r.category_id) : 'Semua Produk'
                              }
                            </div>
                            {(r.start_at || r.end_at) && (
                              <div className="text-xs text-gray-400">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {r.start_at ? formatDateIndonesia(r.start_at) : 'Mulai sekarang'} - {r.end_at ? formatDateIndonesia(r.end_at) : 'Tanpa batas'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={r.active ? 'default' : 'secondary'}>
                            {r.active ? 'Aktif' : 'Tidak'}
                          </Badge>
                          <Button
                            onClick={()=>delRule(r.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Information for Pricing Rules */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
              <h4 className="font-semibold text-blue-800 mb-2">Cara Penggunaan Pricing Rules</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Nama aturan:</strong> Berikan nama yang mudah diingat (contoh: "Diskon Ramadan 15%")</li>
                <li>• <strong>Target produk:</strong> Pilih produk spesifik atau kategori untuk menerapkan aturan</li>
                <li>• <strong>Jenis aturan:</strong> Persentase (%) untuk diskon relatif, Nominal (Rp) untuk nilai tetap</li>
                <li>• <strong>Jadwal:</strong> Atur waktu mulai dan berakhir aturan (opsional untuk aturan permanen)</li>
                <li>• <strong>Scope:</strong> Jika tidak pilih produk/kategori = berlaku untuk semua produk</li>
                <li>• <strong>Status:</strong> Centang "Aktif" untuk langsung menerapkan aturan</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Update */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-600" />
              Bulk Update Harga
            </CardTitle>
            <CardDescription>Update harga massal untuk produk atau kategori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <Label>Filter Kategori (opsional)</Label>
                <select
                  value={bulkForm.category_id}
                  onChange={e=>setBulkForm({...bulkForm,category_id:e.target.value})}
                  className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 rounded-md transition-all"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <Label>Pilih Produk (opsional - kosongkan untuk semua)</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Cari produk untuk ditambahkan..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                      />
                      <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                    <Button
                      type="button"
                      onClick={previewBulkUpdate}
                      variant="outline"
                      className="px-4"
                      disabled={!bulkForm.amount}
                    >
                      Preview
                    </Button>
                  </div>

                  {/* Available Products List */}
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Daftar Produk Tersedia</Label>
                      <div className="text-xs text-gray-500">
                        {bulkForm.category_id
                          ? `Kategori: ${getCategoryName(bulkForm.category_id)}`
                          : 'Semua Kategori'
                        }
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {(bulkForm.category_id
                        ? products.filter(p => p.category_id == bulkForm.category_id)
                        : products
                      ).slice(0, 20).map(product => {
                        const isSelected = selectedProducts.find(p => p.id === product.id)
                        return (
                          <div
                            key={product.id}
                            onClick={() => toggleProductSelection(product)}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-100 border border-blue-300'
                                : 'bg-white hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                #{product.id} - {formatRupiah(product.price)}
                                {product.code && ` - ${product.code}`}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {isSelected ? (
                                <Check className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {(bulkForm.category_id
                        ? products.filter(p => p.category_id == bulkForm.category_id)
                        : products
                      ).length > 20 && (
                        <div className="text-center text-xs text-gray-500 py-2">
                          Menampilkan 20 dari {(bulkForm.category_id
                            ? products.filter(p => p.category_id == bulkForm.category_id)
                            : products
                          ).length} produk. Gunakan pencarian untuk menemukan produk spesifik.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Results */}
                  {productSearch && (
                    <div className="max-h-40 overflow-y-auto border rounded-md bg-white">
                      <div className="p-2 bg-gray-50 text-xs font-medium text-gray-700 border-b">
                        Hasil Pencarian "{productSearch}"
                      </div>
                      {filteredProducts.slice(0, 10).map(product => (
                        <div
                          key={product.id}
                          onClick={() => toggleProductSelection(product)}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">#{product.id} - {formatRupiah(product.price)}</div>
                          </div>
                          <div className="flex items-center">
                            {selectedProducts.find(p => p.id === product.id) ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Plus className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Products */}
                  {selectedProducts.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-blue-800">
                          Produk Terpilih ({selectedProducts.length})
                        </Label>
                        <Button
                          type="button"
                          onClick={() => setSelectedProducts([])}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedProducts.map(product => (
                          <Badge
                            key={product.id}
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800"
                          >
                            {product.name}
                            <button
                              onClick={() => toggleProductSelection(product)}
                              className="ml-1 hover:bg-blue-200 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Operasi</Label>
                  <select
                    value={bulkForm.operation}
                    onChange={e=>setBulkForm({...bulkForm,operation:e.target.value})}
                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 rounded-md transition-all"
                  >
                    <option value="increase">Naikkan</option>
                    <option value="decrease">Turunkan</option>
                    <option value="set">Set Harga</option>
                  </select>
                </div>
                <div>
                  <Label>Mode</Label>
                  <select
                    value={bulkForm.mode}
                    onChange={e=>setBulkForm({...bulkForm,mode:e.target.value})}
                    className="w-full h-10 px-3 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 rounded-md transition-all"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Rp</option>
                  </select>
                </div>
                <div>
                  <Label>Nilai</Label>
                  {bulkForm.mode === 'fixed' ? (
                    <RupiahInput
                      placeholder="Nilai dalam rupiah"
                      value={bulkForm.amount}
                      onChange={value=>setBulkForm({...bulkForm,amount:value.toString()})}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                    />
                  ) : (
                    <Input
                      placeholder="Nilai (%)"
                      type="number"
                      value={bulkForm.amount}
                      onChange={e=>setBulkForm({...bulkForm,amount:e.target.value})}
                      className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-500 transition-all"
                    />
                  )}
                </div>
              </div>
              {/* Preview Results */}
              {previewData && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">Preview Update</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-green-700">
                      <strong>Akan mempengaruhi {previewData.count} produk:</strong>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {previewData.products?.slice(0, 5).map(p => (
                        <div key={p.id} className="text-xs bg-white p-2 rounded border">
                          <span className="font-medium">{p.name}</span> -
                          <span className="text-gray-600"> {formatRupiah(p.current_price)}</span> →
                          <span className="font-semibold text-green-700"> {formatRupiah(p.new_price)}</span>
                        </div>
                      ))}
                      {previewData.products?.length > 5 && (
                        <div className="text-xs text-green-600">...dan {previewData.products.length - 5} produk lainnya</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={runBulk}
                disabled={!bulkForm.amount}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 font-semibold disabled:opacity-50"
              >
                {bulkForm.operation === 'increase' ? (
                  <TrendingUp className="h-4 w-4 mr-2" />
                ) : bulkForm.operation === 'decrease' ? (
                  <TrendingDown className="h-4 w-4 mr-2" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Jalankan Update
              </Button>
            </div>

            {/* Information */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Cara Penggunaan</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Filter kategori:</strong> Pilih kategori untuk membatasi produk (opsional)</li>
                <li>• <strong>Pilih produk spesifik:</strong> Klik produk di daftar atau gunakan pencarian (opsional)</li>
                <li>• <strong>Scope update:</strong> Jika tidak pilih kategori/produk = update SEMUA produk</li>
                <li>• <strong>Preview wajib:</strong> Selalu preview untuk melihat dampak sebelum eksekusi</li>
                <li>• <strong>Perhatian:</strong> Operasi ini tidak dapat dibatalkan setelah dijalankan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {pagination.length > 1 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {pagination.map(p => (
                <Button
                  key={p}
                  onClick={()=>load(p)}
                  disabled={p===current}
                  variant={p===current ? "default" : "outline"}
                  size="sm"
                  className={p===current ? "bg-yellow-600 hover:bg-yellow-700" : "hover:bg-yellow-100"}
                >
                  {p}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
