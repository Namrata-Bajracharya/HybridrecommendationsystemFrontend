/* ── SizeGuide ──
   Overlay modal showing standard size measurements
   for kurtha, lehenga, blouse. Triggered from the
   Products page "Size Guide" button. */
export default function SizeGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark">Size Guide</h2>
          <button className="text-2xl leading-none text-muted hover:text-dark" onClick={onClose}>×</button>
        </div>

        <p className="text-xs text-muted mb-4">Measurements in inches. If between sizes, size up.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-cream-alt">
                <th className="py-2 pr-4 font-medium text-dark">Size</th>
                <th className="py-2 pr-4 font-medium text-dark">Bust</th>
                <th className="py-2 pr-4 font-medium text-dark">Waist</th>
                <th className="py-2 font-medium text-dark">Hip</th>
              </tr>
            </thead>
            <tbody>
              {[
                { size: 'XS', bust: 30, waist: 24, hip: 32 },
                { size: 'S', bust: 32, waist: 26, hip: 34 },
                { size: 'M', bust: 34, waist: 28, hip: 36 },
                { size: 'L', bust: 36, waist: 30, hip: 38 },
                { size: 'XL', bust: 38, waist: 32, hip: 40 },
                { size: 'XXL', bust: 40, waist: 34, hip: 42 },
              ].map(row => (
                <tr key={row.size} className="border-b border-cream-alt">
                  <td className="py-2 pr-4 font-medium text-dark">{row.size}</td>
                  <td className="py-2 pr-4 text-muted">{row.bust}</td>
                  <td className="py-2 pr-4 text-muted">{row.waist}</td>
                  <td className="py-2 text-muted">{row.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-muted mt-4 leading-relaxed">
          Kurtha: order your regular top size.<br />
          Lehenga: order skirt size (hips are most important).<br />
          Blouse: order bust size. Stretch fabric included.
        </p>
      </div>
    </div>
  )
}
