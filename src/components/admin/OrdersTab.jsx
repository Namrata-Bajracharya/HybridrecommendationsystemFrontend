import { useState, useEffect } from 'react'
import { useOrders, statusFlow, terminalStatuses } from '../../hooks/useOrders'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'

const ADMIN_STATUSES = ['order_received', 'packed', 'sent_for_delivery', 'delivered', 'paid']
const STATUS_LABELS = {
  pending: 'Pending', order_received: 'Order Received', packed: 'Packed',
  sent_for_delivery: 'Sent for Delivery', delivered: 'Delivered', paid: 'Paid',
  cancelled: 'Cancelled', refund_requested: 'Refund Requested', refunded: 'Refunded',
}

function CancelModal({ orderId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const reasons = ['Out of stock', 'Delivery address too far', 'Payment issue', 'Customer requested', 'Other']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-3">Cancel Order #{orderId}</h3>
        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <label key={r} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="radio" name="cancelReason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-dark" />
              {r}
            </label>
          ))}
          {reason === 'Other' && (
            <input type="text" placeholder="Enter reason" value={reason} onChange={e => setReason(e.target.value)}
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

export default function OrdersTab() {
  const { orders: localOrders, advanceStatus: localAdvance } = useOrders()
  const [backendOrders, setBackendOrders] = useState([])
  const [filter, setFilter] = useState('all')
  const [cancelOrderId, setCancelOrderId] = useState(null)

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
  const counts = { all: merged.length }; Object.keys(STATUS_LABELS).forEach(s => { counts[s] = merged.filter(o => (o.status || 'Processing') === s).length })

  const handleAccept = async (orderId) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).accept)
      fetchOrders()
    } catch { }
  }

  const handleCancel = async (orderId, reason) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).cancel, { reason, cancelled_by: 'admin' })
      setCancelOrderId(null)
      fetchOrders()
    } catch { }
  }

  const handleAdvance = async (orderId, nextStatus) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).advance, { status: nextStatus })
      fetchOrders()
    } catch { }
    localAdvance(orderId, nextStatus)
  }

  return (
    <div>
      {cancelOrderId && <CancelModal orderId={cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(reason) => handleCancel(cancelOrderId, reason)} />}

      <div className="flex gap-2 mb-6 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => setFilter(s)}>{s === 'all' ? `All (${counts.all})` : `${STATUS_LABELS[s] || s} (${counts[s] || 0})`}</button>))}
      </div>

      {filtered.length === 0 ? <p className="text-muted text-sm">No orders found.</p> : (
        <div className="space-y-3">
          {[...filtered].reverse().map(o => {
            const status = o.status || 'Processing'
            const items = o.order_items || o.items || []
            const label = STATUS_LABELS[status] || status
            return (
              <div key={o.id || o.order_number} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-muted">
                    <p className="font-medium text-dark text-sm mb-0.5">Order #{o.order_number || o.id}</p>
                    <p>{new Date(o.order_date || o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {o.cancel_reason && <p className="text-red-500 text-[11px] mt-1">Reason: {o.cancel_reason} {o.cancelled_by ? `(by ${o.cancelled_by})` : ''}</p>}
                    {o.refund_reason && <p className="text-purple-500 text-[11px] mt-1">Refund: {o.refund_reason}</p>}
                  </div>
                  <div className="text-right text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      status === 'delivered' || status === 'paid' ? 'bg-green-100 text-green-700'
                      : status === 'cancelled' || status === 'refunded' ? 'bg-red-100 text-red-600'
                      : status === 'refund_requested' ? 'bg-purple-100 text-purple-600'
                      : status === 'sent_for_delivery' ? 'bg-blue-100 text-blue-700'
                      : status === 'order_received' || status === 'packed' ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{label}</span>
                    <div className="mt-1.5 space-x-2">
                      {status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:underline text-[11px]" onClick={() => handleAccept(o.id)}>Accept</button>
                          <button className="text-red-400 hover:text-red-500 text-[11px]" onClick={() => setCancelOrderId(o.id)}>Cancel</button>
                        </>
                      )}
                      {ADMIN_STATUSES.includes(status) && ADMIN_STATUSES.indexOf(status) < ADMIN_STATUSES.length - 1 && (
                        <button className="text-accent hover:underline text-[11px]" onClick={() => handleAdvance(o.id, ADMIN_STATUSES[ADMIN_STATUSES.indexOf(status) + 1])}>
                          {STATUS_LABELS[ADMIN_STATUSES[ADMIN_STATUSES.indexOf(status) + 1]]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted mb-2">
                  {items.map(item => <span key={item.ckey || item.product_id} className="bg-cream px-2 py-0.5 rounded">{item.name || `Product #${item.product_id}`} {item.size ? `(${item.size})` : ''} ×{item.quantity}</span>)}
                </div>
                <div className="flex justify-between text-xs text-muted border-t border-cream-alt pt-2">
                  <div>
                    <span>{o.contact_name || o.contact?.name || '—'} · {o.contact_phone || o.contact?.phone || '—'}</span>
                    <span className="ml-3 text-[11px] px-1.5 py-0.5 rounded bg-cream">{(o.payment_mode || o.paymentMode) === 'online' ? '💳 Online' : '💵 COD'}</span>
                  </div>
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
