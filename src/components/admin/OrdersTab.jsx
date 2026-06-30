/* ── OrdersTab ──
   Displays ordeRs with status filtering, advance/cancel/return
   actions. Uses the useOrdeRs hook. */
import { useState } from 'react'
import { useOrders, statusFlow, terminalStatuses } from '../../hooks/useOrders'

export default function OrdersTab() {
  const { orders, advanceStatus } = useOrders()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? ordeRs : orders.filter(o => (o.status || 'Processing') === filter)
  const allStatuses = ['all', ...statusFlow, ...terminalStatuses]
  const counts = { all: orders.length }; [...statusFlow, ...terminalStatuses].forEach(s => { counts[s] = orders.filter(o => (o.status || 'Processing') === s).length })

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {allStatuses.map(s => (
          <button key={s} className={`text-xs px-3 py-1.5 rounded-full transition ${filter === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
            onClick={() => setFilter(s)}>{s === 'all' ? `All (${counts.all})` : `${s} (${counts[s] || 0})`}</button>))}
      </div>
      {filtered.length === 0 ? <p className="text-muted text-sm">No ordeRs found.</p> : (
        <div className="space-y-3">
          {filtered.toReversed().map(o => {
            const status = o.status || 'Processing'
            return (
              <div key={o.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-xs text-muted">
                    <p className="font-medium text-dark text-sm mb-0.5">Order #{o.id}</p>
                    <p>{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${status === 'Delivered' ? 'bg-green-100 text-green-700' : status === 'Shipped' ? 'bg-blue-100 text-blue-700' : status === 'Cancelled' ? 'bg-red-100 text-red-600' : status === 'Returned' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-700'}`}>{status}</span>
                    <div className="mt-1.5 space-x-2">
                      {!terminalStatuses.includes(status) && statusFlow.indexOf(status) < statusFlow.length - 1 && (
                        <button className="text-accent hover:underline text-[11px]" onClick={() => advanceStatus(o.id)}>{statusFlow[statusFlow.indexOf(status) + 1]}</button>)}
                      {status === 'Delivered' && <button className="text-purple-400 hover:text-purple-500 text-[11px]" onClick={() => advanceStatus(o.id, 'Returned')}>Return</button>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted mb-2">
                  {o.items.map(item => <span key={item.ckey} className="bg-cream px-2 py-0.5 rounded">{item.name} {item.size ? `(${item.size})` : ''} ×{item.quantity}</span>)}
                </div>
                <div className="flex justify-between text-xs text-muted border-t border-cream-alt pt-2">
                  <div><span>{o.contact?.name || '—'} · {o.contact?.phone || '—'}</span><span className="ml-3 text-[11px] px-1.5 py-0.5 rounded bg-cream">{o.paymentMode === 'online' ? '💳 Online' : '💵 COD'}</span></div>
                  <span className="font-medium text-dark">Rs {o.total.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
