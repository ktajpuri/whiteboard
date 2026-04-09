import { useState } from 'react'
import { useSlidesStore } from '../store/slidesStore'

const FORMAT_OPTIONS = [
  { id: 'json', icon: '{ }', label: 'JSON',  desc: 'Full data export'  },
  { id: 'png',  icon: '🖼',  label: 'PNG',   desc: 'Image snapshot'    },
  { id: 'pdf',  icon: '📄',  label: 'PDF',   desc: 'Print-ready'       },
]

export default function ExportModal({ onClose }) {
  const [format, setFormat] = useState('json')
  const [scope, setScope]   = useState('current')
  const { getActiveSlide, slides } = useSlidesStore()

  const handleExport = () => {
    const activeSlide  = getActiveSlide()

    if (format === 'json') {
      const data = JSON.stringify(
        scope === 'current' ? activeSlide : { slides, specVersion: '1.0' },
        null, 2
      )
      downloadBlob(new Blob([data], { type: 'application/json' }), `whiteboard-${scope}.json`)
    }

    if (format === 'png') {
      const stage = window.__konvaStage
      if (stage) {
        const uri  = stage.toDataURL({ pixelRatio: 2 })
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
        const pdf  = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
        const uri  = stage.toDataURL({ pixelRatio: 2 })
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
        <button className="modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <h2>Export</h2>
        </div>

        <div className="export-option-group">
          <div className="export-option-label">Format</div>
          <div className="export-options">
            {FORMAT_OPTIONS.map(f => (
              <button
                key={f.id}
                className={`export-option ${format === f.id ? 'selected' : ''}`}
                onClick={() => setFormat(f.id)}
              >
                <span className="export-option-icon">{f.icon}</span>
                <span className="export-option-name">{f.label}</span>
                <span style={{ fontSize: 10, color: 'var(--n-400)', marginTop: 1 }}>{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="export-option-group">
          <div className="export-option-label">Scope</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'current', label: 'Current page only' },
              { id: 'all',     label: `All pages (${slides.length})` },
            ].map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--r)', border: `1.5px solid ${scope === s.id ? 'var(--brand)' : 'var(--n-200)'}`, background: scope === s.id ? 'var(--brand-bg)' : 'var(--n-50)', transition: 'all .15s' }}>
                <input
                  type="radio"
                  value={s.id}
                  checked={scope === s.id}
                  onChange={() => setScope(s.id)}
                  style={{ accentColor: 'var(--brand)' }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: scope === s.id ? 'var(--brand)' : 'var(--n-700)' }}>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export {format.toUpperCase()}
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
