import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import {
  Copy,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Store,
  Sparkles,
  Shield,
  ArrowRight,
  Users
} from 'lucide-react'

const demoAccounts = [
  {
    business: 'Super Admin (Semua Bisnis)',
    accounts: [
      { role: 'Super Admin', email: 'ranggaegha25022003@gmail.com', password: '123' },
    ],
  },
  {
    business: 'Photocopy Hub',
    accounts: [
      { role: 'Admin', email: 'admin.photocopy-hub@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.photocopy-hub@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.photocopy-hub@demo.test', password: '123' },
    ],
  },
  {
    business: 'Barbershop Utama',
    accounts: [
      { role: 'Admin', email: 'admin.barbershop-main@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.barbershop-main@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.barbershop-main@demo.test', password: '123' },
    ],
  },
  {
    business: 'Restaurant Delight',
    accounts: [
      { role: 'Admin', email: 'admin.restaurant-delight@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.restaurant-delight@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.restaurant-delight@demo.test', password: '123' },
    ],
  },
  {
    business: 'Retail Market',
    accounts: [
      { role: 'Admin', email: 'admin.retail-market@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.retail-market@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.retail-market@demo.test', password: '123' },
    ],
  },
  {
    business: 'Laundry Fresh',
    accounts: [
      { role: 'Admin', email: 'admin.laundry-fresh@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.laundry-fresh@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.laundry-fresh@demo.test', password: '123' },
    ],
  },
  {
    business: 'Automotive Garage',
    accounts: [
      { role: 'Admin', email: 'admin.automotive-garage@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.automotive-garage@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.automotive-garage@demo.test', password: '123' },
    ],
  },
  {
    business: 'Pharmacy Care',
    accounts: [
      { role: 'Admin', email: 'admin.pharmacy-care@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.pharmacy-care@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.pharmacy-care@demo.test', password: '123' },
    ],
  },
  {
    business: 'Clinic Prima',
    accounts: [
      { role: 'Admin', email: 'admin.clinic-prima@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.clinic-prima@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.clinic-prima@demo.test', password: '123' },
    ],
  },
  {
    business: 'Education Center',
    accounts: [
      { role: 'Admin', email: 'admin.education-center@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.education-center@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.education-center@demo.test', password: '123' },
    ],
  },
  {
    business: 'Consulting Pro',
    accounts: [
      { role: 'Admin', email: 'admin.consulting-pro@demo.test', password: '123' },
      { role: 'Manager', email: 'manager.consulting-pro@demo.test', password: '123' },
      { role: 'Kasir', email: 'cashier.consulting-pro@demo.test', password: '123' },
    ],
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ranggaegha25022003@gmail.com')
  const [password, setPassword] = useState('123')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleQuickFill(account) {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.18),transparent_45%)]" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <aside className="flex flex-1 flex-col justify-between px-6 py-10 lg:px-14">
          <div className="flex items-center gap-3 text-slate-100/90">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 backdrop-blur">
              <Store className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Omnichannel Retail Suite</p>
              <h1 className="text-3xl font-semibold">Foto Copy App</h1>
            </div>
          </div>

          <div className="mt-12 space-y-12">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-200">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.35em]">Grow Smarter</span>
              </div>
              <h2 className="text-4xl font-bold leading-tight text-white lg:text-5xl">
                Kendalikan semua bisnis Anda dalam satu dashboard modern.
              </h2>
              <p className="max-w-xl text-base text-slate-300/80">
                Pantau penjualan, shift, inventori, dan layanan dari berbagai jenis usaha—mulai dari barbershop, photocopy, hingga klinik—tanpa perlu berpindah sistem.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[{
                icon: <Users className="h-5 w-5 text-sky-300" />, title: 'Tim Kolaboratif', desc: 'Kelola admin, manager, dan kasir dengan kontrol granular per tenant.'
              }, {
                icon: <Shield className="h-5 w-5 text-purple-300" />, title: 'Keamanan Tenant', desc: 'Setiap bisnis terisolasi, sementara super admin dapat berpindah tenant seketika.'
              }, {
                icon: <Copy className="h-5 w-5 text-emerald-300" />, title: 'POS & Inventori', desc: 'Integrasi penjualan jasa & barang dengan laporan detail dan pencetakan instan.'
              }, {
                icon: <ArrowRight className="h-5 w-5 text-pink-300" />, title: 'Onboarding Cepat', desc: 'Gunakan akun demo per bisnis untuk mengeksplorasi fitur secara langsung.'
              }].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all hover:border-cyan-400/50 hover:bg-cyan-400/10"
                >
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    {feature.icon}
                    {feature.title}
                  </div>
                  <p className="text-sm text-slate-300/80">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-slate-400/80">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
              <span>Multi-tenant architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-purple-400" />
              <span>Realtime analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-pink-400" />
              <span>Shift & staff scheduling</span>
            </div>
          </div>
        </aside>

        <main className="flex w-full justify-center px-4 py-10 sm:px-8 lg:w-[480px] lg:px-10 lg:py-16">
          <div className="w-full max-w-[420px]">
            <Card className="border border-white/10 bg-slate-950/60 text-slate-100 shadow-2xl backdrop-blur-xl">
              <CardHeader className="space-y-5 pb-6">
                <div className="flex flex-col gap-2 text-center">
                  <p className="mx-auto hidden h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 lg:flex">
                    <Store className="h-6 w-6" />
                  </p>
                  <CardTitle className="text-3xl font-bold">Masuk ke Dashboard</CardTitle>
                  <CardDescription className="text-sm text-slate-400">
                    Gunakan akun demo untuk menjelajah fitur atau masuk menggunakan akun produksi Anda.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        className="h-12 rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:bg-black/20 focus:ring-0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        className="h-12 rounded-xl border border-white/10 bg-white/5 pl-11 pr-12 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:bg-black/20 focus:ring-0"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-slate-400 hover:bg-white/10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Butuh akun produksi? Hubungi support kami.</span>
                  </div>

                  <Button
                    type="submit"
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-purple-500 font-semibold text-white shadow-lg transition-transform hover:scale-[1.01]"
                    disabled={loading}
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-25" />
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sedang masuk...
                      </>
                    ) : (
                      <>
                        <Store className="h-5 w-5" />
                        Masuk Sekarang
                      </>
                    )}
                  </Button>
                </form>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <span className="h-px flex-1 bg-slate-800" />
                    Quick Login
                    <span className="h-px flex-1 bg-slate-800" />
                  </div>

                  <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">
                    {demoAccounts.map((section) => (
                      <div key={section.business} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{section.business}</p>
                          <span className="text-xs text-slate-400">{section.accounts.length} akun</span>
                        </div>
                        <div className="space-y-2">
                          {section.accounts.map((account) => (
                            <button
                              key={account.email}
                              type="button"
                              onClick={() => handleQuickFill(account)}
                              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-400/60 hover:text-white"
                            >
                              <div>
                                <p className="text-xs font-semibold text-white/90">{account.role}</p>
                                <p className="text-[11px] text-slate-400">{account.email}</p>
                              </div>
                              <span className="text-[11px] text-cyan-300">Isi otomatis</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-xs text-slate-500">
              © 2024 Foto Copy App — Platform manajemen multi-bisnis modern.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
