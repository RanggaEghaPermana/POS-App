import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatDateIndonesia, formatTimeOnly } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import {
  Clock, DollarSign, Calculator, PiggyBank, TrendingUp, Users,
  Play, Power, Eye, Plus, Minus, ShoppingCart, Scissors,
  AlertCircle, CheckCircle, Home, FileText, Wallet, Receipt
} from 'lucide-react'

export default function BarbershopShift() {
  const { token, user } = useAuth()
  const currency = useCurrency('IDR')
  const [currentShift, setCurrentShift] = useState(null)
  const [shiftData, setShiftData] = useState({
    modal_awal: 0,
    penjualan_cash: 0,
    pengeluaran: [],
    split_revenue: []
  })
  const [loading, setLoading] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ kategori: '', nominal: '', keterangan: '' })
  const [modalAwal, setModalAwal] = useState(0)
  const [modalAwalDisplay, setModalAwalDisplay] = useState('')
  const [nominalDisplay, setNominalDisplay] = useState('')

  // Format number with thousand separators
  function formatNumber(num) {
    if (!num) return ''
    return new Intl.NumberFormat('id-ID').format(num)
  }

  // Parse formatted number back to integer
  function parseFormattedNumber(str) {
    if (!str) return 0
    return parseInt(str.replace(/\./g, '')) || 0
  }

  // Handle modal awal input with formatting
  function handleModalAwalChange(value) {
    const numericValue = parseFormattedNumber(value)
    setModalAwal(numericValue)
    setModalAwalDisplay(formatNumber(numericValue))
  }

  // Handle nominal pengeluaran input with formatting
  function handleNominalChange(value) {
    const numericValue = parseFormattedNumber(value)
    setExpenseForm(prev => ({ ...prev, nominal: numericValue }))
    setNominalDisplay(formatNumber(numericValue))
  }

  // Load current shift data
  async function loadCurrentShift() {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockShift = {
        id: 'shift-001',
        tanggal: new Date().toISOString().split('T')[0],
        jam_mulai: '09:00',
        status: 'active',
        modal_awal: 500000,
        user_id: user?.id,
        user_name: user?.name || 'Admin',
        created_at: new Date().toISOString()
      }

      const storedShift = localStorage.getItem('barbershop_current_shift')
      if (storedShift) {
        setCurrentShift(JSON.parse(storedShift))
      } else {
        setCurrentShift(null)
      }

      loadShiftFinancialData()
    } catch (error) {
      console.error('Failed to load shift:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load financial data for current shift
  function loadShiftFinancialData() {
    try {
      const storedData = localStorage.getItem('barbershop_shift_financial')
      if (storedData) {
        setShiftData(JSON.parse(storedData))
      }

      // Calculate sales from transactions
      const sales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      const today = new Date().toISOString().split('T')[0]
      const todaySales = sales.filter(sale => sale.date?.startsWith(today))
      const totalCashSales = todaySales
        .filter(sale => sale.payments?.some(p => p.method === 'cash'))
        .reduce((sum, sale) => {
          const cashPayment = sale.payments?.find(p => p.method === 'cash')
          return sum + (cashPayment?.amount || 0)
        }, 0)

      setShiftData(prev => ({
        ...prev,
        penjualan_cash: totalCashSales
      }))
    } catch (error) {
      console.error('Failed to load financial data:', error)
    }
  }

  // Start new shift
  async function startShift() {
    try {
      const newShift = {
        id: `shift-${Date.now()}`,
        tanggal: new Date().toISOString().split('T')[0],
        jam_mulai: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: 'active',
        modal_awal: modalAwal,
        user_id: user?.id,
        user_name: user?.name || 'Admin',
        created_at: new Date().toISOString()
      }

      localStorage.setItem('barbershop_current_shift', JSON.stringify(newShift))
      setCurrentShift(newShift)

      // Initialize financial data
      const initialData = {
        modal_awal: modalAwal,
        penjualan_cash: 0,
        pengeluaran: [],
        split_revenue: []
      }
      localStorage.setItem('barbershop_shift_financial', JSON.stringify(initialData))
      setShiftData(initialData)

      setShowStartModal(false)
      setModalAwal(0)
      setModalAwalDisplay('')
      alert('Shift berhasil dimulai!')
    } catch (error) {
      console.error('Failed to start shift:', error)
      alert('Gagal memulai shift')
    }
  }

  // End current shift
  async function endShift() {
    try {
      const endedShift = {
        ...currentShift,
        status: 'completed',
        jam_selesai: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        kas_akhir: calculateKasAkhir(),
        total_penjualan: shiftData.penjualan_cash,
        total_pengeluaran: shiftData.pengeluaran.reduce((sum, p) => sum + p.nominal, 0)
      }

      // Save to shift history
      const shiftHistory = JSON.parse(localStorage.getItem('barbershop_shift_history') || '[]')
      shiftHistory.unshift(endedShift)
      localStorage.setItem('barbershop_shift_history', JSON.stringify(shiftHistory))

      // Clear current shift
      localStorage.removeItem('barbershop_current_shift')
      localStorage.removeItem('barbershop_shift_financial')

      setCurrentShift(null)
      setShiftData({ modal_awal: 0, penjualan_cash: 0, pengeluaran: [], split_revenue: [] })
      setShowEndModal(false)

      alert('Shift berhasil ditutup!')
    } catch (error) {
      console.error('Failed to end shift:', error)
      alert('Gagal menutup shift')
    }
  }

  // Add expense
  function addExpense() {
    if (!expenseForm.kategori || !expenseForm.nominal) {
      alert('Kategori dan nominal wajib diisi')
      return
    }

    const newExpense = {
      id: Date.now(),
      kategori: expenseForm.kategori,
      nominal: Number(expenseForm.nominal),
      keterangan: expenseForm.keterangan,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    const updatedData = {
      ...shiftData,
      pengeluaran: [...shiftData.pengeluaran, newExpense]
    }

    setShiftData(updatedData)
    localStorage.setItem('barbershop_shift_financial', JSON.stringify(updatedData))

    setExpenseForm({ kategori: '', nominal: '', keterangan: '' })
    setNominalDisplay('')
    setShowExpenseModal(false)
  }

  // Calculate final cash
  function calculateKasAkhir() {
    const totalPengeluaran = shiftData.pengeluaran.reduce((sum, p) => sum + p.nominal, 0)
    return shiftData.modal_awal + shiftData.penjualan_cash - totalPengeluaran
  }

  // Calculate barber revenue split (70% for barber, 30% for shop)
  function calculateBarberSplit() {
    const barberShare = shiftData.penjualan_cash * 0.7
    const shopShare = shiftData.penjualan_cash * 0.3
    return { barberShare, shopShare }
  }

  useEffect(() => {
    loadCurrentShift()
    // Refresh every 30 seconds to get latest sales
    const interval = setInterval(loadShiftFinancialData, 30000)
    return () => clearInterval(interval)
  }, [])

  const { barberShare, shopShare } = calculateBarberSplit()
  const kasAkhir = calculateKasAkhir()

  return (
    <div className="space-y-6">
      {/* Header Section - Compact & Professional */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Shift Barbershop</h1>
              <p className="text-sm text-gray-600">Manajemen finansial shift harian barbershop</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/service-pos" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Treatment
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Shift Status Card */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-600" />
            Status Shift Hari Ini
          </CardTitle>
          <CardDescription>
            {formatDateIndonesia(new Date().toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentShift ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Shift Aktif</div>
                  <div className="text-sm text-gray-600">
                    Dimulai: {currentShift.jam_mulai} • Operator: {currentShift.user_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Modal Awal: {formatMoney(currentShift.modal_awal, currency)}
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowEndModal(true)} variant="destructive">
                <Power className="h-4 w-4 mr-2" />
                Tutup Shift
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Shift Belum Dimulai</div>
                  <div className="text-sm text-gray-600">Mulai shift untuk operasional hari ini</div>
                </div>
              </div>
              <Button onClick={() => setShowStartModal(true)} className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Mulai Shift
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {currentShift && (
        <>
          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <PiggyBank className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modal Awal</p>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(shiftData.modal_awal, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Penjualan Cash</p>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(shiftData.penjualan_cash, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Minus className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Pengeluaran</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatMoney(shiftData.pengeluaran.reduce((sum, p) => sum + p.nominal, 0), currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Wallet className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kas Akhir</p>
                    <p className="text-lg font-bold text-gray-900">{formatMoney(kasAkhir, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Split */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
                Split Revenue Barber
              </CardTitle>
              <CardDescription>Pembagian hasil penjualan (70% Barber, 30% Barbershop)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Share Barber (70%)</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{formatMoney(barberShare, currency)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Share Barbershop (30%)</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{formatMoney(shopShare, currency)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-slate-600" />
                    Pengeluaran Shift
                  </CardTitle>
                  <CardDescription>Kelola pengeluaran supplies, tip barber, dll</CardDescription>
                </div>
                <Button onClick={() => {
                  setExpenseForm({ kategori: '', nominal: '', keterangan: '' })
                  setNominalDisplay('')
                  setShowExpenseModal(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengeluaran
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shiftData.pengeluaran.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Belum ada pengeluaran hari ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftData.pengeluaran.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.waktu}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.kategori}</Badge>
                        </TableCell>
                        <TableCell>{expense.keterangan}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(expense.nominal, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Start Shift Modal */}
      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mulai Shift Barbershop</DialogTitle>
            <DialogDescription>
              Masukkan modal awal kas untuk memulai shift hari ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modal">Modal Awal Kas</Label>
              <Input
                id="modal"
                type="text"
                placeholder="Contoh: 500.000"
                value={modalAwalDisplay}
                onChange={(e) => handleModalAwalChange(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Jumlah uang cash di kas register untuk kembalian
              </p>
              {modalAwal > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Nilai: Rp {formatNumber(modalAwal)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setModalAwal(0)
              setModalAwalDisplay('')
              setShowStartModal(false)
            }}>
              Batal
            </Button>
            <Button onClick={startShift} className="bg-green-600 hover:bg-green-700">
              Mulai Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Shift Modal */}
      <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tutup Shift Barbershop</DialogTitle>
            <DialogDescription>
              Rekap finansial shift hari ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Modal Awal:</div>
              <div className="font-medium">{formatMoney(shiftData.modal_awal, currency)}</div>
              <div>Penjualan Cash:</div>
              <div className="font-medium text-green-600">{formatMoney(shiftData.penjualan_cash, currency)}</div>
              <div>Total Pengeluaran:</div>
              <div className="font-medium text-red-600">{formatMoney(shiftData.pengeluaran.reduce((sum, p) => sum + p.nominal, 0), currency)}</div>
              <div className="border-t pt-2 font-semibold">Kas Akhir:</div>
              <div className="border-t pt-2 font-semibold text-lg">{formatMoney(kasAkhir, currency)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndModal(false)}>
              Batal
            </Button>
            <Button onClick={endShift} variant="destructive">
              Tutup Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran</DialogTitle>
            <DialogDescription>
              Catat pengeluaran selama shift (supplies, tip, dll)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kategori">Kategori</Label>
              <select
                id="kategori"
                value={expenseForm.kategori}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, kategori: e.target.value }))}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="">Pilih Kategori</option>
                <option value="Supplies">Supplies (shampo, gel, pisau)</option>
                <option value="Tip Barber">Tip Barber</option>
                <option value="Snack">Snack & Minuman</option>
                <option value="Maintenance">Maintenance Alat</option>
                <option value="Operasional">Operasional Lainnya</option>
              </select>
            </div>
            <div>
              <Label htmlFor="nominal">Nominal</Label>
              <Input
                id="nominal"
                type="text"
                placeholder="Contoh: 50.000"
                value={nominalDisplay}
                onChange={(e) => handleNominalChange(e.target.value)}
              />
              {expenseForm.nominal > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  Nilai: Rp {formatNumber(expenseForm.nominal)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                placeholder="Detail pengeluaran (opsional)"
                value={expenseForm.keterangan}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, keterangan: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setExpenseForm({ kategori: '', nominal: '', keterangan: '' })
              setNominalDisplay('')
              setShowExpenseModal(false)
            }}>
              Batal
            </Button>
            <Button onClick={addExpense}>
              Tambah Pengeluaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}