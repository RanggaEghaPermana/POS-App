const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

let tenantResolver = () => null

export function setTenantResolver(resolver) {
  tenantResolver = typeof resolver === 'function' ? resolver : () => null
}

function tenantHeaders(path = '') {
  // Skip tenant headers for most setup endpoints except those that are tenant-aware
  if (path.includes('/setup/') && !path.includes('/setup/config') && !path.includes('/setup/services') && !path.includes('/setup/service-categories')) {
    return {}
  }

  const tenant = tenantResolver ? tenantResolver() : null
  if (!tenant) return {}
  const headers = {}
  if (tenant.slug) headers['X-Tenant-Slug'] = tenant.slug
  if (tenant.id) headers['X-Tenant-Id'] = tenant.id

  // Debug logging for tenant headers
  if (path.includes('/setup/config') && tenant.slug) {
    console.log('Sending tenant header for config:', tenant.slug)
  }

  return headers
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...tenantHeaders(path),
      ...authHeaders(token)
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `GET ${path} failed`)
  return data
}

export async function apiPost(path, body, token) {
  const fullUrl = `${API_BASE}${path}`
  console.log('apiPost URL:', fullUrl)
  console.log('API_BASE:', API_BASE)

  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...tenantHeaders(path),
      ...authHeaders(token)
    },
    body: JSON.stringify(body || {})
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `POST ${path} failed`)
  return data
}

export async function apiPatch(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...tenantHeaders(path),
      ...authHeaders(token)
    },
    body: JSON.stringify(body || {})
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `PATCH ${path} failed`)
  return data
}

export async function apiPut(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...tenantHeaders(path),
      ...authHeaders(token)
    },
    body: JSON.stringify(body || {})
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `PUT ${path} failed`)
  return data
}

export async function apiDelete(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...tenantHeaders(path),
      ...authHeaders(token)
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `DELETE ${path} failed`)
  return data
}

export async function loginRequest({ email, password, device_name = 'react-web' }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password, device_name })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Login gagal')
  return data
}

export async function logoutRequest(token) {
  return apiPost('/auth/logout', {}, token)
}

// Fallback API calls with automatic retry on setup endpoints
export async function apiGetWithFallback(path, token) {
  try {
    // For config endpoint, try setup first
    if (path === '/config') {
      return await apiGet('/setup/config', token)
    }
    return await apiGet(path, token)
  } catch {
    // Try setup endpoint as fallback
    if (path.startsWith('/')) {
      const setupPath = `/setup${path}`
      return await apiGet(setupPath, token)
    }
    throw new Error(`Failed to fetch ${path}`)
  }
}
