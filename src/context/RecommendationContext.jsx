/* ── RecommendationContext ──
   Provides trending, occasion-based, hybrid user recs,
   recently viewed, and product-detail recommendations.
   Fetches real product data from the backend so every
   card has proper images. Falls back to local data when
   the API is unavailable. */
import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useCart } from './CartContext'
import { privateAgent, publicAgent } from '../Requests/AuthRequests'
import { RecommendationAPI, ProductAPI } from '../routes/Routes'
import { getTrending, getByOccasion, getRecommendationsForUser, getHybridRecommendations, getCompleteTheLook } from '../engine/recommender'
import { getAllProducts } from '../utils/products'

const RecommendationContext = createContext(null)

export function RecommendationProvider({ children }) {
  const { user } = useAuth()
  const { items } = useCart()

  const [allProducts, setAllProducts] = useState([])
  const [productsReady, setProductsReady] = useState(false)
  const [backendForYou, setBackendForYou] = useState([])

  /* ── Fetch all products from backend (with real images) ── */
  useEffect(() => {
    let cancelled = false
    publicAgent.get(ProductAPI({ pageNum: 1, RecordPerPage: 100 }).getAll)
      .then(({ data: res }) => {
        if (cancelled) return
        const prods = Array.isArray(res?.data) ? res.data : []
        if (prods.length > 0) {
          setAllProducts(prods)
        } else {
          setAllProducts(getAllProducts())
        }
        setProductsReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setAllProducts(getAllProducts())
          setProductsReady(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  /* ── Fetch personalized recommendations from backend ── */
  useEffect(() => {
    if (!user?.id || !productsReady) return
    let cancelled = false
    privateAgent.get(RecommendationAPI({ userId: user.id, topK: 8 }).forUser)
      .then(({ data: res }) => {
        if (cancelled) return
        const recs = res?.recommendations || []
        if (!recs.length) return
        const matched = []
        recs.forEach(r => {
          const pid = parseInt(r.item_id, 10)
          if (!isNaN(pid)) {
            const p = allProducts.find(x => x.id === pid)
            if (p) matched.push(p)
          }
        })
        if (matched.length >= 2) setBackendForYou(matched)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, productsReady, allProducts])

  /* pick the right product list once ready */
  const products = productsReady && allProducts.length > 0 ? allProducts : getAllProducts()

  /* ── Trending Now: top 8 by popularity ── */
  const trending = useMemo(() => getTrending(8, { products }), [products])

  /* ── "Just For You": backend recs if available, else local engine ── */
  const forYou = useMemo(() => {
    if (backendForYou.length >= 2) return backendForYou
    const synthetic = localStorage.getItem('kalleenepal_user')
    return getHybridRecommendations({ userId: user?.id || synthetic, limit: 8, products })
  }, [user, backendForYou, products])

  /* ── Recently Viewed: last 10 product IDs from session storage ── */
  const recentlyViewed = useMemo(() => {
    try {
      const ids = JSON.parse(sessionStorage.getItem('kalleenepal_recent') || '[]')
      return ids.map(id => products.find(p => p.id === id)).filter(Boolean).slice(0, 8)
    } catch { return [] }
  }, [products])

  /* ── Occasion-based section for Home & Collection page ── */
  const occasionEdits = useMemo(() => {
    const occasions = ['casual', 'festive', 'wedding', 'party', 'office']
    return occasions.map(o => ({ occasion: o, items: getByOccasion(o, { limit: 4, products }) }))
  }, [products])

  /* ── Product detail recs: similar, also-bought, same-occasion ── */
  const getProductRecommendations = (productId) => {
    const hybrid = getHybridRecommendations({ currentProductId: productId, limit: 8, products })
    const sameOccasion = getByOccasion(
      products.find(p => p.id === productId)?.occasion,
      { excludeId: productId, limit: 4, products }
    )
    const completeLook = getCompleteTheLook(productId, 4, products)
    return { hybrid, sameOccasion, completeLook }
  }

  /* ── Cart-based "Complete Your Look" ──
       Uses the first cart item to find complementary products. */
  const cartCompleteLook = useMemo(() => {
    if (!items.length) return []
    const first = items[0]
    return getCompleteTheLook(first.id, 4, products)
  }, [items, products])

  return (
    <RecommendationContext.Provider value={{ trending, forYou, recentlyViewed, occasionEdits, getProductRecommendations, cartCompleteLook }}>
      {children}
    </RecommendationContext.Provider>
  )
}

export function useRecommendations() {
  const ctx = useContext(RecommendationContext)
  if (!ctx) throw new Error('useRecommendations must be used within RecommendationProvider')
  return ctx
}
