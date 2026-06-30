/* ── CategoriesTab ──
   Shows product count per category in a grid. */
import { getAllProducts } from '../../utils/products'

export default function CategoriesTab() {
  const all = getAllProducts()
  const cats = [...new Set(all.map(p => p.category))]

  return (
    <div>
      <p className="text-sm text-muted mb-4">{cats.length} categories · {all.length} total products</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cats.map(cat => {
          const items = all.filter(p => p.category === cat)
          return (
            <div key={cat} className="bg-white rounded-2xl p-5 text-center">
              <div className="text-2xl mb-2">{cat === 'kurtha' ? '🥻' : cat === 'saree' ? '🪡' : cat === 'lehenga' ? '👗' : cat === 'dupatta' ? '🧣' : '👚'}</div>
              <h3 className="text-sm font-semibold text-dark capitalize mb-1">{cat}</h3>
              <p className="text-xs text-muted">{items.length} products</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
