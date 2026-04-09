import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'
import ColorPicker from './ColorPicker'

const TOOLS = [
  { id: 'select', label: '↖', title: 'Select' },
  { id: 'rect', label: '□', title: 'Rectangle' },
  { id: 'ellipse', label: '○', title: 'Circle' },
  { id: 'triangle', label: '△', title: 'Triangle' },
  { id: 'hexagon', label: '⬡', title: 'Hexagon' },
  { id: 'pen', label: '✏', title: 'Pen' },
  { id: 'text', label: 'T', title: 'Text' },
  { id: 'eraser', label: '⌫', title: 'Eraser' },
  { id: 'bucket', label: '🪣', title: 'Fill' },
]

const SIZES = ['S', 'M', 'L', 'XL']

export default function Toolbar({ onExport, onImport }) {
  const {
    activeTool, setTool,
    penSize, setPenSize,
    eraserSize, setEraserSize,
    zoom, setZoom, fitToScreen,
    canUndo, canRedo
  } = useCanvasStore()

  const { getActiveSlide, updateSlideElements, activeSlideId } = useSlidesStore()
  const { undo, redo, canUndo: histCanUndo, canRedo: histCanRedo } = useHistoryStore()

  const slide = getActiveSlide()
  const elements = slide?.elements || []

  const handleUndo = () => {
    const prev = undo(activeSlideId, elements)
    if (prev !== null) updateSlideElements(activeSlideId, prev)
  }

  const handleRedo = () => {
    const next = redo(activeSlideId, elements)
    if (next !== null) updateSlideElements(activeSlideId, next)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section tools">
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
            onClick={() => setTool(t.id)}
            title={t.title}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(activeTool === 'pen') && (
        <div className="toolbar-section sizes">
          {SIZES.map(s => (
            <button key={s} className={penSize === s ? 'active' : ''} onClick={() => setPenSize(s)}>{s}</button>
          ))}
        </div>
      )}

      {activeTool === 'eraser' && (
        <div className="toolbar-section sizes">
          {SIZES.map(s => (
            <button key={s} className={eraserSize === s ? 'active' : ''} onClick={() => setEraserSize(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="toolbar-section colors">
        <ColorPicker />
      </div>

      <div className="toolbar-section actions">
        <button onClick={handleUndo} disabled={!histCanUndo(activeSlideId)} title="Undo (Cmd+Z)">↩</button>
        <button onClick={handleRedo} disabled={!histCanRedo(activeSlideId)} title="Redo (Cmd+Shift+Z)">↪</button>
      </div>

      <div className="toolbar-section zoom-controls">
        <button onClick={() => setZoom(zoom / 1.2)} title="Zoom out">−</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom * 1.2)} title="Zoom in">+</button>
        <button onClick={fitToScreen} title="Fit to screen">⊡</button>
      </div>

      <div className="toolbar-section file-actions">
        <button onClick={onImport} title="Import">Import</button>
        <button onClick={onExport} title="Export">Export</button>
      </div>
    </div>
  )
}
