/* ── NotificationBell ──
   Bell icon with unread badge and dropdown list of notifications.
   Polls every 5s for new notifications from localStorage. */
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationBell() {
  const { count, open, setOpen, markRead, allNotifs } = useNotifications()

  return (
    <div className="relative">
      <button className="relative text-lg" onClick={() => setOpen(o => !o)}>
        🔔{count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">{count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-cream-alt z-50 max-h-80 overflow-y-auto" onMouseLeave={() => setOpen(false)}>
          <p className="text-xs font-medium text-dark px-4 pt-3 pb-2 border-b border-cream-alt">Notifications</p>
          {allNotifs.length === 0 ? <p className="text-xs text-muted p-4">No notifications.</p> : allNotifs.map(n => (
            <div key={n.id} className={`px-4 py-3 text-xs border-b border-cream-alt last:border-0 ${n.read ? 'opacity-50' : ''}`} onClick={() => markRead(n.id)}>
              <p className="text-dark">{n.message}</p>
              <p className="text-muted mt-0.5">{new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
