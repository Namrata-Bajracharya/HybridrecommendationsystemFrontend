/* ── CartPage ──
   Cart items, coupon code input, checkout form (name/phone/address),
   payment method, order summary with discount, place order
   (auth-gated, saves to localStorage, creates notification). */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useRecommendations } from '../context/RecommendationContext'
import { validateCoupon, applyDiscount, incrementCouponUsage } from '../utils/coupons'
import ProductCard from '../components/ProductCard'

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart()
  const { user, requireAuth } = useAuth()
  const { cartCompleteLook } = useRecommendations()
  const [ordered, setOrdered] = useState(false)
  const [contact, setContact] = useState({ name: user?.name || '', phone: '', address: '' })
  const [paymentMode, setPaymentMode] = useState('cod')
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState(null)

  const shipping = totalPrice > 5000 ? 0 : 199
  const gst = Math.round(totalPrice * 0.12)
  const discount = couponResult?.valid ? applyDiscount(couponResult.coupon, totalPrice) : 0
  const finalTotal = totalPrice + gst + shipping - discount

  const applyCoupon = () => {
    if (!couponCode.trim()) return
    const result = validateCoupon(couponCode, totalPrice)
    setCouponResult(result)
    if (!result.valid) setCouponCode('')
  }

  const placeOrder = () => {
    if (!requireAuth()) return
    if (!contact.name.trim() || !contact.phone.trim() || !contact.address.trim()) return

    if (couponResult?.valid) incrementCouponUsage(couponResult.coupon.code)

    const ordeRs = JSON.parse(localStorage.getItem('kalleenepal_orders') || '[]')
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      status: 'Processing',
      paymentMode,
      coupon: couponResult?.valid ? couponResult.coupon.code : null,
      discount,
      items: [...items],
      total: finalTotal,
      contact: { ...contact, email: user?.email || '' },
    }
    orders.push(order)
    localStorage.setItem('kalleenepal_orders', JSON.stringify(orders))

    /* ── Create notification for admin ── */
    const notifs = JSON.parse(localStorage.getItem('kalleenepal_notifications') || '[]')
    notifs.push({ id: Date.now(), message: `New order #${order.id} from ${contact.name} — Rs ${finalTotal.toLocaleString()}`, date: new Date().toISOString(), read: false })
    localStorage.setItem('kalleenepal_notifications', JSON.stringify(notifs))

    /* ── Decrement stock for each item ── */
    const stored = localStorage.getItem('kalleenepal_products')
    if (stored) {
      const custom = JSON.parse(stored)
      const updated = custom.map(p => {
        const ordered = items.find(i => i.id === p.id)
        return ordered ? { ...p, stock: Math.max(0, (p.stock ?? 20) - ordered.quantity) } : p
      })
      localStorage.setItem('kalleenepal_products', JSON.stringify(updated))
    }

    /* ── Log stock movements ── */
    const log = JSON.parse(localStorage.getItem('kalleenepal_stock_log') || '[]')
    items.forEach(item => {
      log.push({ type: 'out', productName: item.name, quantity: item.quantity, date: new Date().toISOString() })
    })
    localStorage.setItem('kalleenepal_stock_log', JSON.stringify(log))

    clearCart()
    setOrdered(true)
  }

  if (ordered) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold text-dark mb-2">Order Placed!</h1>
          <p className="text-muted text-sm mb-6">Your ethnic wear is on its way.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Continue Shopping</Link>
        </div>
      </div>
    )
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.ckey} className="flex items-center gap-4 bg-white rounded-2xl p-4">
              <div className="w-16 h-16 bg-cream rounded-xl flex items-center justify-center text-2xl shrink-0">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="text-sm font-medium text-dark hover:text-accent transition block truncate">{item.name}</Link>
                <p className="text-sm text-accent font-semibold mt-0.5">Rs {item.price.toLocaleString()}</p>
                {item.size && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted uppercase mt-1 inline-block">Size: {item.size}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full text-sm hover:bg-cream transition" onClick={() => updateQuantity(item.ckey, -1)}>−</button>
                <span className="text-sm w-5 text-center">{item.quantity}</span>
                <button className="w-7 h-7 rounded-full text-sm hover:bg-cream transition" onClick={() => updateQuantity(item.ckey, 1)}>+</button>
              </div>
              <button className="text-sm text-muted hover:text-red-400 transition" onClick={() => removeItem(item.ckey)}>✕</button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 sticky top-24 space-y-5">

            {/* ── Contact details ── */}
            <div>
              <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Contact Details</h2>
              <div className="space-y-2">
                <input type="text" placeholder="Full name" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input type="tel" placeholder="Phone number" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <textarea placeholder="Delivery address" value={contact.address} rows={2} onChange={e => setContact(c => ({ ...c, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
              </div>
            </div>

            {/* ── Coupon code ── */}
            <div>
              <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Coupon Code</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Enter code" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-cream text-dark text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <button className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition" onClick={applyCoupon}>Apply</button>
              </div>
              {couponResult && (
                <p className={`text-xs mt-1.5 ${couponResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                  {couponResult.valid ? `✅ ${couponResult.coupon.code}: ${couponResult.coupon.type === 'percent' ? `${couponResult.coupon.value}% off` : `Rs ${couponResult.coupon.value} off`}` : `✕ ${couponResult.reason}`}
                </p>
              )}
            </div>

            {/* ── Payment method ── */}
            <div>
              <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Payment</h2>
              <div className="flex gap-3">
                {['cod','online'].map(pm => (
                  <label key={pm} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition ${paymentMode === pm ? 'bg-dark text-cream' : 'bg-cream text-muted hover:text-dark'}`}>
                    <input type="radio" name="payment" value={pm} checked={paymentMode === pm} onChange={() => setPaymentMode(pm)} className="sr-only" />
                    {pm === 'cod' ? '💵 COD' : '💳 Online'}
                  </label>
                ))}
              </div>
            </div>

            {/* ── Order summary ── */}
            <div>
              <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-dark font-medium">Rs {totalPrice.toLocaleString()}</span></div>
                <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-dark font-medium">{shipping === 0 ? 'Free' : `Rs ${shipping}`}</span></div>
                <div className="flex justify-between text-muted"><span>GST (12%)</span><span className="text-dark font-medium">Rs {gst.toLocaleString()}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium">−Rs {discount.toLocaleString()}</span></div>
                )}
                <hr />
                <div className="flex justify-between text-dark font-semibold"><span>Total</span><span>Rs {finalTotal.toLocaleString()}</span></div>
              </div>
            </div>

            <button className="w-full py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition" onClick={placeOrder}>Place Order</button>
          </div>
        </div>
      </div>

      {cartCompleteLook.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-dark mb-6">Complete Your Look</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cartCompleteLook.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
