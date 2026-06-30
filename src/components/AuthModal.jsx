/* ── AuthModal ──
   Modal dialog with signin / signup form toggling.
   Used by requireAuth() when an unauthenticated user attempts
   a protected action (wishlist, order placement). 
   Overlay has backdrop blur; modal is centered. */
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const { authModal, setAuthModal, signin, signup, user } = useAuth()
  const [mode, setMode] = useState(authModal.mode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  /* ── Keep local mode in sync with context mode ── */
  if (!authModal.open || user) return null

  const close = () => { setAuthModal({ open: false, mode: 'signin' }); setError(''); setSuccess('') }

  /* ── Switch between signin / signup ── */
  const toggle = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(''); setSuccess('')
  }

  /* ── Handle form submission ── */
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (!email.trim() || !password.trim()) return setError('Please fill in all fields')
    if (mode === 'signup' && !name.trim()) return setError('Please enter your name')

    const result = mode === 'signin' ? await signin(email.trim(), password) : await signup(name.trim(), email.trim(), password)
    if (!result.ok) return setError(result.error)

    setSuccess(mode === 'signin' ? 'Welcome back!' : 'Account created!')
    setTimeout(close, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={close}>
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* ── Close button ── */}
        <button className="absolute top-4 right-4 text-2xl leading-none text-muted hover:text-dark" onClick={close}>×</button>

        {/* ── Header ── */}
        <h2 className="text-2xl font-semibold text-dark mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Join Kallee Nepal'}
        </h2>
        <p className="text-sm text-muted mb-6">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </p>

        {/* ── Error / success feedback ── */}
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-cream text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-cream text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-cream text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <button type="submit"
            className="w-full py-3 rounded-xl bg-dark text-cream font-medium hover:opacity-90 transition">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* ── Toggle link ── */}
        <p className="text-sm text-muted text-center mt-6">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          <button className="ml-1 text-accent font-medium hover:underline" onClick={toggle}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
