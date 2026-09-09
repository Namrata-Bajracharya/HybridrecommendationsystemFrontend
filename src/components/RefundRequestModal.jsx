import { useState } from 'react'
import { useSnackbar } from 'notistack'
import { privateAgent } from '../Requests/AuthRequests'
import { OrderAPI } from '../routes/Routes'
import DraggableUpload from './DraggableUpload'

const REFUND_REASONS = [
  { value: 'item_damaged', label: 'Item Damaged' },
  { value: 'description_mismatch', label: 'Does Not Match Description' },
  { value: 'size_mismatch', label: 'Size Does Not Fit' },
  { value: 'wrong_item', label: 'Wrong Item Delivered' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'item_missing', label: 'Item Missing' },
  { value: 'other', label: 'Other' },
]

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export default function RefundRequestModal({ orderId, orderNumber, onClose, onSubmitted }) {
  const { enqueueSnackbar } = useSnackbar()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [proofFiles, setProofFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleFilesChange = (files) => {
    setProofFiles(files)
  }

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    try {
      const proofImages = await Promise.all(proofFiles.map(f => readFileAsDataURL(f)))
      await privateAgent.post(OrderAPI({ id: orderId }).refundRequest, {
        reason,
        description,
        proof_images: proofImages,
      })
      onSubmitted()
      onClose()
    } catch (e) {
      enqueueSnackbar('Failed to submit refund request', { variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-dark mb-1">Request Refund</h3>
        <p className="text-xs text-muted mb-4">Order #{orderNumber}</p>

        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Reason <span className="text-red-400">*</span></label>
        <div className="space-y-2 mb-4">
          {REFUND_REASONS.map(r => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="radio" name="refundReason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-dark" />
              {r.label}
            </label>
          ))}
        </div>

        <label className="text-[10px] text-muted/60 uppercase tracking-wide mb-1 block">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          placeholder="Tell us more about the issue..."
          className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none mb-4 resize-none" />

        <div className="mb-4">
          <DraggableUpload
            onFilesChange={handleFilesChange}
            maxFiles={5}
            label="Proof Images"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl bg-cream text-dark text-sm" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm disabled:opacity-40" disabled={!reason || submitting} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Send Refund Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
