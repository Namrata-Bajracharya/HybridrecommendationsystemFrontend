/* ── InventoryTab ──
   Overview cards (total/in stock/low/out), low-stock list,
   stock movement log. */
import { getAllProducts } from '../../utils/products'
import { useStockLog } from '../../hooks/useStockLog'

export default function InventoryTab() {
  const all = getAllProducts()
  const stockLog = useStockLog()
  const lowStock = all.filter(p => (p.stock ?? 20) < 5)
  const outOfStock = all.filter(p => (p.stock ?? 20) === 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: all.length, emoji: '📦' },
          { label: 'In Stock', value: all.filter(p => (p.stock ?? 20) > 0).length, emoji: '✅' },
          { label: 'Low Stock', value: lowStock.length, emoji: '⚠️' },
          { label: 'Out of Stock', value: outOfStock.length, emoji: '🚫' },
        ].map(c => <div key={c.label} className="bg-white rounded-2xl p-4 text-center"><div className="text-xl mb-1">{c.emoji}</div><p className="text-lg font-semibold text-dark">{c.value}</p><p className="text-[11px] text-muted">{c.label}</p></div>)}
      </div>

      {lowStock.length > 0 && (
        <div><h3 className="text-sm font-medium text-dark mb-3">Low Stock</h3>
        <div className="space-y-2 text-sm">
          {lowStock.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
              <span>{p.emoji}</span><span className="flex-1 text-dark truncate">{p.name}</span>
              <span className={`font-medium ${(p.stock ?? 0) === 0 ? 'text-red-500' : 'text-amber-500'}`}>Stock: {p.stock ?? 0}</span>
            </div>))}
        </div></div>
      )}

      <div><h3 className="text-sm font-medium text-dark mb-3">Stock Movements</h3>
      {stockLog.length === 0 ? <p className="text-muted text-sm">No movements recorded.</p> : (
        <div className="space-y-1.5 text-xs max-h-[300px] overflow-y-auto">
          {stockLog.toReversed().map((m, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
              <span className={m.type === 'in' ? 'text-green-500' : 'text-red-500'}>{m.type === 'in' ? '↓ IN' : '↑ OUT'}</span>
              <span className="text-dark">{m.productName}</span>
              <span className="text-muted">×{m.quantity}</span>
              <span className="text-muted ml-auto">{new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}</div>
    </div>
  )
}
