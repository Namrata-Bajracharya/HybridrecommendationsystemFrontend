import { useState, useEffect } from 'react'
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
]

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

        const cats = Array.isArray(catResp.data) ? catResp.data : []
        setCategories(cats)

        const prods = Array.isArray(prodResp.data?.data) ? prodResp.data.data : []
        setProducts(prods)
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

  const categoryGroups = categories.map((cat, i) => {
    const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-')
    const matched = products.filter(p => {
      const pc = p.category
      return pc?.id === cat.id || pc?.slug === slug || pc?.name === cat.name
    })
    const visual = visualDefaults[i % visualDefaults.length]
    return { ...cat, slug, items: matched.slice(0, 4), visual }
  })

  if (loading) return <p className="text-muted mt-8 px-4">Loading…</p>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Collections</h1>

      {/* ── Category Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {categoryGroups.map(cat => (
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

      {/* ── Product Sections by Category ── */}
      {categoryGroups.filter(g => g.items.length > 0).map(cat => (
        <section key={cat.id} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark">{cat.name}</h2>
            <Link to={`/products?category=${cat.slug}`} className="text-sm text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cat.items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}

      {categoryGroups.every(g => g.items.length === 0) && (
        <p className="text-muted text-sm">No products found in any category.</p>
      )}
    </div>
  )
}
