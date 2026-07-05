import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart()
  const navigate = useNavigate()
  const [selected, setSelected] = useState({})

  const toggleSelect = (pid, vid) => {
    const key = `${pid}-${vid || ''}`
    setSelected(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const selectedItems = items.filter(i => selected[`${i.productId}-${i.variantId || ''}`])
  const selectedTotal = selectedItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0)

  const handleBuySelected = () => {
    if (selectedItems.length === 0) return
    navigate('/checkout', { state: { items: selectedItems } })
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
          <div className="text-5xl mb-4">🛍️</div>
          <h1 className="text-xl font-semibold text-dark mb-2">Your cart is empty</h1>
          <p className="text-muted text-sm mb-6">Explore our collection and find something you love.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Browse Products</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-dark">Shopping Cart</h1>
        <p className="text-sm text-muted">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const key = `${item.productId}-${item.variantId || ''}`
          return (
            <div key={key} className="flex items-center gap-4 bg-white rounded-2xl p-4">
              <input type="checkbox" checked={!!selected[key]} onChange={() => toggleSelect(item.productId, item.variantId)}
                className="w-4 h-4 accent-dark shrink-0" />
              <div className="w-14 h-14 bg-cream rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span>🛍️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.productId}`} className="text-sm font-medium text-dark hover:text-accent transition block truncate">{item.name || 'Product'}</Link>
                <p className="text-sm text-accent font-semibold mt-0.5">Rs {item.price?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full text-sm hover:bg-cream transition" onClick={() => updateQuantity(item.productId, -1, item.variantId)}>−</button>
                <span className="text-sm w-5 text-center">{item.quantity}</span>
                <button className="w-7 h-7 rounded-full text-sm hover:bg-cream transition" onClick={() => updateQuantity(item.productId, 1, item.variantId)}>+</button>
              </div>
              <button className="text-sm text-muted hover:text-red-400 transition" onClick={() => removeItem(item.productId, item.variantId)}>✕</button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between bg-white rounded-2xl p-4">
        <div>
          <p className="text-sm text-muted">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</p>
          <p className="text-lg font-semibold text-dark">Rs {selectedTotal.toLocaleString()}</p>
        </div>
        <button onClick={handleBuySelected} disabled={selectedItems.length === 0}
          className="px-8 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
          Buy Selected
        </button>
      </div>
    </div>
  )
}
