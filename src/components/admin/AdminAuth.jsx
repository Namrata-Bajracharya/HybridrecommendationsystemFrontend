/* ── AdminAuth ──
   Sign-in / sign-up form for admin panel. */
import { useState } from 'react'

export default function AdminAuth({ onLogin }) {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    const { name, email, password } = form
    if (!email.trim() || !password.trim()) return setError('Fill in all fields')
    if (password.length < 4) return setError('Password must be 4+ characters')
    if (mode === 'signup' && !name.trim()) return setError('Enter your name')
    onLogin(mode, name, email, password, setError)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-semibold text-dark mb-6">Admin Panel</h1>
      <div className="max-w-sm mx-auto bg-white rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-dark mb-1">{mode === 'signin' ? 'Sign In' : 'Register Admin'}</h2>
        <p className="text-xs text-muted mb-4">{mode === 'signin' ? 'Enter your admin credentials' : 'Create the first admin account'}</p>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input type="text" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />)}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl bg-cream text-dark text-sm placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition">{mode === 'signin' ? 'Sign In' : 'Register'}</button>
        </form>
        <button className="text-xs text-accent hover:underline mt-4" onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}>
          {mode === 'signin' ? 'Register as new admin' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
