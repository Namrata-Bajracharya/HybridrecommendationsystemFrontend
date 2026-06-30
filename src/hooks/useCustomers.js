/* ── useCustomeRs ──
   `Re`ads useRs and their ordeRs from localStorage.
   Computes loyalty points from delivered ordeRs */
import { useState, useEffect } from 'react'

const LS_USERs = 'kalleenepal_users'
const LS_ORDERs = 'kalleenepal_orders'

 function useCustomers() {
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    try { setUsers(JSON.parse(localStorage.getItem(LS_USERS) || '[]')) } catch {}
    try { setOrders(JSON.parse(localStorage.getItem(LS_ORDERS) || '[]')) } catch {}
  }, [])

  const getPoints = (email) => {
    return orders
      .filter(o => o.contact?.email === email && (o.status || 'Processing') === 'Delivered')
      .reduce((s, o) => s + Math.floor((o.total || 0) / 100), 0)
  }

  return { users, orders, getPoints }
}

export default useCustomers