import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrders, statusFlow, terminalStatuses } from '../hooks/useOrders'
import { getAllProducts } from '../utils/products'
import ProductCard from '../components/ProductCard'
import { privateAgent } from '../Requests/AuthRequests'
import { OrderAPI } from '../routes/Routes'

const CUSTOMER_TABS = ['dashboard', 'orders', 'wishlist']

const REFUND_REASONS = [
  { value: 'item_damaged', label: 'Item Damaged' },
  { value: 'size_mismatch', label: 'Size Does Not Match' },
  { value: 'description_mismatch', label: 'Does Not Match Description' },
  { value: 'item_missing', label: 'Item Missing' },
  { value: 'wrong_item', label: 'Wrong Item Delivered' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other' },
]

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function CustomerDashboardTab() {
  const { user } = useAuth()
  const { orders: localOrders } = useOrders()
  const [backendOrders, setBackendOrders] = useState([])
  const all = getAllProducts()

  useEffect(() => {
    if (!user) return
    privateAgent.get(OrderAPI({}).getAll)
      .then(r => setBackendOrders(r.data || []))
      .catch(() => {})
  }, [user])

  const local = localOrders.filter(o => o.contact?.email === user?.email)
  const backend = backendOrders.filter(o => o.contact_email === user?.email)
  const myOrders = [...backend, ...local]

  const today = new Date().toDateString()
  const todayOrders = myOrders.filter(o => new Date(o.order_date || o.date).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total_amount || o.total || 0), 0)
  const totalRevenue = myOrders.reduce((s, o) => s + (o.total_amount || o.total || 0), 0)
  const pending = myOrders.filter(o => !terminalStatuses.includes(o.status || 'Processing') && (o.status || 'Processing') !== 'Delivered').length
  const wishlistCount = JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]').length

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Today Orders', value: todayOrders.length, emoji: '📋' },
          { label: 'Today Spend', value: `Rs ${todayRevenue.toLocaleString()}`, emoji: '💰' },
          { label: 'Total Spend', value: `Rs ${totalRevenue.toLocaleString()}`, emoji: '💵' },
          { label: 'Pending', value: pending, emoji: '⏳' },
          { label: 'Wishlist', value: wishlistCount, emoji: '🤍' },
          { label: 'Products', value: all.length, emoji: '📦' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 text-center">
            <div className="text-xl mb-1">{c.emoji}</div>
            <p className="text-lg font-semibold text-dark">{c.value}</p>
            <p className="text-[11px] text-muted mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-dark mb-3">My Orders by Status</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.keys(STATUS_LABELS_CUSTOMER).filter(s => s !== 'pending').map(s => {
              const count = myOrders.filter(o => (o.status || 'Processing') === s).length
              if (count === 0) return null
              return (
                <div key={s} className={`rounded-2xl p-3 text-center ${
                  s === 'delivered' ? 'bg-green-50'
                  : s === 'cancelled' || s === 'refund_successful' ? 'bg-red-50'
                  : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(s) ? 'bg-purple-50'
                  : s === 'accepted' || s === 'packed' ? 'bg-amber-50'
                  : s === 'on_delivery' ? 'bg-blue-50'
                  : s === 'rejected' ? 'bg-red-50'
                  : 'bg-gray-50'
                }`}>
                  <p className="text-lg font-semibold text-dark">{count}</p>
                  <p className="text-[10px] text-muted">{STATUS_LABELS_CUSTOMER[s]}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Recent Orders</h3>
          {myOrders.length === 0 ? <p className="text-xs text-muted">No orders yet.</p> : (
            <div className="space-y-2 text-sm">
              {myOrders.toReversed().slice(0, 5).map(o => (
                <div key={o.id || o.order_number} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                  <span>📦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark truncate">Order #{o.order_number || o.id}</p>
                    <p className="text-[11px] text-muted">{new Date(o.order_date || o.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-700'
                    : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(o.status) ? 'bg-purple-100 text-purple-600'
                    : o.status === 'refund_successful' ? 'bg-green-100 text-green-700'
                    : o.status === 'cancelled' ? 'bg-red-100 text-red-600'
                    : o.status === 'rejected' ? 'bg-red-100 text-red-600'
                    : o.status === 'on_delivery' ? 'bg-blue-100 text-blue-700'
                    : o.status === 'accepted' || o.status === 'packed' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{STATUS_LABELS_CUSTOMER[o.status] || o.status || 'Processing'}</span>
                  <span className="text-accent font-medium">Rs {(o.total_amount || o.total || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS_CUSTOMER = {
  pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', packed: 'Packed',
  on_delivery: 'On Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_requested: 'Refund Requested',
  refund_out_for_pickup: 'Pickup in Progress',
  item_retrieved_from_customer: 'Item Picked Up',
  item_retrieved_by_admin: 'Item Received by Admin',
  refund_on_the_way: 'Refund on the Way',
  refund_successful: 'Refund Successful',
}

const CUSTOMER_CANCEL_REASONS = ['Alternative found', 'Change of mind', 'Wrong delivery address', 'Found better price', 'Other']

function CustomerCancelModal({ orderId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-3">Cancel Order #{orderId}</h3>
        <div className="space-y-2 mb-4">
          {CUSTOMER_CANCEL_REASONS.map(r => (
            <label key={r} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="radio" name="cancelReason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-dark" />
              {r}
            </label>
          ))}
          {reason === 'Other' && (
            <input type="text" placeholder="Enter reason" onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none mt-2" />
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl bg-cream text-dark text-sm" onClick={onClose}>Back</button>
          <button className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm disabled:opacity-40" disabled={!reason} onClick={() => onConfirm(reason)}>Cancel Order</button>
        </div>
      </div>
    </div>
  )
}

function RefundModal({ orderId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [proofFiles, setProofFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    setProofFiles(files)
    const urls = await Promise.all(files.map(f => readFileAsDataURL(f)))
    setPreviews(urls)
  }

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    await onConfirm(reason, description, previews)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-4">Request Refund — Order #{orderId}</h3>

        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Reason <span className="text-red-400">*</span></label>
        <div className="space-y-2 mb-4">
          {REFUND_REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="radio" name="refundReason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-dark" />
              {r.label}
            </label>
          ))}
          {reason === 'other' && (
            <input type="text" placeholder="Describe the issue" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none mt-2" />
          )}
        </div>

        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          placeholder="Tell us more about the issue..."
          className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none mb-4 resize-none" />

        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Proof Images</label>
        <div className="mb-4">
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-cream file:text-sm file:text-dark hover:file:opacity-80" />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((url, i) => (
                <img key={i} src={url} alt={`Proof ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-dark/10" />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl bg-cream text-dark text-sm" onClick={onClose}>Back</button>
          <button className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm disabled:opacity-40" disabled={!reason || submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit Refund Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomerOrdersTab() {
  const { user } = useAuth()
  const { orders: localOrders } = useOrders()
  const [backendOrders, setBackendOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [cancelOrderId, setCancelOrderId] = useState(null)
  const [refundOrderId, setRefundOrderId] = useState(null)

  const fetchMyOrders = () => {
    if (!user) return
    privateAgent.get(OrderAPI({}).getAll)
      .then(r => setBackendOrders(r.data || []))
      .catch(() => {})
  }

  useEffect(() => { fetchMyOrders() }, [user])

  const allLocal = localOrders.filter(o => o.contact?.email === user?.email)
  const allBackend = backendOrders.filter(o => o.contact_email === user?.email)
  const allOrders = [...allBackend, ...allLocal]
  const seen = new Set()
  const merged = allOrders.filter(o => {
    const key = o.id || o.order_number
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const filtered = filter === 'all' ? merged : merged.filter(o => (o.status || 'Processing') === filter)
  const allStatuses = ['all', ...Object.keys(STATUS_LABELS_CUSTOMER)]
  const counts = { all: merged.length }; Object.keys(STATUS_LABELS_CUSTOMER).forEach(s => { counts[s] = merged.filter(o => (o.status || 'Processing') === s).length })

  const handleCustomerCancel = async (orderId, reason) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).customerCancel, { reason, cancelled_by: 'customer' })
      setCancelOrderId(null)
      fetchMyOrders()
    } catch { }
  }

  const handleRefundRequest = async (orderId, reason, description, proofImages) => {
    try {
      await privateAgent.post(OrderAPI({ id: orderId }).refundRequest, { reason, description, proof_images: proofImages })
      setRefundOrderId(null)
      fetchMyOrders()
    } catch { }
  }

  const canRequestRefund = (order) => {
    if (order.status !== 'delivered') return false
    if (!order.delivered_at) return true
    const deliveredDate = new Date(order.delivered_at)
    const now = new Date()
    const diffDays = (now - deliveredDate) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }

  const REFUND_PROGRESS = ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way', 'refund_successful']

  const refundProgressIndex = (status) => REFUND_PROGRESS.indexOf(status)

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => setFilter(s)}>{s === 'all' ? `All (${counts.all})` : `${s} (${counts[s] || 0})`}</button>))}
      </div>
      {filtered.length === 0 ? <p className="text-muted text-sm">No orders found.</p> : (
        <div className="space-y-3">
          {[...filtered].reverse().map(o => {
            const status = o.status || 'Processing'
            const items = o.order_items || o.items || []
            const label = STATUS_LABELS_CUSTOMER[status] || status
            const refundIdx = refundProgressIndex(status)
            const refundProofs = (() => { try { return JSON.parse(o.refund_proof_images || '[]') } catch { return [] } })()
            return (
              <div key={o.id || o.order_number} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-muted">
                    <p className="font-medium text-dark text-sm mb-0.5">Order #{o.order_number || o.id}</p>
                    <p>{new Date(o.order_date || o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {o.cancel_reason && <p className="text-red-500 text-[11px] mt-1">Cancelled: {o.cancel_reason}</p>}
                    {o.reject_reason && <p className="text-red-500 text-[11px] mt-1">Rejected: {o.reject_reason}</p>}
                    {o.refund_reason && <p className="text-purple-500 text-[11px] mt-1">Refund Reason: {o.refund_reason}</p>}
                    {o.refund_description && <p className="text-purple-500 text-[11px] mt-1">Description: {o.refund_description}</p>}
                  </div>
                  <div className="text-right text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      status === 'delivered' ? 'bg-green-100 text-green-700'
                      : status === 'cancelled' ? 'bg-red-100 text-red-600'
                      : status === 'rejected' ? 'bg-red-100 text-red-600'
                      : status === 'refund_successful' ? 'bg-green-100 text-green-700'
                      : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(status) ? 'bg-purple-100 text-purple-600'
                      : status === 'on_delivery' ? 'bg-blue-100 text-blue-700'
                      : status === 'accepted' || status === 'packed' ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{label}</span>
                    <div className="mt-1.5 space-x-2">
                      {status === 'pending' && (
                        <button className="text-red-400 hover:text-red-500 text-[11px]" onClick={() => setCancelOrderId(o.id)}>Cancel</button>
                      )}
                      {canRequestRefund(o) && (
                        <button className="text-purple-400 hover:text-purple-500 text-[11px]" onClick={() => setRefundOrderId(o.id)}>Request Refund</button>
                      )}
                    </div>
                  </div>
                </div>

                {refundIdx >= 0 && (
                  <div className="flex items-center gap-1 mb-3 text-[10px] text-muted">
                    {REFUND_PROGRESS.map((step, i) => (
                      <div key={step} className="flex items-center gap-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${
                          i <= refundIdx ? 'bg-purple-500 text-white' : 'bg-cream text-muted'
                        }`}>✓</span>
                        <span className={i <= refundIdx ? 'text-purple-600 font-medium' : ''}>
                          {STATUS_LABELS_CUSTOMER[step]?.replace('Refund ', '')?.replace('Item ', '') || step}
                        </span>
                        {i < REFUND_PROGRESS.length - 1 && <span className="w-3 h-px bg-cream-alt" />}
                      </div>
                    ))}
                  </div>
                )}

                {refundProofs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {refundProofs.map((url, i) => (
                      <img key={i} src={url} alt={`Proof ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-dark/10" />
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted mb-2">
                  {items.map(item => <span key={item.ckey || item.product_id} className="bg-cream px-2 py-0.5 rounded">{item.name || `Product #${item.product_id}`} {item.size ? `(${item.size})` : ''} ×{item.quantity}</span>)}
                </div>
                <div className="flex justify-between text-xs text-muted border-t border-cream-alt pt-2">
                  <div><span>{o.contact_name || o.contact?.name || '—'} · {o.contact_phone || o.contact?.phone || '—'}</span><span className="ml-3 text-[11px] px-1.5 py-0.5 rounded bg-cream">{(o.payment_mode || o.paymentMode) === 'online' ? '💳 Online' : '💵 COD'}</span></div>
                  <span className="font-medium text-dark">Rs {(o.total_amount || o.total || 0).toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {cancelOrderId && <CustomerCancelModal orderId={cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(reason) => handleCustomerCancel(cancelOrderId, reason)} />}
      {refundOrderId && <RefundModal orderId={refundOrderId} onClose={() => setRefundOrderId(null)} onConfirm={(reason, description, proofImages) => handleRefundRequest(refundOrderId, reason, description, proofImages)} />}
    </div>
  )
}

function CustomerWishlistTab() {
  const wishlistIds = JSON.parse(localStorage.getItem('kalleenepal_wishlist') || '[]')
  const wishlistItems = getAllProducts().filter(p => wishlistIds.includes(p.id))

  if (wishlistItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🤍</div>
        <h2 className="text-lg font-semibold text-dark mb-1">Your wishlist is empty</h2>
        <p className="text-muted text-sm mb-4">Save your favourite pieces for later.</p>
        <Link to="/products" className="inline-block px-5 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
          Explore Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {wishlistItems.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

export default function UserDashboard() {
  const { user } = useAuth()
  const params = useParams()
  const navigate = useNavigate()
  const rawTab = params.tab || 'dashboard'
  const tab = CUSTOMER_TABS.includes(rawTab) ? rawTab : 'dashboard'

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) return null

  const tabComponents = { dashboard: CustomerDashboardTab, orders: CustomerOrdersTab, wishlist: CustomerWishlistTab }
  const TabComponent = tabComponents[tab]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">
        Welcome back, {user.first_name || user.name || 'User'}
      </h1>

      <div className="flex gap-6 border-b border-cream-alt mb-8 overflow-x-auto">
        {CUSTOMER_TABS.map(k => (
          <Link key={k} to={`/${user.id}/dashboard/${k === 'dashboard' ? '' : k}`}
            className={`pb-2 text-sm capitalize transition border-b-2 shrink-0 whitespace-nowrap ${tab === k ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}>
            {k}
          </Link>
        ))}
      </div>

      <TabComponent />
    </div>
  )
}
