import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'

export default function PropertiesPanel() {
  const { selectedIds, activeColor } = useCanvasStore()
  const { getActiveSlide, updateSlideElements, activeSlideId } = useSlidesStore()
  const { push: pushHistory } = useHistoryStore()

  const slide = getActiveSlide()
  const elements = slide?.elements || []
  const selected = elements.filter(el => selectedIds.includes(el.id))

  if (!selected.length) return null

  const el = selected[0]
  const isSingle = selected.length === 1

  const update = (patch) => {
    pushHistory(activeSlideId, elements)
    updateSlideElements(activeSlideId, elements.map(e =>
      selectedIds.includes(e.id) ? { ...e, ...patch } : e
    ))
  }

  return (
    <div className="properties-panel">
      <div className="prop-group">
        <label>Fill</label>
        <input type="color" value={el.fill || '#ffffff'} onChange={e => update({ fill: e.target.value })} />
      </div>
      {isSingle && el.type !== 'stroke' && el.type !== 'text' && (
        <div className="prop-group">
          <label>Border</label>
          <input type="color" value={el.stroke || '#000000'} onChange={e => update({ stroke: e.target.value })} />
          <input
            type="number" min={0} max={20} value={el.strokeWidth ?? 2}
            onChange={e => update({ strokeWidth: Number(e.target.value) })}
            style={{ width: 48 }}
          />
        </div>
      )}
      {isSingle && el.type === 'text' && (
        <>
          <div className="prop-group">
            <label>Color</label>
            <input type="color" value={el.color || '#000000'} onChange={e => update({ color: e.target.value })} />
          </div>
          <div className="prop-group">
            <label>Size</label>
            {['S', 'M', 'L', 'XL'].map((s, i) => {
              const sizes = [12, 16, 24, 36]
              return (
                <button
                  key={s}
                  className={el.fontSize === sizes[i] ? 'active' : ''}
                  onClick={() => update({ fontSize: sizes[i] })}
                >{s}</button>
              )
            })}
          </div>
          <div className="prop-group">
            <label>Style</label>
            <button className={el.fontStyle?.includes('bold') ? 'active' : ''} onClick={() => {
              const f = el.fontStyle || 'normal'
              update({ fontStyle: f.includes('bold') ? f.replace('bold', '').trim() || 'normal' : (f === 'normal' ? 'bold' : f + ' bold') })
            }}><b>B</b></button>
            <button className={el.fontStyle?.includes('italic') ? 'active' : ''} onClick={() => {
              const f = el.fontStyle || 'normal'
              update({ fontStyle: f.includes('italic') ? f.replace('italic', '').trim() || 'normal' : (f === 'normal' ? 'italic' : f + ' italic') })
            }}><i>I</i></button>
          </div>
        </>
      )}
    </div>
  )
}
