import { useState, useEffect, useCallback, useRef } from 'react'
import { privateAgent } from '../Requests/AuthRequests'
import { NotificationAPI } from '../routes/Routes'

const LS_NOTIFS = 'kalleenepal_notifications'

export function useNotifications() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [backendNotifs, setBackendNotifs] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    privateAgent.get(NotificationAPI({}).getAll)
      .then(r => setBackendNotifs(r.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws')
    wsRef.current = ws
    ws.onmessage = () => {
      privateAgent.get(NotificationAPI({}).getAll)
        .then(r => setBackendNotifs(r.data || []))
        .catch(() => {})
    }
    ws.onerror = () => {}
    return () => ws.close()
  }, [])

  const refresh = useCallback(() => {
    const notifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]')
    const all = [...backendNotifs, ...notifs]
    setCount(all.filter(n => !n.read).length)
  }, [backendNotifs])

  useEffect(() => {
    refresh()
    const iv = setInterval(refresh, 5000)
    return () => clearInterval(iv)
  }, [refresh])

  const markRead = useCallback((id) => {
    const notifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]')
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n)
    localStorage.setItem(LS_NOTIFS, JSON.stringify(updated))
    refresh()
  }, [refresh])

  const allNotifs = (() => {
    const local = JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]')
    const merged = [...backendNotifs, ...local]
    const seen = new Set()
    return merged.filter(n => {
      const key = n.id || n.message
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).toReversed()
  })()

  return { count, open, setOpen, markRead, allNotifs }
}
