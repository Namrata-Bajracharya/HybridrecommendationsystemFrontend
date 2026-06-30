/* ── RecommendationContext ──
   Provides trending, occasion-based, hybrid user recs,
   recently viewed, and product-detail recommendations.
   Wraps the engine in React context for easy consumption
   across pages. */
import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useCart } from './CartContext'
import { getTrending, getByOccasion, getRecommendationsForUser, getHybridRecommendations, getCompleteTheLook } from '../engine/recommender'
import { getAllProducts } from '../utils/products'

const RecommendationContext = createContext(null)

export function RecommendationProvider({ children }) {
  const { user } = useAuth()
  const { items } = useCart()

  /* ── Trending Now: top 8 by popularity ── */
  const trending = useMemo(() => getTrending(8), [])

  /* ── "Just For You": hybrid recommendations based on user profile + trending fallback ── */
  const forYou = useMemo(() => {
    const synthetic = localStorage.getItem('kalleenepal_user')
    return getHybridRecommendations({ userId: user?.id || synthetic, limit: 8 })
  }, [user])

  /* ── Recently Viewed: last 10 product IDs from session storage ── */
  const recentlyViewed = useMemo(() => {
    try {
      const ids = JSON.parse(sessionStorage.getItem('kalleenepal_recent') || '[]')
      const allProducts = getAllProducts()
      return ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean).slice(0, 8)
    } catch { return [] }
  }, [])

  /* ── Occasion-based section for Home & Collection page ── */
  const occasionEdits = useMemo(() => {
    const occasions = ['casual', 'festive', 'wedding', 'party', 'office']
    return occasions.map(o => ({ occasion: o, items: getByOccasion(o, { limit: 4 }) }))
  }, [])

  /* ── Product detail recs: similar, also-bought, same-occasion ── */
  const getProductRecommendations = (productId) => {
    const hybrid = getHybridRecommendations({ currentProductId: productId, limit: 8 })
    const sameOccasion = getByOccasion(
      getAllProducts().find(p => p.id === productId)?.occasion,
      { excludeId: productId, limit: 4 }
    )
    const completeLook = getCompleteTheLook(productId)
    return { hybrid, sameOccasion, completeLook }
  }

  /* ── Cart-based "Complete Your Look" ──
       Uses the first cart item to find complementary products. */
  const cartCompleteLook = useMemo(() => {
    if (!items.length) return []
    const first = items[0]
    return getCompleteTheLook(first.id, 4)
  }, [items])

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
