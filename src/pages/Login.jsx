import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signin, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    const res = await signin(email.trim(), password)
    if (!res.ok) return setError(res.error)
    // signed in; read current user
    const sess = localStorage.getItem('kalleenepal_session')
    let u = null
    try { u = JSON.parse(sess) } catch {}
    if (u?.role === 'admin') navigate('/admin/dashboard')
    else if (u?.id) navigate(`/${u.id}/dashboard`)
    else navigate('/')
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded" />
        <button type="submit" className="px-4 py-2 bg-dark text-cream rounded">Sign In</button>
      </form>
    </div>
  )
}
