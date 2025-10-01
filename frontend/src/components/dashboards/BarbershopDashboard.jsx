import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { useAuth } from '../../AuthContext'
import { apiGet } from '../../api'
import { formatRupiah, formatDateIndonesia } from '../../utils/formatters'
import {
  Scissors, Calendar, Users, Clock, Star, TrendingUp,
  CheckCircle, AlertCircle, UserCheck, Timer, Play,
  Loader2, ChevronRight, Coffee, Award
} from 'lucide-react'

export default function BarbershopDashboard() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [todayStats, setTodayStats] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers] = useState([])
  const [queue, setQueue] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Mock data for demonstration
      setTodayStats({
        customers: 24,
        revenue: 850000,
        appointments: 18,
        walkins: 6,
        avgServiceTime: 35,
        satisfaction: 4.8
      })

      setAppointments([
        { id: 1, time: '09:00', customer: 'Budi Santoso', service: 'Haircut Premium', barber: 'Agus', status: 'confirmed' },
        { id: 2, time: '09:30', customer: 'Andi Wijaya', service: 'Beard Trim', barber: 'Beni', status: 'confirmed' },
        { id: 3, time: '10:00', customer: 'Dedi Rahman', service: 'Complete Package', barber: 'Agus', status: 'pending' },
        { id: 4, time: '10:30', customer: 'Eko Prasetyo', service: 'Hair Wash', barber: 'Candra', status: 'confirmed' }
      ])

      setBarbers([
        { id: 1, name: 'Agus', skill: 'Senior', today_customers: 8, rating: 4.9, status: 'busy', next_free: '10:30' },
        { id: 2, name: 'Beni', skill: 'Expert', today_customers: 6, rating: 4.8, status: 'available', next_free: 'now' },
        { id: 3, name: 'Candra', skill: 'Junior', today_customers: 4, rating: 4.6, status: 'break', next_free: '11:00' }
      ])

      setQueue([
        { id: 1, customer: 'Walk-in Customer 1', service: 'Haircut Basic', waiting_time: 15 },
        { id: 2, customer: 'Walk-in Customer 2', service: 'Beard Trim', waiting_time: 25 }
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

  return (
    <div className="space-y-6 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen p-6">
      {/* Header dengan desain barbershop */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Scissors className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Barbershop Dashboard</h1>
              <p className="text-purple-100">Kelola salon cukur profesional Anda</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm">Customer Hari Ini</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.customers}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">Revenue</span>
              </div>
              <div className="text-2xl font-bold mt-1">{formatRupiah(todayStats.revenue)}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                <span className="text-sm">Avg Service</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.avgServiceTime}min</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <span className="text-sm">Rating</span>
              </div>
              <div className="text-2xl font-bold mt-1">{todayStats.satisfaction}/5</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Schedule */}
        <div className="lg:col-span-2">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Appointment Hari Ini
              </CardTitle>
              <CardDescription className="text-purple-100">
                {appointments.length} appointment terjadwal
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">{apt.time} - {apt.customer}</div>
                        <div className="text-sm text-gray-600">{apt.service} • Barber: {apt.barber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                        {apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barber Status */}
        <div>
          <Card className="border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Status Barber
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {barbers.map((barber) => (
                  <div key={barber.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-indigo-200 text-indigo-700">
                            {barber.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{barber.name}</div>
                          <div className="text-xs text-gray-600">{barber.skill}</div>
                        </div>
                      </div>
                      <Badge
                        variant={barber.status === 'available' ? 'default' :
                                barber.status === 'busy' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {barber.status === 'available' ? 'Available' :
                         barber.status === 'busy' ? 'Busy' : 'Break'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Customer: {barber.today_customers}</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {barber.rating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Next free: {barber.next_free}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Walk-in Queue */}
        <Card className="border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Antrian Walk-in
            </CardTitle>
            <CardDescription className="text-amber-100">
              {queue.length} customer sedang menunggu
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {queue.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Coffee className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada antrian saat ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div>
                      <div className="font-medium">{customer.customer}</div>
                      <div className="text-sm text-gray-600">{customer.service}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{customer.waiting_time}min</div>
                      <div className="text-xs text-gray-600">waiting</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="h-16 flex-col gap-1 bg-purple-600 hover:bg-purple-700">
                <Link to="/service-pos">
                  <Scissors className="h-5 w-5" />
                  <span className="text-xs">Layanan Cukur</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 flex-col gap-1 border-purple-200 hover:bg-purple-50">
                <Link to="/appointments">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Booking Baru</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 flex-col gap-1 border-indigo-200 hover:bg-indigo-50">
                <Link to="/cashier">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Kasir</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 flex-col gap-1 border-amber-200 hover:bg-amber-50">
                <Link to="/barbershop-shift">
                  <Clock className="h-5 w-5" />
                  <span className="text-xs">Kelola Shift</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}