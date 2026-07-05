import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders } from '../../hooks/useOrders'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'

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

export default function OrdersTab() {
  const { orders: localOrders } = useOrders()
  const [backendOrders, setBackendOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const fetchOrders = () => {
    privateAgent.get(OrderAPI({}).adminAll)
      .then(r => setBackendOrders(r.data || []))
      .catch(() => {})
  }

  useEffect(() => { fetchOrders() }, [])

  const allOrders = [...backendOrders, ...localOrders]
  const seen = new Set()
  const merged = allOrders.filter(o => {
    const key = o.id || o.order_number
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const filtered = filter === 'all' ? merged : merged.filter(o => (o.status || 'Processing') === filter)
  const allStatuses = ['all', ...Object.keys(STATUS_LABELS)]
  const counts = { all: merged.length }
  Object.keys(STATUS_LABELS).forEach(s => { counts[s] = merged.filter(o => (o.status || 'Processing') === s).length })

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => setFilter(s)}>{s === 'all' ? `All (${counts.all})` : `${STATUS_LABELS[s] || s} (${counts[s] || 0})`}</button>))}
      </div>

      {filtered.length === 0 ? <p className="text-muted text-sm">No orders found.</p> : (
        <div className="space-y-3">
          {[...filtered].reverse().map(o => {
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
      )}
    </div>
  )
}
