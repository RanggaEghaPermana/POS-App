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
  Car, Wrench, Clock, TrendingUp, Users, Package,
  CheckCircle, AlertCircle, Timer, Settings, Truck,
  Loader2, Fuel, Gauge, Receipt, AlertTriangle
} from 'lucide-react'

export default function AutomotiveDashboard() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [todayStats, setTodayStats] = useState(null)
  const [activeServices, setActiveServices] = useState([])
  const [vehicleQueue, setVehicleQueue] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [spareParts, setSpareParts] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Mock data for demonstration
      setTodayStats({
        vehiclesServiced: 12,
        revenue: 2450000,
        completed: 8,
        inProgress: 4,
        avgServiceTime: 120,
        partsRevenue: 850000
      })

      setActiveServices([
        {
          id: 'SRV-001',
          vehicle: 'Honda Jazz',
          plate: 'B 1234 XYZ',
          service: 'Tune Up + Oli',
          mechanic: 'Budi',
          startTime: '08:30',
          estimatedTime: 90,
          progress: 65,
          status: 'progress'
        },
        {
          id: 'SRV-002',
          vehicle: 'Toyota Avanza',
          plate: 'B 5678 ABC',
          service: 'Brake Service',
          mechanic: 'Andi',
          startTime: '09:15',
          estimatedTime: 120,
          progress: 90,
          status: 'finishing'
        },
        {
          id: 'SRV-003',
          vehicle: 'Suzuki Ertiga',
          plate: 'B 9012 DEF',
          service: 'AC Service',
          mechanic: 'Candra',
          startTime: '10:00',
          estimatedTime: 60,
          progress: 30,
          status: 'progress'
        }
      ])

      setVehicleQueue([
        { id: 1, vehicle: 'Daihatsu Xenia', plate: 'B 3456 GHI', service: 'Oil Change', priority: 'normal', waitTime: 25 },
        { id: 2, vehicle: 'Mitsubishi Pajero', plate: 'B 7890 JKL', service: 'Engine Check', priority: 'urgent', waitTime: 45 },
        { id: 3, vehicle: 'Nissan Grand Livina', plate: 'B 2468 MNO', service: 'Tire Rotation', priority: 'normal', waitTime: 15 }
      ])

      setMechanics([
        { id: 1, name: 'Budi Santoso', speciality: 'Engine Expert', status: 'busy', current_job: 'SRV-001', today_jobs: 3 },
        { id: 2, name: 'Andi Wijaya', speciality: 'Brake Specialist', status: 'busy', current_job: 'SRV-002', today_jobs: 2 },
        { id: 3, name: 'Candra Pratama', speciality: 'AC Technician', status: 'busy', current_job: 'SRV-003', today_jobs: 2 },
        { id: 4, name: 'Dedi Rahman', speciality: 'General Service', status: 'available', current_job: null, today_jobs: 1 }
      ])

      setSpareParts([
        { name: 'Oli Mesin', stock: 8, minStock: 5, status: 'ok' },
        { name: 'Brake Pad', stock: 3, minStock: 5, status: 'low' },
        { name: 'Air Filter', stock: 12, minStock: 10, status: 'ok' },
        { name: 'Spark Plug', stock: 2, minStock: 8, status: 'critical' }
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

  const getServiceStatusColor = (status) => {
    switch (status) {
      case 'progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'finishing': return 'bg-green-100 text-green-800 border-green-200'
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'text-green-600'
      case 'low': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      {/* Header Automotive Style */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-blue-800 rounded-xl p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        <div className="absolute top-1/3 right-1/2 w-8 h-8 bg-white/10 rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Car className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Automotive Workshop</h1>
              <p className="text-gray-100">Sistem manajemen bengkel otomotif profesional</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                <span className="text-sm">Vehicles Today</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.vehiclesServiced}</div>
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
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Completed</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.completed}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <span className="text-sm">In Progress</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.inProgress}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <span className="text-sm">Avg Time</span>
              </div>
              <div className="text-xl font-bold mt-1">{todayStats.avgServiceTime}min</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span className="text-sm">Parts Sales</span>
              </div>
              <div className="text-lg font-bold mt-1">{formatRupiah(todayStats.partsRevenue)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Services */}
        <div className="lg:col-span-2">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Services in Progress
              </CardTitle>
              <CardDescription className="text-blue-100">
                {activeServices.length} kendaraan sedang dikerjakan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {activeServices.map((service) => (
                  <div key={service.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{service.vehicle} - {service.plate}</div>
                          <div className="text-sm text-gray-600">{service.service} • {service.mechanic}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getServiceStatusColor(service.status)}>
                          {service.status === 'progress' ? 'In Progress' : 'Finishing'}
                        </Badge>
                        <div className="text-xs text-gray-600 mt-1">Started: {service.startTime}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{service.progress}%</span>
                      </div>
                      <Progress value={service.progress} className="h-2" />
                      <div className="text-xs text-gray-600">
                        Estimated: {service.estimatedTime} minutes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Queue */}
        <div>
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Vehicle Queue
              </CardTitle>
              <CardDescription className="text-orange-100">
                {vehicleQueue.length} kendaraan menunggu
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {vehicleQueue.map((vehicle) => (
                  <div key={vehicle.id} className={`p-3 rounded-lg border ${
                    vehicle.priority === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">{vehicle.vehicle}</div>
                        <div className="text-xs text-gray-600">{vehicle.plate}</div>
                      </div>
                      {vehicle.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{vehicle.service}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Waiting time:</span>
                      <span className="font-medium">{vehicle.waitTime} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mechanics Status */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mechanic Status
            </CardTitle>
            <CardDescription className="text-green-100">
              Status tim mekanik hari ini
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {mechanics.map((mechanic) => (
                <div key={mechanic.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">
                        {mechanic.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{mechanic.name}</div>
                      <div className="text-sm text-gray-600">{mechanic.speciality}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={mechanic.status === 'available' ? 'default' : 'secondary'}>
                      {mechanic.status}
                    </Badge>
                    <div className="text-xs text-gray-600 mt-1">
                      Jobs today: {mechanic.today_jobs}
                    </div>
                    {mechanic.current_job && (
                      <div className="text-xs text-blue-600">
                        Working on: {mechanic.current_job}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spare Parts & Quick Actions */}
        <div className="space-y-6">
          {/* Spare Parts Alert */}
          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Spare Parts Alert
              </CardTitle>
              <CardDescription className="text-yellow-100">
                Stock monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {spareParts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{part.name}</div>
                      <div className="text-xs text-gray-600">Min: {part.minStock}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getStockStatusColor(part.status)}`}>
                        {part.stock}
                      </div>
                      {part.status !== 'ok' && (
                        <AlertTriangle className="h-4 w-4 text-red-500 inline" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Aksi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="h-16 flex-col gap-1 bg-blue-600 hover:bg-blue-700">
                  <Link to="/service-pos">
                    <Car className="h-5 w-5" />
                    <span className="text-xs">New Service</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-green-200 hover:bg-green-50">
                  <Link to="/cashier">
                    <Package className="h-5 w-5" />
                    <span className="text-xs">Sell Parts</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-orange-200 hover:bg-orange-50">
                  <Link to="/inventory">
                    <Wrench className="h-5 w-5" />
                    <span className="text-xs">Parts Stock</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-16 flex-col gap-1 border-purple-200 hover:bg-purple-50">
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