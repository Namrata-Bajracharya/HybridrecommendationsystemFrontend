/* ── DashboardTab ──
   Overview cards, ordeRs by status, best-selling products,
   low-stock alerts. */
import { getAllProducts } from '../../utils/products'
import { statusFlow, terminalStatuses } from '../../hooks/useOrders'

const LS_ORDERS = 'kalleenepal_orders'
const LS_USERS = 'kalleenepal_users'

export default function DashboardTab() {
  const all = getAllProducts()
  const orders = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]')
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '[]')

  const today = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today)
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0)
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const pending = orders.filter(o => !terminalStatuses.includes(o.status || 'Processing') && (o.status || 'Processing') !== 'Delivered').length
  const lowStock = all.filter(p => (p.stock ?? 20) < 5)

  const productSales = {}
  orders.forEach(o => (o.items || []).forEach(item => { productSales[item.id] = (productSales[item.id] || 0) + (item.quantity || 0) }))
  const bestSellers = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, qty]) => {
    const p = all.find(x => x.id === Number(id))
    return p ? { ...p, qty } : null
  }).filter(Boolean)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Today Orders', value: todayOrders.length, emoji: '📋' },
          { label: 'Today Revenue', value: `Rs ${todayRevenue.toLocaleString()}`, emoji: '💰' },
          { label: 'Total Revenue', value: `Rs ${totalRevenue.toLocaleString()}`, emoji: '💵' },
          { label: 'Pending', value: pending, emoji: '⏳' },
          { label: 'Products', value: all.length, emoji: '📦' },
          { label: 'Customers', value: users.length, emoji: '👥' },
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
          <h3 className="text-sm font-medium text-dark mb-3">Orders by Status</h3>
          <div className="grid grid-cols-5 gap-2">
            {[...statusFlow, ...terminalStatuses].map(s => (
              <div key={s} className={`rounded-2xl p-3 text-center ${s === 'Delivered' ? 'bg-green-50' : s === 'Cancelled' ? 'bg-red-50' : s === 'Returned' ? 'bg-purple-50' : s === 'Shipped' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                <p className="text-lg font-semibold text-dark">{orders.filter(o => (o.status || 'Processing') === s).length}</p>
                <p className="text-[10px] text-muted">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Best-Selling Products</h3>
          {bestSellers.length === 0 ? <p className="text-xs text-muted">No sales yet.</p> : (
            <div className="space-y-2 text-sm">
              {bestSellers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                  <span className="text-muted w-4 text-center text-xs">{i + 1}</span>
                  <span>{p.emoji}</span>
                  <span className="flex-1 text-dark truncate">{p.name}</span>
                  <span className="text-accent font-medium">{p.qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Low Stock Alerts</h3>
          <div className="space-y-2 text-sm">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                <span>{p.emoji}</span>
                <span className="flex-1 text-dark truncate">{p.name}</span>
                <span className={`font-medium ${(p.stock ?? 0) === 0 ? 'text-red-500' : 'text-amber-500'}`}>Stock: {p.stock ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
