import { useCanvasStore } from '../store/canvasStore'
import { useSlidesStore } from '../store/slidesStore'
import { useHistoryStore } from '../store/historyStore'
import ColorPicker from './ColorPicker'

/* ── Brand logo ── */
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
    <rect width="30" height="30" rx="8" fill="#6366f1"/>
    <rect x="5" y="6" width="20" height="13" rx="2.5" stroke="white" strokeWidth="1.6" fill="none"/>
    <path d="M10 19.5v3m10-3v3M7.5 22.5h15" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M9 14l3 2.5 4-5 3.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* ── SVG Icons ── */
const Ic = ({ d, ...rest }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d}
  </svg>
)

const IcCursor  = () => <Ic d={<><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></>} />
const IcRect    = () => <Ic d={<rect x="3" y="3" width="18" height="18" rx="2"/>} />
const IcCircle  = () => <Ic d={<circle cx="12" cy="12" r="9"/>} />
const IcTriangle= () => <Ic d={<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>} />
const IcHexagon = () => <Ic d={<polygon points="11 2 22 8.5 22 15.5 11 22 0 15.5 0 8.5"/>} />
const IcPen     = () => <Ic d={<><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></>} />
const IcText    = () => <Ic d={<><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>} />
const IcEraser  = () => <Ic d={<><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></>} />
const IcBucket  = () => <Ic d={<><path d="m19 11-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11Z"/><path d="m19 11 2 2a2.83 2.83 0 0 1 0 4h0a2.83 2.83 0 0 1-4 0l-1-1"/><path d="M3 21h12"/></>} />
const IcUndo    = () => <Ic d={<><path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 6 6.3"/></>} />
const IcRedo    = () => <Ic d={<><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-6.7"/></>} />
const IcMinus   = () => <Ic d={<line x1="5" y1="12" x2="19" y2="12"/>} />
const IcPlus    = () => <Ic d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />
const IcFit     = () => <Ic d={<><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></>} />
const IcUpload  = () => <Ic d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />
const IcDownload= () => <Ic d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />
const IcUser    = () => <Ic d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />

const SHAPE_TOOLS = [
  { id: 'select',   Icon: IcCursor,   title: 'Select (V)'     },
  { id: 'rect',     Icon: IcRect,     title: 'Rectangle (R)'  },
  { id: 'ellipse',  Icon: IcCircle,   title: 'Ellipse (E)'    },
  { id: 'triangle', Icon: IcTriangle, title: 'Triangle'       },
  { id: 'hexagon',  Icon: IcHexagon,  title: 'Hexagon'        },
]

const DRAW_TOOLS = [
  { id: 'pen',    Icon: IcPen,    title: 'Pen (P)'    },
  { id: 'text',   Icon: IcText,   title: 'Text (T)'   },
  { id: 'eraser', Icon: IcEraser, title: 'Eraser'     },
  { id: 'bucket', Icon: IcBucket, title: 'Fill color' },
]

const SIZES = ['S', 'M', 'L', 'XL']

export default function Toolbar({ onExport, onImport, user, onSignIn, onSignOut }) {
  const {
    activeTool, setTool,
    penSize, setPenSize,
    eraserSize, setEraserSize,
    zoom, setZoom, fitToScreen,
  } = useCanvasStore()

  const { getActiveSlide, updateSlideElements, activeSlideId } = useSlidesStore()
  const { undo, redo, canUndo: histCanUndo, canRedo: histCanRedo } = useHistoryStore()

  const slide    = getActiveSlide()
  const elements = slide?.elements || []
  const canUndo  = histCanUndo(activeSlideId)
  const canRedo  = histCanRedo(activeSlideId)

  const handleUndo = () => {
    const prev = undo(activeSlideId, elements)
    if (prev !== null) updateSlideElements(activeSlideId, prev)
  }
  const handleRedo = () => {
    const next = redo(activeSlideId, elements)
    if (next !== null) updateSlideElements(activeSlideId, next)
  }

  const showSizes = activeTool === 'pen' || activeTool === 'eraser'
  const activeSize = activeTool === 'pen' ? penSize : eraserSize
  const setSize    = activeTool === 'pen' ? setPenSize : setEraserSize

  const initials = user
    ? (user.display_name || user.email || '?').slice(0, 2).toUpperCase()
    : null

  return (
    <div className="toolbar">
      {/* Brand */}
      <div className="toolbar-brand">
        <Logo />
        <span className="toolbar-brand-name">Whiteboard</span>
      </div>

      <div className="toolbar-divider" />

      {/* Shape tools */}
      <div className="toolbar-group">
        {SHAPE_TOOLS.map(({ id, Icon, title }) => (
          <button
            key={id}
            className={`tool-btn ${activeTool === id ? 'active' : ''}`}
            onClick={() => setTool(id)}
            title={title}
          >
            <Icon />
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Draw tools */}
      <div className="toolbar-group">
        {DRAW_TOOLS.map(({ id, Icon, title }) => (
          <button
            key={id}
            className={`tool-btn ${activeTool === id ? 'active' : ''}`}
            onClick={() => setTool(id)}
            title={title}
          >
            <Icon />
          </button>
        ))}
      </div>

      {/* Size picker (contextual) */}
      {showSizes && (
        <>
          <div className="toolbar-divider" />
          <div className="size-picker">
            {SIZES.map(s => (
              <button
                key={s}
                className={`size-btn ${activeSize === s ? 'active' : ''}`}
                onClick={() => setSize(s)}
                title={`Size ${s}`}
              >{s}</button>
            ))}
          </div>
        </>
      )}

      <div className="toolbar-divider" />

      {/* Color picker */}
      <ColorPicker />

      <div className="toolbar-spacer" />

      {/* Undo / Redo */}
      <div className="toolbar-group">
        <button className="tool-btn" onClick={handleUndo} disabled={!canUndo} title="Undo (⌘Z)">
          <IcUndo />
        </button>
        <button className="tool-btn" onClick={handleRedo} disabled={!canRedo} title="Redo (⌘⇧Z)">
          <IcRedo />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Zoom */}
      <div className="zoom-group">
        <button className="tool-btn" onClick={() => setZoom(zoom / 1.25)} title="Zoom out (−)"><IcMinus /></button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button className="tool-btn" onClick={() => setZoom(zoom * 1.25)} title="Zoom in (+)"><IcPlus /></button>
        <button className="tool-btn" onClick={fitToScreen} title="Fit to screen"><IcFit /></button>
      </div>

      <div className="toolbar-divider" />

      {/* File actions */}
      <button className="tb-action-btn" onClick={onImport} title="Import JSON">
        <IcUpload /> Import
      </button>
      <button className="tb-action-btn primary" onClick={onExport} title="Export">
        <IcDownload /> Export
      </button>

      <div className="toolbar-divider" />

      {/* User */}
      {user ? (
        <div className="tb-user" onClick={onSignOut} title="Sign out">
          <div className="tb-avatar">{initials}</div>
          <span className="tb-user-name">{user.display_name || user.email}</span>
        </div>
      ) : (
        <button className="tb-sign-in" onClick={onSignIn}>Sign in</button>
      )}
    </div>
  )
}
