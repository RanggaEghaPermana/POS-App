import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiGet, loginRequest, logoutRequest, setTenantResolver } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token') || '')
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem('user')
        try { return raw ? JSON.parse(raw) : null } catch { return null }
    })
    const [availableTenants, setAvailableTenants] = useState(() => Array.isArray(user?.tenants) ? user.tenants : [])
    const [activeTenant, setActiveTenantState] = useState(() => {
        const raw = localStorage.getItem('activeTenant')
        try { return raw ? JSON.parse(raw) : null } catch { return null }
    })

    useEffect(() => {
        if (token) localStorage.setItem('token', token); else localStorage.removeItem('token')
    }, [token])
    useEffect(() => {
        if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user')
    }, [user, activeTenant])
    useEffect(() => {
    if (activeTenant) localStorage.setItem('activeTenant', JSON.stringify(activeTenant)); else localStorage.removeItem('activeTenant')
  }, [activeTenant])

  useEffect(() => {
    setTenantResolver(() => activeTenant)
  }, [activeTenant])

    useEffect(() => {
        if (!token) {
            return
        }
        (async () => {
            try {
                const response = await apiGet('/user/tenants', token)
                const tenantList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : []
                setAvailableTenants(tenantList)

                setActiveTenantState(prev => {
                    if (tenantList.length === 0) {
                        return null
                    }
                    if (prev) {
                        const exists = tenantList.find(t => (t.id && prev.id === t.id) || (t.slug && prev.slug === t.slug))
                        if (exists) {
                            return exists
                        }
                    }
                    return tenantList[0]
                })
            } catch (err) {
                console.warn('Failed to load tenant list', err?.message)
            }
        })()
    }, [token])

    useEffect(() => {
        const tenants = Array.isArray(user?.tenants) ? user.tenants : []
        setAvailableTenants(tenants)

        if (tenants.length === 0) {
            setActiveTenantState(null)
            return
        }

        if (activeTenant) {
            const stillExists = tenants.find(t => (t.id && activeTenant.id === t.id) || (t.slug && activeTenant.slug === t.slug))
            if (stillExists) {
                if (stillExists !== activeTenant) {
                    setActiveTenantState(stillExists)
                }
                return
            }
        }

        const preferred = user?.tenant || tenants[0]
        setActiveTenantState(preferred || null)
    }, [user])

    function updateActiveTenant(tenant) {
        if (!tenant) {
            setActiveTenantState(null)
            return
        }
        setActiveTenantState(tenant)
    }

    async function login(email, password) {
        try {
            const data = await loginRequest({ email, password })
            setToken(data.token)
            setUser(data.user)
            setAvailableTenants(Array.isArray(data.user?.tenants) ? data.user.tenants : [])
            const defaultTenant = data.user?.tenant || (data.user?.tenants?.[0] ?? null)
            if (defaultTenant) {
                setActiveTenantState(defaultTenant)
            } else {
                setActiveTenantState(null)
            }
        } catch (error) {
            // If API login fails, try mock login for demo purposes
            console.warn('API login failed, trying mock login:', error.message)

      // Mock users for demo
      const mockUsers = {
        'ranggaegha25022003@gmail.com': { name: 'Super Admin', email: 'ranggaegha25022003@gmail.com', roles: ['super_admin'], tenants: [] },
        'admin@barbershop.test': { name: 'Barbershop Admin', email: 'admin@barbershop.test', roles: ['admin'], tenants: [{ id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' }], tenant: { id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' } },
        'manager@barbershop.test': { name: 'Manager User', email: 'manager@barbershop.test', roles: ['manager'], tenants: [{ id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' }], tenant: { id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' } },
        'cashier@barbershop.test': { name: 'Kasir User', email: 'cashier@barbershop.test', roles: ['cashier'], tenants: [{ id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' }], tenant: { id: 1, slug: 'barbershop-main', name: 'Barbershop', business_type: 'barbershop' } },
        'admin.restaurant-delight@demo.test': { name: 'Restaurant Admin', email: 'admin.restaurant-delight@demo.test', roles: ['admin'], tenants: [{ id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' }], tenant: { id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' } },
        'manager.restaurant-delight@demo.test': { name: 'Restaurant Manager', email: 'manager.restaurant-delight@demo.test', roles: ['manager'], tenants: [{ id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' }], tenant: { id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' } },
        'cashier.restaurant-delight@demo.test': { name: 'Restaurant Cashier', email: 'cashier.restaurant-delight@demo.test', roles: ['cashier'], tenants: [{ id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' }], tenant: { id: 2, slug: 'restaurant-delight', name: 'Restaurant Delight', business_type: 'restaurant' } }
      }

      if (mockUsers[email] && password === '123') {
        // Mock successful login
        const mockToken = 'mock-token-' + Date.now()
        setToken(mockToken)
        setUser(mockUsers[email])
        setAvailableTenants(mockUsers[email].tenants || [])
        setActiveTenantState(mockUsers[email].tenant || null)
        console.log('Mock login successful for:', email)
        return
      }

      // If mock login also fails, throw error
      throw error
    }
  }
  async function logout() {
    try { if (token) await logoutRequest(token) } catch {}
    setToken('')
    setUser(null)
    setAvailableTenants([])
    setActiveTenantState(null)
  }

  const value = useMemo(() => ({ token, user, login, logout, tenants: availableTenants, activeTenant, setActiveTenant: updateActiveTenant }), [token, user, availableTenants, activeTenant])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() { return useContext(AuthCtx) }
