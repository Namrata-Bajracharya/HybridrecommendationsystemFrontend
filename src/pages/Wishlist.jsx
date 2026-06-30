/* ── WishlistPage ──
   Auth-gated page. If user is not signed in, shows message
   prompting sign-in. If signed in, displays wishlist items
   in a product grid or empty state. Uses requireAuth gate. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllProducts } from '../utils/products'
import ProductCard from '../components/ProductCard'

export default function WishlistPage() {
  const { user, requireAuth } = useAuth()
  const [authed, setAuthed] = useState(false)

  /* ── Gate auth on mount ── */
  useEffect(() => {
    if (requireAuth()) setAuthed(true)
    else setAuthed(false)
  }, [requireAuth])

  /* ── Not signed in: prompt ── */
  if (!authed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
        <div className="text-5xl mb-4">🤍</div>
        <h1 className="text-xl font-semibold text-dark mb-2">Sign in to see your wishlist</h1>
        <p className="text-muted text-sm">Save your favourite pieces for later.</p>
      </div>
      </div>
    )
  }

  /* ── Read wishlist from localStorage ── */
  const wishlistIds = JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]')
  const wishlistItems = getAllProducts().filter(p => wishlistIds.includes(p.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Your Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-sm mb-4">Your wishlist is empty.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlistItems.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
