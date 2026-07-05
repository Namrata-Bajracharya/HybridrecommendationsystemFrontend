import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI } from '../../routes/Routes'
import InvoiceModal from '../InvoiceModal'

const TABS = ['Orders', 'P&L', 'Product Profit']

export default function ReportsTab() {
  const [activeTab, setActiveTab] = useState('P&L')
  const [period, setPeriod] = useState('all_time')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-cream rounded-xl p-1">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${activeTab === tab ? 'bg-white text-dark shadow-sm' : 'text-muted hover:text-dark'}`}
            >{tab}</button>
          ))}
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-cream text-xs">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {activeTab === 'Orders' && <OrdersTab period={period} />}
      {activeTab === 'P&L' && <ProfitLossTab period={period} />}
      {activeTab === 'Product Profit' && <ProductProfitTab period={period} />}
    </div>
  )
}

function OrdersTab({ period }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [invoiceId, setInvoiceId] = useState(null)

  useEffect(() => {
    setLoading(true)
    privateAgent.get(AdminAPI({}).getOrdersReport.replace('{period}', period))
      .then(({ data }) => setOrders(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="text-sm text-muted">Loading...</div>

  return (
    <>
      {orders.length === 0 ? (
        <p className="text-sm text-muted">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted uppercase tracking-wide">
                <th className="text-left py-2 pr-3">Order #</th>
                <th className="text-left py-2 px-3">Customer</th>
                <th className="text-right py-2 px-3">Amount</th>
                <th className="text-left py-2 px-3">Order Date</th>
                <th className="text-left py-2 px-3">Delivered</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-right py-2 pl-3">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-t border-cream-alt">
                  <td className="py-2 pr-3 font-medium text-dark">{order.order_number}</td>
                  <td className="py-2 px-3 text-muted truncate max-w-[140px]">{order.contact_name || '-'}</td>
                  <td className="text-right py-2 px-3">Rs {Number(order.total_amount).toLocaleString()}</td>
                  <td className="py-2 px-3 text-muted">{new Date(order.order_date).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-muted">{order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : '-'}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[order.status] || 'bg-cream text-muted'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-right py-2 pl-3">
                    <button onClick={() => setInvoiceId(order.id)}
                      className="text-accent hover:underline text-[10px] font-medium">View Invoice</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {invoiceId && <InvoiceModal orderId={invoiceId} onClose={() => setInvoiceId(null)} />}
    </>
  )
}

function ProfitLossTab({ period }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    privateAgent.get(AdminAPI({}).getProfitReport + `?period=${period}`)
      .then(({ data }) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  const chartData = useMemo(() => {
    if (!report?.items) return []
    return report.items.slice(0, 10).map(i => ({
      name: i.product_name.length > 15 ? i.product_name.slice(0, 15) + '...' : i.product_name,
      profit: i.profit,
      revenue: i.revenue,
      cost: i.cost,
    }))
  }, [report])

  if (loading) return <div className="text-sm text-muted">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Revenue', value: report?.total_revenue || 0, color: 'text-accent' },
          { label: 'Cost', value: report?.total_cost || 0, color: 'text-red-500' },
          { label: 'Profit', value: report?.total_profit || 0, color: report?.total_profit >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Margin', value: report?.overall_margin != null ? `${report.overall_margin}%` : 'N/A', color: 'text-dark' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-4 text-center">
            <p className="text-xs text-muted mb-1">{card.label}</p>
            <p className={`text-lg font-semibold ${card.color}`}>
              {card.label === 'Margin' ? card.value : `Rs ${Number(card.value).toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-dark mb-3">Top Products by Profit</h3>
          <div className="bg-white rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8a7f76' }} axisLine={{ stroke: '#f0ebe3' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#8a7f76' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#4f6f52" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-dark mb-3">Product Breakdown</h3>
        {(!report?.items || report.items.length === 0) ? (
          <p className="text-muted text-sm">No delivered orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4">Product</th>
                  <th className="text-right py-2 px-4">Units</th>
                  <th className="text-right py-2 px-4">Revenue</th>
                  <th className="text-right py-2 px-4">Cost</th>
                  <th className="text-right py-2 px-4">Profit</th>
                  <th className="text-right py-2 pl-4">Margin</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map(i => (
                  <tr key={i.product_id} className="border-t border-cream-alt">
                    <td className="py-2 pr-4 text-dark max-w-[200px] truncate">{i.product_name}</td>
                    <td className="text-right py-2 px-4 text-muted">{i.units_sold}</td>
                    <td className="text-right py-2 px-4">Rs {i.revenue.toLocaleString()}</td>
                    <td className="text-right py-2 px-4 text-red-500">Rs {i.cost.toLocaleString()}</td>
                    <td className={`text-right py-2 px-4 font-medium ${i.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Rs {i.profit.toLocaleString()}
                    </td>
                    <td className={`text-right py-2 pl-4 ${i.margin != null && i.margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {i.margin != null ? `${i.margin}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductProfitTab({ period }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    privateAgent.get(AdminAPI({}).getProductProfitReport.replace('{period}', period))
      .then(({ data }) => setData(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <div className="text-sm text-muted">Loading...</div>

  if (data.length === 0) return <p className="text-sm text-muted">No product profit data available.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted uppercase tracking-wide">
            <th className="text-left py-2 pr-3">Product</th>
            <th className="text-left py-2 px-3">SKU</th>
            <th className="text-right py-2 px-3">Stock</th>
            <th className="text-right py-2 px-3">Sold</th>
            <th className="text-right py-2 px-3">Revenue</th>
            <th className="text-right py-2 px-3">Cost</th>
            <th className="text-right py-2 px-3">Profit</th>
            <th className="text-right py-2 pl-3">Last Cost</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.product_id} className="border-t border-cream-alt">
              <td className="py-2 pr-3 text-dark max-w-[160px] truncate">{item.product_name}</td>
              <td className="py-2 px-3 text-muted">{item.sku || '-'}</td>
              <td className="text-right py-2 px-3 text-muted">{item.stock_quantity}</td>
              <td className="text-right py-2 px-3 text-muted">{item.total_units_sold}</td>
              <td className="text-right py-2 px-3">Rs {item.total_revenue.toLocaleString()}</td>
              <td className="text-right py-2 px-3 text-red-500">Rs {item.total_cost.toLocaleString()}</td>
              <td className={`text-right py-2 px-3 font-medium ${item.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Rs {item.total_profit.toLocaleString()}
              </td>
              <td className="text-right py-2 pl-3 text-muted">
                {item.last_purchase_cost != null ? `Rs ${Number(item.last_purchase_cost).toLocaleString()}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  packed: 'bg-purple-100 text-purple-700',
  on_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  refund_requested: 'bg-gray-100 text-gray-700',
  refund_approved: 'bg-gray-100 text-gray-700',
  refunded: 'bg-gray-100 text-gray-700',
}