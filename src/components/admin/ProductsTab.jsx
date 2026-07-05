import { useState, useEffect, useCallback, useRef } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { ProductAPI, HOST_URL } from '../../routes/Routes'
import ProductForm from './ProductForm'

export default function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const formRef = useRef(null)

  useEffect(() => {
    if ((showForm || editProduct) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showForm, editProduct])
  const [viewProduct, setViewProduct] = useState(null)
  const [viewVariantIdx, setViewVariantIdx] = useState(-1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await privateAgent.get(ProductAPI({ pageNum: page, RecordPerPage: perPage }).getAll)
      const body = resp.data
      setProducts(body.data || [])
      setTotal(body.meta?.total_items || 0)
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await privateAgent.delete(ProductAPI({ id: deleteTarget.id }).delete)
      setDeleteTarget(null)
      fetch()
    } catch { alert('Failed to delete') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted">{total} products</p>
        <button className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
          onClick={() => { setShowForm(o => !o); setEditProduct(null) }}>{showForm && !editProduct ? 'Cancel' : '+ Add Product'}</button>
      </div>
      {(showForm || editProduct) && (
        <div ref={formRef}>
          <ProductForm editProduct={editProduct} onDone={() => { setShowForm(false); setEditProduct(null); fetch() }} />
        </div>
      )}
      {loading ? <p className="text-sm text-muted">Loading...</p> : (
        <>
          <h3 className="text-sm font-medium text-dark mb-3">All Products</h3>
          <div className="space-y-2 text-sm max-h-[500px] overflow-y-auto">
            {products.length === 0 && <p className="text-sm text-muted">No products yet.</p>}
            {products.map(p => {
              const img = p.images?.[0]?.document
              const imgUrl = img ? `${HOST_URL}/${img.relative_path}`.replace(/\\/g, '/') : null
              return (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                  <div className="w-10 h-10 rounded-lg bg-cream shrink-0 overflow-hidden">
                    {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-cream" />}
                  </div>
                  <span className="flex-1 text-dark truncate min-w-0">{p.name}</span>
                  <span className="text-muted text-xs capitalize shrink-0">{p.category?.name || ''}</span>
                  <span className="text-accent font-medium shrink-0">Rs {p.price?.toLocaleString()}</span>
                  <span className="text-[11px] text-muted shrink-0">Stock: {p.stock_quantity ?? 0}</span>
                  <div className="flex gap-2 shrink-0">
                    <button className="text-xs text-dark/60 hover:text-dark" onClick={() => setViewProduct(p)}>View</button>
                    <button className="text-xs text-accent hover:underline" onClick={() => { setEditProduct(p); setShowForm(false) }}>Edit</button>
                    <button className="text-xs text-red-400 hover:text-red-500" onClick={() => setDeleteTarget({ id: p.id, name: p.name })}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
          {total > perPage && (
            <div className="flex gap-2 mt-4 justify-center">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-cream text-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-sm text-muted">{page} / {Math.ceil(total / perPage)}</span>
              <button disabled={page >= Math.ceil(total / perPage)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-cream text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setViewProduct(null); setViewVariantIdx(-1) }}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            {(() => {
              const variants = viewProduct.variants || []
              const hasVariants = variants.length > 0
              const selIdx = viewVariantIdx >= 0 && viewVariantIdx < variants.length ? viewVariantIdx : -1
              const selVariant = selIdx >= 0 ? variants[selIdx] : null

              const productImg = viewProduct.images?.[0]?.document
              const productImgUrl = productImg ? `${HOST_URL}/${productImg.relative_path}`.replace(/\\/g, '/') : null
              const variantImg = selVariant?.document
              const variantImgUrl = variantImg ? `${HOST_URL}/${variantImg.relative_path}`.replace(/\\/g, '/') : null
              const currentImgUrl = variantImgUrl || productImgUrl

              const currentPrice = selVariant?.selling_price ?? selVariant?.price ?? viewProduct.price
              const currentStock = selVariant?.stock_quantity ?? viewProduct.stock_quantity

              return (
                <>
                  {currentImgUrl && (
                    <div className="w-full h-64 bg-cream">
                      <img src={currentImgUrl} alt={viewProduct.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-dark">{viewProduct.name}</h3>
                        {viewProduct.category?.name && (
                          <span className="text-xs text-muted bg-cream px-2 py-0.5 rounded-full">{viewProduct.category.name}</span>
                        )}
                      </div>
                      <span className="text-xl font-bold text-accent">Rs {Number(currentPrice)?.toLocaleString()}</span>
                    </div>
                    {viewProduct.description && <p className="text-sm text-muted">{viewProduct.description}</p>}
                    {viewProduct.field_values && Object.keys(viewProduct.field_values).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(viewProduct.field_values).map(([k, v]) => (
                          <span key={k} className="text-[11px] bg-cream px-2 py-0.5 rounded-full text-muted">{k.replace(/^(origin_|design_|design_pattern_)/, '')}: {v}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted pt-2 border-t border-dark/5">
                      <span>Stock: {currentStock ?? 0}</span>
                      {viewProduct.sku && <span>SKU: {viewProduct.sku}</span>}
                    </div>
                    {hasVariants && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dark/5">
                        {variants.map((v, i) => (
                          <button key={i} onClick={() => setViewVariantIdx(i === selIdx ? -1 : i)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${i === selIdx ? 'bg-dark text-cream' : 'bg-cream text-muted hover:text-dark'}`}>
                            {v.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="w-full py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition"
                      onClick={() => { setViewProduct(null); setViewVariantIdx(-1) }}>Close</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-medium text-dark">Delete this product?</p>
            <p className="text-sm text-muted leading-relaxed">
              This will permanently remove <span className="text-dark font-medium">{deleteTarget.name}</span> and all its data.
            </p>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 py-2 rounded-xl bg-cream text-sm text-dark hover:opacity-80 transition disabled:opacity-40"
                disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="flex-1 py-2 rounded-xl bg-red-500 text-sm text-white font-medium hover:opacity-90 transition disabled:opacity-40"
                disabled={deleting} onClick={handleDelete}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
