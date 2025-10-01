import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { useAuth } from '../../AuthContext'
import { apiGet } from '../../api'
import { formatRupiah, formatDateIndonesia } from '../../utils/formatters'
import {
  Pill, Stethoscope, Clock, TrendingUp, Users, Package,
  CheckCircle, AlertCircle, Timer, Activity, FileText,
  Loader2, Heart, AlertTriangle, ShoppingCart, Calendar
} from 'lucide-react'

export default function PharmacyDashboard() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [todayStats, setTodayStats] = useState(null)
  const [prescriptions, setPrescriptions] = useState([])
  const [expiryAlerts, setExpiryAlerts] = useState([])
  const [consultations, setConsultations] = useState([])
  const [topMedicines, setTopMedicines] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Mock data for demonstration
      setTodayStats({
        totalSales: 42,
        revenue: 1850000,
        prescriptions: 18,
        otc: 24,
        consultations: 6,
        avgWaitTime: 12
      })

      setPrescriptions([
        {
          id: 'RX-001',
          patient: 'Budi Santoso',
          doctor: 'Dr. Sari',
          medicines: ['Amoxicillin 500mg', 'Paracetamol 500mg'],
          status: 'processing',
          time: '14:30',
          insurance: 'BPJS'
        },
        {
          id: 'RX-002',
          patient: 'Siti Aisyah',
          doctor: 'Dr. Ahmad',
          medicines: ['Omeprazole 20mg'],
          status: 'ready',
          time: '14:15',
          insurance: 'Private'
        },
        {
          id: 'RX-003',
          patient: 'Andi Wijaya',
          doctor: 'Dr. Maya',
          medicines: ['Metformin 500mg', 'Glimepiride 2mg'],
          status: 'pending',
          time: '14:45',
          insurance: 'BPJS'
        }
      ])

      setExpiryAlerts([
        { name: 'Vitamin C 500mg', batch: 'VTC2024001', expiry: '2024-12-15', stock: 25, days: 45 },
        { name: 'Paracetamol Syrup', batch: 'PCM2024005', expiry: '2024-11-30', stock: 8, days: 30 },
        { name: 'Antibiotik Amoxicillin', batch: 'AMX2024012', expiry: '2024-10-20', stock: 12, days: 10 }
      ])

      setConsultations([
        { id: 1, time: '15:00', patient: 'Dedi Rahman', type: 'Drug Consultation', pharmacist: 'Apt. Lisa' },
        { id: 2, time: '15:30', patient: 'Eka Putri', type: 'Health Screening', pharmacist: 'Apt. Budi' },
        { id: 3, time: '16:00', patient: 'Firman Ali', type: 'Medication Review', pharmacist: 'Apt. Lisa' }
      ])

      setTopMedicines([
        { name: 'Paracetamol 500mg', sold: 24, revenue: 240000, category: 'Analgesik' },
        { name: 'Vitamin C 500mg', sold: 18, revenue: 180000, category: 'Vitamin' },
        { name: 'OBH Combi', sold: 15, revenue: 225000, category: 'Obat Batuk' },
        { name: 'Antimo', sold: 12, revenue: 120000, category: 'Anti Mual' }
      ])

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const getPrescriptionStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getExpiryAlertColor = (days) => {
    if (days <= 30) return 'border-red-200 bg-red-50'
    if (days <= 60) return 'border-yellow-200 bg-yellow-50'
    return 'border-green-200 bg-green-50'
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen p-6">
      {/* Header Pharmacy Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-18 translate-x-18" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-14 -translate-x-14" />
        <div className="absolute top-1/4 right-1/3 w-6 h-6 bg-white/20 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-white/20 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
              <p className="text-green-100">Sistem manajemen apotek dan farmasi</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Total Sales</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.totalSales}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">Revenue</span>
              </div>
              <div className="text-xl font-bold mt-1">{formatRupiah(todayStats.revenue)}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm">Prescriptions</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.prescriptions}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                <span className="text-sm">OTC Sales</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.otc}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                <span className="text-sm">Consultations</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.consultations}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Avg Wait</span>
              </div>
              <div className="text-xl font-bold mt-1">{todayStats.avgWaitTime}min</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Queue */}
        <div className="lg:col-span-2">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prescription Queue
              </CardTitle>
              <CardDescription className="text-blue-100">
                {prescriptions.length} resep dalam antrian
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{rx.id} - {rx.patient}</div>
                          <div className="text-sm text-gray-600">Dr. {rx.doctor} • {rx.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPrescriptionStatusColor(rx.status)}>
                          {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                        </Badge>
                        <div className="text-xs text-gray-600 mt-1">{rx.insurance}</div>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <div className="text-sm font-medium mb-1">Medicines:</div>
                      <div className="text-sm text-gray-600">
                        {rx.medicines.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Alerts */}
        <div>
          <Card className="border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expiry Alerts
              </CardTitle>
              <CardDescription className="text-red-100">
                Medicine expiration monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {expiryAlerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getExpiryAlertColor(alert.days)}`}>
                    <div className="font-medium text-sm mb-1">{alert.name}</div>
                    <div className="text-xs text-gray-600 mb-2">
                      Batch: {alert.batch} • Stock: {alert.stock}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Expires: {alert.expiry}</span>
                      <span className={`font-medium ${
                        alert.days <= 30 ? 'text-red-600' :
                        alert.days <= 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {alert.days} days left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consultations Schedule */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Consultation Schedule
            </CardTitle>
            <CardDescription className="text-purple-100">
              Jadwal konsultasi farmasi hari ini
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{consultation.time} - {consultation.patient}</div>
                      <div className="text-sm text-gray-600">{consultation.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{consultation.pharmacist}</div>
                    <Button size="sm" variant="outline" className="mt-1 text-purple-600 border-purple-300">
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Medicines & Quick Actions */}
        <div className="space-y-6">
          {/* Top Medicines */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Top Medicines Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {topMedicines.map((medicine, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{medicine.name}</div>
                      <div className="text-xs text-gray-600">{medicine.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{medicine.sold}</div>
                      <div className="text-xs text-gray-600">{formatRupiah(medicine.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-16 flex-col gap-1 bg-green-600 hover:bg-green-700">
                  <Link to="/cashier">
                    <Pill className="h-5 w-5" />
                    <span className="text-xs">Sell Medicine</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-blue-200 hover:bg-blue-50">
                  <Link to="/service-pos">
                    <Stethoscope className="h-5 w-5" />
                    <span className="text-xs">Consultation</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-purple-200 hover:bg-purple-50">
                  <Link to="/inventory">
                    <Package className="h-5 w-5" />
                    <span className="text-xs">Drug Stock</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-red-200 hover:bg-red-50">
                  <Link to="/reports">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs">Reports</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}