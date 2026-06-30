/* ── ProductsPage ──
   Category tabs with real-time search bar and sorting
   (price low→high, high→low, rating). The ?occasion= query
   param from "View All" links is respected as initial filter. */
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllProducts, getCustomProducts, saveCustomProducts } from '../utils/products'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { occasionLabels } from '../data/products'
import ProductCard from '../components/ProductCard'
import ProductForm from '../components/admin/ProductForm'
import SizeGuide from '../components/SizeGuide'
import axios from 'axios'

// default fallback while categories load
const DEFAULT_TABS = ['all', 'kurtha', 'saree', 'lehenga', 'dupatta', 'blouse']

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const urlOccasion = searchParams.get('occasion') || ''

  const { admin } = useAdminAuth()

  const [category, setCategory] = useState('all')
  const [occasion, setOccasion] = useState(urlOccasion)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('')
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [tabs, setTabs] = useState(DEFAULT_TABS)

  // fetch categories from backend on mount
  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadCategories() {
      try {
        const base = import.meta.env.VITE_API_BASE || ''
        const resp = await axios.get(`${base}/category`, { cancelToken: source.token })
        if (Array.isArray(resp.data)) {
          const names = resp.data.map(c => (c.name || c.slug)).filter(Boolean)
          setTabs(['all', ...names])
        }
      } catch (err) {
        // keep defaults on error
        console.warn('Failed to load categories, using defaults', err)
      }
    }
    loadCategories()
    return () => source.cancel()
  }, [])

  useEffect(() => { setOccasion(urlOccasion) }, [urlOccasion])

  const q = query.toLowerCase().trim()

  const [allProducts, setAllProducts] = useState([])
  const customProducts = useMemo(() => getCustomProducts(), [editProduct])

  // fetch products from backend and merge with admin custom products
  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadProducts() {
      try {
        const base = import.meta.env.VITE_API_BASE || ''
        const resp = await axios.get(`${base}/product?page=1&per_page=1000`, { cancelToken: source.token })
        const remote = Array.isArray(resp.data?.data) ? resp.data.data : []
        setAllProducts(remote)
      } catch (err) {
        console.warn('Failed to load products from API, falling back to static', err)
        setAllProducts(getAllProducts())
      }
    }
    loadProducts()
    return () => source.cancel()
  }, [editProduct])

  const mergedProducts = useMemo(() => {
    const map = new Map()
    allProducts.forEach(p => map.set(p.id, p))
    customProducts.forEach(p => map.set(p.id, p))
    return [...map.values()]
  }, [allProducts, customProducts])

  const filtered = useMemo(() => {
    let result = mergedProducts.filter(p => {
      // support both static string category and backend object {id,name,slug}
      const catName = typeof p.category === 'string' ? p.category : (p.category?.name || p.category?.slug)
      if (category !== 'all' && catName !== category) return false
      if (occasion && p.occasion !== occasion) return false
      if (q) {
        const searchable = `${p.name} ${catName || ''} ${p.fabric} ${p.pattern} ${p.region} ${p.occasion} ${p.color}`.toLowerCase()
        if (!searchable.includes(q)) return false
      }
      return true
    })

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)

    return result
  }, [category, occasion, q, sort, allProducts])

  const handleDelete = (id) => {
    if (!confirm('Delete this custom product?')) return
    saveCustomProducts(customProducts.filter(p => p.id !== id))
    window.location.reload()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── Heading ── */}
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-2xl font-semibold text-dark">
          {occasion ? occasionLabels[occasion] || occasion : 'All Products'}
        </h1>
        {occasion && (
          <button className="text-xs text-muted hover:text-accent transition"
            onClick={() => setOccasion('')}>
            Clear
          </button>
        )}
      </div>

      {/* ── Search + Sort bar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <input type="text" placeholder="Search products…" value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-cream text-dark placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option value="">Default</option>
          <option value="price-asc">Price: Low→High</option>
          <option value="price-desc">Price: High→Low</option>
          <option value="rating">Highest Rated</option>
        </select>
        <button className="px-3 py-2.5 rounded-xl bg-cream text-muted text-sm hover:text-dark transition"
          onClick={() => setShowSizeGuide(true)}>
          Size Guide
        </button>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-6 border-b border-cream-alt mb-8">
        {tabs.map(t => (
          <button key={t}
            className={`pb-2 text-sm capitalize transition border-b-2 ${category === t ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}
            onClick={() => setCategory(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Edit form ── */}
      {editProduct && (
        <div className="mb-8">
          <ProductForm editProduct={editProduct} onDone={() => { setEditProduct(null); window.location.reload() }} />
        </div>
      )}

      {/* ── Results ── */}
      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const isCustom = customProducts.some(c => c.id === p.id)
            return (
              <div key={p.id} className="relative">
                {admin && isCustom && (
                  <div className="absolute top-3 left-3 z-10 flex gap-1">
                    <button className="text-[11px] bg-white/90 backdrop-blur px-2 py-1 rounded-md text-accent font-medium hover:bg-accent hover:text-white transition shadow-sm"
                      onClick={() => setEditProduct(p)}>
                      Edit
                    </button>
                    <button className="text-[11px] bg-white/90 backdrop-blur px-2 py-1 rounded-md text-red-400 font-medium hover:bg-red-400 hover:text-white transition shadow-sm"
                      onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  </div>
                )}
                <ProductCard product={p} />
              </div>
            )
          })}
        </div>
      )}

      {showSizeGuide && <SizeGuide onClose={() => setShowSizeGuide(false)} />}
    </div>
  )
}
