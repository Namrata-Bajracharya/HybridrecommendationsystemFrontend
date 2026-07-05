import { useState, useEffect, useCallback } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { BASE_API_ROUTE, OrderAPI } from '../../routes/Routes'
import { useNavigate, Link } from 'react-router-dom'

const CUSTOMER_TABS = ['dashboard', 'orders', 'wishlist']

const STATUS_LABELS = {
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

function DashboardTab({ data }) {
  const statCards = [
    { label: "Today's Orders", value: data.today_orders, icon: '📋' },
    { label: "Today's Spend", value: `Rs ${(data.today_spend || 0).toLocaleString()}`, icon: '💰' },
    { label: 'Total Spend', value: `Rs ${(data.total_spent || 0).toLocaleString()}`, icon: '💵' },
    { label: 'Pending', value: data.pending_orders, icon: '⏳' },
    { label: 'Wishlist', value: data.wishlist_count, icon: '🤍' },
    { label: 'Products', value: data.products_count, icon: '📦' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 text-center">
            <div className="text-xl mb-1">{c.icon}</div>
            <p className="text-lg font-semibold text-dark">{c.value}</p>
            <p className="text-[11px] text-muted mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Orders by Status</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.orders_by_status || {}).map(([status, count]) => {
              const bg = status === 'delivered' ? 'bg-green-50 text-green-700'
                : status === 'cancelled' || status === 'rejected' ? 'bg-red-50 text-red-600'
                : status === 'refund_successful' ? 'bg-green-50 text-green-700'
                : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(status) ? 'bg-purple-50 text-purple-600'
                : status === 'on_delivery' ? 'bg-blue-50 text-blue-700'
                : status === 'accepted' || status === 'packed' ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-50 text-gray-600'
              return (
                <div key={status} className={`rounded-2xl p-3 text-center min-w-[70px] ${bg}`}>
                  <p className="text-lg font-semibold">{count}</p>
                  <p className="text-[10px]">{STATUS_LABELS[status] || status.replace(/_/g, ' ')}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Recent Orders</h3>
          {data.recent_orders?.length > 0 ? (
            <div className="space-y-2 text-sm">
              {data.recent_orders.map(o => (
                <div key={o.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                  <span>📦</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-dark truncate">{o.order_number}</p>
                    <p className="text-[11px] text-muted">{new Date(o.order_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-700'
                    : o.status === 'cancelled' || o.status === 'rejected' ? 'bg-red-100 text-red-600'
                    : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(o.status) ? 'bg-purple-100 text-purple-600'
                    : o.status === 'refund_successful' ? 'bg-green-100 text-green-700'
                    : o.status === 'on_delivery' ? 'bg-blue-100 text-blue-700'
                    : o.status === 'accepted' || o.status === 'packed' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{STATUS_LABELS[o.status] || o.status}</span>
                  <span className="font-medium text-dark">Rs {o.total_amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ userId }) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(() => {
    setLoading(true)
    privateAgent.get(`${BASE_API_ROUTE}/admin/orders?page_size=100&user_id=${userId}`)
      .then(({ data }) => setOrders(data?.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const statuses = ['all', ...Object.keys(STATUS_LABELS)]
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const counts = { all: orders.length }
  Object.keys(STATUS_LABELS).forEach(s => { counts[s] = orders.filter(o => o.status === s).length })

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => setFilter(s)}>
            {s === 'all' ? `All (${counts.all})` : `${STATUS_LABELS[s] || s} (${counts[s] || 0})`}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-muted text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {[...filtered].reverse().map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/orders/${o.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs text-muted">
                  <p className="font-medium text-dark text-sm mb-0.5">{o.order_number}</p>
                  <p>{new Date(o.order_date || o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-700'
                    : o.status === 'cancelled' || o.status === 'rejected' ? 'bg-red-100 text-red-600'
                    : o.status === 'refund_successful' ? 'bg-green-100 text-green-700'
                    : ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way'].includes(o.status) ? 'bg-purple-100 text-purple-600'
                    : o.status === 'on_delivery' ? 'bg-blue-100 text-blue-700'
                    : o.status === 'accepted' || o.status === 'packed' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{STATUS_LABELS[o.status] || o.status}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted border-t border-cream-alt pt-2">
                <span>{o.user_email || '—'} · <span className="text-[11px] px-1.5 py-0.5 rounded bg-cream">{(o.payment_status || 'cod') === 'success' ? '💳 Online' : '💵 COD'}</span></span>
                <span className="font-medium text-dark">Rs {(o.total_amount || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WishlistTab({ wishlistProductIds }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wishlistProductIds?.length) { setLoading(false); return }
    setLoading(true)
    Promise.all(
      wishlistProductIds.map(id =>
        privateAgent.get(`${BASE_API_ROUTE}/product/id/${id}`).then(r => r.data).catch(() => null)
      )
    ).then(results => {
      setProducts(results.filter(Boolean))
    }).finally(() => setLoading(false))
  }, [wishlistProductIds])

  if (loading) return <p className="text-muted text-sm">Loading...</p>

  if (!products.length) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🤍</div>
        <h2 className="text-lg font-semibold text-dark mb-1">Wishlist is empty</h2>
        <p className="text-muted text-sm">This customer has no items in their wishlist.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(p => {
        const img = p.images?.[0]?.document?.relative_path
          ? `${BASE_API_ROUTE.replace('/api/v1', '')}/${p.images[0].document.relative_path}`
          : null
        return (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-cream-alt">
            <div className="aspect-square bg-cream flex items-center justify-center">
              {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-3xl text-muted">📦</span>}
            </div>
            <div className="p-3">
              <p className="text-xs text-dark font-medium truncate">{p.name}</p>
              <p className="text-[11px] text-muted mt-0.5">Rs {p.selling_price || p.price || 'N/A'}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CustomerDetail({ userId }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    privateAgent.get(`${BASE_API_ROUTE}/admin/users/${userId}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="text-sm text-muted">Loading...</div>
  if (!data) return <div className="text-sm text-muted">Customer not found.</div>

  const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.email
  const initials = name.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/customers')}
        className="text-xs text-muted hover:text-dark transition mb-2 inline-block">
        &larr; Back to Customers
      </button>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-dark text-cream text-lg font-medium flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-dark">Welcome back, {name}</h2>
          <p className="text-xs text-muted">{data.email} · Joined {new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-cream-alt mb-6 overflow-x-auto">
        {CUSTOMER_TABS.map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`pb-2 text-sm capitalize transition border-b-2 shrink-0 ${tab === k ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}>
            {k}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardTab data={data} />}
      {tab === 'orders' && <OrdersTab userId={userId} />}
      {tab === 'wishlist' && <WishlistTab wishlistProductIds={data.wishlist_product_ids || []} />}
    </div>
  )
}
