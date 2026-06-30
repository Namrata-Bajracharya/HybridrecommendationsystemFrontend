/* ── Navbar ──
   Sticky top nav with: logo, desktop nav links, mobile
   hamburger menu, user avatar dropdown (signout), wishlist
   heart badge, and cart badge. Uses responsive Tailwind. */
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

export default function Navbar() {
  const { user, signout, requireAuth, setAuthModal } = useAuth()
  const { totalItems } = useCart()
  const { wishlistCount } = useWishlist()
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [dropdown, setDropdown] = useState(false)
  const isAdmin = pathname.startsWith('/admin')

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/collection', label: 'Collection' },
    { to: '/orders', label: 'Orders' },
    { to: '/wishlist', label: 'Wishlist', badge: wishlistCount },
  ]

  return (
    <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="text-xl tracking-wider text-dark font-semibold">Kallee Nepal</Link>

        {/* ── Desktop nav links ── */}
        {!isAdmin && (
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className={`relative text-sm tracking-wide transition-coloRs ${pathname === l.to ? 'text-accent font-medium' : 'text-muted hover:text-dark'}`}>
              {l.label}
              {l.badge > 0 && (
                <span className="absolute -top-2 -right-4 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{l.badge}</span>
              )}
            </Link>
          ))}
        </div>
        )}

        {/* ── Right: auth avatar / CTA + cart icon + mobile hamburger ── */}
        <div className="flex items-center gap-4">
          {/* ── User avatar or Sign In CTA ── */}
          {user ? (
            <div className="relative">
              <button className="w-8 h-8 rounded-full bg-accent text-cream text-sm font-medium flex items-center justify-center"
                onClick={() => setDropdown(d => !d)}>
                {user.name.charAt(0).toUpperCase()}
              </button>
              {dropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50"
                  onMouseLeave={() => setDropdown(false)}>
                  <p className="px-4 py-1 text-sm text-muted truncate">{user.name}</p>
                  <hr className="my-1" />
                  <button className="w-full text-left px-4 py-2 text-sm text-dark hover:bg-cream transition"
                    onClick={() => { signout(); setDropdown(false) }}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <button className="text-sm text-accent font-medium hover:underline"
              onClick={() => requireAuth()}>Sign In</button>
          )}

          {/* ── Cart icon ── */}
          <Link to="/cart" className="relative">
            <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </Link>

          {/* ── Hamburger (mobile) ── */}
          <button className="md:hidden text-dark text-2xl leading-none" onClick={() => setMenu(m => !m)}>☰</button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menu && !isAdmin && (
        <div className="md:hidden bg-cream px-4 pb-4 pt-2 space-y-2">
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenu(false)}
              className={`block text-sm py-2 ${pathname === l.to ? 'text-accent font-medium' : 'text-muted'}`}>
              {l.label} {l.badge > 0 ? `(${l.badge})` : ''}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
