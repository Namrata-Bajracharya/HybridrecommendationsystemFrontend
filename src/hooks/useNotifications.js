import { useState, useEffect, useCallback } from "react";
import { privateAgent } from "../Requests/AuthRequests";
import { NotificationAPI } from "../routes/Routes";
import { useSocket } from "../context/SocketContext";

const STATUS_LABELS = {
  pending: 'Order Placed', accepted: 'Accepted', packed: 'Packed',
  on_delivery: 'Sent for Delivery', delivered: 'Delivered',
  rejected: 'Rejected', cancelled: 'Cancelled',
}

function localNotif(data) {
  let msg, id
  if (data.type === 'review_reply') {
    msg = `Admin replied to your review on ${data.product_name}`
    id = `temp_review_reply_${data.review_id}_${Date.now()}`
  } else if (data.type === 'new_review') {
    msg = `${data.user_name} reviewed ${data.product_name}`
    id = `temp_new_review_${data.review_id}_${Date.now()}`
  } else if (data.type === 'order_placed') {
    msg = `Order #${data.order_number} placed successfully!`
    id = `temp_${data.order_id}_${data.status || data.type}_${Date.now()}`
  } else if (data.type === 'new_order') {
    msg = `New Order #${data.order_number} from ${data.customer_name || 'a customer'}`
    id = `temp_${data.order_id}_${data.status || data.type}_${Date.now()}`
  } else if (data.type === 'refund_status') {
    msg = `Refund update for Order #${data.order_number}`
    id = `temp_${data.order_id}_${data.status || data.type}_${Date.now()}`
  } else {
    msg = `Order #${data.order_number} status: ${STATUS_LABELS[data.status] || data.status}`
    id = `temp_${data.order_id}_${data.status || data.type}_${Date.now()}`
  }
  return {
    id,
    message: msg,
    type: data.type || 'order_status',
    order_id: data.order_id,
    order_number: data.order_number,
    status: data.status,
    product_id: data.product_id,
    product_name: data.product_name,
    review_id: data.review_id,
    read: false,
    created_at: new Date().toISOString(),
    date: new Date().toISOString(),
  }
}

export function useNotifications() {
  const { connected, on } = useSocket();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [backendNotifs, setBackendNotifs] = useState([]);

  const pushLocal = useCallback((data) => {
    setBackendNotifs(prev => {
      const already = prev.some(p => (typeof p.id === 'number' || !p.id?.startsWith?.('temp_')) && p.order_id === data.order_id && p.status === data.status)
      if (already) return prev
      return [localNotif(data), ...prev]
    })
  }, [])

  const refreshNotifs = useCallback(() => {
    privateAgent
      .get(NotificationAPI({}).getAll)
      .then((r) => {
        const serverData = r.data || []
        const tempIds = new Set()
        for (const s of serverData) {
          if (s.order_id && s.status) tempIds.add(`temp_${s.order_id}_${s.status}`)
        }
        setBackendNotifs(prev => [
          ...serverData.map(s => {
            const temp = prev.find(p => typeof p.id === 'string' && p.id.startsWith('temp_') && p.order_id === s.order_id && p.status === s.status)
            return temp?.read ? { ...s, read: true } : s
          }),
          ...prev.filter(n => (typeof n.id === 'string' && n.id.startsWith('temp_')) && !tempIds.has(n.id)),
        ])
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!connected) return;
    const unsub1 = on("new_order", (d) => { pushLocal(d); refreshNotifs() });
    const unsub2 = on("order_status", (d) => { pushLocal(d); refreshNotifs() });
    const unsub3 = on("order_placed", (d) => { pushLocal(d); refreshNotifs() });
    const unsub4 = on("new_review", (d) => { pushLocal(d); refreshNotifs() });
    const unsub5 = on("review_reply", (d) => { pushLocal(d); refreshNotifs() });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5() };
  }, [connected, on, pushLocal, refreshNotifs]);

  useEffect(() => {
    refreshNotifs();
  }, [refreshNotifs]);

  const recalc = useCallback(() => {
    setCount(backendNotifs.filter(n => !n.read).length);
  }, [backendNotifs]);

  useEffect(() => {
    recalc();
  }, [recalc]);

  const markRead = useCallback((id) => {
    if (!id || (typeof id === 'string' && id.startsWith('temp_'))) {
      setBackendNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      return
    }
    privateAgent.patch(NotificationAPI({ id }).markRead)
      .then(() => {
        setBackendNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      })
      .catch(() => {})
  }, []);

  const allNotifs = backendNotifs

  return { count, open, setOpen, markRead, allNotifs };
}