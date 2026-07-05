import { useState } from 'react'
import { privateAgent } from '../../Requests/AuthRequests'
import { OrderAPI } from '../../routes/Routes'
import DraggableUpload from '../DraggableUpload'

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export default function AdminRefundPaymentModal({ orderId, orderNumber, onClose, onCompleted }) {
  const [proofFiles, setProofFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleFilesChange = (files) => {
    setProofFiles(files)
  }

  const handleSubmit = async () => {
    if (proofFiles.length === 0) return
    setSubmitting(true)
    try {
      const proofImages = await Promise.all(proofFiles.map(f => readFileAsDataURL(f)))
      await privateAgent.patch(OrderAPI({ id: orderId }).refundInitiatePayment, {
        proof_image: proofImages[0],
      })
      onCompleted()
      onClose()
    } catch (e) {
      alert('Failed to process refund payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-1">Refund Payment Proof</h3>
        <p className="text-xs text-muted mb-4">Order #{orderNumber}</p>
        <p className="text-xs text-muted mb-3">Upload an image of the payment receipt or transaction proof sent to the customer.</p>

        <div className="mb-4">
          <DraggableUpload
            onFilesChange={handleFilesChange}
            maxFiles={1}
            label="Payment Proof Image"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl bg-cream text-dark text-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm disabled:opacity-40" disabled={proofFiles.length === 0 || submitting} onClick={handleSubmit}>
            {submitting ? 'Processing...' : 'Confirm Refund Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
