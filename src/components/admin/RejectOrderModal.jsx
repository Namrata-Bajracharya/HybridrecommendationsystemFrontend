import { useEffect, useState } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'

export default function RejectOrderModal({ orderId, orderNumber, onClose, onRejected }) {
  const [reasons, setReasons] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    privateAgent.get(OrderAPI().rejectionReasons).then(res => setReasons(res.data)).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await privateAgent.patch(OrderAPI({ id: orderId }).reject, { reason: selected })
      onRejected()
      onClose()
    } catch (e) {
      alert('Failed to reject order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Reject Order</h2>
        <p className="text-sm text-gray-500 mb-4">Order #{orderNumber}</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection</label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">-- Select a reason --</option>
          {reasons.map(r => (
            <option key={r.id} value={r.reason}>{r.reason}</option>
          ))}
        </select>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!selected || loading}
          >
            {loading ? 'Rejecting...' : 'Reject Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
