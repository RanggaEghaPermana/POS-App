import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiPost } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { UserPlus, Save, ArrowLeft } from 'lucide-react'

export default function UserNew(){
  const { token, user, activeTenant } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const roleOptions = useMemo(() => {
    const roles = user?.roles || []
    if (roles.includes('super_admin')) return ['admin', 'manager', 'cashier']
    if (roles.includes('admin')) return ['admin', 'manager', 'cashier']
    if (roles.includes('manager')) return ['cashier']
    return ['cashier']
  }, [user])
  const [role, setRole] = useState(roleOptions[0] ?? 'cashier')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roleOptions.includes(role)) {
      setRole(roleOptions[0] ?? 'cashier')
    }
  }, [roleOptions, role])

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true)
    try {
      await apiPost('/admin/users', { name, email, password, role }, token)
      alert('User berhasil dibuat')
      navigate('/users')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <UserPlus className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Tambah User Baru</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/users" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Buat User</CardTitle>
          <CardDescription>
            {activeTenant ? `User akan ditambahkan ke bisnis ${activeTenant.name}.` : 'Isi data user dan pilih role.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" value={role} onChange={e=>setRole(e.target.value)} className="w-full h-10 rounded-md border border-gray-200 px-3 text-sm">
                {roleOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'cashier' ? 'Kasir' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Simpan User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
