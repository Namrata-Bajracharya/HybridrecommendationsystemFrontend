import { useState, useEffect } from 'react'
import { useOrders, statusFlow, terminalStatuses } from '../../hooks/useOrders'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'

const ADMIN_STATUSES = ['accepted', 'packed', 'on_delivery', 'delivered']
const REFUND_ADMIN_FLOW = ['refund_requested', 'refund_out_for_pickup', 'item_retrieved_from_customer', 'item_retrieved_by_admin', 'refund_on_the_way', 'refund_successful']
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

function RejectModal({ orderId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const reasons = ['Item out of stock', 'Item Damaged', 'Delivery too far', 'Payment issue', 'Other']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-3">Reject Order #{orderId}</h3>
        <div className="space-y-2 mb-4">
          {reasons.map(r => (
            <label key={r} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="radio" name="rejectReason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-dark" />
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
          <button className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm disabled:opacity-40" disabled={!reason} onClick={() => onConfirm(reason)}>Reject Order</button>
        </div>
      </div>
    </div>
  )
}

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function RefundPaymentProofModal({ orderId, title, onClose, onConfirm }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(await readFileAsDataURL(file))
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-3">{title || 'Add Proof Image'} — Order #{orderId}</h3>
        <input type="file" accept="image/*" onChange={handleFile} className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-cream file:text-sm file:text-dark hover:file:opacity-80 mb-3" />
        {preview && <img src={preview} alt="Proof" className="w-full rounded-xl object-cover border border-dark/10 mb-3 max-h-48" />}
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl bg-cream text-dark text-sm" onClick={onClose}>Back</button>
          <button className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm disabled:opacity-40" disabled={!image} onClick={() => onConfirm(preview)}>Confirm</button>
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
  const [rejectOrderId, setRejectOrderId] = useState(null)
  const [paymentProofOrderId, setPaymentProofOrderId] = useState(null)
  const [paymentProofTitle, setPaymentProofTitle] = useState('')
  const [paymentProofCallback, setPaymentProofCallback] = useState(null)

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

  const handleReject = async (orderId, reason) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).reject, { reason })
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

  const handleRefundAccept = async (orderId) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).refundAccept)
      fetchOrders()
    } catch { }
  }

  const handleRefundItemRetrievedFromCustomer = async (orderId) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).refundItemRetrievedFromCustomer)
      fetchOrders()
    } catch { }
  }

  const handleRefundItemRetrievedByAdmin = async (orderId) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).refundItemRetrievedByAdmin)
      fetchOrders()
    } catch { }
  }

  const handleRefundInitiatePayment = async (orderId, proofImage) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).refundInitiatePayment, { proof_image: proofImage })
      setPaymentProofOrderId(null)
      fetchOrders()
    } catch { }
  }

  const handleRefundComplete = async (orderId, proofImage) => {
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).refundComplete, { proof_image: proofImage })
      setPaymentProofOrderId(null)
      fetchOrders()
    } catch { }
  }

  return (
    <div>
      {cancelOrderId && <CancelModal orderId={cancelOrderId} onClose={() => setCancelOrderId(null)} onConfirm={(reason) => handleCancel(cancelOrderId, reason)} />}
      {rejectOrderId && <RejectModal orderId={rejectOrderId} onClose={() => setRejectOrderId(null)} onConfirm={(reason) => { handleReject(rejectOrderId, reason); setRejectOrderId(null) }} />}
      {paymentProofOrderId && <RefundPaymentProofModal orderId={paymentProofOrderId} title={paymentProofTitle} onClose={() => setPaymentProofOrderId(null)} onConfirm={(img) => paymentProofCallback(img)} />}

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
            const refundIdx = REFUND_ADMIN_FLOW.indexOf(status)
            const refundProofs = (() => { try { return JSON.parse(o.refund_proof_images || '[]') } catch { return [] } })()
            return (
              <div key={o.id || o.order_number} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-muted">
                    <p className="font-medium text-dark text-sm mb-0.5">Order #{o.order_number || o.id}</p>
                    <p>{new Date(o.order_date || o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    {o.cancel_reason && <p className="text-red-500 text-[11px] mt-1">Cancel: {o.cancel_reason} {o.cancelled_by ? `(by ${o.cancelled_by})` : ''}</p>}
                    {o.reject_reason && <p className="text-red-500 text-[11px] mt-1">Rejected: {o.reject_reason}</p>}
                    {o.refund_reason && <p className="text-purple-500 text-[11px] mt-1">Refund: {o.refund_reason}</p>}
                    {o.refund_description && <p className="text-purple-500 text-[11px] mt-1">Desc: {o.refund_description}</p>}
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
                    <div className="mt-1.5 space-x-2 flex flex-wrap gap-1 justify-end">
                      {status === 'pending' && (
                        <>
                          <button className="text-green-600 hover:underline text-[11px]" onClick={() => handleAccept(o.id)}>Accept</button>
                          <button className="text-red-400 hover:text-red-500 text-[11px]" onClick={() => setRejectOrderId(o.id)}>Reject</button>
                          <button className="text-red-400 hover:text-red-500 text-[11px]" onClick={() => setCancelOrderId(o.id)}>Cancel</button>
                        </>
                      )}
                      {ADMIN_STATUSES.includes(status) && ADMIN_STATUSES.indexOf(status) < ADMIN_STATUSES.length - 1 && (
                        <button className="text-accent hover:underline text-[11px]" onClick={() => handleAdvance(o.id, ADMIN_STATUSES[ADMIN_STATUSES.indexOf(status) + 1])}>
                          {STATUS_LABELS[ADMIN_STATUSES[ADMIN_STATUSES.indexOf(status) + 1]]}
                        </button>
                      )}
                      {status === 'refund_requested' && (
                        <>
                          <button className="text-purple-600 hover:underline text-[11px]" onClick={() => handleRefundAccept(o.id)}>Accept Refund</button>
                          <button className="text-red-400 hover:text-red-500 text-[11px]" onClick={() => setCancelOrderId(o.id)}>Cancel Refund</button>
                        </>
                      )}
                      {status === 'refund_out_for_pickup' && (
                        <button className="text-purple-600 hover:underline text-[11px]" onClick={() => handleRefundItemRetrievedFromCustomer(o.id)}>Item Picked Up</button>
                      )}
                      {status === 'item_retrieved_from_customer' && (
                        <button className="text-purple-600 hover:underline text-[11px]" onClick={() => handleRefundItemRetrievedByAdmin(o.id)}>Item Received</button>
                      )}
                      {status === 'item_retrieved_by_admin' && (
                        <button className="text-purple-600 hover:underline text-[11px]" onClick={() => {
                          setPaymentProofTitle('Initiate Refund Payment — Add Screenshot')
                          setPaymentProofCallback((img) => handleRefundInitiatePayment(o.id, img))
                          setPaymentProofOrderId(o.id)
                        }}>Initiate Refund</button>
                      )}
                      {status === 'refund_on_the_way' && (
                        <button className="text-green-600 hover:underline text-[11px]" onClick={() => {
                          setPaymentProofTitle('Complete Refund — Add Final Proof')
                          setPaymentProofCallback((img) => handleRefundComplete(o.id, img))
                          setPaymentProofOrderId(o.id)
                        }}>Complete Refund</button>
                      )}
                    </div>
                  </div>
                </div>

                {refundIdx >= 0 && (
                  <div className="flex items-center gap-1 mb-3 text-[10px] text-muted flex-wrap">
                    {REFUND_ADMIN_FLOW.map((step, i) => (
                      <div key={step} className="flex items-center gap-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${
                          i <= refundIdx ? 'bg-purple-500 text-white' : 'bg-cream text-muted'
                        }`}>{i <= refundIdx ? '✓' : i}</span>
                        <span className={i <= refundIdx ? 'text-purple-600 font-medium' : ''}>{STATUS_LABELS[step]}</span>
                        {i < REFUND_ADMIN_FLOW.length - 1 && <span className="w-3 h-px bg-cream-alt" />}
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

                {o.refund_payment_proof && (
                  <div className="mb-2">
                    <p className="text-[10px] text-muted/60 uppercase tracking-wide mb-1">Payment Proof</p>
                    <img src={o.refund_payment_proof} alt="Payment Proof" className="w-24 h-24 rounded-lg object-cover border border-dark/10" />
                  </div>
                )}

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
