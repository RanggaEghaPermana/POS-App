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
  Receipt, ArrowUpCircle, ArrowDownCircle, Calculator,
  Filter, Calendar, BarChart3, FileText, AlertCircle
} from 'lucide-react'

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

export default function TaxReport(){
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const today = new Date().toISOString().slice(0,10)
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  async function load(){
    setLoading(true)
    try{ setData(await apiGet(`/reports/tax?from=${from}&to=${to}`, token)) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{ (async()=>{ load() })() },[])
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Laporan Pajak</h1>
                <p className="text-amber-100">Perhitungan dan rekonsiliasi PPN</p>
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
            <Filter className="h-5 w-5 text-amber-600" />
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
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label htmlFor="to">Sampai Tanggal</Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={e=>setTo(e.target.value)}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="lg:col-span-4">
              <Label>&nbsp;</Label>
              <Button
                onClick={load}
                className="w-full h-10 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
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
          <span>Memuat data pajak...</span>
        </div>
      ) : (
        <>
          {/* Tax Summary Cards */}
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
                    <p className="text-sm font-medium text-gray-500">PPN Keluaran</p>
                    <p className="text-2xl font-bold text-green-600">{formatMoney(data.ppn_output, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-100 p-3">
                      <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">PPN Masukan</p>
                    <p className="text-2xl font-bold text-blue-600">{formatMoney(data.ppn_input, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-full p-3 ${
                      data.ppn_net >= 0 ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      <Calculator className={`h-6 w-6 ${
                        data.ppn_net >= 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">PPN Terutang</p>
                    <p className={`text-2xl font-bold ${
                      data.ppn_net >= 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {formatMoney(data.ppn_net, currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Tax Calculation */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                Rincian Perhitungan PPN
              </CardTitle>
              <CardDescription>
                Detail perhitungan Pajak Pertambahan Nilai untuk periode yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* PPN Calculation */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-4">
                      <ArrowUpCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">PPN KELUARAN</h3>
                        <p className="text-gray-600">PPN yang dipungut dari penjualan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-green-600">
                        {formatMoney(data.ppn_output, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-4">
                      <ArrowDownCircle className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">PPN MASUKAN</h3>
                        <p className="text-gray-600">PPN yang dibayar untuk pembelian</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-blue-600">
                        - {formatMoney(data.ppn_input, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t-2 border-gray-200 my-4"></div>

                  {/* Net PPN Result */}
                  <div className={`p-8 rounded-lg border-4 ${
                    data.ppn_net >= 0
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-emerald-50 border-emerald-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Calculator className={`h-10 w-10 ${
                          data.ppn_net >= 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`} />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">
                            PPN TERUTANG
                          </h3>
                          <p className="text-gray-600">
                            {data.ppn_net >= 0
                              ? 'PPN yang harus dibayar ke negara'
                              : 'Lebih bayar PPN (dapat dikreditkan)'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-4xl font-bold ${
                          data.ppn_net >= 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {formatMoney(Math.abs(data.ppn_net), currency)}
                        </span>
                        <div className="mt-2">
                          {data.ppn_net >= 0 ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Harus Dibayar
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              <ArrowDownCircle className="h-3 w-3 mr-1" />
                              Lebih Bayar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Informasi Pajak
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• PPN Keluaran dihitung dari penjualan dengan tarif 11%</li>
                    <li>• PPN Masukan dihitung dari pembelian yang dapat dikreditkan</li>
                    <li>• Jika PPN Terutang positif, wajib dibayar ke kas negara</li>
                    <li>• Jika PPN Terutang negatif, dapat dikompensasikan ke periode berikutnya</li>
                    <li>• Laporan ini untuk keperluan SPT Masa PPN</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
