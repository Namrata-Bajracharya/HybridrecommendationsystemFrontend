import { useEffect, useRef } from 'react'
import { useSnackbar } from 'notistack'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

const STATUS_LABELS = {
  pending: 'Order Placed', accepted: 'Accepted', packed: 'Packed',
  on_delivery: 'Sent for Delivery', delivered: 'Delivered',
  rejected: 'Rejected', cancelled: 'Cancelled',
  refund_requested: 'Refund Requested', refund_out_for_pickup: 'Delivery Pickup',
  item_retrieved_from_customer: 'Item Picked Up', item_retrieved_by_admin: 'Item Received',
  refund_on_the_way: 'Refund on the Way', refund_successful: 'Refund Successful',
}

export default function SocketNotifier() {
  const { connected, on } = useSocket()
  const { enqueueSnackbar } = useSnackbar()
  const shownKeys = useRef(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (!connected) return

    const unsub1 = on('order_status', (data) => {
      const key = `${data.order_id}-${data.status}-${Date.now()}`
      if (shownKeys.current.has(key)) return
      shownKeys.current.add(key)
      setTimeout(() => shownKeys.current.delete(key), 5000)

      if (user?.role !== 'admin') return

      const label = STATUS_LABELS[data.status] || data.status
      const msg = `Order #${data.order_number} status updated to: ${label}`
      enqueueSnackbar(msg, {
        variant: data.status === 'rejected' || data.status === 'cancelled' ? 'error'
          : data.status === 'delivered' ? 'success'
          : 'info',
        autoHideDuration: 5000,
      })
    })

    const unsub2 = on('order_placed', (data) => {
      if (user?.role !== 'admin') return
      enqueueSnackbar(`Order #${data.order_number} placed successfully!`, {
        variant: 'success', autoHideDuration: 5000,
      })
    })

    const unsub3 = on('refund_status', (data) => {
      const key = `${data.order_id}-${data.status}-${Date.now()}`
      if (shownKeys.current.has(key)) return
      shownKeys.current.add(key)
      setTimeout(() => shownKeys.current.delete(key), 5000)

      const label = STATUS_LABELS[data.status] || data.status
      if (user?.role === 'admin' && data.status === 'refund_requested') {
        const name = data.customer_name || `User`
        enqueueSnackbar(`${name} has asked for a refund on Order #${data.order_number}`, {
          variant: 'warning', autoHideDuration: 7000,
        })
      } else if (user?.role === 'admin') {
        enqueueSnackbar(`Order #${data.order_number} refund status: ${label}`, {
          variant: 'info', autoHideDuration: 5000,
        })
      } else {
        enqueueSnackbar(`Refund update: Order #${data.order_number} — ${label}`, {
          variant: data.status === 'refund_successful' ? 'success' : 'info',
          autoHideDuration: 5000,
        })
      }
    })

    return () => { unsub1(); unsub2(); unsub3() }
  }, [connected, on, enqueueSnackbar, user?.role])

  return null
}
