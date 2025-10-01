import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { LoadingSpinner } from '../components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import {
  DollarSign, Plus, Edit, Trash2, Calendar, Receipt,
  Users, Building, Scissors, ShoppingBag, AlertTriangle, Wrench
} from 'lucide-react'
import useCurrency from '../hooks/useCurrency'

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

// Kategori pengeluaran untuk barbershop
const EXPENSE_CATEGORIES = [
  { id: 'salary', name: 'Gaji Barber & Staff', icon: Users, color: 'bg-blue-500' },
  { id: 'rent', name: 'Sewa & Utilitas', icon: Building, color: 'bg-green-500' },
  { id: 'supplies', name: 'Supplies & Equipment', icon: Scissors, color: 'bg-purple-500' },
  { id: 'inventory', name: 'Stok Produk Grooming', icon: ShoppingBag, color: 'bg-orange-500' },
  { id: 'maintenance', name: 'Maintenance & Repair', icon: Wrench, color: 'bg-gray-500' },
  { id: 'marketing', name: 'Marketing & Promosi', icon: Receipt, color: 'bg-pink-500' },
  { id: 'other', name: 'Lain-lain', icon: AlertTriangle, color: 'bg-red-500' }
]

export default function ExpenseManagement(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    description: '',
    amount: '',
    notes: ''
  })

  async function loadExpenses(){
    setLoading(true)
    try {
      const expenseData = JSON.parse(localStorage.getItem('barbershop_expenses') || '[]')
      setExpenses(expenseData.sort((a, b) => new Date(b.date) - new Date(a.date)))
    } catch (error) {
      console.error('Error loading expenses:', error)
      setExpenses([])
    }
    setLoading(false)
  }

  async function saveExpense(){
    try {
      const newExpense = {
        id: editingExpense?.id || Date.now(),
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        created_at: editingExpense?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let updatedExpenses
      if (editingExpense) {
        updatedExpenses = expenses.map(exp => exp.id === editingExpense.id ? newExpense : exp)
      } else {
        updatedExpenses = [newExpense, ...expenses]
      }

      localStorage.setItem('barbershop_expenses', JSON.stringify(updatedExpenses))
      setExpenses(updatedExpenses)
      resetForm()
      alert(editingExpense ? 'Pengeluaran berhasil diupdate!' : 'Pengeluaran berhasil ditambahkan!')
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Gagal menyimpan pengeluaran')
    }
  }

  function deleteExpense(id){
    if (confirm('Yakin ingin menghapus pengeluaran ini?')) {
      const updatedExpenses = expenses.filter(exp => exp.id !== id)
      localStorage.setItem('barbershop_expenses', JSON.stringify(updatedExpenses))
      setExpenses(updatedExpenses)
      alert('Pengeluaran berhasil dihapus!')
    }
  }

  function editExpense(expense){
    setEditingExpense(expense)
    setFormData({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      notes: expense.notes || ''
    })
    setShowForm(true)
  }

  function resetForm(){
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      description: '',
      amount: '',
      notes: ''
    })
    setEditingExpense(null)
    setShowForm(false)
  }

  function getCategoryInfo(categoryId){
    return EXPENSE_CATEGORIES.find(cat => cat.id === categoryId) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
  }

  function getTotalExpenses(){
    return expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  function getTodayExpenses(){
    const today = new Date().toISOString().slice(0, 10)
    return expenses.filter(exp => exp.date === today).reduce((sum, exp) => sum + exp.amount, 0)
  }

  function getThisMonthExpenses(){
    const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    return expenses.filter(exp => exp.date.startsWith(thisMonth)).reduce((sum, exp) => sum + exp.amount, 0)
  }

  useEffect(()=>{ loadExpenses() }, [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Manajemen Pengeluaran</h1>
                <p className="text-red-100">Kelola dan pantau pengeluaran operasional barbershop</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowForm(!showForm)}
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Plus className="h-5 w-5 mr-2" />
              {showForm ? 'Tutup Form' : 'Tambah Pengeluaran'}
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-red-100 p-3">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pengeluaran Hari Ini</p>
                <p className="text-2xl font-bold text-red-600">{formatMoney(getTodayExpenses(), currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-orange-100 p-3">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-bold text-orange-600">{formatMoney(getThisMonthExpenses(), currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-gray-100 p-3">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-gray-900">{formatMoney(getTotalExpenses(), currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e=>setFormData({...formData, date: e.target.value})}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e=>setFormData({...formData, category: e.target.value})}
                  className="w-full h-12 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Pilih Kategori</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e=>setFormData({...formData, description: e.target.value})}
                  placeholder="Contoh: Gaji barber Budi"
                  className="h-12"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Jumlah (IDR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={e=>setFormData({...formData, amount: e.target.value})}
                  placeholder="0"
                  className="h-12"
                  required
                />
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={e=>setFormData({...formData, notes: e.target.value})}
                  placeholder="Catatan tambahan..."
                  className="h-12"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={saveExpense}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!formData.category || !formData.description || !formData.amount}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {editingExpense ? 'Update Pengeluaran' : 'Simpan Pengeluaran'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-gray-300"
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            Daftar Pengeluaran
          </CardTitle>
          <CardDescription>
            Total {expenses.length} pengeluaran tercatat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <LoadingSpinner size="sm" />
              <span>Memuat data pengeluaran...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pengeluaran</h3>
              <p className="mb-6">Mulai catat pengeluaran operasional barbershop Anda</p>
              <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-5 w-5 mr-2" />
                Tambah Pengeluaran Pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kategori</TableHead>
                    <TableHead className="font-semibold text-gray-700">Deskripsi</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Jumlah</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const categoryInfo = getCategoryInfo(expense.category)
                    const IconComponent = categoryInfo.icon
                    return (
                      <TableRow key={expense.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="py-4">
                          <div className="font-medium text-gray-900">
                            {new Date(expense.date).toLocaleDateString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full ${categoryInfo.color} flex items-center justify-center`}>
                              <IconComponent className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{categoryInfo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-red-600 text-lg">
                            {formatMoney(expense.amount, currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => editExpense(expense)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => deleteExpense(expense.id)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
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
    </div>
  )
}