import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../hooks/useOrders'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'
import { useSocket } from '../../context/SocketContext'

const STATUS_LABELS = {
  pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', packed: 'Packed',
  on_delivery: 'On Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled',
  refund_requested: 'Refund Requested',
  refund_out_for_pickup: 'Pickup in Progress',
  item_retrieved_from_customer: 'Item Picked Up',
  item_retrieved_by_admin: 'Item Received',
  refund_on_the_way: 'Refund on the Way',
  refund_successful: 'Refund Successful',
}

const PER_PAGE = 20

export default function OrdersTab() {
  const { orders: localOrders } = useOrders()
  const [backendOrders, setBackendOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { connected, on } = useSocket()

  const fetchOrders = useCallback(() => {
    privateAgent.get(OrderAPI({}).adminAll)
      .then(r => {
        const data = r.data
        let list = []
        if (Array.isArray(data)) {
          list = data
        } else if (data?.data && Array.isArray(data.data)) {
          list = data.data
        } else if (data?.orders && Array.isArray(data.orders)) {
          list = data.orders
        }
        list.sort((a, b) => new Date(b.order_date || b.date || 0) - new Date(a.order_date || a.date || 0))
        setBackendOrders(list)
      })
      .catch((e) => {
        console.error('OrdersTab fetch failed:', e?.response?.status, e?.message)
      })
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    if (!connected) return
    const unsub1 = on("new_order", fetchOrders)
    const unsub2 = on("order_placed", fetchOrders)
    const unsub3 = on("order_status", fetchOrders)
    return () => { unsub1(); unsub2(); unsub3() }
  }, [connected, on, fetchOrders])

  useEffect(() => {
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const allOrders = [...backendOrders, ...localOrders]
  const seen = new Set()
  const merged = allOrders.filter(o => {
    const key = o?.id || o?.order_number
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const filtered = filter === 'all' ? merged : merged.filter(o => (o.status || 'Processing') === filter)
  const allStatuses = ['all', ...Object.keys(STATUS_LABELS)]
  const counts = { all: merged.length }
  Object.keys(STATUS_LABELS).forEach(s => { counts[s] = merged.filter(o => (o.status || 'Processing') === s).length })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * PER_PAGE
  const pageItems = filtered.slice(startIdx, startIdx + PER_PAGE)

  const handleFilter = (s) => { setFilter(s); setPage(1) }

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => handleFilter(s)}>{s === 'all' ? `All (${counts.all})` : `${STATUS_LABELS[s] || s} (${counts[s] || 0})`}</button>))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs text-muted">{backendOrders.length} orders from server{!connected ? ' (socket disconnected)' : ''}</p>
        <button onClick={fetchOrders} className="text-xs text-accent hover:underline ml-auto">Refresh</button>
      </div>

      {filtered.length === 0 ? <p className="text-muted text-sm">No orders found.</p> : (<>        <div className="space-y-3">
          {pageItems.map(o => {
            const status = o.status || 'Processing'
            return (
              <div key={o.id || o.order_number}
                className="bg-white rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/orders/${o.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="text-xs text-muted">
                    <p className="font-medium text-dark text-sm mb-0.5">Order #{o.order_number || o.id}</p>
                    <p>{new Date(o.order_date || o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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
                    }`}>{STATUS_LABELS[status] || status}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted mt-3 pt-2 border-t border-cream-alt">
                  <span>{o.contact_name || o.contact?.name || '—'}</span>
                  <span className="font-medium text-dark">Rs {(o.total_amount || o.total || 0).toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-alt">
          <p className="text-xs text-muted">Showing {startIdx + 1}–{Math.min(startIdx + PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1.5">
            <button disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg text-xs bg-cream text-dark disabled:opacity-40 hover:bg-cream-alt transition">
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(safePage - 3, totalPages - 6))
              const p = start + i
              if (p > totalPages) return null
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition ${p === safePage ? 'bg-dark text-cream' : 'bg-cream text-dark hover:bg-cream-alt'}`}>
                  {p}
                </button>
              )
            })}
            <button disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg text-xs bg-cream text-dark disabled:opacity-40 hover:bg-cream-alt transition">
              Next
            </button>
          </div>
        </div>
      </>)}
    </div>
  )
}
