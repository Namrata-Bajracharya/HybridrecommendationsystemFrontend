import { useNavigate } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { HOST_URL } from '../routes/Routes'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const liked = isInWishlist(product.id)

  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  const img = product.images?.[0]?.document
  const imgSrc = img?.relative_path ? `${HOST_URL}/${img.relative_path}`.replace(/\\/g, '/') : null

  const fv = product.field_values || {}
  const typeVal = Object.entries(fv).find(([k]) => !k.startsWith('origin_') && !k.startsWith('design_') && !k.startsWith('design_pattern_'))
  const originVal = Object.entries(fv).find(([k]) => k.startsWith('origin_'))
  const designVal = Object.entries(fv).find(([k]) => k.startsWith('design_') && !k.startsWith('design_pattern_'))

  return (
    <div className="bg-white rounded-2xl p-4 hover:shadow-md transition-shadow group relative flex flex-col">
      <button className="absolute top-3 right-3 z-10 text-lg" onClick={() => toggleWishlist(product.id)}>
        {liked ? '❤️' : '🤍'}
      </button>

      <div className="aspect-[3/4] bg-cream rounded-xl mb-3 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">{product.emoji || '📷'}</span>
        )}
      </div>

      {isNew && (
        <span className="text-[10px] uppercase tracking-wider text-white bg-green-600 px-2 py-0.5 rounded-full self-start mb-1">New</span>
      )}

      <h3 className="text-sm font-medium text-dark leading-tight mb-1 cursor-pointer hover:text-accent"
        onClick={() => navigate(`/product/${product.id}`)}>
        {product.name}
      </h3>
      <p className="text-base font-semibold text-accent mb-2">Rs {Number(product.price).toLocaleString()}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {typeVal && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{typeVal[1]}</span>}
        {originVal && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{originVal[1]}</span>}
        {designVal && <span className="text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{designVal[1]}</span>}
      </div>

      {product.average_rating != null && (
        <p className="text-[11px] text-muted mb-2">★ {Number(product.average_rating).toFixed(1)} ({product.review_count})</p>
      )}

      <div className="mt-auto">
        <button className="w-full py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          onClick={() => addToCart(product)}>
          Add to Cart
        </button>
      </div>
    </div>
  )
}
