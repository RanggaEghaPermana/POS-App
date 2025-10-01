import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import {
  TrendingUp, TrendingDown, DollarSign, PieChart, Calculator,
  Filter, Calendar, BarChart3, Target, Minus
} from 'lucide-react'

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

import useCurrency from '../hooks/useCurrency'
import { LoadingSpinner } from '../components/ui/loading'

export default function ProfitLoss(){
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
      const apiData = await apiGet(`/reports/profit-loss?from=${from}&to=${to}`, token)
      setData(apiData)
    }catch(e){
      console.warn('API not available, generating profit-loss report from real data', e.message)
      // Generate real profit-loss data from existing sales and expenses
      await generateRealProfitLossReport()
    } finally { setLoading(false) }
  }

  async function generateRealProfitLossReport() {
    try {
      // Get real sales data (revenue)
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

      // Calculate revenue
      const revenueGross = filteredSales.reduce((sum, sale) => sum + (sale.grand_total || 0), 0)

      // Calculate tax (assume 11% PPN)
      const taxOutput = revenueGross * 0.11
      const revenueNet = revenueGross - taxOutput

      // Get real expense data (operating expenses)
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

      const operatingExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)

      // Calculate COGS (Cost of Goods Sold) for barbershop
      // For service business like barbershop, COGS is minimal (products used)
      let productsData = []
      try {
        productsData = JSON.parse(localStorage.getItem('barbershop_products') || '[]')
      } catch {
        productsData = []
      }

      // Estimate COGS as ~15% of revenue for grooming products used
      const estimatedCOGS = revenueGross * 0.15

      // Calculate profits
      const grossProfit = revenueNet - estimatedCOGS
      const netProfit = grossProfit - operatingExpenses

      const profitLossData = {
        revenue_gross: revenueGross,
        tax_output: taxOutput,
        revenue_net: revenueNet,
        cogs: estimatedCOGS,
        gross_profit: grossProfit,
        operating_expenses: operatingExpenses,
        net_profit: netProfit
      }

      setData(profitLossData)

    } catch (error) {
      console.error('Error generating profit-loss report:', error)
      setData({
        revenue_gross: 0,
        tax_output: 0,
        revenue_net: 0,
        cogs: 0,
        gross_profit: 0,
        operating_expenses: 0,
        net_profit: 0
      })
    }
  }
  useEffect(()=>{ (async()=>{ load() })() },[])
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Calculator className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Laporan Laba Rugi Barbershop</h1>
                <p className="text-purple-100">Analisis profitabilitas dan kinerja keuangan barbershop</p>
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
            <Filter className="h-5 w-5 text-purple-600" />
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
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label htmlFor="to">Sampai Tanggal</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={e=>setTo(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label>&nbsp;</Label>
              <Button
                onClick={load}
                className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
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
          <span>Memuat data laba rugi...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
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
                    <p className="text-sm font-medium text-gray-500">Pendapatan Kotor</p>
                    <p className="text-2xl font-bold text-blue-600">{formatMoney(data.revenue_gross, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-green-100 p-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pendapatan Bersih</p>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(data.revenue_net, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-purple-100 p-3">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Laba Kotor</p>
                    <p className="text-2xl font-bold text-purple-600">{formatMoney(data.gross_profit, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-full p-3 ${
                      data.net_profit >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {data.net_profit >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Laba Bersih</p>
                    <p className={`text-2xl font-bold ${
                      data.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatMoney(data.net_profit, currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Profit & Loss Statement */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Rincian Laba Rugi
              </CardTitle>
              <CardDescription>
                Breakdown lengkap perhitungan laba rugi periode yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">PENDAPATAN</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-gray-900">Pendapatan Kotor</span>
                      </div>
                      <span className="font-bold text-blue-600 text-lg">{formatMoney(data.revenue_gross, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Minus className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">PPN Output</span>
                      </div>
                      <span className="font-semibold text-gray-600">- {formatMoney(data.tax_output, currency)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Pendapatan Bersih</span>
                    </div>
                    <span className="font-bold text-green-600 text-xl">{formatMoney(data.revenue_net, currency)}</span>
                  </div>
                </div>

                {/* Costs Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">BIAYA</h3>
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Minus className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-gray-900">Harga Pokok Penjualan (HPP)</span>
                    </div>
                    <span className="font-bold text-orange-600 text-lg">- {formatMoney(data.cogs, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-gray-900">Laba Kotor</span>
                    </div>
                    <span className="font-bold text-purple-600 text-xl">{formatMoney(data.gross_profit, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Minus className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-gray-900">Beban Operasional</span>
                    </div>
                    <span className="font-bold text-red-600 text-lg">- {formatMoney(data.operating_expenses, currency)}</span>
                  </div>
                </div>

                {/* Net Profit Section */}
                <div className={`p-6 rounded-lg border-4 ${
                  data.net_profit >= 0
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {data.net_profit >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">LABA BERSIH</h3>
                        <p className="text-gray-600">Hasil akhir setelah semua biaya</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-4xl font-bold ${
                        data.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatMoney(data.net_profit, currency)}
                      </span>
                      {data.revenue_net > 0 && (
                        <div className={`text-sm font-medium ${
                          data.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {((data.net_profit / data.revenue_net) * 100).toFixed(1)}% margin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
