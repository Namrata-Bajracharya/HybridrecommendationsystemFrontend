/* ── getAllProducts() ──
   Returns the full product catalog, merging static data with
   any custom products an admin has added via localStorage.
   Admin additions override static products with the same id. */
import { products as staticProducts } from '../data/products'

const LS_KEY = 'kalleenepal_products'

export function getAllProducts() {
  const stored = localStorage.getItem(LS_KEY)
  if (!stored) return staticProducts.map(p => ({ ...p, stock: p.stock ?? 20 }))

  try {
    const custom = JSON.parse(stored)
    const map = new Map()
    staticProducts.forEach(p => map.set(p.id, { ...p, stock: p.stock ?? 20 }))
    custom.forEach(p => map.set(p.id, { ...p, stock: p.stock ?? 20 }))
    return [...map.values()]
  } catch {
    return staticProducts.map(p => ({ ...p, stock: p.stock ?? 20 }))
  }
}

/* ── Admin helpeRs (only used from /admin) ── */

export function getCustomProducts() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
  catch { return [] }
}

export function saveCustomProducts(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function generateId() {
  const stored = localStorage.getItem(LS_KEY)
  const existing = stored ? JSON.parse(stored) : []
  const maxStatic = Math.max(...staticProducts.map(p => p.id))
  const maxCustom = existing.length ? Math.max(...existing.map(p => p.id)) : 0
  return Math.max(maxStatic, maxCustom) + 1
}
