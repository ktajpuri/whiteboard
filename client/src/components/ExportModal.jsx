import { useState } from 'react'
import { useSlidesStore } from '../store/slidesStore'

export default function ExportModal({ onClose }) {
  const [format, setFormat] = useState('json')
  const [scope, setScope] = useState('current')
  const { getActiveSlide, slides } = useSlidesStore()

  const handleExport = () => {
    const activeSlide = getActiveSlide()
    const targetSlides = scope === 'current' ? [activeSlide] : slides

    if (format === 'json') {
      const data = JSON.stringify(
        scope === 'current' ? activeSlide : { slides, specVersion: '1.0' },
        null, 2
      )
      downloadBlob(new Blob([data], { type: 'application/json' }), `whiteboard-${scope}.json`)
    }

    if (format === 'png') {
      // Single slide PNG via Konva stage toDataURL
      const stage = window.__konvaStage
      if (stage) {
        const uri = stage.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = 'slide.png'
        link.href = uri
        link.click()
      }
    }

    if (format === 'pdf') {
      import('jspdf').then(({ jsPDF }) => {
        const stage = window.__konvaStage
        if (!stage) return
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
        const uri = stage.toDataURL({ pixelRatio: 2 })
        const { width, height } = pdf.internal.pageSize
        pdf.addImage(uri, 'PNG', 0, 0, width, height)
        pdf.save('whiteboard.pdf')
      })
    }

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Export</h2>

        <div className="prop-group">
          <label>Format</label>
          {['json', 'png', 'pdf'].map(f => (
            <label key={f} className="radio-label">
              <input type="radio" value={f} checked={format === f} onChange={() => setFormat(f)} /> {f.toUpperCase()}
            </label>
          ))}
        </div>

        <div className="prop-group">
          <label>Scope</label>
          {['current', 'all'].map(s => (
            <label key={s} className="radio-label">
              <input type="radio" value={s} checked={scope === s} onChange={() => setScope(s)} />
              {s === 'current' ? ' Current slide' : ' All slides'}
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button onClick={handleExport}>Export</button>
          <button onClick={onClose} className="secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
