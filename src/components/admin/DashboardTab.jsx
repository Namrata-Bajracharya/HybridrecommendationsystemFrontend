import { useState, useEffect } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI } from '../../routes/Routes'
import { useSnackbar } from 'notistack'

export default function DashboardTab() {
  const { enqueueSnackbar } = useSnackbar()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    privateAgent.get(AdminAPI({}).getDashboard)
      .then(({ data: res }) => setData(res))
      .catch(() => enqueueSnackbar('Failed to load dashboard', { variant: 'error' }))
      .finally(() => setLoading(false))
  }, [enqueueSnackbar])

  if (loading) return <div className="text-sm text-muted">Loading...</div>
  if (!data) return <div className="text-sm text-muted">No data available.</div>

  const { sales, users, products, reviews } = data

  const statuses = [
    { label: 'Pending', value: sales.pending_orders, cls: 'bg-amber-50' },
    { label: 'Paid', value: sales.paid_orders, cls: 'bg-blue-50' },
    { label: 'Shipped', value: sales.shipped_orders, cls: 'bg-sky-50' },
    { label: 'Delivered', value: sales.delivered_orders, cls: 'bg-green-50' },
    { label: 'Cancelled', value: sales.cancelled_orders, cls: 'bg-red-50' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Orders', value: sales.total_orders, emoji: '📋' },
          { label: 'Total Revenue', value: `Rs ${(sales.total_revenue || 0).toLocaleString()}`, emoji: '💰' },
          { label: 'Revenue (30d)', value: `Rs ${(sales.revenue_last_30_days || 0).toLocaleString()}`, emoji: '📈' },
          { label: 'Pending', value: sales.pending_orders, emoji: '⏳' },
          { label: 'Products', value: products.total_products, emoji: '📦' },
          { label: 'Customers', value: users.total_customers, emoji: '👥' },
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
            {statuses.map(s => (
              <div key={s.label} className={`rounded-2xl p-3 text-center ${s.cls}`}>
                <p className="text-lg font-semibold text-dark">{s.value}</p>
                <p className="text-[10px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Reviews Overview</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl p-3 text-center">
              <p className="text-lg font-semibold text-dark">{reviews.total_reviews}</p>
              <p className="text-[10px] text-muted">Total</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-semibold text-dark">{reviews.pending_reviews}</p>
              <p className="text-[10px] text-muted">Pending</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-semibold text-dark">{reviews.approved_reviews}</p>
              <p className="text-[10px] text-muted">Approved</p>
            </div>
          </div>
          {reviews.average_rating != null && (
            <p className="text-xs text-muted mt-2 text-center">Avg rating: {reviews.average_rating} / 5</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 text-center">
          <p className="text-lg font-semibold text-dark">{users.total_users}</p>
          <p className="text-[11px] text-muted">Total Users</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center">
          <p className="text-lg font-semibold text-dark">{users.new_users_last_30_days}</p>
          <p className="text-[11px] text-muted">New Users (30d)</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center">
          <p className="text-lg font-semibold text-dark">{products.low_stock_count}</p>
          <p className="text-[11px] text-muted">Low Stock Products</p>
        </div>
      </div>
    </div>
  )
}