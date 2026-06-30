/* ── CollectionPage ──
   Hero cards for each collection, followed by occasion-based
   product sections. Each hero card links to filtered products page. */
import { Link } from 'react-router-dom'
import { collections, occasionLabels } from '../data/products'
import { useRecommendations } from '../context/RecommendationContext'
import ProductCard from '../components/ProductCard'

export default function CollectionPage() {
  const { occasionEdits } = useRecommendations()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Collections</h1>

      {/* ── Hero collection cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {collections.map(c => (
          <Link key={c.id} to={`/products?occasion=${c.id}`}
            className="rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow"
            style={{ backgroundColor: c.color }}>
            <span className="text-3xl mb-3">{c.emoji}</span>
            <h3 className="text-sm font-semibold text-dark">{c.name}</h3>
            <p className="text-xs text-muted mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Occasion-based product sections ── */}
      {occasionEdits.filter(o => o.items.length > 0).map(({ occasion, items }) => (
        <section key={occasion} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-dark">{occasionLabels[occasion]}</h2>
            <Link to={`/products?occasion=${occasion}`} className="text-sm text-accent hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
