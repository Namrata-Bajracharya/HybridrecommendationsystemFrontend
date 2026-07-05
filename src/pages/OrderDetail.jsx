import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { privateAgent } from '../Requests/AuthRequests'
import { OrderAPI } from '../routes/Routes'
import RejectOrderModal from '../components/admin/RejectOrderModal'
import InvoiceModal from '../components/InvoiceModal'
import RefundRequestModal from '../components/RefundRequestModal'
import AdminRefundPaymentModal from '../components/admin/AdminRefundPaymentModal'

const STATUS_LABELS = {
  pending: 'Order Placed', accepted: 'Accepted', packed: 'Packed',
  on_delivery: 'Sent for Delivery', delivered: 'Delivered',
  rejected: 'Rejected', cancelled: 'Cancelled',
  refund_requested: 'Refund Requested', refund_out_for_pickup: 'Delivery Pickup Scheduled',
  item_retrieved_from_customer: 'Item Picked Up', item_retrieved_by_admin: 'Item Received by Admin',
  refund_on_the_way: 'Refund on the Way', refund_successful: 'Refund Successful',
}

const ADMIN_NEXT = { accepted: 'packed', packed: 'on_delivery', on_delivery: 'delivered' }
const REFUND_FLOW = ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way', 'refund_successful']
const REFUND_LABELS = {
  refund_requested: 'Refund Requested', refund_out_for_pickup: 'Delivery Pickup Scheduled',
  item_retrieved_from_customer: 'Item Picked Up', item_retrieved_by_admin: 'Item Received by Admin',
  refund_on_the_way: 'Refund on the Way', refund_successful: 'Refund Successful',
}

const canRequestRefund = (order) => {
  if (order.status !== 'delivered') return false
  if (!order.delivered_at) return true
  const deliveredDate = new Date(order.delivered_at)
  const now = new Date()
  const diffDays = (now - deliveredDate) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showRefundPaymentModal, setShowRefundPaymentModal] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchOrder = () => {
    if (!id) return
    setLoading(true)
    const url = isAdmin ? OrderAPI({ id }).adminById : OrderAPI({ id }).getById
    privateAgent.get(url)
      .then(r => { setOrder(r.data); setLoading(false) })
      .catch(() => { setError('Order not found'); setLoading(false) })
  }

  useEffect(() => { fetchOrder() }, [id, isAdmin])

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-muted">Loading...</div>
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-sm text-red-500 mb-4">{error}</p>
      <Link to={isAdmin ? '/admin/orders' : `/${user?.id}/dashboard/orders`} className="text-accent text-sm underline">Back to orders</Link>
    </div>
  )
  if (!order) return null

  const currentStatus = order.status || 'pending'

  const STATUS_ORDER = ['pending', 'accepted', 'packed', 'on_delivery', 'delivered']
  const TIMESTAMP_MAP = {
    pending: order.order_date || order.date,
    accepted: order.accepted_at,
    packed: order.packed_at,
    on_delivery: order.on_delivery_at,
    delivered: order.delivered_at,
  }

  const REFUND_TIMESTAMP_MAP = {
    refund_requested: order.refund_requested_at,
    refund_out_for_pickup: order.refund_out_for_pickup_at,
    item_retrieved_from_customer: order.item_retrieved_from_customer_at,
    item_retrieved_by_admin: order.item_retrieved_by_admin_at,
    refund_on_the_way: order.refund_on_the_way_at,
    refund_successful: order.refund_successful_at,
  }

  const isRefundFlow = REFUND_FLOW.includes(currentStatus)

  let timeline = []

  if (currentStatus === 'rejected') {
    timeline.push({ key: 'pending', label: 'Order Placed', time: order.order_date || order.date })
    timeline.push({ key: 'rejected', label: 'Rejected', time: order.rejected_at || order.order_date, terminal: true })
  } else if (currentStatus === 'cancelled') {
    timeline.push({ key: 'pending', label: 'Order Placed', time: order.order_date || order.date })
    timeline.push({ key: 'cancelled', label: 'Cancelled', time: order.order_date, terminal: true })
  } else if (isRefundFlow) {
    const idx = REFUND_FLOW.indexOf(currentStatus)
    for (let i = 0; i <= idx; i++) {
      timeline.push({
        key: REFUND_FLOW[i],
        label: REFUND_LABELS[REFUND_FLOW[i]],
        time: REFUND_TIMESTAMP_MAP[REFUND_FLOW[i]],
      })
    }
  } else {
    const idx = STATUS_ORDER.indexOf(currentStatus)
    for (let i = 0; i <= idx; i++) {
      timeline.push({
        key: STATUS_ORDER[i],
        label: STATUS_LABELS[STATUS_ORDER[i]],
        time: TIMESTAMP_MAP[STATUS_ORDER[i]],
      })
    }
  }

  const currentIdx = timeline.findIndex(t => t.key === currentStatus)
  const terminalStatuses = ['delivered', 'rejected', 'cancelled', 'refund_successful']
  const isTerminal = terminalStatuses.includes(currentStatus)

  const handleAdvance = async () => {
    const next = ADMIN_NEXT[currentStatus]
    if (!next) return
    try {
      await privateAgent.patch(OrderAPI({ id }).advance, { status: next })
      fetchOrder()
    } catch (e) { alert('Failed to update status') }
  }

  const handleAccept = async () => {
    try {
      await privateAgent.patch(OrderAPI({ id }).accept)
      fetchOrder()
    } catch (e) { alert('Failed to accept order') }
  }

  const handleReject = () => setShowRejectModal(true)

  const handleCancel = async () => {
    const reason = prompt('Reason for cancellation:')
    if (!reason) return
    try {
      await privateAgent.patch(OrderAPI({ id }).cancel, { reason, cancelled_by: 'admin' })
      fetchOrder()
    } catch (e) { alert('Failed to cancel order') }
  }

  const handleRefundAccept = async () => {
    try {
      await privateAgent.patch(OrderAPI({ id }).refundAccept)
      fetchOrder()
    } catch (e) { alert('Failed to accept refund') }
  }

  const handleItemRetrievedFromCustomer = async () => {
    try {
      await privateAgent.patch(OrderAPI({ id }).refundItemRetrievedFromCustomer)
      fetchOrder()
    } catch (e) { alert('Failed to mark item retrieved') }
  }

  const handleItemRetrievedByAdmin = async () => {
    try {
      await privateAgent.patch(OrderAPI({ id }).refundItemRetrievedByAdmin)
      fetchOrder()
    } catch (e) { alert('Failed to mark admin retrieval') }
  }

  const handleCompleteRefund = async () => {
    try {
      await privateAgent.patch(OrderAPI({ id }).refundComplete, { proof_image: null })
      fetchOrder()
    } catch (e) { alert('Failed to complete refund') }
  }

  const items = order.order_items || order.items || []
  const refundProofs = (() => { try { return JSON.parse(order.refund_proof_images || '[]') } catch { return [] } })()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to={isAdmin ? '/admin/orders' : `/${user?.id}/dashboard/orders`} className="text-sm text-muted hover:text-dark mb-6 inline-block">&larr; Back to Orders</Link>

      <div className="bg-white rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-dark">Order #{order.order_number || order.id}</h1>
            <p className="text-xs text-muted mt-1">
              {order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            currentStatus === 'delivered' || currentStatus === 'refund_successful' ? 'bg-green-100 text-green-700'
            : currentStatus === 'cancelled' || currentStatus === 'rejected' ? 'bg-red-100 text-red-600'
            : isRefundFlow ? 'bg-purple-100 text-purple-600'
            : currentStatus === 'on_delivery' ? 'bg-blue-100 text-blue-700'
            : currentStatus === 'accepted' || currentStatus === 'packed' ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-600'
          }`}>{STATUS_LABELS[currentStatus] || currentStatus}</span>
        </div>

        <div className="text-xs text-muted space-y-1 mb-4 pb-4 border-b border-cream-alt">
          {order.contact_name && <p><span className="text-dark/60">Customer:</span> {order.contact_name}</p>}
          {order.contact_phone && <p><span className="text-dark/60">Phone:</span> {order.contact_phone}</p>}
          {order.contact_email && <p><span className="text-dark/60">Email:</span> {order.contact_email}</p>}
          <p><span className="text-dark/60">Payment:</span> {(order.payment_mode || order.paymentMode) === 'online' ? 'Online' : 'COD'}</p>
          {order.cancel_reason && <p className="text-red-500">Cancel reason: {order.cancel_reason} {order.cancelled_by ? `(by ${order.cancelled_by})` : ''}</p>}
          {order.reject_reason && <p className="text-red-500">Reject reason: {order.reject_reason}</p>}
          {order.refund_reason && <p className="text-purple-500">Refund reason: {order.refund_reason}</p>}
          {order.refund_description && <p className="text-purple-500">Description: {order.refund_description}</p>}
        </div>

        {items.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-muted/60 uppercase tracking-wide mb-2">Items</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              {items.map(item => (
                <span key={item.product_id || item.ckey} className="bg-cream px-2 py-1 rounded inline-flex items-center gap-2">
                  <span>{item.name || `Product #${item.product_id}`}{item.variant_name || item.size ? ` — ${item.variant_name || item.size}` : ''} &times;{item.quantity} @ Rs {item.unit_price?.toLocaleString()}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {refundProofs.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-muted/60 uppercase tracking-wide mb-2">Refund Proof Images</p>
            <div className="flex flex-wrap gap-2">
              {refundProofs.map((url, i) => (
                <img key={i} src={url} alt={`Proof ${i + 1}`} className="w-20 h-20 rounded-xl object-cover border border-dark/10" />
              ))}
            </div>
          </div>
        )}

        {order.refund_payment_proof && (
          <div className="mb-4">
            <p className="text-[10px] text-muted/60 uppercase tracking-wide mb-2">Refund Payment Proof</p>
            <img src={order.refund_payment_proof} alt="Payment proof" className="w-40 h-40 rounded-xl object-cover border border-dark/10" />
          </div>
        )}

        <div className="flex justify-between text-sm font-medium text-dark pt-2 border-t border-cream-alt">
          <span>Total</span>
          <span>Rs {(order.total_amount || order.total || 0).toLocaleString()}</span>
        </div>

        {currentStatus === 'delivered' && !isAdmin && (
          <div className="space-y-3 mt-4 pt-4 border-t border-cream-alt">
            <div className="flex flex-wrap gap-2">
              {items.map(item => (
                <Link key={item.product_id || item.ckey}
                  to={`/product/${item.product_id}`}
                  className="px-4 py-1.5 rounded-xl bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition">
                  Review {item.name || `Product #${item.product_id}`}
                </Link>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInvoice(true)}
                className="px-4 py-1.5 rounded-xl bg-dark text-cream text-xs font-medium hover:bg-dark/90">View Invoice</button>
              {canRequestRefund(order) && (
                <button onClick={() => setShowRefundModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600">Request Refund</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-dark mb-6">
          {isRefundFlow ? 'Refund Timeline' : 'Order Timeline'}
        </h2>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-cream-alt" />

          {timeline.map((t, i) => {
            const isPast = i < currentIdx
            const isCurrent = i === currentIdx

            const dotColor = t.terminal ? 'bg-red-500 text-white'
              : isCurrent ? 'ring-2 ring-offset-2 ring-accent bg-accent text-white'
              : isPast ? 'bg-green-500 text-white'
              : 'bg-cream text-muted'

            const labelColor = t.terminal ? 'text-red-500'
              : isCurrent ? 'text-accent'
              : isPast ? 'text-dark'
              : 'text-muted/50'

            return (
              <div key={t.key} className="relative flex items-start gap-4 pb-8 last:pb-0">
                <div className={`relative z-10 mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium ${dotColor}`}>
                  {t.terminal ? '!' : isPast ? '✓' : isCurrent ? '●' : ''}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${labelColor}`}>
                      {t.label}
                    </p>
                    {t.time && (
                      <p className="text-[11px] text-muted">
                        {new Date(t.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {isCurrent && !t.terminal && !isTerminal && (
                    <p className="text-[11px] text-muted mt-1">Current step</p>
                  )}

                  {isCurrent && isAdmin && !t.terminal && !isTerminal && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {currentStatus === 'pending' && (
                        <>
                          <button onClick={handleAccept} className="px-4 py-1.5 rounded-xl bg-green-500 text-white text-xs font-medium hover:opacity-90">Accept</button>
                          <button onClick={handleReject} className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-medium hover:opacity-90">Reject</button>
                        </>
                      )}
                      {ADMIN_NEXT[currentStatus] && (
                        <button onClick={handleAdvance} className="px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-medium hover:opacity-90">
                          Mark as {STATUS_LABELS[ADMIN_NEXT[currentStatus]]}
                        </button>
                      )}
                      {currentStatus === 'refund_requested' && (
                        <>
                          <button onClick={handleRefundAccept} className="px-4 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600">Accept Refund</button>
                          <button onClick={handleReject} className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-medium hover:opacity-90">Reject</button>
                        </>
                      )}
                      {currentStatus === 'refund_out_for_pickup' && (
                        <button onClick={handleItemRetrievedFromCustomer} className="px-4 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600">Mark Item Picked Up</button>
                      )}
                      {currentStatus === 'item_retrieved_from_customer' && (
                        <button onClick={handleItemRetrievedByAdmin} className="px-4 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-medium hover:bg-purple-600">Mark Item Received by Admin</button>
                      )}
                      {currentStatus === 'item_retrieved_by_admin' && (
                        <button onClick={() => setShowRefundPaymentModal(true)} className="px-4 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700">Initiate Refund Payment</button>
                      )}
                      {currentStatus === 'refund_on_the_way' && (
                        <button onClick={handleCompleteRefund} className="px-4 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700">Complete Refund</button>
                      )}
                    </div>
                  )}

                  {isCurrent && !isAdmin && currentStatus === 'delivered' && (
                    <div className="mt-3">
                      <button onClick={() => setShowInvoice(true)}
                        className="px-4 py-1.5 rounded-xl bg-dark text-cream text-xs font-medium hover:bg-dark/90">View Invoice</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showRejectModal && (
        <RejectOrderModal
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setShowRejectModal(false)}
          onRejected={fetchOrder}
        />
      )}
      {showInvoice && <InvoiceModal orderId={order.id} onClose={() => setShowInvoice(false)} />}
      {showRefundModal && (
        <RefundRequestModal
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setShowRefundModal(false)}
          onSubmitted={fetchOrder}
        />
      )}
      {showRefundPaymentModal && (
        <AdminRefundPaymentModal
          orderId={order.id}
          orderNumber={order.order_number}
          onClose={() => setShowRefundPaymentModal(false)}
          onCompleted={fetchOrder}
        />
      )}
    </div>
  )
}
