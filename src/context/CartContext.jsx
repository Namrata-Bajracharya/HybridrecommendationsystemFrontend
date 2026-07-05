import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { getAllProducts } from '../utils/products'
import { HOST_URL } from '../routes/Routes'

const CartContext = createContext(null)

function productImageUrl(product) {
  const img = product.images?.[0]?.document
  return img?.relative_path ? `${HOST_URL}/${img.relative_path}`.replace(/\\/g, '/') : null
}

function enrichCartItems(cart) {
  const products = getAllProducts()
  const lookup = {}
  products.forEach(p => { lookup[p.id] = p })
  return cart.map(item => {
    if (item.name && item.price && item.image) return item
    const p = lookup[String(item.productId)] || lookup[item.productId] || lookup[item.id]
    if (!p) return { ...item, name: item.name || 'Product', price: item.price ?? 0, image: null }
    return {
      ...item,
      name: item.name || p.name,
      price: item.price ?? Number(p.price),
      variantId: item.variantId ?? null,
      image: item.image || productImageUrl(p) || null,
    }
  })
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('kalleenepal_cart')
      const cart = stored ? JSON.parse(stored) : []
      return enrichCartItems(cart)
    } catch { return [] }
  })

  useEffect(() => { localStorage.setItem('kalleenepal_cart', JSON.stringify(items)) }, [items])

  const addToCart = useCallback((product, variantId, overridePrice, variantName) => {
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
        variantName: variantName || null,
        name: product.name,
        price: Number(overridePrice ?? product.price),
        image: productImageUrl(product),
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
