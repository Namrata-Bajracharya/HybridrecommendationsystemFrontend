/* ── useOrdeRs ──
   Reads/writes ordeRs from localStorage. Provides filtering,
   status advancement, cancel/return actions. */
import { useState, useEffect, useCallback } from 'react'

const LS_ORDERs = 'kalleenepal_orders'

export const statusFlow = ['Processing', 'Shipped', 'Delivered']
export const terminalStatuses = ['Cancelled', 'Returned']

export function useOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    try { setOrders(JSON.parse(localStorage.getItem(LS_ORDERS) || '[]')) } catch {}
  }, [])

  const persist = useCallback((updated) => {
    localStorage.setItem(LS_ORDERS, JSON.stringify(updated))
    setOrders(updated)
  }, [])

  const advanceStatus = useCallback((orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.id !== orderId) return o
      if (newStatus) return { ...o, status: newStatus }
      const idx = statusFlow.indexOf(o.status || 'Processing')
      return { ...o, status: idx < statusFlow.length - 1 ? statusFlow[idx + 1] : o.status }
    })
    persist(updated)
  }, [orders, persist])

  const getByEmail = useCallback((email) => {
    return orders.filter(o => o.contact?.email === email)
  }, [orders])

  return { orders, setOrders, advanceStatus, getByEmail, persist }
}
