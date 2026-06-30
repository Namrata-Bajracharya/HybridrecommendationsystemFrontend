/* ── CartContext ──
   Size-aware shopping cart. Uses a composite key `ckey = "${id}-${size}"`
   so the same product in different sizes appeaRs as separate line items.
   If a product has no sizes, ckey = "${id}-nosize". 
   Cart state is persisted to localStorage (kalleenepal_cart). */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  /* ── Hydrate from localStorage on mount ── */
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('kalleenepal_cart')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  /* ── Persist every mutation ── */
  useEffect(() => { localStorage.setItem('kalleenepal_cart', JSON.stringify(items)) }, [items])

  /* ── addToCart(product, size?) ──
       Creates a composite key. If product has sizes but none provided,
       returns false (caller should enforce selection).
       If same product+size already exists, increments quantity. */
  const addToCart = useCallback((product, size = null) => {
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0
    if (hasSizes && !size) return false

    const ckey = hasSizes ? `${product.id}-${size}` : `${product.id}-nosize`

    setItems(prev => {
      const existing = prev.find(i => i.ckey === ckey)
      if (existing) {
        return prev.map(i => i.ckey === ckey ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ckey, id: product.id, name: product.name, price: product.price, size, quantity: 1, emoji: product.emoji, category: product.category }]
    })
    return true
  }, [])

  /* ── updateQuantity / removeItem / clearCart ── */
  const updateQuantity = useCallback((ckey, delta) => {
    setItems(prev => prev.map(i => i.ckey === ckey ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0))
  }, [])

  const removeItem = useCallback((ckey) => {
    setItems(prev => prev.filter(i => i.ckey !== ckey))
  }, [])

  const clearCart = useCallback(() => { setItems([]) }, [])

  /* ── Derived values: total items, total price ── */
  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items])
  const totalPrice = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])

  return (
    <CartContext.Provider value={{ items, addToCart, updateQuantity, removeItem, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
