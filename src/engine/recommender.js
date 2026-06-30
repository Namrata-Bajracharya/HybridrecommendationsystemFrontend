/* ── Hybrid Recommendation Engine ──
   Combines four strategies into a single ranked result:
   1. Content-based  — similarity by product attributes
   2. Collaborative  — co-purchase patterns from user data
   3. Knowledge-based — occasion/season filtering
   4. Popularity     — trending by rating * reviews
   Each strategy produces scored candidates; the hybrid fusion layer
   sums weighted scores and returns the top-N results. */

import { getAllProducts } from '../utils/products'
import { useRs } from '../data/users'

/* ── Attribute similarity helpeRs ──
   Builds a set of `key:value` strings for each product.
   Jaccard similarity = intersection size / union size. */

const attributeKeys = ['fabric', 'pattern', 'occasion', 'color', 'region', 'work', 'sleeve', 'neckline', 'fit']

const products = getAllProducts()

function attributeVector(p) {
  const set = new Set()
  attributeKeys.forEach(k => { if (p[k]) set.add(`${k}:${p[k]}`) })
  set.add(`category:${p.category}`)
  return set
}

function jaccard(a, b) {
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return union.size === 0 ? 0 : intersection.size / union.size
}

/* ── Content-based similarity score ──
   Weighted combination of:
   - Same category (high weight)
   - Attribute Jaccard (medium weight)
   - Price proximity (low weight) */
function contentSimilarity(a, b) {
  const va = attributeVector(a)
  const vb = attributeVector(b)

  const cat = a.category === b.category ? 0.4 : 0
  const attRs = jaccard(va, vb)

  const priceDiff = Math.abs(a.price - b.price)
  const priceScore = Math.max(0, 1 - priceDiff / 20000)

  return cat * 2 + attRs * 1.2 + priceScore * 0.3
}

/* ── getSimilarProducts(productId, opts) ──
   Content-based: returns top-N products with highest attribute similarity.
   Set excludeCategory=true for cross-category recommendations. */
export function getSimilarProducts(productId, {
  limit = 8,
  excludeCategory = false,
} = {}) {
  const target = products.find(p => p.id === productId)
  if (!target) return []

  const scored = products
    .filter(p => p.id !== productId)
    .filter(p => !excludeCategory || p.category !== target.category)
    .map(p => ({ product: p, score: contentSimilarity(target, p) }))
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(s => s.product)
}

/* ── Complementary category mapping ──
   Defines which categories naturally pair together.
   Used by "Complete the Look" recommendations. */
const complementaryCategories = {
  kurtha: ['dupatta', 'blouse'],
  saree: ['blouse'],
  lehenga: ['dupatta', 'blouse'],
  lehengablouse: ['dupatta'],
  dupatta: ['kurtha', 'lehenga'],
  blouse: ['saree', 'lehenga'],
}

/* ── getCompleteTheLook(productId, limit) ──
   Finds items from complementary categories that share
   color / work / region with the target product.
   Falls back to any complementary-category item if none match. */
export function getCompleteTheLook(productId, limit = 4) {
  const target = products.find(p => p.id === productId)
  if (!target) return []

  const complements = complementaryCategories[target.category] || []
  if (!complements.length) return getSimilarProducts(productId, { limit })

  const candidates = products.filter(p =>
    complements.includes(p.category) &&
    (p.color === target.color ||
     p.work === target.work ||
     p.region === target.region)
  )

  if (candidates.length === 0) {
    return products
      .filter(p => complements.includes(p.category))
      .slice(0, limit)
  }

  return candidates
    .map(p => ({ product: p, score: contentSimilarity(target, p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.product)
}

/* ── Collaborative filtering (item-based) ──
   Builds a co-occurrence matrix from purchase histories:
   if user bought A and B, then A→B and B→A both get +1.
   Results are cached for performance. */
let coPurchaseCache = null

function buildCoOccurrence() {
  if (coPurchaseCache) return coPurchaseCache

  const coOccur = {}
  useRs.forEach(u => {
    const items = u.purchases
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]; const b = items[j]
        coOccur[a] = coOccur[a] || {}
        coOccur[b] = coOccur[b] || {}
        coOccur[a][b] = (coOccur[a][b] || 0) + 1
        coOccur[b][a] = (coOccur[b][a] || 0) + 1
      }
    }
  })

  coPurchaseCache = coOccur
  return coOccur
}

/* ── getAlsoBought(productId, limit) ──
   Collaborative: returns products most frequently co-purchased.
   Falls back to content-based similar products when
   co-purchase data is sparse (cold-start). */
export function getAlsoBought(productId, limit = 6) {
  const coOccur = buildCoOccurrence()
  const neighboRs = coOccur[productId] || {}
  const paired = Object.entries(neighbors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => products.find(p => p.id === Number(id)))
    .filter(Boolean)

  if (paired.length < limit) {
    const existing = new Set([productId, ...paired.map(p => p.id)])
    const sim = getSimilarProducts(productId, { limit: limit * 2 })
    sim.forEach(p => {
      if (!existing.has(p.id) && paired.length < limit) {
        paired.push(p)
        existing.add(p.id)
      }
    })
  }

  return paired
}

/* ── getRecommendationsForUser(userId, limit) ──
   User-based collaborative filtering.
   Scores each product by:
   - Preference match (category, occasion, fabric)
   - Co-purchase signal from user's purchase history
   - Explicit likes
   Falls back to trending for unknown useRs */
export function getRecommendationsForUser(userId, limit = 8) {
  const user = useRs.find(u => u.id === userId)
  if (!user) return getTrending(limit)

  const owned = new Set(user.purchases)

  const scored = products
    .filter(p => !owned.has(p.id))
    .map(p => {
      let score = 0

      if (user.preferredCategories.includes(p.category)) score += 2
      if (user.preferredOccasions.includes(p.occasion)) score += 1.5
      if (user.preferredFabrics.includes(p.fabric)) score += 1

      const coOccur = buildCoOccurrence()
      user.purchases.forEach(pid => {
        const neighboRs = coOccur[pid] || {}
        score += (neighbors[p.id] || 0) * 0.5
      })

      if (user.likes.includes(p.id)) score += 3

      return { product: p, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(s => s.product)
}

/* ── getTrending(limit, {category}) ──
   Popularity-based: ranks products by rating * reviews (weighted score).
   Optionally scoped to a single category. */
export function getTrending(limit = 8, { category } = {}) {
  const pool = category
    ? products.filter(p => p.category === category)
    : products

  return [...pool]
    .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
    .slice(0, limit)
}

/* ── getByOccasion(occasion) ──
   Knowledge-based: filteRs products by occasion type,
   sorted by popularity within that occasion. */
export function getByOccasion(occasion, { limit = 8, excludeId } = {}) {
  return products
    .filter(p => p.occasion === occasion && p.id !== excludeId)
    .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
    .slice(0, limit)
}

/* ── getHybridRecommendations({userId, currentProductId, limit}) ──
   Hybrid fusion layer. Collects candidates from multiple strategies
   with different weights, deduplicates by summing scores, and returns
   the top-N results sorted by combined score.
   Weights: collaborative(2x) > content(1.5x) > user-pref(1.5x) > trending(0.5x) */
export function getHybridRecommendations({
  userId = null,
  currentProductId = null,
  limit = 8,
} = {}) {
  const recs = new Map()

  function add(source, weight = 1) {
    source.forEach(p => {
      recs.set(p.id, (recs.get(p.id) || 0) + weight)
    })
  }

  if (currentProductId) {
    add(getSimilarProducts(currentProductId, { limit: limit * 2 }), 1.5)
    add(getAlsoBought(currentProductId, limit * 2), 2)
  }

  if (userId) {
    add(getRecommendationsForUser(userId, limit * 2), 1.5)
  }

  add(getTrending(limit * 2), 0.5)

  const sorted = [...recs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => products.find(p => p.id === id))
    .filter(Boolean)

  return sorted
}
