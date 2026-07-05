import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI } from '../../routes/Routes'
import { useSnackbar } from 'notistack'

export default function ReviewsTab() {
  const { enqueueSnackbar } = useSnackbar()
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(() => {
    setLoading(true)
    const baseUrl = AdminAPI({}).getReviewsForModeration.split('?')[0]
    const params = new URLSearchParams({ page, page_size: pageSize })

    privateAgent.get(`${baseUrl}?${params}`)
      .then(({ data: res }) => {
        setReviews(res.reviews || [])
        setTotal(res.total || 0)
      })
      .catch(() => enqueueSnackbar('Failed to load reviews', { variant: 'error' }))
      .finally(() => setLoading(false))
  }, [page, pageSize, enqueueSnackbar])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleDelete = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await privateAgent.delete(AdminAPI({ id }).rejectReview)
      enqueueSnackbar('Review deleted', { variant: 'success' })
      fetchReviews()
    } catch {
      enqueueSnackbar('Failed to delete review', { variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">{total} review{total !== 1 ? 's' : ''}</p>

      {loading ? <p className="text-sm text-muted">Loading...</p> : reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews found.</p>
      ) : (
        <div className="space-y-2 text-sm">
          {reviews.map(r => (
            <Link key={r.id} to={`/product/${r.product_id}`}
              className="block rounded-xl px-4 py-3 bg-white hover:bg-cream/50 transition border border-transparent hover:border-cream-alt">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-xs font-bold text-muted shrink-0">
                  {r.user_email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-dark text-xs">{r.user_email}</span>
                    <span className="text-muted text-[10px]">on</span>
                    <span className="text-dark text-xs truncate max-w-[200px]">{r.product_name}</span>
                    <span className="text-amber-500 text-[11px]">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-muted text-xs mt-1">{r.comment}</p>}
                  <p className="text-[10px] text-muted/50 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => handleDelete(e, r.id)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-400 text-[11px] hover:bg-red-100 transition shrink-0 self-center">
                  Delete
                </button>
              </div>
            </Link>
          ))}
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