import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import useCurrency from '../hooks/useCurrency'
import { LoadingSpinner } from '../components/ui/loading'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle,
  Filter, Calendar, BarChart3, Activity
} from 'lucide-react'

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

export default function Cashflow(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const today = new Date().toISOString().slice(0,10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  async function load(){
    setLoading(true)

    try{
      // Try API first
      const apiData = await apiGet(`/reports/cashflow?from=${from}&to=${to}`, token)
      setData(apiData)
    }catch(e){
      console.warn('API not available, generating cashflow report from real data', e.message)
      // Generate real cashflow data from existing sales and expenses
      await generateRealCashflowReport()
    } finally { setLoading(false) }
  }

  async function generateRealCashflowReport() {
    try {
      // Get real sales data (cash in)
      let salesData = []
      try {
        salesData = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
      } catch {
        salesData = []
      }

      // Filter sales by date range
      const fromDate = new Date(from)
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)

      const filteredSales = salesData.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= fromDate && saleDate <= toDate
      })

      // Calculate cash in from sales
      const totalCashIn = filteredSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

      // Get real expense data
      let expenseData = []
      try {
        expenseData = JSON.parse(localStorage.getItem('barbershop_expenses') || '[]')
      } catch {
        expenseData = []
      }

      // Filter expenses by date range
      const filteredExpenses = expenseData.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= fromDate && expenseDate <= toDate
      })

      // Calculate cash out from real expenses
      const totalCashOut = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

      // Group expenses by day
      const dailyCashOut = {}
      filteredExpenses.forEach(expense => {
        const dateKey = expense.date
        if (!dailyCashOut[dateKey]) {
          dailyCashOut[dateKey] = 0
        }
        dailyCashOut[dateKey] += (expense.amount || 0)
      })

      // Generate daily breakdown
      const daily = []
      const processDate = new Date(fromDate)

      while (processDate <= toDate) {
        const dateKey = processDate.toISOString().split('T')[0]

        // Calculate cash in for this day
        const daySales = filteredSales.filter(sale => {
          const saleDate = new Date(sale.created_at).toISOString().split('T')[0]
          return saleDate === dateKey
        })
        const dayCashIn = daySales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

        // Get cash out for this day
        const dayCashOut = dailyCashOut[dateKey] || 0

        daily.push({
          day: dateKey,
          cash_in: dayCashIn,
          cash_out: dayCashOut,
          net: dayCashIn - dayCashOut
        })

        processDate.setDate(processDate.getDate() + 1)
      }

      // Calculate totals and net
      const netCashflow = totalCashIn - totalCashOut

      const cashflowData = {
        totals: {
          cash_in: totalCashIn,
          cash_out: totalCashOut,
          net: netCashflow
        },
        daily: daily.sort((a, b) => new Date(a.day) - new Date(b.day))
      }

      setData(cashflowData)

    } catch (error) {
      console.error('Error generating cashflow report:', error)
      setData({
        totals: { cash_in: 0, cash_out: 0, net: 0 },
        daily: []
      })
    }
  }
  useEffect(()=>{ (async()=>{ load() })() },[])
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Activity className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Laporan Arus Kas Barbershop</h1>
                <p className="text-cyan-100">Analisis pergerakan kas masuk dan keluar bisnis barbershop</p>
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

      {/* Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-cyan-600" />
            Filter Periode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Label htmlFor="from">Dari Tanggal</Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={e=>setFrom(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label htmlFor="to">Sampai Tanggal</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={e=>setTo(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label>&nbsp;</Label>
              <Button
                onClick={load}
                className="w-full h-10 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Filter className="h-4 w-4 mr-2" />
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!data || loading ? (
        <div className="flex items-center justify-center min-h-[200px] text-muted-foreground gap-2">
          <LoadingSpinner size="sm" />
          <span>Memuat data arus kas...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-green-100 p-3">
                      <ArrowUpCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Kas Masuk</p>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(data.totals.cash_in, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-red-100 p-3">
                      <ArrowDownCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Kas Keluar</p>
                    <p className="text-2xl font-bold text-red-600">{formatMoney(data.totals.cash_out, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-full p-3 ${
                      data.totals.net >= 0 ? 'bg-blue-100' : 'bg-orange-100'
                    }`}>
                      {data.totals.net >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Net Cashflow</p>
                    <p className={`text-2xl font-bold ${
                      data.totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {formatMoney(data.totals.net, currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Cashflow Table */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-600" />
                Detail Arus Kas Harian
              </CardTitle>
              <CardDescription>
                Rincian pergerakan kas per hari dalam periode yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.daily?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada data arus kas untuk periode ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-semibold text-gray-700">Tanggal</th>
                        <th className="text-right py-3 font-semibold text-gray-700">Kas Masuk</th>
                        <th className="text-right py-3 font-semibold text-gray-700">Kas Keluar</th>
                        <th className="text-right py-3 font-semibold text-gray-700">Net Cashflow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.daily.map(d => (
                        <tr key={d.day} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3">
                            <div className="font-medium">
                              {new Date(d.day).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="text-right py-3">
                            <span className="font-semibold text-green-600">
                              {formatMoney(d.cash_in, currency)}
                            </span>
                          </td>
                          <td className="text-right py-3">
                            <span className="font-semibold text-red-600">
                              {formatMoney(d.cash_out, currency)}
                            </span>
                          </td>
                          <td className="text-right py-3">
                            <div className="flex items-center justify-end gap-2">
                              {d.net >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-orange-500" />
                              )}
                              <span className={`font-bold ${
                                d.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                              }`}>
                                {formatMoney(d.net, currency)}
                              </span>
                            </div>
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
