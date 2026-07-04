import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('kalleenepal_cart')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  useEffect(() => { localStorage.setItem('kalleenepal_cart', JSON.stringify(items)) }, [items])

  const addToCart = useCallback((product, variantId, overridePrice) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id && (i.variantId || null) === (variantId || null))
      if (existing) {
        return prev.map(i =>
          i.productId === product.id && (i.variantId || null) === (variantId || null)
            ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, {
        productId: product.id,
        variantId: variantId || null,
        name: product.name,
        price: Number(overridePrice ?? product.price),
        quantity: 1,
      }]
    })
    return true
  }, [])

  const updateQuantity = useCallback((productId, delta, variantId) => {
    setItems(prev => prev.map(i =>
      i.productId === productId && (i.variantId || null) === (variantId || null)
        ? { ...i, quantity: Math.max(0, i.quantity + delta) }
        : i
    ).filter(i => i.quantity > 0))
  }, [])

  const removeItem = useCallback((productId, variantId) => {
    setItems(prev => prev.filter(i =>
      !(i.productId === productId && (i.variantId || null) === (variantId || null))
    ))
  }, [])

  const clearCart = useCallback(() => { setItems([]) }, [])

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
