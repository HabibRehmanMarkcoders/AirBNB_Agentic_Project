import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const USERS_KEY = 'agentic_bnb_users'
const SESSION_KEY = 'agentic_bnb_session'

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession())

  const signup = ({ name, username, email, password }) => {
    const users = readUsers()
    const normalized = email.trim().toLowerCase()
    const displayName = (username || name || '').trim()

    if (!displayName) {
      throw new Error('Name is required.')
    }

    if (users.some((u) => u.email === normalized)) {
      throw new Error('An account with this email already exists.')
    }

    const nextUser = {
      id: crypto.randomUUID(),
      name: displayName,
      email: normalized,
      password,
    }

    users.push(nextUser)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    const session = { id: nextUser.id, name: nextUser.name, email: nextUser.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  const login = ({ email, password }) => {
    const users = readUsers()
    const normalized = email.trim().toLowerCase()
    const found = users.find((u) => u.email === normalized && u.password === password)

    if (!found) {
      throw new Error('Invalid email or password.')
    }

    const session = { id: found.id, name: found.name, email: found.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, signup, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
