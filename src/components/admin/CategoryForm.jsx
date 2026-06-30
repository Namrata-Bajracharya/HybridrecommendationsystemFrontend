import { useState, useEffect } from 'react'

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') }

export default function CategoryForm({ onAdded }){
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  useEffect(()=>{
    setErr('')
  },[name])

  const handleSubmit = (e) =>{
    e.preventDefault(); setErr('')
    if(!name.trim()) return setErr('Name required')
    const key = 'admin_categories'
    const existing = JSON.parse(localStorage.getItem(key)||'[]')
    const newCat = { id: crypto?.randomUUID?.()||String(Date.now()), name: name.trim(), slug: slugify(name) }
    existing.push(newCat)
    localStorage.setItem(key, JSON.stringify(existing))
    setName('')
    if(onAdded) onAdded(newCat)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 space-y-2">
      <p className="text-xs font-medium text-dark">Add Category</p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Category name" className="w-full px-3 py-2 rounded-xl bg-cream text-sm" />
      <div className="flex justify-end">
        <button className="px-3 py-1 rounded-xl bg-dark text-cream text-sm">Add</button>
      </div>
    </form>
  )
}
