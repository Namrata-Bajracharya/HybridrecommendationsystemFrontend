import { useState, useEffect } from 'react'

const REV_KEY = 'admin_reviews'

function loadReviews(){ return JSON.parse(localStorage.getItem(REV_KEY)||'[]') }
function saveReviews(r){ localStorage.setItem(REV_KEY, JSON.stringify(r)) }

export default function ReviewsAdmin(){
  const [reviews, setReviews] = useState(loadReviews())
  const [productFilter, setProductFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [replyText, setReplyText] = useState('')

  useEffect(()=> setReviews(loadReviews()), [])

  const products = [...new Set((JSON.parse(localStorage.getItem('products')||'[]')).map(p=>p.name))]
  const users = JSON.parse(localStorage.getItem('users')||'[]')

  const filtered = reviews.filter(r => (!productFilter || r.productId === productFilter) && (!userFilter || r.userId === userFilter))

  const handleReply = (id) =>{
    if(!replyText.trim()) return
    const updated = reviews.map(r => r.id===id ? { ...r, replies: [...(r.replies||[]), { id: Date.now(), text: replyText, at: new Date().toISOString() }] } : r)
    saveReviews(updated); setReviews(updated); setReplyText('')
  }

  const handleDelete = (id)=>{ if(!confirm('Delete review?')) return; const updated = reviews.filter(r=>r.id!==id); saveReviews(updated); setReviews(updated) }

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <p className="text-sm font-medium">Reviews</p>
      <div className="flex gap-2">
        <select value={productFilter} onChange={e=>setProductFilter(e.target.value)} className="flex-1 px-2 py-1 rounded-xl bg-cream text-sm">
          <option value="">All products</option>
          {products.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={userFilter} onChange={e=>setUserFilter(e.target.value)} className="w-28 px-2 py-1 rounded-xl bg-cream text-sm">
          <option value="">All users</option>
          {users.map(u=> <option key={u.id} value={u.id}>{u.email||u.name||u.id}</option>)}
        </select>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 text-sm">
        {filtered.length===0 && <p className="text-xs text-muted">No reviews</p>}
        {filtered.map(r=> (
          <div key={r.id} className="border border-cream rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted">User: {r.userId} · Product: {r.productId}</p>
                <p className="text-sm text-dark">{r.comment}</p>
                <p className="text-xs text-muted">Rating: {r.rating}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <button className="text-xs text-accent" onClick={()=>{ const t=prompt('Quick reply'); if(t){ setReplyText(t); handleReply(r.id) }}}>Quick Reply</button>
                <button className="text-xs text-red-500" onClick={()=>handleDelete(r.id)}>Delete</button>
              </div>
            </div>
            {r.replies && r.replies.length>0 && (
              <div className="mt-2 space-y-1">
                {r.replies.map(rep => <div key={rep.id} className="text-xs text-muted">Reply: {rep.text} · {new Date(rep.at).toLocaleString()}</div>)}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Reply..." className="flex-1 px-2 py-1 rounded-xl bg-cream text-sm" />
              <button onClick={()=>handleReply(r.id)} className="px-3 py-1 rounded-xl bg-dark text-cream text-sm">Reply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
