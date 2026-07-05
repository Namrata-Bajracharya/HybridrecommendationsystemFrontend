import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import axios from 'axios'
import { publicAgent } from '../Requests/AuthRequests'
import { CategoryAPI, ProductAPI } from '../routes/Routes'

const visualDefaults = [
  { emoji: '📦', color: '#f0ebe4' },
  { emoji: '✨', color: '#ebe4e4' },
  { emoji: '◇', color: '#e8e8e0' },
  { emoji: '☆', color: '#ebe4e8' },
  { emoji: '○', color: '#e4ebe4' },
  { emoji: '◆', color: '#e4e4eb' },
  { emoji: '◈', color: '#ebe4f0' },
  { emoji: '⊹', color: '#f0ebe8' },
  { emoji: '📦', color: '#f0ebe4' },
]

function Carousel({ items, title, slug }) {
  const ref = useRef(null)

  const scroll = (dir) => {
    if (!ref.current) return
    ref.current.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-dark">{title}</h2>
        <Link to={`/products?category=${slug}`} className="text-sm text-accent hover:underline">View All</Link>
      </div>
      <div className="relative group">
        <button onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 shadow-md flex items-center justify-center text-dark opacity-0 group-hover:opacity-100 transition hover:bg-white">
          ‹
        </button>
        <button onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 shadow-md flex items-center justify-center text-dark opacity-0 group-hover:opacity-100 transition hover:bg-white">
          ›
        </button>
        <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {items.map(p => (
            <div key={p.id} className="min-w-[220px] max-w-[220px] shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CollectionPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadData() {
      setLoading(true)
      try {
        const [catResp, prodResp] = await Promise.all([
          publicAgent.get(CategoryAPI({}).getAll, { cancelToken: source.token }),
          publicAgent.get(ProductAPI({ pageNum: 1, RecordPerPage: 100 }).getAll, { cancelToken: source.token })
        ])

        const allCats = Array.isArray(catResp.data) ? catResp.data : []
        const prods = Array.isArray(prodResp.data?.data) ? prodResp.data.data : []
        setProducts(prods)
        setCategories(allCats)
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn('Failed to load collection data', err)
        }
      }
      setLoading(false)
    }
    loadData()
    return () => source.cancel()
  }, [])

  const rootCats = categories.filter(c => c.parent_id == null)

  const childIdsByRoot = {}
  rootCats.forEach(rc => {
    const ids = [rc.id]
    categories.forEach(c => {
      if (c.parent_id === rc.id) ids.push(c.id)
    })
    childIdsByRoot[rc.id] = ids
  })

  const categorySections = rootCats.map((cat, i) => {
    const catIds = childIdsByRoot[cat.id] || [cat.id]
    const catProducts = products.filter(p => catIds.includes(p.category?.id))
    const scored = [...catProducts].sort((a, b) => {
      const sa = (a.average_rating || 0) * (a.review_count || 0)
      const sb = (b.average_rating || 0) * (b.review_count || 0)
      return sb - sa
    })
    const visual = visualDefaults[i % visualDefaults.length]
    return { ...cat, visual, topItems: scored.slice(0, 10), slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-') }
  })

  if (loading) return <p className="text-muted mt-8 px-4">Loading…</p>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Collections</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {categorySections.map(cat => (
          <Link key={cat.id} to={`/products?category=${cat.slug}`}
            className="rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            style={{ backgroundColor: cat.visual.color }}>
            <span className="text-3xl mb-3">{cat.visual.emoji}</span>
            <h3 className="text-sm font-semibold text-dark">{cat.name}</h3>
            {cat.description && (
              <p className="text-xs text-muted mt-1">{cat.description}</p>
            )}
          </Link>
        ))}
      </div>

      {categorySections.map(cat => (
        <Carousel key={cat.id} items={cat.topItems} title={cat.name} slug={cat.slug} />
      ))}

      {categorySections.every(c => c.topItems.length === 0) && (
        <p className="text-muted text-sm">No products found in any category.</p>
      )}
    </div>
  )
}