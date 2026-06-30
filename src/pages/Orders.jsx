/* ── OrdersPage ──
   Displays past ordeRs from localStorage (kalleenepal_orders).
   Auth-gated — if not signed in, prompts sign-in. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllProducts } from '../utils/products'

export default function OrdersPage() {
  const { user, requireAuth } = useAuth()
  const [authed, setAuthed] = useState(false)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (requireAuth()) {
      setAuthed(true)
      const stored = JSON.parse(localStorage.getItem('kalleenepal_orders') || '[]')
      setOrders(stored)
    }
  }, [requireAuth])

  if (!authed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="text-xl font-semibold text-dark mb-2">Sign in to see your orders</h1>
          <p className="text-muted text-sm">View your past purchases here.</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
          <div className="text-5xl mb-4">📦</div>
          <h1 className="text-xl font-semibold text-dark mb-2">No ordeRs yet</h1>
          <p className="text-muted text-sm mb-6">Your order history will appear here.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Your Orders</h1>

      <div className="space-y-4">
        {orders.toReversed().map(order => (
          <div key={order.id} className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3 text-xs text-muted">
              <span>{new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="font-medium text-dark">Rs {order.total.toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {order.items.map(item => {
                const p = getAllProducts().find(pr => pr.id === item.id)
                return (
                  <Link key={item.ckey} to={`/product/${item.id}`}
                    className="flex items-center gap-2 bg-cream rounded-xl px-3 py-2 text-sm hover:bg-cream-alt transition">
                    <span>{p?.emoji || '○'}</span>
                    <span className="text-dark truncate max-w-[160px]">{item.name}</span>
                    {item.size && <span className="text-[10px] text-muted uppercase">({item.size})</span>}
                    <span className="text-muted">×{item.quantity}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
