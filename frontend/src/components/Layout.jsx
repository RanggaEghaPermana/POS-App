import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { Button } from './ui/button'
import { Sidebar, SidebarHeader, SidebarContent, SidebarNav, SidebarNavItem, SidebarNavSection } from './ui/sidebar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import {
  Menu, User, Copy, LogOut
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiGetWithFallback } from '../api'
import { getBusinessNavigation, filterNavigationByRoles, BUSINESS_TYPES } from '../utils/businessNavigation'

export default function Layout(){
  const { user, logout, token, tenants, activeTenant, setActiveTenant } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cfg, setCfg] = useState(null)
  const [businessNavigation, setBusinessNavigation] = useState(null)
  const roles = user?.roles || []
  const isSuperAdmin = roles.includes('super_admin')
  const tenantOptions = Array.isArray(tenants) ? tenants : []
  const selectedTenantValue = activeTenant ? (activeTenant.slug ?? String(activeTenant.id)) : ''

  const navItem = (to, label, isActive) => (
    <SidebarNavItem
      as={NavLink}
      to={to}
      active={isActive}
      className="block"
    >
      {label}
    </SidebarNavItem>
  )

  async function reloadConfig(){
    try{
      const c = await apiGetWithFallback('/config', token)
      setCfg(c)
      try {
        window.__APP_CONFIG__ = c
        window.__APP_CURRENCY__ = c?.currency || 'IDR'
        window.dispatchEvent(new CustomEvent('app:config-updated', { detail: c }))
      } catch {}

      // Update business navigation based on config
      updateBusinessNavigation(c)
    }catch{
      // Use default config if API fails
      const defaultConfig = {
        store: { name: null, specialty: null },
        currency: 'IDR',
        business_type: activeTenant?.business_type || 'general'
      }
      setCfg(defaultConfig)
      updateBusinessNavigation(defaultConfig)
    }
  }

  function updateBusinessNavigation(config) {
    const businessType = activeTenant?.business_type || config?.business_type || BUSINESS_TYPES.GENERAL
    const navigation = getBusinessNavigation(businessType)
    const filteredNavigation = filterNavigationByRoles(navigation, roles)
    setBusinessNavigation(filteredNavigation)
  }

  useEffect(()=>{ (async()=>{ await reloadConfig() })() },[token, activeTenant])

  // Dengarkan perubahan settings untuk update instan tanpa reload halaman
  useEffect(()=>{
    const onUpdated = () => { reloadConfig() }
    window.addEventListener('app:settings-updated', onUpdated)
    return () => window.removeEventListener('app:settings-updated', onUpdated)
  },[])

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <Sidebar className="w-72">
          <SidebarHeader>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-primary/10 text-primary">
                {businessNavigation?.icon ? (
                  <businessNavigation.icon className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {cfg?.store?.name || businessNavigation?.name || activeTenant?.name?.replace(' Utama', '') || 'ALTA POS'}
                </span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {cfg?.store?.specialty || 'ALTA POS'}
                </span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav>
              {businessNavigation && Object.entries(businessNavigation.sections).map(([sectionKey, section]) => (
                <SidebarNavSection key={sectionKey} title={section.title}>
                  {section.items.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={true}
                        className={({isActive}) => `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    )
                  })}
                </SidebarNavSection>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {cfg?.store?.name || businessNavigation?.name || activeTenant?.name?.replace(' Utama', '') || 'ALTA POS'}
              </span>
              <span className="text-xs text-muted-foreground">
                {cfg?.store?.specialty || 'ALTA POS'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
