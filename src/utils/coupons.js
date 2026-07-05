/* ── Coupon utilities ──
   Coupon codes stored in localStorage (kalleenepal_coupons).
   Each coupon: { id, code, scope: 'cart'|'delivery', type: 'percent'|'fixed'|'free', value, minPurchase, usageLimit, usedCount } */
const LS_KEY = 'kalleenepal_coupons'

export function getCoupons() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

export function saveCoupons(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function generateCouponId() {
  const list = getCoupons()
  return list.length ? Math.max(...list.map(c => c.id)) + 1 : 1
}

export function validateCoupon(code, cartTotal) {
  const coupons = getCoupons()
  const c = coupons.find(c => c.code.toUpperCase() === code.toUpperCase().trim())
  if (!c) return { valid: false, reason: 'Invalid coupon code' }
  if (c.usageLimit && c.usedCount >= c.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' }
  if (c.minPurchase && cartTotal < c.minPurchase) return { valid: false, reason: `Minimum purchase of Rs ${c.minPurchase.toLocaleString()} required` }
  return { valid: true, coupon: c }
}

export function applyDiscount(coupon, targetTotal) {
  if (coupon.scope === 'delivery') {
    if (coupon.type === 'free') return targetTotal
    if (coupon.type === 'percent') return Math.round(targetTotal * (coupon.value / 100))
    return Math.min(coupon.value, targetTotal)
  }
  if (coupon.type === 'percent') return Math.round(targetTotal * (coupon.value / 100))
  return Math.min(coupon.value, targetTotal)
}

export function incrementCouponUsage(code) {
  const coupons = getCoupons()
  const idx = coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase().trim())
  if (idx !== -1) {
    coupons[idx].usedCount = (coupons[idx].usedCount || 0) + 1
    saveCoupons(coupons)
  }
}
