/* ── ProductForm ──
   Add/edit form for custom products with all attributes. */
import { useState } from 'react'
import { getCustomProducts, saveCustomProducts, generateId } from '../../utils/products'

export default function ProductForm({ editProduct, onDone }) {
  const [f, setF] = useState({
    name: editProduct?.name || '', category: editProduct?.category || 'kurtha', price: editProduct?.price?.toString() || '',
    fabric: editProduct?.fabric || 'cotton', pattern: editProduct?.pattern || 'solid', occasion: editProduct?.occasion || 'casual',
    color: editProduct?.color || '', region: editProduct?.region || 'north', work: editProduct?.work || 'none',
    emoji: editProduct?.emoji || '○', stock: editProduct?.stock?.toString() || '20',
    sizes: editProduct?.sizes ? editProduct.sizes.join(',') : 'XS,S,M,L,XL,XXL',
  })
  const [err, setErr] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault(); setErr('')
    if (!f.name.trim() || !f.price) return setErr('Name and price required')
    const sizes = ['kurtha','lehenga','blouse'].includes(f.category) ? f.sizes.split(',').map(s => s.trim()).filter(Boolean) : undefined
    const product = {
      id: editProduct?.id || generateId(), name: f.name.trim(), category: f.category, price: Number(f.price),
      fabric: f.fabric, pattern: f.pattern, occasion: f.occasion, color: f.color || 'other', region: f.region,
      work: f.work, emoji: f.emoji || '○', stock: Number(f.stock) || 20,
      neckline: editProduct?.neckline || null, sleeve: editProduct?.sleeve || null, fit: editProduct?.fit || null,
      rating: editProduct?.rating || 0, reviews: editProduct?.reviews || 0, sizes,
    }
    const existing = getCustomProducts()
    if (editProduct) { const idx = existing.findIndex(p => p.id === editProduct.id); if (idx !== -1) existing[idx] = product; else existing.push(product) }
    else existing.push(product)
    saveCustomProducts(existing); onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 mb-6 space-y-3">
      {err && <p className="text-xs text-red-500">{err}</p>}
      <p className="text-sm font-medium text-dark">{editProduct ? 'Edit Product' : 'New Product'}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input placeholder="Name" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} className="col-span-full px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['kurtha','saree','lehenga','dupatta','blouse'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input placeholder="Price (Rs)" type="number" value={f.price} onChange={e => setF(p => ({ ...p, price: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={f.occasion} onChange={e => setF(p => ({ ...p, occasion: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['casual','office','festive','party','wedding'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={f.fabric} onChange={e => setF(p => ({ ...p, fabric: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['cotton','silk','georgette','chiffon','linen','velvet','organza','net'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={f.pattern} onChange={e => setF(p => ({ ...p, pattern: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['solid','printed','embroidered','block-print','woven','ikat','bandhani'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input placeholder="Emoji" value={f.emoji} onChange={e => setF(p => ({ ...p, emoji: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <input placeholder="Color" value={f.color} onChange={e => setF(p => ({ ...p, color: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        <select value={f.region} onChange={e => setF(p => ({ ...p, region: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['north','south','banarasi','kanchipuram','chanderi','jaipur','gujarat','rajasthan','telangana'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={f.work} onChange={e => setF(p => ({ ...p, work: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
          {['none','zari','sequin','mirror','thread-embroidery','stone','block-print','print','bandhani','woven','ikat'].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <input placeholder="Stock" type="number" min="0" value={f.stock} onChange={e => setF(p => ({ ...p, stock: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        {['kurtha','lehenga','blouse'].includes(f.category) && (
          <input placeholder="Sizes (comma-sep)" value={f.sizes} onChange={e => setF(p => ({ ...p, sizes: e.target.value }))} className="px-3 py-2 rounded-xl bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />)}
      </div>
      <button type="submit" className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">{editProduct ? 'Update' : 'Save'}</button>
    </form>
  )
}
