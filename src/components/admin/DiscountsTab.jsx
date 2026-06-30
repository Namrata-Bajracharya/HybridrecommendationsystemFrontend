/* ── DiscountsTab ──
   Lists coupon codes with create/delete actions.
   Includes inline CouponForm. */
import { useState } from 'react'
import { getCoupons, saveCoupons } from '../../utils/coupons'
import CouponForm from './CouponForm'

export default function DiscountsTab() {
  const [coupons, setCoupons] = useState(getCoupons())
  const [showForm, setShowForm] = useState(false)
  const refresh = () => setCoupons(getCoupons())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{coupons.length} coupon codes</p>
        <button className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          onClick={() => setShowForm(o => !o)}>{showForm ? 'Cancel' : '+ New Coupon'}</button>
      </div>
      {showForm && <CouponForm onDone={() => { setShowForm(false); refresh() }} />}
      {coupons.length === 0 ? <p className="text-muted text-sm">No coupons created yet.</p> : (
        <div className="space-y-2 text-sm">
          {coupons.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
              <span className="font-mono font-semibold text-dark uppercase">{c.code}</span>
              <span className="text-muted text-xs">{c.type === 'percent' ? `${c.value}% off` : `Rs ${c.value} off`}</span>
              {c.minPurchase > 0 && <span className="text-muted text-xs">min Rs {c.minPurchase}</span>}
              <span className="text-muted text-xs">Used: {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</span>
              <button className="ml-auto text-xs text-red-400 hover:text-red-500"
                onClick={() => { saveCoupons(coupons.filter(x => x.id !== c.id)); refresh() }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
