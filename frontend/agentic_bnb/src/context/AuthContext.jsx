import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function authRequest(path, options = {}) {
  const { headers, ...rest } = options
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  })

  const payload = await res.json().catch(() => ({}))

  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || payload.error || 'Request failed')
  }

  return payload
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    authRequest('/auth/me')
      .then((payload) => {
        if (!cancelled) setUser(payload.data?.user || null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const signup = async ({ name, username, email, password }) => {
    const payload = await authRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: (username || name || '').trim(),
        email,
        password,
      }),
    })

    const nextUser = payload.data?.user || null
    setUser(nextUser)
    return nextUser
  }

  const login = async ({ email, password }) => {
    const payload = await authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const nextUser = payload.data?.user || null
    setUser(nextUser)
    return nextUser
  }

  const logout = async () => {
    try {
      await authRequest('/auth/logout', { method: 'POST' })
    } catch {
      // Clear local session even if the request fails.
    }
    setUser(null)
  }

  const value = useMemo(() => ({ user, loading, login, signup, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
