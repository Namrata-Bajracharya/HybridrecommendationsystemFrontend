/* ── useNotifications ──
   Polls localStorage for new order notifications, tracks
   unread count, marks notifications as read. */
import { useState, useEffect, useCallback } from 'react'

const LS_NOTIFS = 'kalleenepal_notifications'

export function useNotifications() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)

  const refresh = useCallback(() => {
    const notifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]')
    setCount(notifs.filter(n => !n.read).length)
  }, [])

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

  const allNotifs = JSON.parse(localStorage.getItem(LS_NOTIFS) || '[]').toReversed()

  return { count, open, setOpen, markRead, allNotifs }
}
