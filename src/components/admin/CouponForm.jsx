/* ── CouponForm ──
   Form to create a new coupon code. */
import { useState } from 'react'
import { getCoupons, saveCoupons, generateCouponId } from '../../utils/coupons'

export default function CouponForm({ onDone }) {
  const [f, setF] = useState({ code: '', scope: 'cart', type: 'percent', value: '', minPurchase: '', usageLimit: '' })
  const [err, setErr] = useState('')

  const needsValue = f.scope !== 'delivery' || f.type !== 'free'

  const handleSubmit = (e) => {
    e.preventDefault(); setErr('')
    if (!f.code.trim()) return setErr('Code required')
    if (needsValue && !f.value) return setErr('Value required')
    const existing = getCoupons()
    existing.push({
      id: generateCouponId(),
      code: f.code.trim().toUpperCase(),
      scope: f.scope,
      type: f.scope === 'delivery' && f.type === 'free' ? 'free' : f.type,
      value: needsValue ? Number(f.value) : 0,
      minPurchase: Number(f.minPurchase) || 0,
      usageLimit: Number(f.usageLimit) || 0,
      usedCount: 0,
    })
    saveCoupons(existing); onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 space-y-3">
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <input placeholder="CODE" value={f.code} onChange={e => setF(p => ({ ...p, code: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm uppercase focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={f.scope} onChange={e => setF(p => ({ ...p, scope: e.target.value, type: 'percent' }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option value="cart">Cart</option><option value="delivery">Delivery</option>
        </select>
        {f.scope === 'delivery' ? (
          <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
            <option value="free">Free</option><option value="percent">% Off</option><option value="fixed">Fixed (Rs)</option>
          </select>
        ) : (
          <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
            <option value="percent">% Off</option><option value="fixed">Fixed (Rs)</option>
          </select>
        )}
        <input placeholder={needsValue ? 'Value' : '—'} type="number" disabled={!needsValue} value={f.value} onChange={e => setF(p => ({ ...p, value: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-40" />
        <input placeholder="Min purchase (Rs)" type="number" value={f.minPurchase} onChange={e => setF(p => ({ ...p, minPurchase: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <input placeholder="Usage limit (0 = unlimited)" type="number" value={f.usageLimit} onChange={e => setF(p => ({ ...p, usageLimit: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <button type="submit" className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">Create Coupon</button>
    </form>
  )
}
