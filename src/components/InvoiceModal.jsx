import { useState, useEffect, useRef } from 'react'
import { privateAgent } from '../Requests/AuthRequests'
import { OrderAPI } from '../routes/Routes'

export default function InvoiceModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    privateAgent.get(OrderAPI({ id: orderId }).invoice)
      .then(({ data }) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const w = window.open('', '', 'width=800,height=600')
    if (!w) return
    w.document.write(`
      <html><head><title>Invoice #${order?.order_number || orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #1a1a2e; color: #fff; padding: 10px; text-align: left; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
        .totals { max-width: 300px; margin-left: auto; }
        .totals td { border: none; }
        .totals .total-row td { border-top: 2px solid #1a1a2e; font-weight: bold; font-size: 16px; }
        .header { text-align: center; margin-bottom: 30px; }
      </style></head><body>${el.innerHTML}</body></html>
    `)
    w.document.close()
    setTimeout(() => { w.print(); w.close() }, 300)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl p-8">Loading...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl p-8 text-sm text-muted">Failed to load invoice.</div>
      </div>
    )
  }

  const shipAddr = order.shipping_address || {}
  const addrStr = [shipAddr.street, shipAddr.city, shipAddr.state].filter(Boolean).join(', ')

  const items = order.order_items || []
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.unit_price) || 0) * (i.quantity || 0), 0)
  const shipping = parseFloat(order.shipping_cost) || 0
  const tax = parseFloat(order.tax) || 0
  const discount = parseFloat(order.discount) || 0
  const total = parseFloat(order.total_amount) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-alt">
          <h3 className="text-sm font-medium text-dark">Invoice #{order.order_number}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-3 py-1.5 rounded-xl bg-dark text-cream text-xs font-medium hover:bg-dark/90">Print</button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl bg-cream text-dark text-xs">Close</button>
          </div>
        </div>

        {/* Invoice Body */}
        <div ref={printRef} className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-bold text-dark">KALLEE NEPAL</h1>
            <p className="text-xs text-muted">Invoice</p>
          </div>

          <div className="flex justify-between text-xs">
            <div>
              <p className="font-medium text-dark">Bill To:</p>
              <p className="text-muted">{order.contact_name || '-'}</p>
              <p className="text-muted">{order.contact_phone || '-'}</p>
              {addrStr && <p className="text-muted">{addrStr}</p>}
            </div>
            <div className="text-right">
              <p className="font-medium text-dark">Order #:</p>
              <p className="text-muted">{order.order_number}</p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="bg-dark text-cream">
                <th className="text-left py-2 px-2">Item</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="border-t border-cream-alt">
                  <td className="py-2 px-2 text-dark">{item.name || item.product_name || `Product #${item.product_id}`}{item.variant_name || item.size ? ` — ${item.variant_name || item.size}` : ''}</td>
                  <td className="text-center py-2 px-2 text-muted">{item.quantity}</td>
                  <td className="text-right py-2 px-2 text-muted">Rs {parseFloat(item.unit_price).toLocaleString()}</td>
                  <td className="text-right py-2 px-2 text-dark font-medium">Rs {(parseFloat(item.unit_price) * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <table className="w-full max-w-xs ml-auto text-xs">
            <tbody>
              <tr><td className="py-1 text-muted">Subtotal</td><td className="text-right py-1 text-muted">Rs {subtotal.toLocaleString()}</td></tr>
              <tr><td className="py-1 text-muted">Shipping</td><td className="text-right py-1 text-muted">Rs {shipping.toLocaleString()}</td></tr>
              <tr><td className="py-1 text-muted">Tax</td><td className="text-right py-1 text-muted">Rs {tax.toLocaleString()}</td></tr>
              {discount > 0 && <tr><td className="py-1 text-muted">Discount</td><td className="text-right py-1 text-muted">-Rs {discount.toLocaleString()}</td></tr>}
              <tr className="total-row"><td className="py-2 font-semibold text-dark border-t-2 border-dark">Total</td><td className="text-right py-2 font-semibold text-dark border-t-2 border-dark">Rs {total.toLocaleString()}</td></tr>
            </tbody>
          </table>

          <p className="text-center text-xs text-muted pt-4 border-t border-cream-alt">Thank you for shopping with Kallee Nepal!</p>
        </div>
      </div>
    </div>
  )
}