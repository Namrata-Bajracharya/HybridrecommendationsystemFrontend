/* ── ProductsTab ──
   Lists all products, shows edit/delete controls for custom ones.
   Includes inline ProductForm for add/edit. */
import { useState } from 'react'
import { getCustomProducts, saveCustomProducts, getAllProducts } from '../../utils/products'
import ProductForm from './ProductForm'

export default function ProductsTab() {
  const [custom, setCustom] = useState(getCustomProducts())
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const refresh = () => setCustom(getCustomProducts())
  const handleDelete = (id) => { if (!confirm('Delete this custom product?')) return; saveCustomProducts(custom.filter(p => p.id !== id)); refresh() }
  const existing = custom.find(c => c.id === editId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">Custom products: {custom.length}</p>
        <button className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          onClick={() => { setShowForm(o => !o); setEditId(null) }}>{showForm && !editId ? 'Cancel' : '+ Add Product'}</button>
      </div>
      {(showForm || editId) && <ProductForm editProduct={existing} onDone={() => { setShowForm(false); setEditId(null); refresh() }} />}
      <h3 className="text-sm font-medium text-dark mb-3">All Products ({getAllProducts().length})</h3>
      <div className="space-y-2 text-sm max-h-[500px] overflow-y-auto">
        {getAllProducts().map(p => {
          const isCustom = custom.some(c => c.id === p.id)
          return (
            <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
              <span>{p.emoji}</span>
              <span className="flex-1 text-dark truncate">{p.name}</span>
              <span className="text-muted text-xs capitalize">{p.category}</span>
              <span className="text-accent font-medium">Rs {p.price.toLocaleString()}</span>
              <span className="text-[11px] text-muted">Stock: {p.stock ?? 20}</span>
              {isCustom && (
                <div className="flex gap-2">
                  <button className="text-xs text-accent hover:underline" onClick={() => { setEditId(p.id); setShowForm(false) }}>Edit</button>
                  <button className="text-xs text-red-400 hover:text-red-500" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
