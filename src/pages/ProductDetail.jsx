/* ── ProductDetailPage ──
   Full product view with image placeholder, all attributes,
   size selector chips, add-to-cart button (disabled until
   size chosen for sized products), and three recommendation
   sections: "You May Also Like" (hybrid), "Complete the Look"
   (complementary items), "More in this Occasion". */
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllProducts } from '../utils/products'
import { occasionLabels } from '../data/products'
import { useCart } from '../context/CartContext'
import { useRecommendations } from '../context/RecommendationContext'
import ProductCard from '../components/ProductCard'

export default function ProductDetailPage() {
  const { id } = useParams()
  const allProducts = getAllProducts()
  const product = allProducts.find(p => p.id === Number(id))
  const { addToCart } = useCart()
  const { getProductRecommendations } = useRecommendations()

  const [selectedSize, setSelectedSize] = useState('')
  const [added, setAdded] = useState(false)
  const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0

  /* ── Track recent view (session storage) ── */
  useEffect(() => {
    if (!product) return
    try {
      const recent = JSON.parse(sessionStorage.getItem('kalleenepal_recent') || '[]')
      const filtered = recent.filter(v => v !== product.id)
      filtered.unshift(product.id)
      sessionStorage.setItem('kalleenepal_recent', JSON.stringify(filtered.slice(0, 20)))
    } catch { /* ignore */ }
  }, [product])

  /* ── Reset size & added state when product changes ── */
  useEffect(() => { setSelectedSize(''); setAdded(false) }, [id])

  if (!product) return <p className="text-muted mt-8">Product not found.</p>

  /* ── Handle add to cart with mandatory size check ── */
  const handleAdd = () => {
    if (hasSizes && !selectedSize) return
    addToCart(product, selectedSize || null)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  /* ── Recommendation sections ── */
  const { hybrid, sameOccasion, completeLook } = getProductRecommendations(product.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Product hero ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* ── Image placeholder ── */}
        <div className="aspect-[3/4] bg-cream rounded-3xl flex items-center justify-center text-8xl">
          {product.emoji}
        </div>

        {/* ── Product details ── */}
        <div>
          {/* ── Breadcrumb ── */}
          <p className="text-xs text-muted mb-2">
            <Link to="/products" className="hover:text-accent">Products</Link>
            {' / '}<span className="text-dark">{product.name}</span>
          </p>

          {/* ── Occasion badge ── */}
          <span className="inline-block text-[11px] uppercase tracking-wider text-muted bg-cream px-3 py-1 rounded-full mb-3">
            {occasionLabels[product.occasion] || product.occasion}
          </span>

          {/* ── Name & price ── */}
          <h1 className="text-2xl font-semibold text-dark mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-accent mb-6">Rs {product.price.toLocaleString()}</p>

          {/* ── Attribute details ── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm">
            {product.fabric && <Detail label="Fabric" value={product.fabric} />}
            {product.pattern && <Detail label="Pattern" value={product.pattern} />}
            {product.region && <Detail label="Origin" value={product.region} />}
            {product.fit && <Detail label="Fit" value={product.fit} />}
            {product.sleeve && <Detail label="Sleeve" value={product.sleeve} />}
            {product.neckline && <Detail label="Neckline" value={product.neckline} />}
            {product.work && product.work !== 'none' && <Detail label="Craft" value={product.work} />}
            <Detail label="Rating" value={`★ ${product.rating} (${product.reviews})`} />
          </div>

          {/* ── Size selector ── */}
          {hasSizes && (
            <div className="mb-6">
              <p className="text-sm font-medium text-dark mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition ${selectedSize === s ? 'bg-dark text-cream' : 'bg-white text-muted hover:bg-cream'}`}
                    onClick={() => setSelectedSize(s)}>
                    {s}
                  </button>
                ))}
              </div>
              {hasSizes && !selectedSize && (
                <p className="text-xs text-red-400 mt-2">Please select a size before adding to cart</p>
              )}
            </div>
          )}

          {/* ── Add to cart button ──
               Disabled when sized product has no selected size. */}
          <button className="w-full py-3 rounded-xl bg-dark text-cream font-medium text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={hasSizes && !selectedSize} onClick={handleAdd}>
            {added ? '✓ Added to Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* ── You May Also Like (hybrid recommendations) ── */}
      {hybrid.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {hybrid.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Complete the Look (complementary items) ── */}
      {completeLook.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">Complete the Look</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completeLook.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── More in this Occasion ── */}
      {sameOccasion.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">More in {occasionLabels[product.occasion]}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sameOccasion.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Small helper to render attribute label:value ── */
function Detail({ label, value }) {
  return <div><span className="text-muted">{label}</span><br /><span className="text-dark">{value}</span></div>
}
