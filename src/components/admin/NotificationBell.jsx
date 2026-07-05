import { useNavigate } from 'react-router-dom'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationBell() {
  const { count, open, setOpen, markRead, allNotifs } = useNotifications()
  const navigate = useNavigate()

  const handleClick = (n) => {
    markRead(n.id)
    if (n.product_id && (n.type === 'review_reply' || n.type === 'new_review')) {
      navigate(`/product/${n.product_id}`)
      return
    }
    if (n.order_id) {
      navigate(`/orders/${n.order_id}`)
      return
    }
    // fallback for old notifications without order_id: parse order number from message
    const m = n.message?.match(/#([\w,-]+)/)
    const orderNum = m ? m[1] : null
    if (orderNum) {
      privateAgent.get(OrderAPI({ orderNumber: orderNum }).byNumber)
        .then(r => navigate(`/orders/${r.data.id}`))
        .catch(() => {})
    }
  }

  return (
    <div className="relative">
      <button className="relative text-lg" onClick={() => setOpen(o => !o)}>
        🔔{count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-cream-alt z-50 max-h-80 overflow-y-auto" onMouseLeave={() => setOpen(false)}>
          <p className="text-xs font-medium text-dark px-4 pt-3 pb-2 border-b border-cream-alt">Notifications</p>
          {allNotifs.length === 0 ? <p className="text-xs text-muted p-4">No notifications.</p> : allNotifs.map(n => (
            <div key={n.id} className={`px-4 py-3 text-xs border-b border-cream-alt last:border-0 cursor-pointer ${n.read ? 'bg-gray-100' : 'bg-white'}`} onClick={() => handleClick(n)}>
              <p className="text-dark">{n.message}</p>
              <p className="text-muted mt-0.5">{new Date(n.date || n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
