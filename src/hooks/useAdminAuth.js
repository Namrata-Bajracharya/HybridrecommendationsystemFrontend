/* ── useAdminAuth ──
   Admin authentication using backend APIs. Only signs in (admins are seeded server-side).
*/
import { useState, useEffect } from 'react'

// Deprecated: use global AuthContext (`useAuth`) instead. This file is a compatibility shim
// for parts of the codebase still importing `useAdminAuth`.

const LS_TOKEN = 'kalleenepal_admin_token'
const LS_SESSION = 'kalleenepal_admin_session'

export function useAdminAuth() {
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    const session = localStorage.getItem(LS_SESSION) || localStorage.getItem('kalleenepal_session')
    if (session) {
      try { setAdmin(JSON.parse(session)) } catch { setAdmin(null) }
    }
  }, [])

  const signin = async () => {
    return 'Use global signin page at /login'
  }

  const signout = () => {
    // Clear admin and global session tokens from client
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_SESSION)
    localStorage.removeItem('kalleenepal_token')
    localStorage.removeItem('kalleenepal_session')
    setAdmin(null)
  }

  return { admin, signin, signout }
}
