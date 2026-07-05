import { useState, useEffect, useCallback } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI } from '../../routes/Routes'
import { useSnackbar } from 'notistack'

export default function WishlistTab() {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: pageSize })
    privateAgent.get(`${AdminAPI({}).getAllWishlists}?${params}`)
      .then(({ data: res }) => {
        setItems(res.items || [])
        setTotal(res.total || 0)
      })
      .catch(() => enqueueSnackbar('Failed to load wishlist data', { variant: 'error' }))
      .finally(() => setLoading(false))
  }, [page, pageSize, enqueueSnackbar])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{total} wishlist item{total !== 1 ? 's' : ''}</p>

      {loading ? <p className="text-sm text-muted">Loading...</p> : items.length === 0 ? (
        <p className="text-sm text-muted">No wishlist items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2 pr-3">User</th>
                <th className="text-left py-2 pr-3">Product</th>
                <th className="text-right py-2 px-3">Price</th>
                <th className="text-right py-2 pl-3">Added</th>
              </tr>
            </thead>
            <tbody>
              {items.map(w => (
                <tr key={w.id} className="border-t border-cream-alt">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cream flex items-center justify-center text-[10px] font-bold text-muted shrink-0">
                        {w.user_email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-dark text-xs truncate max-w-[180px]">{w.user_name || w.user_email}</p>
                        <p className="text-[10px] text-muted truncate max-w-[180px]">{w.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      {w.product_image && (
                        <img src={w.product_image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      )}
                      <span className="text-dark text-xs truncate max-w-[200px]">{w.product_name}</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-3 text-muted text-xs">Rs {w.product_price.toLocaleString()}</td>
                  <td className="text-right py-2 pl-3 text-muted text-[10px] whitespace-nowrap">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">Prev</button>
          <span className="text-muted px-2">Page {page} of {Math.ceil(total / pageSize)}</span>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">Next</button>
        </div>
      )}
    </div>
  )
}