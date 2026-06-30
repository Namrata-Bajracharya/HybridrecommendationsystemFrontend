import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function UserDashboard() {
  const { userid } = useParams()
  const [session, setSession] = useState(null)

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('kalleenepal_session') || 'null')
      setSession(s)
    } catch {
      setSession(null)
    }
  }, [])

  if (!session) return <div className="py-20 text-center">Please sign in to view your dashboard.</div>

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">{session.first_name || session.name}'s Dashboard</h1>
      <p className="text-sm text-muted">This is a placeholder user dashboard for user {userid}.</p>
    </div>
  )
}
