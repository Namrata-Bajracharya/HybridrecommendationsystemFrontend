import { useState, useEffect, useMemo, useCallback } from 'react'
import ProductCard from '../components/ProductCard'
import SizeGuide from '../components/SizeGuide'
import axios from 'axios'
import { publicAgent, privateAgent } from '../Requests/AuthRequests'
import { CategoryAPI, ProductAPI, RecommendationAPI } from '../routes/Routes'
import { useAuth } from '../context/AuthContext'

const DEFAULT_TABS = ['all']
const PER_PAGE = 12

export default function ProductsPage() {
  const { user } = useAuth()

  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [tabs, setTabs] = useState(DEFAULT_TABS)
  const [allProducts, setAllProducts] = useState([])
  const [categoryMap, setCategoryMap] = useState({})
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [recommendedIds, setRecommendedIds] = useState(new Set())

  const loadProducts = useCallback(async (sourceToken) => {
    setLoading(true)
    try {
      const prodResp = await publicAgent.get(
        ProductAPI({ pageNum: 1, RecordPerPage: 100 }).getAll,
        { cancelToken: sourceToken }
      )
      const remote = Array.isArray(prodResp.data?.data) ? prodResp.data.data : []
      setAllProducts(remote)

      if (user?.id) {
        try {
          const recResp = await privateAgent.get(
            RecommendationAPI({ userId: user.id, topK: 50 }).forUser,
            { cancelToken: sourceToken }
          )
          const recs = recResp.data?.recommendations || []
          const ids = new Set()
          recs.forEach(r => {
            const idNum = parseInt(r.item_id, 10)
            if (!isNaN(idNum)) ids.add(idNum)
          })
          setRecommendedIds(ids)
        } catch {
          setRecommendedIds(new Set())
        }
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.warn('Failed to load data from API', err)
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    setPage(1)
  }, [category, query, sort])

  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadData() {
      try {
        const catResp = await publicAgent.get(
          CategoryAPI({}).getAll,
          { cancelToken: source.token }
        )
        if (Array.isArray(catResp.data)) {
          const map = {}
          const names = catResp.data.map(c => {
            const key = c.name || c.slug
            map[key] = c.id
            return key
          }).filter(Boolean)
          setCategoryMap(map)
          setTabs(['all', ...names])
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn('Failed to load categories', err)
        }
      }
      await loadProducts(source.token)
    }
    loadData()
    return () => source.cancel()
  }, [loadProducts])

  const q = query.toLowerCase().trim()

  const filtered = useMemo(() => {
    let result = allProducts.filter(p => {
      const catName = p.category?.name || p.category?.slug
      if (category !== 'all' && catName !== category) return false

      if (q) {
        const fv = p.field_values || {}
        const fvSearchable = Object.values(fv).filter(Boolean).join(' ').toLowerCase()
        const searchable = `${p.name} ${p.description || ''} ${catName || ''} ${fvSearchable}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })

    if (sort === 'price-asc') result.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'price-desc') result.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'rating') result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    else if (recommendedIds.size > 0) {
      result.sort((a, b) => {
        const aRec = recommendedIds.has(a.id) ? 1 : 0
        const bRec = recommendedIds.has(b.id) ? 1 : 0
        return bRec - aRec
      })
    }

    return result
  }, [category, q, sort, allProducts, recommendedIds])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * PER_PAGE
  const pageProducts = filtered.slice(startIdx, startIdx + PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <h1 className="text-2xl font-semibold text-dark mb-6">All Products</h1>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <input type="text" placeholder="Search products…" value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-cream text-dark placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option value="">Default{recommendedIds.size > 0 ? ' (Recommended)' : ''}</option>
          <option value="price-asc">Price: Low→High</option>
          <option value="price-desc">Price: High→Low</option>
          <option value="rating">Highest Rated</option>
        </select>
        <button className="px-3 py-2.5 rounded-xl bg-cream text-muted text-sm hover:text-dark transition"
          onClick={() => setShowSizeGuide(true)}>
          Size Guide
        </button>
      </div>

      <div className="flex gap-6 border-b border-cream-alt mb-8">
        {tabs.map(t => (
          <button key={t}
            className={`pb-2 text-sm capitalize transition border-b-2 ${category === t ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}
            onClick={() => setCategory(t)}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading products…</p>
      ) : pageProducts.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pageProducts.map(p => (
              <div key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-cream-alt">
            <p className="text-sm text-muted">
              Showing {startIdx + 1}–{Math.min(startIdx + PER_PAGE, filtered.length)} of {filtered.length} products
            </p>
            <div className="flex items-center gap-2">
              <button disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-cream text-sm text-dark disabled:opacity-40 hover:bg-cream-alt transition">
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
                const p = start + i
                if (p > totalPages) return null
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === safePage ? 'bg-dark text-cream' : 'bg-cream text-dark hover:bg-cream-alt'}`}>
                    {p}
                  </button>
                )
              })}
              <button disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-cream text-sm text-dark disabled:opacity-40 hover:bg-cream-alt transition">
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showSizeGuide && <SizeGuide onClose={() => setShowSizeGuide(false)} />}
    </div>
  )
}
