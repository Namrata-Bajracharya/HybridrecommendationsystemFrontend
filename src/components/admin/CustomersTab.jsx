import { useState, useEffect } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { BASE_API_ROUTE } from '../../routes/Routes'
import { useNavigate } from 'react-router-dom'

export default function CustomersTab() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, page_size: pageSize, role: 'customer' })
    if (search) params.set('search', search)
    privateAgent.get(`${BASE_API_ROUTE}/admin/users?${params}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, pageSize, search])

  const joinDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading && !data) return <div className="text-sm text-muted">Loading...</div>

  const users = data?.users || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{total} customer{total !== 1 ? 's' : ''}</p>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-64 px-4 py-2 rounded-xl bg-white border border-cream-alt text-sm outline-none focus:border-dark transition"
        />
      </div>

      <div className="overflow-x-auto">
        {users.length === 0 ? (
          <p className="text-muted text-sm">No customers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wide">
                <th className="text-left py-2 pr-4">Customer</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Joined</th>
                <th className="text-right py-2 px-4">Orders</th>
                <th className="text-right py-2 pl-4">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} onClick={() => navigate(`/admin/customers/${u.id}`)}
                  className="border-t border-cream-alt cursor-pointer hover:bg-cream/50 transition">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dark text-cream text-xs font-medium flex items-center justify-center shrink-0">
                        {(u.first_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-dark font-medium truncate max-w-[180px]">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-muted truncate max-w-[200px]">{u.email}</td>
                  <td className="py-2 pr-4 text-muted text-[11px] whitespace-nowrap">{joinDate(u.created_at)}</td>
                  <td className="text-right py-2 px-4">{u.total_orders}</td>
                  <td className="text-right py-2 pl-4 font-medium">Rs {(u.total_spent || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">
            Prev
          </button>
          <span className="text-muted px-2">Page {page} of {Math.ceil(total / pageSize)}</span>
          <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded-lg bg-white border border-cream-alt disabled:opacity-40 hover:bg-cream transition">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
