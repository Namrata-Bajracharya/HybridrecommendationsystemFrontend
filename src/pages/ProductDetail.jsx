import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useRecommendations } from '../context/RecommendationContext'
import ProductCard from '../components/ProductCard'
import axios from 'axios'
import { publicAgent, privateAgent } from '../Requests/AuthRequests'
import { ProductAPI, ReviewAPI, OrderAPI, HOST_URL } from '../routes/Routes'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { getProductRecommendations } = useRecommendations()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState(null)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState([])
  const [hasPurchased, setHasPurchased] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [selectedVariant, setSelectedVariant] = useState({})

  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadProduct() {
      setLoading(true)
      try {
        const resp = await publicAgent.get(
          ProductAPI({ pageNum: 1, RecordPerPage: 100 }).getAll,
          { cancelToken: source.token }
        )
        const found = (resp.data?.data || []).find(p => p.id === Number(id))
        setProduct(found || null)
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn('Failed to load product', err)
          setProduct(null)
        }
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
    return () => source.cancel()
  }, [id])

  useEffect(() => {
    if (!product) return
    try {
      const recent = JSON.parse(sessionStorage.getItem('kalleenepal_recent') || '[]')
      const filtered = recent.filter(v => v !== product.id)
      filtered.unshift(product.id)
      sessionStorage.setItem('kalleenepal_recent', JSON.stringify(filtered.slice(0, 20)))
    } catch { /* ignore */ }
  }, [product])

  useEffect(() => {
    setSelectedImage(0)
    setSelectedSize(null)
    setSelectedVariant({})
    setAdded(false)
    setReviewSubmitted(false)
    setReviewError('')
    setReviewRating(5)
    setReviewComment('')
  }, [id])

  useEffect(() => {
    const source = axios.CancelToken.source()
    async function loadReviews() {
      try {
        const resp = await publicAgent.get(
          ReviewAPI({ id: Number(id), pageNum: 0, RecordPerPage: 100 }).getByProduct,
          { cancelToken: source.token }
        )
        setReviews(Array.isArray(resp.data) ? resp.data : [])
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn('Failed to load reviews', err)
        }
      }
    }
    loadReviews()
    return () => source.cancel()
  }, [id, reviewSubmitted])

  useEffect(() => {
    if (!user) return
    const source = axios.CancelToken.source()
    async function checkPurchase() {
      try {
        const resp = await privateAgent.get(OrderAPI({}).getAll, { cancelToken: source.token })
        const orders = Array.isArray(resp.data) ? resp.data : []
        const bought = orders.some(order =>
          order.order_items?.some(item => item.product_id === Number(id))
        )
        setHasPurchased(bought)
      } catch {
        setHasPurchased(false)
      }
    }
    checkPurchase()
    return () => source.cancel()
  }, [user, id])

  const handleAdd = () => {
    addToCart(product, selectedVariantObj?.id, variantPrice)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    addToCart(product, selectedVariantObj?.id, variantPrice)
    const item = { productId: product.id, variantId: selectedVariantObj?.id || null, name: product.name, price: Number(variantPrice ?? product.price), quantity: 1 }
    navigate('/checkout', { state: { items: [item] } })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!user) return
    setSubmittingReview(true)
    setReviewError('')
    try {
      await privateAgent.post(ReviewAPI({}).create, {
        product_id: Number(id),
        rating: reviewRating,
        comment: reviewComment || null
      })
      setReviewSubmitted(true)
      setReviewComment('')
      setReviewRating(5)
    } catch (err) {
      setReviewError(err.response?.data?.detail || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <p className="text-muted mt-8 px-4">Loading...</p>
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <p className="text-muted">Product not found.</p>
      <Link to="/products" className="text-accent text-sm mt-2 inline-block">← Back to Products</Link>
    </div>
  )

  const fv = product.field_values || {}

  const typeVal = Object.entries(fv).find(([k]) => !k.startsWith('origin_') && !k.startsWith('design_') && !k.startsWith('size'))
  const originVal = Object.entries(fv).find(([k]) => k.startsWith('origin_'))
  const designVal = Object.entries(fv).find(([k]) => k.startsWith('design_') && !k.startsWith('design_pattern_'))
  const patternVal = Object.entries(fv).find(([k]) => k.startsWith('design_pattern_'))
  const sizeVal = Object.entries(fv).find(([k]) => k.toLowerCase().includes('size'))
  const sizes = sizeVal ? String(sizeVal[1]).split(',').map(s => s.trim()).filter(Boolean) : []

  const variants = product.variants || []
  const variantDims = variants.length > 0
    ? [...new Set(variants.flatMap(v => v.attributes.map(a => a.name)))]
    : []
  const dimOptions = {}
  variantDims.forEach(dim => {
    dimOptions[dim] = [...new Set(variants.flatMap(v =>
      v.attributes.filter(a => a.name === dim).map(a => a.value)
    ))]
  })
  const variantLookup = {}
  variants.forEach(v => {
    const key = JSON.stringify(v.attributes.map(a => ({ name: a.name, value: a.value })).sort((a, b) => a.name.localeCompare(b.name)))
    variantLookup[key] = v
  })
  const selectedVariantObj = (() => {
    if (variantDims.length === 0) return null
    const key = JSON.stringify(variantDims.map(name => ({ name, value: selectedVariant[name] || '' })).sort((a, b) => a.name.localeCompare(b.name)))
    return variantLookup[key] || null
  })()
  const variantPrice = selectedVariantObj?.price ?? null
  const variantStock = selectedVariantObj?.stock_quantity ?? null
  const variantImagePath = selectedVariantObj?.image ?? null

  const images = product.images || []
  const imageUrls = images.map(img =>
    img.document?.relative_path
      ? HOST_URL + '/upload/' + img.document.relative_path.replace(/\\/g, '/')
      : null
  ).filter(Boolean)
  const variantImageUrl = variantImagePath
    ? HOST_URL + '/upload/' + variantImagePath.replace(/\\/g, '/')
    : null
  const currentImage = selectedImage === 0 && variantImageUrl
    ? variantImageUrl
    : imageUrls[selectedImage] || imageUrls[0] || variantImageUrl || null

  const catName = product.category?.name || product.category?.slug || ''

  const newBadge = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000

  const avgRating = product.average_rating
  const reviewCount = product.review_count || reviews.length

  const { hybrid, sameOccasion, completeLook } = getProductRecommendations(product.id)

  const userReview = reviews.find(r => r.user_id === user?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <p className="text-xs text-muted mb-4">
        <Link to="/" className="hover:text-accent">Home</Link>
        {' / '}
        <Link to="/products" className="hover:text-accent">Products</Link>
        {' / '}<span className="text-dark">{product.name}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* ── Image Gallery ── */}
        <div>
          <div className="aspect-[4/3] bg-cream rounded-3xl flex items-center justify-center overflow-hidden mb-3">
            {currentImage ? (
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl text-muted/30">📷</span>
            )}
          </div>
          {imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageUrls.map((url, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-cream flex-shrink-0 border-2 transition ${i === selectedImage ? 'border-dark' : 'border-transparent hover:border-muted/30'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col">
          {catName && (
            <span className="inline-block text-[11px] uppercase tracking-wider text-muted bg-cream px-3 py-1 rounded-full mb-3 self-start">
              {catName}
            </span>
          )}

          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-dark">{product.name}</h1>
            {newBadge && (
              <span className="text-[10px] uppercase tracking-wider text-white bg-green-600 px-2 py-0.5 rounded-full">New</span>
            )}
          </div>

          <p className="text-2xl font-semibold text-accent mb-4">Rs {Number(variantPrice ?? product.price).toLocaleString()}</p>

          {avgRating != null && (
            <div className="flex items-center gap-1 mb-4">
              <span className="text-sm font-medium text-dark">{avgRating.toFixed(1)}</span>
              <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
              <span className="text-xs text-muted">({reviewCount} reviews)</span>
            </div>
          )}

          {product.description && (
            <p className="text-sm text-muted mb-6 leading-relaxed">{product.description}</p>
          )}

          {/* ── Variant Dimension Selectors ── */}
          {variantDims.map(dim => (
            <div key={dim} className="mb-4">
              <p className="text-sm font-medium text-dark mb-2">{dim}: {selectedVariant[dim] || <span className="text-muted font-normal">Select</span>}</p>
              <div className="flex flex-wrap gap-2">
                {dimOptions[dim].map(val => (
                  <button key={val} onClick={() => setSelectedVariant(prev => ({ ...prev, [dim]: val }))}
                    className={`px-4 py-2 rounded-lg text-sm border transition ${selectedVariant[dim] === val ? 'border-dark bg-dark text-cream' : 'border-muted/30 text-dark hover:border-dark'}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* ── Details Grid ── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 text-sm">
            {typeVal && <Detail label="Type" value={typeVal[1]} />}
            {originVal && <Detail label="Brand" value={originVal[1]} />}
            {designVal && <Detail label="Design" value={designVal[1]} />}
            {patternVal && <Detail label="Pattern" value={patternVal[1]} />}
            <Detail label="Stock" value={variantStock != null ? (variantStock > 0 ? String(variantStock) : 'Out of stock') : (product.in_stock ? `${product.stock_quantity || 'In Stock'}` : 'Out of stock')} />
          </div>

          {/* ── Wishlist + Add to Cart + Buy it Now ── */}
          <div className="flex gap-3 mt-auto">
            <button onClick={() => toggleWishlist(product.id)}
              className="w-12 h-12 rounded-xl border border-muted/30 flex items-center justify-center text-lg hover:bg-cream transition flex-shrink-0">
              {isInWishlist(product.id) ? '❤️' : '🤍'}
            </button>
            <button className="flex-1 py-3 rounded-xl bg-dark text-cream font-medium text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={variantStock != null ? variantStock <= 0 : !product.in_stock} onClick={handleAdd}>
              {added ? '✓ Added to Cart' : (variantStock != null ? (variantStock > 0 ? 'Add to Cart' : 'Out of Stock') : (product.in_stock ? 'Add to Cart' : 'Out of Stock'))}
            </button>
            {user && user.role !== 'admin' && (
              <button className="flex-1 py-3 rounded-xl bg-accent text-cream font-medium text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={variantStock != null ? variantStock <= 0 : !product.in_stock} onClick={handleBuyNow}>
                Buy it Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer Reviews ── */}
      <section className="mb-12 border-t border-cream-alt pt-8">
        <h2 className="text-xl font-semibold text-dark mb-6">Customer Reviews</h2>

        {avgRating != null && (
          <div className="flex items-center gap-4 mb-6 bg-cream rounded-2xl p-4">
            <div className="text-center">
              <span className="text-3xl font-bold text-dark">{avgRating.toFixed(1)}</span>
              <p className="text-xs text-muted">out of 5</p>
            </div>
            <div>
              <span className="text-yellow-500 text-lg">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
              <p className="text-xs text-muted">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4 mb-8">
            {reviews.map(r => (
              <div key={r.id} className="border border-cream-alt rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark">User #{r.user_id}</span>
                  <span className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-yellow-500 text-sm mb-2">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Review Form */}
        {user ? (
          userReview ? (
            <div className="bg-cream rounded-2xl p-4">
              <p className="text-sm text-muted">You have already reviewed this product.</p>
            </div>
          ) : reviewSubmitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm text-green-700">Thank you! Your review has been submitted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="border border-cream-alt rounded-2xl p-4">
              <h3 className="text-sm font-medium text-dark mb-3">Write a Review</h3>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)}
                    className={`text-xl transition ${star <= reviewRating ? 'text-yellow-500' : 'text-muted/30'}`}>
                    ★
                  </button>
                ))}
              </div>

              <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product (optional)"
                className="w-full px-4 py-2.5 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 mb-3 resize-none" rows={3} />

              {reviewError && <p className="text-red-500 text-xs mb-2">{reviewError}</p>}

              <button type="submit" disabled={submittingReview}
                className="px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )
        ) : (
          <div className="border border-cream-alt rounded-2xl p-4">
            <p className="text-sm text-muted">
              <Link to="/login" className="text-accent hover:underline">Sign in</Link> to write a review.
            </p>
          </div>
        )}
      </section>

      {/* ── Similar Products / Recommendations ── */}
      {hybrid.length > 0 && (
        <section className="mb-12 border-t border-cream-alt pt-8">
          <h2 className="text-xl font-semibold text-dark mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {hybrid.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {completeLook.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">Complete the Look</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completeLook.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {sameOccasion.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-dark mb-6">More in this Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sameOccasion.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return <div><span className="text-muted">{label}</span><br /><span className="text-dark">{value}</span></div>
}
