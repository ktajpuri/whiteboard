import { useState } from 'react'
import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'
import CropModal from './CropModal'

const FONT_SIZES = [
  { label: 'S',  value: 12 },
  { label: 'M',  value: 16 },
  { label: 'L',  value: 24 },
  { label: 'XL', value: 36 },
]

export default function PropertiesPanel() {
  const [showCrop, setShowCrop] = useState(false)
  const { selectedIds } = useCanvasStore()
  const { getActiveSlide, updateSlideElements, activeSlideId } = useSlidesStore()
  const { push: pushHistory } = useHistoryStore()

  const slide    = getActiveSlide()
  const elements = slide?.elements || []
  const selected = elements.filter(el => selectedIds.includes(el.id))

  if (!selected.length) return null

  const el       = selected[0]
  const isSingle = selected.length === 1

  const update = (patch) => {
    pushHistory(activeSlideId, elements)
    updateSlideElements(activeSlideId, elements.map(e =>
      selectedIds.includes(e.id) ? { ...e, ...patch } : e
    ))
  }

  const toggleFontStyle = (style) => {
    const f = el.fontStyle || 'normal'
    const has = f.includes(style)
    const next = has
      ? f.replace(style, '').trim() || 'normal'
      : f === 'normal' ? style : f + ' ' + style
    update({ fontStyle: next })
  }

  return (
    <div className="properties-panel">
      <div className="props-header">
        <span className="props-title">
          {selected.length > 1 ? `${selected.length} Objects` : el.type.charAt(0).toUpperCase() + el.type.slice(1)}
        </span>
        <button className="props-close" onClick={() => useCanvasStore.getState().clearSelection()}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="props-body">
        {/* Fill color */}
        {el.type !== 'stroke' && (
          <div className="prop-row">
            <span className="prop-label">Fill</span>
            <div className="prop-color-btn">
              <input
                type="color"
                value={el.fill || '#ffffff'}
                onChange={e => update({ fill: e.target.value })}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--n-400)', fontFamily: 'monospace' }}>
              {(el.fill || '#ffffff').toUpperCase()}
            </span>
          </div>
        )}

        {/* Stroke / border */}
        {isSingle && el.type !== 'stroke' && el.type !== 'text' && (
          <div className="prop-row">
            <span className="prop-label">Border</span>
            <div className="prop-color-btn">
              <input
                type="color"
                value={el.stroke || '#000000'}
                onChange={e => update({ stroke: e.target.value })}
              />
            </div>
            <input
              className="stroke-width-input"
              type="number" min={0} max={20}
              value={el.strokeWidth ?? 2}
              onChange={e => update({ strokeWidth: Number(e.target.value) })}
            />
            <span style={{ fontSize: 11, color: 'var(--n-400)' }}>px</span>
          </div>
        )}

        {/* Stroke color */}
        {isSingle && el.type === 'stroke' && (
          <div className="prop-row">
            <span className="prop-label">Color</span>
            <div className="prop-color-btn">
              <input
                type="color"
                value={el.color || '#000000'}
                onChange={e => update({ color: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Image controls */}
        {isSingle && el.type === 'image' && (
          <>
            <div className="prop-row">
              <span className="prop-label">Crop</span>
              <button className="btn-secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setShowCrop(true)}>
                Edit Crop
              </button>
            </div>
            {(el.cropX != null || el.cropY != null) && (
              <div className="prop-row">
                <span className="prop-label"></span>
                <button
                  className="btn-secondary"
                  style={{ padding: '3px 10px', fontSize: 12 }}
                  onClick={() => update({ cropX: undefined, cropY: undefined, cropWidth: undefined, cropHeight: undefined })}
                >
                  Reset Crop
                </button>
              </div>
            )}
          </>
        )}

        {/* Text controls */}
        {isSingle && el.type === 'text' && (
          <>
            <div className="prop-row">
              <span className="prop-label">Color</span>
              <div className="prop-color-btn">
                <input
                  type="color"
                  value={el.color || '#000000'}
                  onChange={e => update({ color: e.target.value })}
                />
              </div>
            </div>

            <div className="prop-row">
              <span className="prop-label">Size</span>
              <div className="seg-control">
                {FONT_SIZES.map(({ label, value }) => (
                  <button
                    key={label}
                    className={`seg-btn ${el.fontSize === value ? 'active' : ''}`}
                    onClick={() => update({ fontSize: value })}
                  >{label}</button>
                ))}
              </div>
            </div>

            <div className="prop-row">
              <span className="prop-label">Style</span>
              <button
                className={`style-btn ${el.fontStyle?.includes('bold') ? 'active' : ''}`}
                onClick={() => toggleFontStyle('bold')}
                title="Bold"
              ><b>B</b></button>
              <button
                className={`style-btn ${el.fontStyle?.includes('italic') ? 'active' : ''}`}
                onClick={() => toggleFontStyle('italic')}
                title="Italic"
              ><i>I</i></button>
            </div>
          </>
        )}
      </div>

      {showCrop && isSingle && el.type === 'image' && (
        <CropModal
          element={el}
          onApply={(cropData) => {
            update(cropData)
            setShowCrop(false)
          }}
          onClose={() => setShowCrop(false)}
        />
      )}
    </div>
  )
}
