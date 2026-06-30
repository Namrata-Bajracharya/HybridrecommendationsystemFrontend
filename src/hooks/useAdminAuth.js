/* ── useAdminAuth ──
   Manages admin authentication: signin, signup, signout,
   session persistence via localStorage. */
import { useState, useEffect } from 'react'

const LS_ADMINS = 'kalleenepal_admins'
const LS_SESSION = 'kalleenepal_admin_session'

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    const s = localStorage.getItem(LS_SESSION)
    if (s) try { setAdmin(JSON.parse(s)) } catch { localStorage.removeItem(LS_SESSION) }
  }, [])

  const signin = (email, password) => {
    const admins = JSON.parse(localStorage.getItem(LS_ADMINS) || '[]')
    const found = admins.find(a => a.email === email && a.password === password)
    if (!found) return 'Invalid admin credentials'
    localStorage.setItem(LS_SESSION, JSON.stringify({ id: found.id, name: found.name, email: found.email }))
    setAdmin({ id: found.id, name: found.name, email: found.email })
    return null
  }

  const signup = (name, email, password) => {
    const admins = JSON.parse(localStorage.getItem(LS_ADMINS) || '[]')
    if (admins.find(a => a.email === email)) return 'Admin already exists'
    const newAdmin = { id: `a${Date.now()}`, name, email, password }
    admins.push(newAdmin)
    localStorage.setItem(LS_ADMINS, JSON.stringify(admins))
    localStorage.setItem(LS_SESSION, JSON.stringify({ id: newAdmin.id, name: newAdmin.name, email: newAdmin.email }))
    setAdmin({ id: newAdmin.id, name: newAdmin.name, email: newAdmin.email })
    return null
  }

  const signout = () => { localStorage.removeItem(LS_SESSION); setAdmin(null) }

  return { admin, signin, signup, signout }
}
