/* ── WishlistContext ──
   Auth-gated wishlist. toggleWishlist and isInWishlist check
   requireAuth before mutating or returning data.
   Persisted per user via localStorage key kalleenepal_wishlist. */
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user, requireAuth } = useAuth()
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]') }
    catch { return [] }
  })

  /* ── Persist on every change ── */
  const persist = useCallback((items) => {
    setWishlist(items)
    localStorage.setItem('kalleenepal_wishlist', JSON.stringify(items))
  }, [])

  /* ── toggleWishlist(productId, product?) ──
       Auth-gated. If user is not signed in, opens the auth modal
       and returns without mutating. If product is in list, removes;
       otherwise adds. Returns the resulting boolean (is now liked?). */
  const toggleWishlist = useCallback((productId) => {
    if (!requireAuth()) return false
    const items = JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]')
    const exists = items.includes(productId)
    if (exists) persist(items.filter(id => id !== productId))
    else persist([...items, productId])
    return !exists
  }, [requireAuth, persist])

  /* ── isInWishlist(productId) ──
       Returns false if user is not authenticated (prevents showing
       filled hearts before login). */
  const isInWishlist = useCallback((productId) => {
    if (!user) return false
    const items = JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]')
    return items.includes(productId)
  }, [user])

  const wishlistCount = useMemo(() => {
    if (!user) return 0
    return JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]').length
  }, [user, wishlist])

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
