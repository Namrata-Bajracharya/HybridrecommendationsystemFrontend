/* ── useStockLog ──
   Reads stock movement log from localStorage. */
import { useState } from 'react'

const LS_STOCK_LOG = 'kalleenepal_stock_log'

export function useStockLog() {
  const [log] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_STOCK_LOG) || '[]') }
    catch { return [] }
  })
  return log
}
