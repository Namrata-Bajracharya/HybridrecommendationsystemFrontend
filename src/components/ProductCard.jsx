/* ── ProductCard ──
   Reusable card displaying product image placeholder, name,
   price, occasion badge, attributes, wishlist heart, and
   action button. The action button has two modes:
   - Sized products (kurtha / lehenga / blouse): "Select Size"
     navigates to product detail page for size selection.
   - Unsized products (saree / dupatta): "Add to Cart" adds
     directly (no size needed). */
import { useNavigate } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { occasionLabels } from '../data/products'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const liked = isInWishlist(product.id)
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0

  return (
    <div className="bg-white rounded-2xl p-4 hover:shadow-md transition-shadow group relative flex flex-col">
      {/* ── Heart icon (wishlist toggle) ── */}
      <button className="absolute top-3 right-3 z-10 text-lg" onClick={() => toggleWishlist(product.id)}>
        {liked ? '❤️' : '🤍'}
      </button>

      {/* ── Product image placeholder ── */}
        <div className="aspect-[3/4] bg-cream rounded-xl mb-3 flex items-center justify-center text-5xl">
        {product.emoji}
      </div>

      {/* ── Occasion badge ── */}
      <span className="text-[11px] uppercase tracking-wider text-muted bg-cream px-2 py-0.5 rounded-full self-start mb-1">
        {occasionLabels[product.occasion] || product.occasion}
      </span>

      {/* ── Product name & price ── */}
      <h3 className="text-sm font-medium text-dark leading-tight mb-1">{product.name}</h3>
      <p className="text-base font-semibold text-accent mb-2">Rs {product.price.toLocaleString()}</p>

      {/* ── Attribute chips ── */}
      <div className="flex flex-wrap gap-1 mb-3">
        {product.fabric && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{product.fabric}</span>}
        {product.pattern && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{product.pattern}</span>}
        {product.region && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{product.region}</span>}
      </div>

      {/* ── Action row ── */}
      <div className="mt-auto">
        {hasSizes ? (
          /* Sized products: navigate to detail page for size selection */
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="block w-full text-center py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">
            Select Size
          </button>
        ) : (
          /* Unsized products: add directly to cart */
          <button className="w-full py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
            onClick={() => addToCart(product)}>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  )
}
