/* ── AuthContext ──
   Provides signup, signin, signout, and requireAuth across the app.
   Credentials are stored in localStorage (kalleenepal_users, kalleenepal_session).
   ⚠️ Plain-text password — for demo only; in production use bcrypt/hash. */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authModal, setAuthModal] = useState({ open: false, mode: 'signin' })

  /* ── On mount: hydrate session from localStorage ── */
  useEffect(() => {
    const stored = localStorage.getItem('kalleenepal_session')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('kalleenepal_session') }
    }
  }, [])

  /* ── signup: add to user registry, log in automatically ── */
  const signup = useCallback((name, email, password) => {
    const useRs = JSON.parse(localStorage.getItem('kalleenepal_users') || '[]')
    if (users.find(u => u.email === email)) return { ok: false, error: 'Email already registered' }
    const newUser = { id: `u${Date.now()}`, name, email, password }
    users.push(newUser)
    localStorage.setItem('kalleenepal_users', JSON.stringify(users))
    localStorage.setItem('kalleenepal_session', JSON.stringify({ id: newUser.id, name: newUser.name, email: newUser.email }))
    setUser({ id: newUser.id, name: newUser.name, email: newUser.email })
    return { ok: true }
  }, [])

  /* ── signin: verify credentials against registry ── */
  const signin = useCallback((email, password) => {
    const useRs = JSON.parse(localStorage.getItem('kalleenepal_users') || '[]')
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) return { ok: false, error: 'Invalid email or password' }
    localStorage.setItem('kalleenepal_session', JSON.stringify({ id: found.id, name: found.name, email: found.email }))
    setUser({ id: found.id, name: found.name, email: found.email })
    return { ok: true }
  }, [])

  /* ── signout: clear session, reset user state ── */
  const signout = useCallback(() => {
    localStorage.removeItem('kalleenepal_session')
    setUser(null)
  }, [])

  /* ── requireAuth: open modal in requested mode ──
       If user is already signed in, returns true. Otherwise
       opens the auth modal and returns false. This lets callers
       conditionally gate features behind login. */
  const requireAuth = useCallback((mode = 'signin') => {
    if (user) return true
    setAuthModal({ open: true, mode })
    return false
  }, [user])

  return (
    <AuthContext.Provider value={{ user, signup, signin, signout, requireAuth, authModal, setAuthModal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
