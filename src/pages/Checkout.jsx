import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { privateAgent, publicAgent } from '../Requests/AuthRequests'
import { ShippingAPI, UserAPI, OrderAPI } from '../routes/Routes'
import { validateCoupon, applyDiscount, incrementCouponUsage } from '../utils/coupons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

function MiniMap({ lat, lng }) {
  const ref = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    const map = L.map(ref.current, { center: [lat, lng], zoom: 15, zoomControl: false, attributionControl: false })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map)
    L.marker([lat, lng]).addTo(map)
    mapRef.current = map
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [lat, lng])

  return <div ref={ref} className="w-full h-40 rounded-xl overflow-hidden" />
}

const DISTRICTS = [
  "Achham","Arghakhanchi","Baglung","Baitadi","Bajhang","Bajura","Banke","Bara","Bardiya","Bhaktapur","Bhojpur","Chitwan","Dadeldhura","Dailekh","Dang","Darchula","Dhading","Dhankuta","Dhanusha","Dolakha","Dolpa","Doti","Gorkha","Gulmi","Humla","Ilam","Jajarkot","Jhapa","Jumla","Kailali","Kalikot","Kanchanpur","Kapilvastu","Kaski","Kathmandu","Kavrepalanchok","Khotang","Lalitpur","Lamjung","Mahottari","Makwanpur","Manang","Morang","Mugu","Mustang","Myagdi","Nawalpur","Nuwakot","Okhaldhunga","Palpa","Panchthar","Parbat","Parsa","Pyuthan","Ramechhap","Rasuwa","Rautahat","Rolpa","Rukum East","Rukum West","Rupandehi","Salyan","Sankhuwasabha","Saptari","Sarlahi","Sindhuli","Sindhupalchok","Siraha","Solukhumbu","Sunsari","Surkhet","Syangja","Tanahun","Taplejung","Terhathum","Udayapur",
]

const ZONES = [
  "Bagmati","Gandaki","Karnali","Koshi","Lumbini","Madhesh","Sudurpashchim",
]

export default function CheckoutPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user, requireAuth } = useAuth()
  const { clearCart } = useCart()

  const checkoutItems = state?.items || []

  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [customAddr, setCustomAddr] = useState({ street: '', landmark: '', city: '', district: '', zone: '', state: '', postal_code: '' })
  const [useCustomAddr, setUseCustomAddr] = useState(false)
  const [settings, setSettings] = useState(null)
  const [shippingResult, setShippingResult] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [ordered, setOrdered] = useState(false)
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    if (!requireAuth()) return
    if (!checkoutItems.length) { navigate('/cart'); return }
  }, [])

  useEffect(() => {
    if (!user) return
    setContact({
      name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      phone: user.phone || '',
      email: user.email || '',
    })
  }, [user])

  useEffect(() => {
    publicAgent.get(ShippingAPI({}).getSettings).then(r => setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    privateAgent.get(UserAPI({}).getAddresses).then(r => {
      const data = r.data || []
      setAddresses(data)
      const defaultAddr = data.find(a => a.is_default) || data[0]
      if (defaultAddr) setSelectedAddressId(String(defaultAddr.id))
    }).catch(() => {})
  }, [user])

  const selectedAddr = addresses.find(a => String(a.id) === selectedAddressId)

  useEffect(() => {
    if (useCustomAddr || !selectedAddr) { setShippingResult(null); return }
    if (!selectedAddr.latitude || !selectedAddr.longitude) { setShippingResult(null); return }
    setShippingLoading(true)
    publicAgent.post(ShippingAPI({}).calculateShipping, {
      latitude: selectedAddr.latitude,
      longitude: selectedAddr.longitude,
      district: selectedAddr.district || undefined,
      zone: selectedAddr.zone || undefined,
    }).then(r => setShippingResult(r.data)).catch(() => setShippingResult(null))
    .finally(() => setShippingLoading(false))
  }, [selectedAddressId, addresses, useCustomAddr])

  const calcCustomShipping = () => {
    if (!customAddr.district || !customAddr.zone) return
    setShippingLoading(true)
    publicAgent.post(ShippingAPI({}).calculateShipping, {
      district: customAddr.district,
      zone: customAddr.zone,
    }).then(r => setShippingResult(r.data)).catch(() => setShippingResult(null))
    .finally(() => setShippingLoading(false))
  }

  const subtotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const taxRate = settings?.tax_percentage ?? 15
  const vat = Math.round(subtotal * taxRate / 100)
  const shippingCost = shippingResult?.cost ?? 0
  const discount = couponResult?.valid ? applyDiscount(couponResult.coupon, subtotal) : 0
  const finalTotal = subtotal + vat + shippingCost - discount

  const applyCoupon = () => {
    if (!couponCode.trim()) return
    const result = validateCoupon(couponCode, subtotal)
    setCouponResult(result)
    if (!result.valid) setCouponCode('')
  }

  const placeOrder = () => {
    if (!contact.name.trim() || !contact.phone.trim()) return
    setPlacing(true)

    if (couponResult?.valid) incrementCouponUsage(couponResult.coupon.code)

    const payload = {
      items: checkoutItems.map(i => ({
        product_id: i.productId || i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      total_amount: finalTotal,
      shipping_cost: shippingCost,
      tax: vat,
      discount,
      contact_name: contact.name,
      contact_phone: contact.phone,
      contact_email: contact.email,
      payment_mode: 'cod',
    }

    privateAgent.post(OrderAPI({}).direct, payload)
      .then(resp => {
        const backendOrder = resp.data
        const orders = JSON.parse(localStorage.getItem('kalleenepal_orders') || '[]')
        orders.push({
          id: backendOrder.id,
          orderNumber: backendOrder.order_number,
          date: new Date().toISOString(),
          status: backendOrder.status || 'Processing',
          paymentMode: 'cod',
          coupon: couponResult?.valid ? couponResult.coupon.code : null,
          discount,
          items: [...checkoutItems],
          total: finalTotal,
          shipping: shippingCost,
          tax: vat,
          contact: { ...contact },
        })
        localStorage.setItem('kalleenepal_orders', JSON.stringify(orders))

        const stored = localStorage.getItem('kalleenepal_products')
        if (stored) {
          const custom = JSON.parse(stored)
          const updated = custom.map(p => {
            const ordered = checkoutItems.find(i => i.productId === p.id)
            return ordered ? { ...p, stock: Math.max(0, (p.stock ?? 20) - ordered.quantity) } : p
          })
          localStorage.setItem('kalleenepal_products', JSON.stringify(updated))
        }

        const log = JSON.parse(localStorage.getItem('kalleenepal_stock_log') || '[]')
        checkoutItems.forEach(item => {
          log.push({ type: 'out', productName: item.name, quantity: item.quantity, date: new Date().toISOString() })
        })
        localStorage.setItem('kalleenepal_stock_log', JSON.stringify(log))

        clearCart()
        setOrdered(true)
      })
      .catch(() => {
        const orders = JSON.parse(localStorage.getItem('kalleenepal_orders') || '[]')
        orders.push({
          id: Date.now(),
          date: new Date().toISOString(),
          status: 'Processing',
          paymentMode: 'cod',
          coupon: couponResult?.valid ? couponResult.coupon.code : null,
          discount,
          items: [...checkoutItems],
          total: finalTotal,
          shipping: shippingCost,
          tax: vat,
          contact: { ...contact },
        })
        localStorage.setItem('kalleenepal_orders', JSON.stringify(orders))

        const stored = localStorage.getItem('kalleenepal_products')
        if (stored) {
          const custom = JSON.parse(stored)
          const updated = custom.map(p => {
            const ordered = checkoutItems.find(i => i.productId === p.id)
            return ordered ? { ...p, stock: Math.max(0, (p.stock ?? 20) - ordered.quantity) } : p
          })
          localStorage.setItem('kalleenepal_products', JSON.stringify(updated))
        }

        clearCart()
        setOrdered(true)
      })
      .finally(() => setPlacing(false))
  }

  if (ordered) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="py-20">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-semibold text-dark mb-2">Order Placed!</h1>
          <p className="text-muted text-sm mb-6">Your order is on its way.</p>
          <Link to="/products" className="inline-block px-6 py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* left — form */}
        <div className="lg:col-span-3 space-y-6">

          {/* Contact */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-dark mb-4 uppercase tracking-wider">Contact</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Full name" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              <div className="grid grid-cols-2 gap-3">
                <input type="tel" placeholder="Phone" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input type="email" placeholder="Email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-dark mb-4 uppercase tracking-wider">Delivery Address</h2>

            {addresses.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-muted mb-3">
                  <input type="checkbox" checked={useCustomAddr} onChange={e => setUseCustomAddr(e.target.checked)} className="accent-dark" />
                  Use a different address
                </label>

                {!useCustomAddr ? (
                  <div className="space-y-3">
                    <select value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                      <option value="">-- Select an address --</option>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>{a.label || 'Address'} — {a.street}, {a.city}</option>
                      ))}
                    </select>
                    {selectedAddr && (
                      <div className="bg-cream rounded-xl p-3 text-xs text-muted leading-relaxed">
                        {selectedAddr.street}{selectedAddr.landmark ? `, near ${selectedAddr.landmark}` : ''}
                        <br />{selectedAddr.city}, {selectedAddr.district || ''} {selectedAddr.zone || ''}
                        <br />{selectedAddr.state} {selectedAddr.postal_code || ''}
                        {selectedAddr.latitude && selectedAddr.longitude && (
                          <div className="mt-2">
                            <MiniMap lat={selectedAddr.latitude} lng={selectedAddr.longitude} />
                            <p className="text-[10px] text-muted mt-1">{selectedAddr.latitude.toFixed(6)}, {selectedAddr.longitude.toFixed(6)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedAddr?.latitude && !useCustomAddr && (
                      <div className="flex gap-2 mt-3">
                        <select value={customAddr.district} onChange={e => setCustomAddr(a => ({ ...a, district: e.target.value }))}
                          className="flex-1 px-2 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                          <option value="">District</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select value={customAddr.zone} onChange={e => setCustomAddr(a => ({ ...a, zone: e.target.value }))}
                          className="flex-1 px-2 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                          <option value="">Zone</option>
                          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                        <button onClick={calcCustomShipping}
                          className="px-3 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Calc</button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {(!addresses.length || useCustomAddr) && (
              <div className="space-y-3">
                <input placeholder="Street / Area" value={customAddr.street} onChange={e => setCustomAddr(a => ({ ...a, street: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input placeholder="Nearby landmark" value={customAddr.landmark} onChange={e => setCustomAddr(a => ({ ...a, landmark: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input placeholder="City" value={customAddr.city} onChange={e => setCustomAddr(a => ({ ...a, city: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={customAddr.district} onChange={e => setCustomAddr(a => ({ ...a, district: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    <option value="">District</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={customAddr.zone} onChange={e => setCustomAddr(a => ({ ...a, zone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                    <option value="">Zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="State / Province" value={customAddr.state} onChange={e => setCustomAddr(a => ({ ...a, state: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                  <input placeholder="Postal code" value={customAddr.postal_code} onChange={e => setCustomAddr(a => ({ ...a, postal_code: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
                {customAddr.district && customAddr.zone && (
                  <button onClick={calcCustomShipping}
                    className="text-xs text-accent hover:underline">Calculate shipping</button>
                )}
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wider">Coupon</h2>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter code" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-cream text-dark text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-accent/30" />
              <button onClick={applyCoupon}
                className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Apply</button>
            </div>
            {couponResult && (
              <p className={`text-xs mt-1.5 ${couponResult.valid ? 'text-green-600' : 'text-red-500'}`}>
                {couponResult.valid ? `✅ ${couponResult.coupon.code}` : `✕ ${couponResult.reason}`}
              </p>
            )}
          </div>

          <button onClick={placeOrder} disabled={placing}
            className="w-full py-3.5 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
            {placing ? 'Placing order…' : `Place Order — Rs ${finalTotal.toLocaleString()}`}
          </button>
        </div>

        {/* right — summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 sticky top-24 space-y-4">
            <h2 className="text-sm font-semibold text-dark uppercase tracking-wider">Order Summary</h2>

            <div className="space-y-3">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="w-10 h-10 bg-cream rounded-lg flex items-center justify-center text-sm shrink-0">🛍️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark truncate">{item.name}</p>
                    <p className="text-xs text-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-dark font-medium shrink-0">Rs {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            <hr className="border-cream-alt" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-dark font-medium">Rs {subtotal.toLocaleString()}</span></div>
              {shippingLoading ? (
                <div className="flex justify-between text-muted"><span>Shipping</span><span className="text-dark font-medium">Calculating…</span></div>
              ) : (
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="text-dark font-medium">{shippingResult ? `Rs ${shippingCost.toLocaleString()}` : '—'}</span>
                </div>
              )}
              <div className="flex justify-between text-muted"><span>VAT ({taxRate}%)</span><span className="text-dark font-medium">Rs {vat.toLocaleString()}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium">−Rs {discount.toLocaleString()}</span></div>
              )}
              <hr />
              <div className="flex justify-between text-dark font-semibold text-base"><span>Total</span><span>Rs {finalTotal.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
