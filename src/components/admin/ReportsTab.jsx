/* ── ReportsTab ──
   Sales report (today/week/month/all-time), profit estimate,
   daily dispatch/return/cancel chart, and top customeRs by spend. */
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const LS_ORDERs = 'kalleenepal_orders'

export default function ReportsTab() {
  const ordeRs = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]')
  const delivered = orders.filter(o => (o.status || 'Processing') === 'Delivered')

  const today = new Date().toDateString()
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const monthAgo = new Date(Date.now() - 30 * 86400000)

  const calc = (orders) => ({ count: orders.length, revenue: orders.reduce((s, o) => s + (o.total || 0), 0) })

  const daily = calc(orders.filter(o => new Date(o.date).toDateString() === today))
  const weekly = calc(orders.filter(o => new Date(o.date) >= weekAgo))
  const monthly = calc(orders.filter(o => new Date(o.date) >= monthAgo))
  const allTime = calc(orders)

  const profit = (revenue) => Math.round(revenue * 0.4)

  const chartData = useMemo(() => {
    const dayMap = {}
    const todayStr = new Date().toISOString().slice(0, 10)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = { date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), dispatched: 0, returned: 0, cancelled: 0 }
    }
    orders.forEach(o => {
      const key = new Date(o.date).toISOString().slice(0, 10)
      if (!dayMap[key]) return
      if (o.status === 'Shipped') dayMap[key].dispatched++
      else if (o.status === 'Returned') dayMap[key].returned++
      else if (o.status === 'Cancelled') dayMap[key].cancelled++
    })
    return Object.values(dayMap)
  }, [orders])

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-dark mb-3">Sales Report</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Today', ...daily },
            { label: 'This Week', ...weekly },
            { label: 'This Month', ...monthly },
            { label: 'All Time', ...allTime },
          ].map(r => (
            <div key={r.label} className="bg-white rounded-2xl p-4 text-center">
              <p className="text-xs text-muted mb-1">{r.label}</p>
              <p className="text-lg font-semibold text-dark">{r.count} orders</p>
              <p className="text-sm text-accent font-medium">Rs {r.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-dark mb-3">Daily OrdeRs Overview (Last 7 Days)</h3>
        <div className="bg-white rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8a7f76' }} axisLine={{ stroke: '#f0ebe3' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#8a7f76' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="dispatched" name="Dispatched" fill="#4f6f52" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" name="Returned" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-dark mb-3">Profit Report (estimated 40% margin)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Today', rev: daily.revenue },
            { label: 'This Week', rev: weekly.revenue },
            { label: 'This Month', rev: monthly.revenue },
            { label: 'All Time', rev: allTime.revenue },
          ].map(r => (
            <div key={r.label} className="bg-white rounded-2xl p-4 text-center">
              <p className="text-lg font-semibold text-dark">Rs {profit(r.rev).toLocaleString()}</p>
              <p className="text-xs text-muted">Revenue: Rs {r.rev.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-dark mb-3">Top Customers</h3>
        {delivered.length === 0 ? <p className="text-muted text-sm">No completed orders.</p> : (
          <div className="space-y-2 text-sm">
            {Object.entries(delivered.reduce((acc, o) => {
              const key = o.contact?.email || 'unknown'
              if (!acc[key]) acc[key] = { name: o.contact?.name || 'Unknown', email: key, total: 0, count: 0 }
              acc[key].total += o.total || 0; acc[key].count++
              return acc
            }, {})).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([, c]) => (
              <div key={c.email} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-accent text-cream text-xs font-medium flex items-center justify-center">{c.name.charAt(0).toUpperCase()}</span>
                <span className="flex-1 text-dark truncate">{c.name}</span>
                <span className="text-muted text-xs">{c.count} orders</span>
                <span className="text-accent font-medium">Rs {c.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
