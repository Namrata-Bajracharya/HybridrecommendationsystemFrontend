import { useState, useEffect, useCallback } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI, ProductAPI } from '../../routes/Routes'
import { useSnackbar } from 'notistack'

export default function InventoryTab() {
  const { enqueueSnackbar } = useSnackbar()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [restockId, setRestockId] = useState(null)
  const [restockQty, setRestockQty] = useState('')
  const [setNewPrices, setSetNewPrices] = useState(false)
  const [newSellPrice, setNewSellPrice] = useState('')
  const [newBuyPrice, setNewBuyPrice] = useState('')
  const [markupPercent, setMarkupPercent] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: pageSize })
    if (search) params.set('search', search)
    if (lowStockOnly) params.set('low_stock', 'true')
    privateAgent.get(`${AdminAPI({}).getInventory}?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => enqueueSnackbar('Failed to load inventory', { variant: 'error' }))
      .finally(() => setLoading(false))
  }, [page, pageSize, search, lowStockOnly, enqueueSnackbar])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRestock = async (pid) => {
    const qty = Number(restockQty)
    if (!qty || qty <= 0) {
      enqueueSnackbar('Enter valid quantity', { variant: 'warning' })
      return
    }
    const prod = data?.items?.find(i => i.product_id === pid)
    const buyPrice = setNewPrices && newBuyPrice ? Number(newBuyPrice) : prod?.buying_price || 0
    const body = { product_id: pid, quantity: qty, unit_cost: buyPrice }
    if (setNewPrices) {
      if (newBuyPrice) body.new_buying_price = Number(newBuyPrice)
      if (newSellPrice) body.new_selling_price = Number(newSellPrice)
    }
    try {
      await privateAgent.post(AdminAPI({}).restock, body)
      enqueueSnackbar('Restocked successfully', { variant: 'success' })
      setRestockId(null)
      setRestockQty('')
      setSetNewPrices(false)
      setNewSellPrice('')
      setNewBuyPrice('')
      setMarkupPercent('')
      fetchData()
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.detail || 'Restock failed', { variant: 'error' })
    }
  }

  const openRestock = (pid) => {
    setRestockId(pid)
    setRestockQty('')
    setSetNewPrices(false)
    setNewSellPrice('')
    setNewBuyPrice('')
    setMarkupPercent('')
  }

  const handleMarkupChange = (pct) => {
    setMarkupPercent(pct)
    const prod = data?.items?.find(i => i.product_id === restockId)
    if (prod && pct) {
      const bp = Number(newBuyPrice || prod.buying_price || 0)
      setNewSellPrice(Math.round(bp * (1 + Number(pct) / 100) * 100) / 100)
    }
  }

  const handleBuyPriceChange = (val) => {
    setNewBuyPrice(val)
    if (markupPercent) {
      setNewSellPrice(Math.round(Number(val) * (1 + Number(markupPercent) / 100) * 100) / 100)
    }
  }

  const daysAgo = (dateStr) => {
    if (!dateStr) return '—'
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return '1 day ago'
    return `${diff} days ago`
  }

  if (loading && !data) return <div className="text-sm text-muted">Loading...</div>

  const summary = data?.summary || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: summary.total_products ?? '—' },
          { label: 'In Stock', value: summary.in_stock ?? '—' },
          { label: 'Low Stock', value: summary.low_stock ?? '—' },
          { label: 'Out of Stock', value: summary.out_of_stock ?? '—' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 text-center">
            <p className="text-lg font-semibold text-dark">{c.value}</p>
            <p className="text-[11px] text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white border border-cream-alt text-sm outline-none focus:border-dark transition"
        />
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => { setLowStockOnly(e.target.checked); setPage(1) }}
            className="accent-dark"
          />
          Low stock only (&lt;10)
        </label>
      </div>

      <div className="overflow-x-auto">
        {loading && <div className="text-sm text-muted mb-2">Updating...</div>}
        {!data?.items?.length ? (
          <p className="text-muted text-sm">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2 pr-4">Product</th>
                <th className="text-left py-2 pr-4">SKU</th>
                <th className="text-right py-2 px-4">Stock</th>
                <th className="text-right py-2 px-4">Buying Price</th>
                <th className="text-right py-2 px-4">Selling Price</th>
                <th className="text-right py-2 px-4">Last Restock</th>
                <th className="text-right py-2 pl-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(p => {
                const stockClass = p.stock_quantity === 0
                  ? 'text-red-500'
                  : p.stock_quantity < 10
                    ? 'text-amber-500'
                    : ''
                return (
                  <tr key={p.product_id} className="border-t border-cream-alt">
                    <td className="py-2 pr-4 text-dark max-w-[220px] truncate">{p.name}</td>
                    <td className="py-2 pr-4 text-muted font-mono text-[11px]">{p.sku || '—'}</td>
                    <td className={`text-right py-2 px-4 font-medium ${stockClass}`}>{p.stock_quantity}</td>
                    <td className="text-right py-2 px-4 text-muted">Rs {p.buying_price ?? 'N/A'}</td>
                    <td className="text-right py-2 px-4">Rs {p.selling_price ?? 'N/A'}</td>
                    <td className="text-right py-2 px-4 text-muted text-[11px] whitespace-nowrap">
                      {p.last_restock_at
                        ? <span title={new Date(p.last_restock_at).toLocaleString()}>{daysAgo(p.last_restock_at)}</span>
                        : '—'}
                    </td>
                    <td className="text-right py-2 pl-4">
                      <button onClick={() => openRestock(p.product_id)}
                        className="px-3 py-1 rounded-lg bg-dark text-cream text-[11px] hover:opacity-90 transition">
                        Restock
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {data?.total > pageSize && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">
            Prev
          </button>
          <span className="text-muted px-2">Page {page} of {Math.ceil(data.total / pageSize)}</span>
          <button disabled={page >= Math.ceil(data.total / pageSize)} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">
            Next
          </button>
        </div>
      )}

      {restockId && (() => {
        const prod = data?.items?.find(i => i.product_id === restockId)
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <p className="text-sm font-medium text-dark">Restock — {prod?.name || `#${restockId}`}</p>

            <div className="flex gap-3 text-xs">
              <div className="flex-1 bg-cream rounded-xl px-3 py-2">
                <span className="text-muted">Buying Price</span>
                <p className="font-medium text-dark">Rs {prod?.buying_price ?? 'N/A'}</p>
              </div>
              <div className="flex-1 bg-cream rounded-xl px-3 py-2">
                <span className="text-muted">Selling Price</span>
                <p className="font-medium text-dark">Rs {prod?.selling_price ?? 'N/A'}</p>
              </div>
            </div>

            <input placeholder="Quantity" type="number" min="1" value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />

            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
              <input type="checkbox" checked={setNewPrices} onChange={e => setSetNewPrices(e.target.checked)} className="accent-dark" />
              Set new prices
            </label>

            {setNewPrices && (
              <div className="space-y-3 pl-4 border-l-2 border-cream-alt">
                <div>
                  <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Buying Price (Rs)</label>
                  <input type="number" min="0" step="0.01" value={newBuyPrice}
                    onChange={e => handleBuyPriceChange(e.target.value)}
                    placeholder={String(prod?.buying_price ?? '')}
                    className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Markup %</label>
                    <input type="number" min="0" step="0.1" value={markupPercent}
                      onChange={e => handleMarkupChange(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Selling Price (Rs)</label>
                    <input type="number" min="0" step="0.01" value={newSellPrice}
                      onChange={e => setNewSellPrice(e.target.value)}
                      placeholder={String(prod?.selling_price ?? '')}
                      className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setRestockId(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-cream text-sm text-muted hover:text-dark transition">
                Cancel
              </button>
              <button onClick={() => handleRestock(restockId)}
                className="flex-1 px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
                Restock
              </button>
            </div>
          </div>
        </div>
        )})()}
    </div>
  )
}
